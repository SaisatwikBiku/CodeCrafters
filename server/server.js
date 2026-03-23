require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const { connectPostgres } = require('./db/postgres');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const codeRoutes = require('./routes/code');
const registerSocketHandlers = require('./socket/handlers');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/public')));

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/code', codeRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

registerSocketHandlers(io);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectPostgres();
    server.listen(PORT, () => {
      console.log(`✅  CodeCrafters server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌  Failed to start server:', err);
    process.exit(1);
  }
}

start();