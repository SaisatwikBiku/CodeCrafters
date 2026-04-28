import express from 'express';
const router = express.Router();
import { v4 as uuidv4 } from 'uuid';
import { Session, Player } from '../db/mongodb.js';
import { setSessionState, getSessionState } from '../db/session.js';
import { authMiddleware } from '../middleware/auth.js';

// Clamp the caller-supplied startStage into [1, 5]. Anything else falls back to 1.
function normalizeStartStage(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.min(5, Math.max(1, Math.floor(n)));
}

// Clamp the caller-supplied level into [1, 3]. Anything else falls back to 1.
function normalizeLevel(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.min(3, Math.max(1, Math.floor(n)));
}

function normalizeRole(raw) {
  if (raw === 'Builder') return 'Builder';
  return 'Architect'; // default
}

router.post('/create', authMiddleware, async (req, res) => {
  const { username, id: userId } = req.user;
  const sessionId = uuidv4().slice(0, 8).toUpperCase();
  const startStage = normalizeStartStage(req.body?.startStage);
  const level = normalizeLevel(req.body?.level);
  const role = normalizeRole(req.body?.role);
  const otherRole = role === 'Architect' ? 'Builder' : 'Architect';

  try {
    const initialState = {
      sessionId,
      stage: startStage,
      level,
      score: 0,
      players: {
        [role]: { name: username, userId, ready: false },
        [otherRole]: null,
      },
      chat: [],
    };

    await Session.create({ _id: sessionId, stage: startStage, startStage, level, state: initialState });
    await Player.create({ sessionId, userId, name: username, role });

    res.json({ sessionId, role, stage: startStage, level });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.post('/join', authMiddleware, async (req, res) => {
  const { sessionId } = req.body;
  const { username, id: userId } = req.user;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  try {
    const session = await Session.findById(sessionId).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.completed) return res.status(400).json({ error: 'Session already completed' });

    const state = await getSessionState(sessionId);
    if (!state) return res.status(404).json({ error: 'Session state not found' });

    const level = normalizeLevel(state.level);

    // Rejoin as Architect
    if (state.players.Architect?.userId === userId) {
      return res.json({ sessionId, role: 'Architect', stage: state.stage, level, rejoining: true });
    }

    // Rejoin as Builder
    if (state.players.Builder?.userId === userId) {
      return res.json({ sessionId, role: 'Builder', stage: state.stage, level, rejoining: true });
    }

    // New player joining — assign whichever role is still open
    const openRole = !state.players.Architect ? 'Architect' : !state.players.Builder ? 'Builder' : null;
    if (!openRole) {
      return res.status(400).json({ error: 'Session is full' });
    }

    await Player.create({ sessionId, userId, name: username, role: openRole });

    state.players[openRole] = { name: username, userId, ready: false };
    await setSessionState(sessionId, state);

    res.json({ sessionId, role: openRole, stage: state.stage, level, rejoining: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

// POST /api/game/create-ai — create a solo session with an AI partner
router.post('/create-ai', authMiddleware, async (req, res) => {
  const { username, id: userId } = req.user;
  const sessionId = uuidv4().slice(0, 8).toUpperCase();
  const startStage = normalizeStartStage(req.body?.startStage);
  const level = normalizeLevel(req.body?.level);
  const role = normalizeRole(req.body?.role);
  const aiRole = role === 'Architect' ? 'Builder' : 'Architect';

  try {
    const initialState = {
      sessionId,
      stage: startStage,
      level,
      score: 0,
      ai_game: true,
      players: {
        [role]:   { name: username, userId, ready: false },
        [aiRole]: { name: 'AI Buddy', userId: null, isAI: true, ready: false },
      },
      chat: [],
    };

    await Session.create({ _id: sessionId, stage: startStage, startStage, level, state: initialState });
    // Only insert the human player — AI has no users document
    await Player.create({ sessionId, userId, name: username, role });

    res.json({ sessionId, role, stage: startStage, level });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create AI session' });
  }
});

// GET active session for logged in user
router.get('/active', authMiddleware, async (req, res) => {
  const { id: userId } = req.user;

  try {
    const players = await Player.find({ userId }).lean();
    const sessionIds = players.map(p => p.sessionId);

    const session = await Session.findOne(
      { _id: { $in: sessionIds }, completed: false },
    ).sort({ createdAt: -1 }).lean();

    if (!session) return res.json({ session: null });

    const player = players.find(p => p.sessionId === session._id);
    res.json({ session: { id: session._id, stage: session.stage, score: session.score, role: player.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch active session' });
  }
});

// POST /api/game/abandon — mark a session as completed so it no longer
// appears as an active session. The user is not penalized for leaving.
router.post('/abandon', authMiddleware, async (req, res) => {
  const { id: userId } = req.user;
  try {
    // Find the most recent incomplete session for this user
    const players = await Player.find({ userId }).lean();
    const sessionIds = players.map(p => p.sessionId);
    const session = await Session.findOne(
      { _id: { $in: sessionIds }, completed: false },
    ).sort({ createdAt: -1 }).lean();

    if (!session) return res.json({ ok: true, message: 'No active session found' });

    await Session.updateOne({ _id: session._id }, { $set: { completed: true } });
    res.json({ ok: true, sessionId: session._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to abandon session' });
  }
});

router.get('/:sessionId', authMiddleware, async (req, res) => {
  const state = await getSessionState(req.params.sessionId);
  if (!state) return res.status(404).json({ error: 'Session not found' });
  res.json(state);
});

export default router;
