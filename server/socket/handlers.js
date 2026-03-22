const { getSessionState, setSessionState } = require('../db/session');
const { getPool } = require('../db/postgres');

const TOTAL_STAGES = 5;

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join_room', async ({ sessionId, playerName, role }) => {
      const room = `session:${sessionId}`;
      socket.join(room);
      socket.data = { sessionId, playerName, role };

      const state = await getSessionState(sessionId);
      if (!state) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      io.to(room).emit('player_joined', { playerName, role, state });
      console.log(`${playerName} (${role}) joined room ${room}`);
    });

    socket.on('chat_message', async ({ sessionId, playerName, message }) => {
      const room = `session:${sessionId}`;
      const entry = { playerName, message, timestamp: Date.now() };

      const state = await getSessionState(sessionId);
      if (state) {
        state.chat.push(entry);
        if (state.chat.length > 100) state.chat.shift();
        await setSessionState(sessionId, state);
      }

      io.to(room).emit('chat_message', entry);
    });

    socket.on('task_complete', async ({ sessionId, role }) => {
      const room = `session:${sessionId}`;
      const state = await getSessionState(sessionId);
      if (!state) return;

      if (state.players[role]) {
        state.players[role].ready = true;
      }

      await setSessionState(sessionId, state);

      io.to(room).emit('partner_status', {
        role,
        ready: true,
        allReady: state.players.Architect?.ready && state.players.Builder?.ready,
      });

      if (state.players.Architect?.ready && state.players.Builder?.ready) {
        await advanceStage(io, room, sessionId, state);
      }
    });

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

async function advanceStage(io, room, sessionId, state) {
  if (state.stage >= TOTAL_STAGES) {
    state.completed = true;
    await setSessionState(sessionId, state);

    try {
      const pool = getPool();
      await pool.query('UPDATE sessions SET completed = TRUE WHERE id = $1', [sessionId]);
    } catch (_) {}

    io.to(room).emit('game_complete', { state });
    return;
  }

  state.stage += 1;
  state.score += 100;
  if (state.players.Architect) state.players.Architect.ready = false;
  if (state.players.Builder) state.players.Builder.ready = false;

  await setSessionState(sessionId, state);

  try {
    const pool = getPool();
    await pool.query(
      'UPDATE sessions SET stage = $1, score = $2 WHERE id = $3',
      [state.stage, state.score, sessionId]
    );
  } catch (_) {}

  io.to(room).emit('stage_complete', {
    completedStage: state.stage - 1,
    nextStage: state.stage,
    score: state.score,
    state,
  });
}

module.exports = registerSocketHandlers;