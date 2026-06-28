const { query } = require('../config/db');

/**
 * Creates a notification for a specific user, or for all users of given roles
 * if userIds is omitted and roles is provided.
 */
async function notify({ userId, title, message, severity = 'INFO', module: moduleName, referenceType, referenceId }) {
  await query(
    `INSERT INTO notifications (user_id, title, message, severity, module, reference_type, reference_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, title, message, severity, moduleName || null, referenceType || null, referenceId || null]
  );
}

async function notifyRoles({ roles, title, message, severity = 'INFO', module: moduleName, referenceType, referenceId }) {
  const { rows: users } = await query('SELECT id FROM users WHERE role = ANY($1) AND is_active = TRUE', [roles]);
  for (const u of users) {
    await notify({ userId: u.id, title, message, severity, module: moduleName, referenceType, referenceId });
  }
}

async function listForUser(userId, { unreadOnly = false, limit = 50, offset = 0 } = {}) {
  const conditions = ['user_id = $1'];
  const params = [userId];
  if (unreadOnly) conditions.push('is_read = FALSE');
  params.push(limit, offset);
  const { rows } = await query(
    `SELECT * FROM notifications WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function markRead(id, userId) {
  const { rows } = await query(
    `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  );
  return rows[0];
}

async function markAllRead(userId) {
  await query(`UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = $1 AND is_read = FALSE`, [userId]);
}

module.exports = { notify, notifyRoles, listForUser, markRead, markAllRead };
