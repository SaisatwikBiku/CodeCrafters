const { createClient } = require('redis');

let client;

async function connectRedis() {
  client = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    },
  });

  client.on('error', (err) => console.error('Redis error:', err));
  await client.connect();
  console.log('✅  Redis connected');
}

// ── Game state helpers ──────────────────────────────────────

/** Save the live state of a session (TTL: 24 hours) */
async function setSessionState(sessionId, state) {
  await client.set(`session:${sessionId}`, JSON.stringify(state), { EX: 86400 });
}

/** Retrieve the live state of a session */
async function getSessionState(sessionId) {
  const raw = await client.get(`session:${sessionId}`);
  return raw ? JSON.parse(raw) : null;
}

/** Delete a session from cache */
async function deleteSessionState(sessionId) {
  await client.del(`session:${sessionId}`);
}

function getClient() {
  if (!client) throw new Error('Redis not connected yet');
  return client;
}

module.exports = { connectRedis, setSessionState, getSessionState, deleteSessionState, getClient };
