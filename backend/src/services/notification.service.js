const { query } = require('../config/db');

/**
 * Send a notification to a single user.
 * Deduplication: if a notification with the same (user_id, reference_type,
 * reference_id, title) already exists and is UNREAD, skip creating a duplicate.
 * This prevents spam when the same event fires multiple times (e.g. repeated
 * low-stock triggers on every production entry).
 */
async function notify({
  userId,
  title,
  message,
  severity = 'INFO',
  module: moduleName,
  referenceType,
  referenceId,
  dedupe = true,
}) {
  // Deduplication check — skip if an identical unread notification exists
  if (dedupe && referenceType && referenceId) {
    const { rows: existing } = await query(
      `SELECT id FROM notifications
       WHERE user_id = $1 AND title = $2 AND reference_type = $3 AND reference_id = $4
         AND is_read = FALSE`,
      [userId, title, referenceType, referenceId]
    );
    if (existing.length > 0) return null; // already notified, skip
  }

  const { rows } = await query(
    `INSERT INTO notifications (user_id, title, message, severity, module, reference_type, reference_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, title, message, severity, moduleName || null, referenceType || null, referenceId || null]
  );
  return rows[0];
}

/**
 * Notify all users with any of the given roles.
 * Deduplication is applied per user.
 */
async function notifyRoles({
  roles,
  title,
  message,
  severity = 'INFO',
  module: moduleName,
  referenceType,
  referenceId,
  dedupe = true,
}) {
  const { rows: users } = await query(
    'SELECT id FROM users WHERE role = ANY($1) AND is_active = TRUE',
    [roles]
  );
  const results = [];
  for (const u of users) {
    const result = await notify({
      userId: u.id, title, message, severity,
      module: moduleName, referenceType, referenceId, dedupe,
    });
    if (result) results.push(result);
  }
  return results;
}

/**
 * Notify a specific user by ID (e.g. the employee who requested leave).
 */
async function notifyUser({
  userId,
  title,
  message,
  severity = 'INFO',
  module: moduleName,
  referenceType,
  referenceId,
  dedupe = true,
}) {
  return notify({ userId, title, message, severity, module: moduleName, referenceType, referenceId, dedupe });
}

async function getUnreadCount(userId) {
  const { rows } = await query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
    [userId]
  );
  return parseInt(rows[0].count, 10);
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
  // Also return total unread for the badge
  const { rows: countRows } = await query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
    [userId]
  );
  return { items: rows, unreadCount: parseInt(countRows[0].count, 10) };
}

async function markRead(id, userId) {
  const { rows } = await query(
    `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  );
  return rows[0];
}

async function markAllRead(userId) {
  await query(
    `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
}

module.exports = { notify, notifyRoles, notifyUser, getUnreadCount, listForUser, markRead, markAllRead };
