const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { optionalAuth } = require('../middleware/auth');
const { evaluateSingleReport, calculateSourceAggregateRisk } = require('../services/riskEngine');
const { evaluateAndDispatchAlert } = require('../services/alertService');

const router = express.Router();

// Configure local file storage for field test & water source photos (FR3)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg');
    cb(null, `report-${Date.now()}-${Math.round(Math.random() * 1e4)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
});

// GET /api/reports -> List recent reports across the platform
router.get('/', async (req, res) => {
  try {
    const { verification_status, report_type } = req.query;
    const conditions = [];
    const params = [];

    if (verification_status && verification_status !== 'all') {
      params.push(verification_status);
      conditions.push(`r.verification_status = $${params.length}`);
    }
    if (report_type && report_type !== 'all') {
      params.push(report_type);
      conditions.push(`r.report_type = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await db.query(
      `SELECT
         r.*,
         ws.code AS source_code,
         ws.name AS source_name,
         ws.source_type,
         ws.locality,
         ws.latitude,
         ws.longitude,
         ws.risk_score AS source_risk_score,
         ws.risk_level AS source_risk_level,
         ws.status AS source_status
       FROM reports r
       JOIN water_sources ws ON ws.id = r.source_id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT 100`,
      params
    );

    res.json({ reports: result.rows });
  } catch (err) {
    console.error('[GET /api/reports Error]', err);
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

// POST /api/reports -> Submit a water contamination report (supports both existing source & new source creation in one step)
router.post('/', optionalAuth, upload.single('photo'), async (req, res) => {
  try {
    let {
      source_id,
      new_source,
      reporter_name,
      reporter_phone,
      report_type,
      test_parameters,
      symptom_data,
      visual_issues,
      notes,
    } = req.body;

    // Parse JSON fields if submitted via multipart/form-data
    if (typeof new_source === 'string' && new_source.trim()) {
      new_source = JSON.parse(new_source);
    }
    if (typeof test_parameters === 'string' && test_parameters.trim()) {
      test_parameters = JSON.parse(test_parameters);
    }
    if (typeof symptom_data === 'string' && symptom_data.trim()) {
      symptom_data = JSON.parse(symptom_data);
    }
    if (typeof visual_issues === 'string' && visual_issues.trim()) {
      visual_issues = JSON.parse(visual_issues);
    }

    let targetSource = null;

    // 1. If reporting a brand new water source on the map (FR2)
    if (!source_id && new_source) {
      const countRes = await db.query('SELECT COUNT(*)::int AS cnt FROM water_sources');
      const code = `GN-WS-${String((countRes.rows[0].cnt || 0) + 101).padStart(3, '0')}`;

      const createSourceRes = await db.query(
        `INSERT INTO water_sources (code, name, source_type, description, locality, jurisdiction, latitude, longitude, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'reported')
         RETURNING *`,
        [
          code,
          new_source.name || 'Community Reported Source',
          new_source.source_type || 'handpump',
          new_source.description || '',
          new_source.locality || 'Greater Noida',
          new_source.jurisdiction || 'Gautam Buddha Nagar (Greater Noida)',
          parseFloat(new_source.latitude),
          parseFloat(new_source.longitude),
        ]
      );
      targetSource = createSourceRes.rows[0];
      source_id = targetSource.id;
    } else if (source_id) {
      const existingRes = await db.query('SELECT * FROM water_sources WHERE id = $1', [parseInt(source_id, 10)]);
      if (existingRes.rowCount === 0) {
        return res.status(404).json({ error: 'Selected water source does not exist.' });
      }
      targetSource = existingRes.rows[0];
    } else {
      return res.status(400).json({ error: 'Either source_id or new_source details must be provided.' });
    }

    const userId = req.user ? req.user.id : null;
    const effectiveRole = req.user ? req.user.role : 'citizen';
    const effectiveName = req.user ? req.user.name : (reporter_name || 'Anonymous Citizen');
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.photo_url || null);

    // 2. Evaluate single report risk against BIS IS 10500 & symptom rules
    const singleEval = evaluateSingleReport({
      report_type: report_type || 'visual_complaint',
      test_parameters: test_parameters || {},
      symptom_data: symptom_data || {},
      visual_issues: visual_issues || [],
    });

    // If submitted by a logged-in authority or admin, auto-verify
    const initialVerification =
      effectiveRole === 'authority' || effectiveRole === 'admin' ? 'verified' : 'pending';

    const insertReportRes = await db.query(
      `INSERT INTO reports (
         source_id, user_id, reporter_name, reporter_phone, reporter_role,
         report_type, test_parameters, symptom_data, visual_issues,
         notes, photo_url, calculated_report_risk, verification_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        targetSource.id,
        userId,
        effectiveName,
        reporter_phone || '',
        effectiveRole,
        report_type || 'visual_complaint',
        JSON.stringify(test_parameters || {}),
        JSON.stringify(symptom_data || {}),
        JSON.stringify(visual_issues || []),
        notes || '',
        photoUrl,
        singleEval.score,
        initialVerification,
      ]
    );

    const createdReport = insertReportRes.rows[0];

    // 3. Recalculate aggregate risk score for the water source (FR8)
    const allReportsRes = await db.query(
      'SELECT * FROM reports WHERE source_id = $1 ORDER BY created_at DESC',
      [targetSource.id]
    );

    // If a source was previously 'resolved', a new contamination report re-opens it to 'reported'
    const nextSourceStatus =
      targetSource.status === 'resolved' && singleEval.score >= 30
        ? 'reported'
        : targetSource.status;

    const aggregateRisk = calculateSourceAggregateRisk(allReportsRes.rows, nextSourceStatus);

    const updatedSourceRes = await db.query(
      `UPDATE water_sources
       SET risk_score = $1,
           risk_level = $2,
           confidence_level = $3,
           status = $4,
           latest_parameters = CASE WHEN $5::jsonb != '{}'::jsonb THEN $5::jsonb ELSE latest_parameters END,
           last_tested_at = CASE WHEN $6 = 'test_reading' THEN CURRENT_TIMESTAMP ELSE last_tested_at END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        aggregateRisk.risk_score,
        aggregateRisk.risk_level,
        aggregateRisk.confidence_level,
        nextSourceStatus,
        JSON.stringify(aggregateRisk.latest_parameters || {}),
        report_type || 'visual_complaint',
        targetSource.id,
      ]
    );

    const updatedSource = updatedSourceRes.rows[0];

    // 4. Trigger automated authority alert if risk crosses threshold (FR5)
    const triggeredAlert = await evaluateAndDispatchAlert({
      source: updatedSource,
      report: createdReport,
      riskResult: aggregateRisk,
    });

    res.status(201).json({
      report: createdReport,
      source: updatedSource,
      risk_evaluation: {
        report_score: singleEval.score,
        violations: singleEval.violations,
        source_aggregate: aggregateRisk,
      },
      alert_triggered: triggeredAlert,
    });
  } catch (err) {
    console.error('[POST /api/reports Error]', err);
    res.status(500).json({ error: 'Failed to submit contamination report.' });
  }
});

module.exports = router;
