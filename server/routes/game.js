const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../db/postgres');
const { setSessionState, getSessionState } = require('../db/session');
const { authMiddleware } = require('../middleware/auth');

router.post('/create', authMiddleware, async (req, res) => {
  const { username, id: userId } = req.user;
  const pool = getPool();
  const sessionId = uuidv4().slice(0, 8).toUpperCase();

  try {
    const initialState = {
      sessionId,
      stage: 1,
      score: 0,
      players: {
        Architect: { name: username, userId, ready: false },
        Builder: null,
      },
      chat: [],
    };

    await pool.query(
      'INSERT INTO sessions (id, state) VALUES ($1, $2)',
      [sessionId, JSON.stringify(initialState)]
    );
    await pool.query(
      'INSERT INTO players (session_id, user_id, name, role) VALUES ($1, $2, $3, $4)',
      [sessionId, userId, username, 'Architect']
    );

    res.json({ sessionId, role: 'Architect' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.post('/join', authMiddleware, async (req, res) => {
  const { sessionId } = req.body;
  const { username, id: userId } = req.user;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  const pool = getPool();

  try {
    const { rows } = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    if (rows[0].completed) return res.status(400).json({ error: 'Session already completed' });

    const state = await getSessionState(sessionId);
    if (!state) return res.status(404).json({ error: 'Session state not found' });

    // Rejoin as Architect
    if (state.players.Architect?.userId === userId) {
      return res.json({ sessionId, role: 'Architect', stage: state.stage, rejoining: true });
    }

    // Rejoin as Builder
    if (state.players.Builder?.userId === userId) {
      return res.json({ sessionId, role: 'Builder', stage: state.stage, rejoining: true });
    }

    // New Builder joining
    if (state.players.Builder) {
      return res.status(400).json({ error: 'Session is full' });
    }

    await pool.query(
      'INSERT INTO players (session_id, user_id, name, role) VALUES ($1, $2, $3, $4)',
      [sessionId, userId, username, 'Builder']
    );

    state.players.Builder = { name: username, userId, ready: false };
    await setSessionState(sessionId, state);

    res.json({ sessionId, role: 'Builder', stage: state.stage, rejoining: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

// GET active session for logged in user
router.get('/active', authMiddleware, async (req, res) => {
  const { id: userId } = req.user;
  const pool = getPool();

  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.stage, s.score, p.role
      FROM sessions s
      JOIN players p ON p.session_id = s.id
      WHERE p.user_id = $1 AND s.completed = FALSE
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [userId]);

    if (rows.length === 0) return res.json({ session: null });
    res.json({ session: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch active session' });
  }
});

router.get('/:sessionId', authMiddleware, async (req, res) => {
  const state = await getSessionState(req.params.sessionId);
  if (!state) return res.status(404).json({ error: 'Session not found' });
  res.json(state);
});

module.exports = router;