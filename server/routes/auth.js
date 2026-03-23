const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db/postgres');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const pool = getPool();
  try {
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Username already taken' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hash]
    );

    const token = jwt.sign({ id: rows[0].id, username: rows[0].username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: rows[0].username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const pool = getPool();
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid username or password' });

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ id: rows[0].id, username: rows[0].username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: rows[0].username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me — verify token and return user
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ id: decoded.id, username: decoded.username });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;