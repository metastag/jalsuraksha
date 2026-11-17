const express = require('express');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { calculateSourceAggregateRisk } = require('../services/riskEngine');

const router = express.Router();

// GET /api/authority/stats -> Dashboard KPI summary metrics (FR6)
router.get('/stats', async (req, res) => {
  try {
    const sourceStats = await db.query(`
      SELECT
        COUNT(*)::int AS total_sources,
        COUNT(CASE WHEN risk_level = 'high' AND status != 'resolved' THEN 1 END)::int AS high_risk_sources,
        COUNT(CASE WHEN risk_level = 'medium' AND status != 'resolved' THEN 1 END)::int AS medium_risk_sources,
        COUNT(CASE WHEN risk_level = 'low' OR status = 'resolved' THEN 1 END)::int AS safe_sources,
        COUNT(CASE WHEN status = 'under_treatment' THEN 1 END)::int AS under_treatment_sources,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END)::int AS resolved_sources
      FROM water_sources
    `);

    const reportStats = await db.query(`
      SELECT
        COUNT(*)::int AS total_reports,
        COUNT(CASE WHEN verification_status = 'pending' THEN 1 END)::int AS pending_reports,
        COUNT(CASE WHEN verification_status = 'verified' THEN 1 END)::int AS verified_reports
      FROM reports
    `);

    const alertStats = await db.query(`
      SELECT
        COUNT(*)::int AS total_alerts,
        COUNT(CASE WHEN status = 'unread' THEN 1 END)::int AS unread_alerts,
        COUNT(CASE WHEN severity = 'critical' AND status != 'resolved' THEN 1 END)::int AS active_critical_alerts
      FROM alerts
    `);

    res.json({
      sources: sourceStats.rows[0],
      reports: reportStats.rows[0],
      alerts: alertStats.rows[0],
    });
  } catch (err) {
    console.error('[GET /api/authority/stats Error]', err);
    res.status(500).json({ error: 'Failed to load dashboard statistics.' });
  }
});

// GET /api/authority/alerts -> List all automated alerts (FR5)
router.get('/alerts', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        a.*,
        ws.code AS source_code,
        ws.name AS source_name,
        ws.locality,
        ws.source_type,
        ws.risk_score,
        ws.risk_level,
        ws.status AS source_status
      FROM alerts a
      JOIN water_sources ws ON ws.id = a.source_id
      ORDER BY
        CASE WHEN a.status = 'unread' THEN 0 WHEN a.status = 'acknowledged' THEN 1 ELSE 2 END,
        a.created_at DESC
    `);
    res.json({ alerts: result.rows });
  } catch (err) {
    console.error('[GET /api/authority/alerts Error]', err);
    res.status(500).json({ error: 'Failed to load authority alerts.' });
  }
});

// PATCH /api/authority/alerts/:id -> Acknowledge or resolve an alert
router.patch('/alerts/:id', requireAuth, requireRole('authority', 'admin'), async (req, res) => {
  try {
    const alertId = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!['unread', 'acknowledged', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid alert status.' });
    }

    const result = await db.query(
      `UPDATE alerts
       SET status = $1,
           resolved_at = CASE WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
       WHERE id = $2
       RETURNING *`,
      [status, alertId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Alert not found.' });
    }
    res.json({ alert: result.rows[0] });
  } catch (err) {
    console.error('[PATCH /api/authority/alerts/:id Error]', err);
    res.status(500).json({ error: 'Failed to update alert status.' });
  }
});

// PATCH /api/authority/reports/:id/verify -> Verify, reject, or resolve a submitted report (FR6)
router.patch('/reports/:id/verify', requireAuth, requireRole('authority', 'admin'), async (req, res) => {
  try {
    const reportId = parseInt(req.params.id, 10);
    const { verification_status, authority_remark } = req.body;

    if (!['pending', 'verified', 'rejected', 'resolved'].includes(verification_status)) {
      return res.status(400).json({ error: 'Invalid verification_status.' });
    }

    const reportRes = await db.query(
      `UPDATE reports
       SET verification_status = $1,
           verified_by = $2,
           authority_remark = COALESCE($3, authority_remark)
       WHERE id = $4
       RETURNING *`,
      [verification_status, req.user.id, authority_remark || null, reportId]
    );

    if (reportRes.rowCount === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const updatedReport = reportRes.rows[0];

    // Recalculate parent water source risk score & confidence level
    const sourceRes = await db.query('SELECT * FROM water_sources WHERE id = $1', [updatedReport.source_id]);
    const currentSource = sourceRes.rows[0];

    const allReportsRes = await db.query(
      'SELECT * FROM reports WHERE source_id = $1 ORDER BY created_at DESC',
      [updatedReport.source_id]
    );

    const nextSourceStatus =
      verification_status === 'verified' && currentSource.status === 'reported'
        ? 'verified'
        : currentSource.status;

    const aggregateRisk = calculateSourceAggregateRisk(allReportsRes.rows, nextSourceStatus);

    const updatedSourceRes = await db.query(
      `UPDATE water_sources
       SET risk_score = $1,
           risk_level = $2,
           confidence_level = $3,
           status = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [
        aggregateRisk.risk_score,
        aggregateRisk.risk_level,
        aggregateRisk.confidence_level,
        nextSourceStatus,
        updatedReport.source_id,
      ]
    );

    res.json({
      report: updatedReport,
      source: updatedSourceRes.rows[0],
    });
  } catch (err) {
    console.error('[PATCH /api/authority/reports/:id/verify Error]', err);
    res.status(500).json({ error: 'Failed to update report verification.' });
  }
});

// PATCH /api/authority/sources/:id/status -> Update treatment workflow status of a water source (FR6)
router.patch('/sources/:id/status', requireAuth, requireRole('authority', 'admin'), async (req, res) => {
  try {
    const sourceId = parseInt(req.params.id, 10);
    const { status, authority_notes } = req.body;

    if (!['reported', 'verified', 'under_treatment', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid source status.' });
    }

    // If authority marks the source as 'resolved', also mark all pending/verified reports and alerts as resolved
    if (status === 'resolved') {
      await db.query(
        `UPDATE reports SET verification_status = 'resolved', authority_remark = COALESCE($1, authority_remark)
         WHERE source_id = $2 AND verification_status IN ('pending', 'verified')`,
        [authority_notes || 'Treated and resolved by PHED Authority', sourceId]
      );
      await db.query(
        `UPDATE alerts SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE source_id = $1`,
        [sourceId]
      );
    } else if (status === 'under_treatment') {
      await db.query(
        `UPDATE alerts SET status = 'acknowledged' WHERE source_id = $1 AND status = 'unread'`,
        [sourceId]
      );
    }

    const allReportsRes = await db.query(
      'SELECT * FROM reports WHERE source_id = $1 ORDER BY created_at DESC',
      [sourceId]
    );

    const aggregateRisk = calculateSourceAggregateRisk(allReportsRes.rows, status);

    const updatedSourceRes = await db.query(
      `UPDATE water_sources
       SET status = $1,
           authority_notes = COALESCE($2, authority_notes),
           risk_score = $3,
           risk_level = $4,
           confidence_level = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        status,
        authority_notes || null,
        aggregateRisk.risk_score,
        aggregateRisk.risk_level,
        aggregateRisk.confidence_level,
        sourceId,
      ]
    );

    if (updatedSourceRes.rowCount === 0) {
      return res.status(404).json({ error: 'Water source not found.' });
    }

    res.json({ source: updatedSourceRes.rows[0] });
  } catch (err) {
    console.error('[PATCH /api/authority/sources/:id/status Error]', err);
    res.status(500).json({ error: 'Failed to update water source status.' });
  }
});

module.exports = router;
