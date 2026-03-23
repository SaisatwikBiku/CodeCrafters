const { Pool } = require('pg');

let pool;

async function connectPostgres() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();
  console.log('✅  PostgreSQL connected');
  client.release();
  await initSchema();
}

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      username    TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      created_at  TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      stage       INTEGER DEFAULT 1,
      score       INTEGER DEFAULT 0,
      completed   BOOLEAN DEFAULT FALSE,
      state       JSONB,
      created_at  TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS players (
      id          SERIAL PRIMARY KEY,
      session_id  TEXT REFERENCES sessions(id),
      user_id     INTEGER REFERENCES users(id),
      name        TEXT NOT NULL,
      role        TEXT CHECK (role IN ('Architect', 'Builder')),
      stage_done  BOOLEAN DEFAULT FALSE,
      joined_at   TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅  Database schema ready');
}

function getPool() {
  if (!pool) throw new Error('PostgreSQL not connected yet');
  return pool;
}

module.exports = { connectPostgres, getPool };