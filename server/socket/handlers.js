import { getSessionState, setSessionState } from '../db/session.js';
import { Session } from '../db/mongodb.js';
import { generateAIChatResponse } from '../ai.js';

const TOTAL_STAGES = 5;
const activeRoleSockets = new Map();
const replacedSockets = new Set();

function sessionRoleKey(sessionId, role) {
  return `${sessionId}:${role}`;
}

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join_room', async ({ sessionId, playerName, role }) => {
      const key = sessionRoleKey(sessionId, role);
      const previousSocketId = activeRoleSockets.get(key);
      if (previousSocketId && previousSocketId !== socket.id) {
        const previousSocket = io.sockets.sockets.get(previousSocketId);
        if (previousSocket) {
          replacedSockets.add(previousSocketId);
          previousSocket.disconnect(true);
        }
      }
      activeRoleSockets.set(key, socket.id);

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

    socket.on('chat_message', async ({ sessionId, message, task }) => {
      const socketSessionId = socket.data?.sessionId;
      const playerName = socket.data?.playerName;
      const role = socket.data?.role;
      const effectiveSessionId = socketSessionId || sessionId;
      if (!effectiveSessionId || !playerName || !role || !message?.trim()) return;

      const room = `session:${effectiveSessionId}`;
      const entry = { playerName, role, message, timestamp: Date.now() };

      const state = await getSessionState(effectiveSessionId);
      if (state) {
        // Cache the task in session state so it's available for future replies
        if (task) state.currentTask = task;
        state.chat.push(entry);
        if (state.chat.length > 100) state.chat.shift();
        await setSessionState(effectiveSessionId, state);
      }

      io.to(room).emit('chat_message', entry);

      // AI game: reply after a short delay
      if (state?.ai_game && role !== 'Builder') {
        const currentStage = state.stage;
        const taskContext = task || state?.currentTask || null;
        const delay = 1000 + Math.random() * 1500;
        setTimeout(async () => {
          const aiText = await generateAIChatResponse(message, currentStage, taskContext);
          const aiEntry = { playerName: 'AI Buddy', role: 'Builder', message: aiText, timestamp: Date.now() };
          const freshState = await getSessionState(effectiveSessionId);
          if (freshState) {
            freshState.chat.push(aiEntry);
            if (freshState.chat.length > 100) freshState.chat.shift();
            await setSessionState(effectiveSessionId, freshState);
          }
          io.to(room).emit('chat_message', aiEntry);
        }, delay);
      }
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
      } else if (state.ai_game && state.players.Architect?.ready && !state.players.Builder?.ready) {
        // AI auto-completes its task after a realistic delay
        const delay = 2000 + Math.random() * 3000;
        setTimeout(async () => {
          const freshState = await getSessionState(sessionId);
          if (!freshState || !freshState.players.Builder) return;
          freshState.players.Builder.ready = true;
          await setSessionState(sessionId, freshState);
          io.to(room).emit('partner_status', { role: 'Builder', ready: true, allReady: true });
          await advanceStage(io, room, sessionId, freshState);
        }, delay);
      }
    });

    socket.on('disconnect', () => {
      const { sessionId, playerName, role } = socket.data || {};
      const replaced = replacedSockets.has(socket.id);
      if (replaced) replacedSockets.delete(socket.id);
      if (sessionId && role) {
        const key = sessionRoleKey(sessionId, role);
        if (activeRoleSockets.get(key) === socket.id) {
          activeRoleSockets.delete(key);
        }
      }
      if (sessionId && !replaced) {
        const room = `session:${sessionId}`;
        io.to(room).emit('player_disconnected', { playerName, role });
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

async function advanceStage(io, room, sessionId, state) {
  // Award XP for the stage that was just completed (applies to all stages including the last)
  state.score += 100;

  if (state.stage >= TOTAL_STAGES) {
    state.completed = true;
    await setSessionState(sessionId, state);

    try {
      await Session.updateOne({ _id: sessionId }, { $set: { completed: true, score: state.score } });
    } catch (err) {
      console.error('[advanceStage] Failed to mark session completed in DB:', err.message);
    }

    io.to(room).emit('game_complete', { state });
    return;
  }

  state.stage += 1;
  if (state.players.Architect) state.players.Architect.ready = false;
  if (state.players.Builder) state.players.Builder.ready = false;

  await setSessionState(sessionId, state);

  try {
    await Session.updateOne({ _id: sessionId }, { $set: { stage: state.stage, score: state.score } });
  } catch (err) {
    console.error('[advanceStage] Failed to persist stage/score to DB:', err.message);
  }

  io.to(room).emit('stage_complete', {
    completedStage: state.stage - 1,
    nextStage: state.stage,
    score: state.score,
    state,
  });
}

export default registerSocketHandlers;