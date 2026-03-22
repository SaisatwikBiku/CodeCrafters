const { getSessionState, setSessionState } = require('../db/redis');
const { getPool } = require('../db/postgres');

const TOTAL_STAGES = 5;

/**
 * All Socket.IO events are namespaced under a session room.
 * Room name convention: `session:<sessionId>`
 */
function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ── JOIN ROOM ────────────────────────────────────────────
    // Client emits this after a successful /api/game/join or /api/game/create
    socket.on('join_room', async ({ sessionId, playerName, role }) => {
      const room = `session:${sessionId}`;
      socket.join(room);
      socket.data = { sessionId, playerName, role };

      const state = await getSessionState(sessionId);
      if (!state) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Notify everyone in the room
      io.to(room).emit('player_joined', { playerName, role, state });
      console.log(`${playerName} (${role}) joined room ${room}`);
    });

    // ── CHAT MESSAGE ─────────────────────────────────────────
    socket.on('chat_message', async ({ sessionId, playerName, message }) => {
      const room = `session:${sessionId}`;
      const entry = { playerName, message, timestamp: Date.now() };

      const state = await getSessionState(sessionId);
      if (state) {
        state.chat.push(entry);
        // Keep last 100 messages in Redis
        if (state.chat.length > 100) state.chat.shift();
        await setSessionState(sessionId, state);
      }

      io.to(room).emit('chat_message', entry);
    });

    // ── TASK COMPLETE ────────────────────────────────────────
    // Emitted by a player after their code passes Judge0 validation
    socket.on('task_complete', async ({ sessionId, role }) => {
      const room = `session:${sessionId}`;
      const state = await getSessionState(sessionId);
      if (!state) return;

      // Mark this player as ready
      if (state.players[role]) {
        state.players[role].ready = true;
      }

      await setSessionState(sessionId, state);

      // Notify partner of progress
      io.to(room).emit('partner_status', {
        role,
        ready: true,
        allReady: state.players.Architect?.ready && state.players.Builder?.ready,
      });

      // If BOTH players are done — advance stage
      if (state.players.Architect?.ready && state.players.Builder?.ready) {
        await advanceStage(io, room, sessionId, state);
      }
    });

    // ── DISCONNECT ───────────────────────────────────────────
    socket.on('disconnect', () => {
      const { sessionId, playerName, role } = socket.data || {};
      if (sessionId) {
        const room = `session:${sessionId}`;
        io.to(room).emit('player_disconnected', { playerName, role });
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

// ── Advance to the next stage ─────────────────────────────────
async function advanceStage(io, room, sessionId, state) {
  if (state.stage >= TOTAL_STAGES) {
    // Game complete!
    state.completed = true;
    await setSessionState(sessionId, state);

    try {
      const pool = getPool();
      await pool.query('UPDATE sessions SET completed = TRUE WHERE id = $1', [sessionId]);
    } catch (_) {}

    io.to(room).emit('game_complete', { state });
    return;
  }

  // Move to next stage, reset ready flags
  state.stage += 1;
  state.score += 100; // 100 points per stage — adjust as needed
  if (state.players.Architect) state.players.Architect.ready = false;
  if (state.players.Builder) state.players.Builder.ready = false;

  await setSessionState(sessionId, state);

  try {
    const pool = getPool();
    await pool.query('UPDATE sessions SET stage = $1, score = $2 WHERE id = $3', [
      state.stage,
      state.score,
      sessionId,
    ]);
  } catch (_) {}

  io.to(room).emit('stage_complete', {
    completedStage: state.stage - 1,
    nextStage: state.stage,
    score: state.score,
    state,
  });
}

module.exports = registerSocketHandlers;
