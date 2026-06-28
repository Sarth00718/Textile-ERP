const { query } = require('../config/db');

async function findUserByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

async function findUserById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function createUser({ fullName, email, phone, passwordHash, role, departmentId }) {
  const { rows } = await query(
    `INSERT INTO users (full_name, email, phone, password_hash, role, department_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [fullName, email, phone || null, passwordHash, role || 'WORKER', departmentId || null]
  );
  return rows[0];
}

async function updateLastLogin(userId) {
  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [userId]);
}

async function updatePasswordHash(userId, passwordHash) {
  await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, userId]);
}

async function storeRefreshToken({ userId, tokenHash, expiresAt, userAgent, ipAddress }) {
  const { rows } = await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, tokenHash, expiresAt, userAgent || null, ipAddress || null]
  );
  return rows[0];
}

async function findRefreshTokenByHash(tokenHash) {
  const { rows } = await query(
    `SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function revokeRefreshToken(id) {
  await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [id]);
}

async function revokeAllUserTokens(userId) {
  await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [userId]);
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateLastLogin,
  updatePasswordHash,
  storeRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshToken,
  revokeAllUserTokens,
};
