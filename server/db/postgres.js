const { Pool } = require('pg');

let pool;

async function connectPostgres() {
  pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'codecrafters',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
  });

  // Verify connection
  const client = await pool.connect();
  console.log('✅  PostgreSQL connected');
  client.release();

  // Run schema init
  await initSchema();
}

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      stage       INTEGER DEFAULT 1,
      score       INTEGER DEFAULT 0,
      completed   BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS players (
      id          SERIAL PRIMARY KEY,
      session_id  TEXT REFERENCES sessions(id),
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
