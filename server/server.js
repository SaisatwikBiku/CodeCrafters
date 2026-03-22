require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const { connectPostgres } = require('./db/postgres');
const { connectRedis } = require('./db/redis');
const gameRoutes = require('./routes/game');
const codeRoutes = require('./routes/code');
const registerSocketHandlers = require('./socket/handlers');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/public')));

// ── REST Routes ─────────────────────────────────────────────
app.use('/api/game', gameRoutes);
app.use('/api/code', codeRoutes);

// ── Serve frontend for all non-API routes ───────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// ── Socket.IO ───────────────────────────────────────────────
registerSocketHandlers(io);

// ── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectPostgres();
    await connectRedis();
    server.listen(PORT, () => {
      console.log(`✅  CodeCrafters server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌  Failed to start server:', err);
    process.exit(1);
  }
}

start();
