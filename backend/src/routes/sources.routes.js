const express = require('express');
const db = require('../config/db');
const { optionalAuth } = require('../middleware/auth');
const { BIS_STANDARDS } = require('../services/riskEngine');

const router = express.Router();

// GET /api/sources/standards -> Returns BIS IS 10500 threshold definitions
router.get('/standards', (req, res) => {
  res.json({ standards: BIS_STANDARDS });
});

// GET /api/sources -> List all water sources with report counts and filters
router.get('/', async (req, res) => {
  try {
    const { source_type, risk_level, status, search } = req.query;
    const conditions = [];
    const params = [];

    if (source_type && source_type !== 'all') {
      params.push(source_type);
      conditions.push(`ws.source_type = $${params.length}`);
    }
    if (risk_level && risk_level !== 'all') {
      params.push(risk_level);
      conditions.push(`ws.risk_level = $${params.length}`);
    }
    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`ws.status = $${params.length}`);
    }
    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      conditions.push(`(ws.name ILIKE $${params.length} OR ws.locality ILIKE $${params.length} OR ws.code ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const queryText = `
      SELECT
        ws.*,
        COUNT(r.id)::int AS report_count,
        COUNT(CASE WHEN r.verification_status = 'verified' THEN 1 END)::int AS verified_report_count
      FROM water_sources ws
      LEFT JOIN reports r ON r.source_id = ws.id AND r.verification_status != 'rejected'
      ${whereClause}
      GROUP BY ws.id
      ORDER BY ws.risk_score DESC, ws.updated_at DESC
    `;

    const result = await db.query(queryText, params);
    res.json({ sources: result.rows });
  } catch (err) {
    console.error('[GET /api/sources Error]', err);
    res.status(500).json({ error: 'Failed to fetch water sources.' });
  }
});

// GET /api/sources/nearby -> Spatial Haversine query in PostgreSQL to detect nearby sources
router.get('/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusMeters = parseFloat(req.query.radius || '250');

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid lat and lng query parameters are required.' });
    }

    const queryText = `
      SELECT * FROM (
        SELECT
          ws.*,
          ROUND(
            (6371000 * acos(
              LEAST(1.0, GREATEST(-1.0,
                cos(radians($1)) * cos(radians(ws.latitude::float)) *
                cos(radians(ws.longitude::float) - radians($2)) +
                sin(radians($1)) * sin(radians(ws.latitude::float))
              ))
            ))::numeric, 1
          ) AS distance_meters
        FROM water_sources ws
      ) sub
      WHERE sub.distance_meters <= $3
      ORDER BY sub.distance_meters ASC
      LIMIT 5
    `;

    const result = await db.query(queryText, [lat, lng, radiusMeters]);
    res.json({ nearby: result.rows });
  } catch (err) {
    console.error('[GET /api/sources/nearby Error]', err);
    res.status(500).json({ error: 'Failed to check nearby sources.' });
  }
});

// GET /api/sources/:id -> Detailed view of a water source with full report and alert history
router.get('/:id', async (req, res) => {
  try {
    const sourceId = parseInt(req.params.id, 10);
    if (isNaN(sourceId)) {
      return res.status(400).json({ error: 'Invalid source ID.' });
    }

    const sourceRes = await db.query('SELECT * FROM water_sources WHERE id = $1', [sourceId]);
    if (sourceRes.rowCount === 0) {
      return res.status(404).json({ error: 'Water source not found.' });
    }

    const reportsRes = await db.query(
      `SELECT r.*, u.name AS user_account_name, u.role AS user_account_role
       FROM reports r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.source_id = $1
       ORDER BY r.created_at DESC`,
      [sourceId]
    );

    const alertsRes = await db.query(
      `SELECT * FROM alerts WHERE source_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [sourceId]
    );

    res.json({
      source: sourceRes.rows[0],
      reports: reportsRes.rows,
      alerts: alertsRes.rows,
    });
  } catch (err) {
    console.error('[GET /api/sources/:id Error]', err);
    res.status(500).json({ error: 'Failed to fetch source details.' });
  }
});

// POST /api/sources -> Register a new water source on the map (FR2)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { name, source_type, description, locality, jurisdiction, latitude, longitude } = req.body;
    if (!name || !source_type || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Name, source_type, latitude, and longitude are required.' });
    }

    const countRes = await db.query('SELECT COUNT(*)::int AS cnt FROM water_sources');
    const code = `GN-WS-${String((countRes.rows[0].cnt || 0) + 101).padStart(3, '0')}`;

    const insertRes = await db.query(
      `INSERT INTO water_sources (code, name, source_type, description, locality, jurisdiction, latitude, longitude, risk_score, risk_level, confidence_level, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 15.0, 'low', 'low', 'reported')
       RETURNING *`,
      [
        code,
        name.trim(),
        source_type,
        description || '',
        locality || 'Greater Noida',
        jurisdiction || 'Gautam Buddha Nagar (Greater Noida)',
        parseFloat(latitude),
        parseFloat(longitude),
      ]
    );

    res.status(201).json({ source: insertRes.rows[0] });
  } catch (err) {
    console.error('[POST /api/sources Error]', err);
    res.status(500).json({ error: 'Failed to create water source.' });
  }
});

module.exports = router;
