const { getPool } = require('./postgres');

async function setSessionState(sessionId, state) {
  const pool = getPool();
  await pool.query(
    `UPDATE sessions SET state = $1 WHERE id = $2`,
    [JSON.stringify(state), sessionId]
  );
}

async function getSessionState(sessionId) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT state FROM sessions WHERE id = $1`,
    [sessionId]
  );
  return rows[0]?.state || null;
}

async function deleteSessionState(sessionId) {
  const pool = getPool();
  await pool.query(`DELETE FROM sessions WHERE id = $1`, [sessionId]);
}

module.exports = { setSessionState, getSessionState, deleteSessionState };