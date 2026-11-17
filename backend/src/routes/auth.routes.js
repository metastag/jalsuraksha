const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, jurisdiction } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const allowedRole = ['citizen', 'tester', 'authority', 'admin'].includes(role) ? role : 'citizen';
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, phone, role, jurisdiction)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, phone, role, jurisdiction, created_at`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        passwordHash,
        phone || '',
        allowedRole,
        jurisdiction || 'Gautam Buddha Nagar (Greater Noida)',
      ]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, jurisdiction: user.jurisdiction },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('[Auth Register Error]', err);
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userRecord = result.rows[0];
    const valid = await bcrypt.compare(password, userRecord.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      phone: userRecord.phone,
      role: userRecord.role,
      jurisdiction: userRecord.jurisdiction,
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    console.error('[Auth Login Error]', err);
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, phone, role, jurisdiction, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// GET /api/auth/demo-accounts
router.get('/demo-accounts', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, jurisdiction FROM users ORDER BY id ASC'
    );
    res.json({ accounts: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list demo accounts.' });
  }
});

module.exports = router;
