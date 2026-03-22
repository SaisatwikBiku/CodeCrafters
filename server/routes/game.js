const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../db/postgres');
const { setSessionState, getSessionState } = require('../db/session');

router.post('/create', async (req, res) => {
  const { playerName } = req.body;
  if (!playerName) return res.status(400).json({ error: 'playerName required' });

  const sessionId = uuidv4().slice(0, 8).toUpperCase();
  const pool = getPool();

  try {
    const initialState = {
      sessionId,
      stage: 1,
      score: 0,
      players: {
        Architect: { name: playerName, ready: false },
        Builder: null,
      },
      chat: [],
    };

    await pool.query(
      'INSERT INTO sessions (id, state) VALUES ($1, $2)',
      [sessionId, JSON.stringify(initialState)]
    );
    await pool.query(
      'INSERT INTO players (session_id, name, role) VALUES ($1, $2, $3)',
      [sessionId, playerName, 'Architect']
    );

    res.json({ sessionId, role: 'Architect', message: 'Session created. Share the ID with your partner.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.post('/join', async (req, res) => {
  const { sessionId, playerName } = req.body;
  if (!sessionId || !playerName) return res.status(400).json({ error: 'sessionId and playerName required' });

  const pool = getPool();

  try {
    const { rows } = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    if (rows[0].completed) return res.status(400).json({ error: 'Session already completed' });

    const state = await getSessionState(sessionId);
    if (!state) return res.status(404).json({ error: 'Session state not found' });
    if (state.players.Builder) return res.status(400).json({ error: 'Session is full' });

    await pool.query(
      'INSERT INTO players (session_id, name, role) VALUES ($1, $2, $3)',
      [sessionId, playerName, 'Builder']
    );

    state.players.Builder = { name: playerName, ready: false };
    await setSessionState(sessionId, state);

    res.json({ sessionId, role: 'Builder', stage: state.stage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

router.get('/:sessionId', async (req, res) => {
  const state = await getSessionState(req.params.sessionId);
  if (!state) return res.status(404).json({ error: 'Session not found' });
  res.json(state);
});

module.exports = router;