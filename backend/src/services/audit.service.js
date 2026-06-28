const { query } = require('../config/db');

/**
 * Records an audit log entry. Never throws to the caller — audit logging
 * failures must not break the primary business operation.
 */
async function recordAudit({ userId, action, entityType, entityId, oldValues, newValues, req }) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId || null,
        action,
        entityType,
        entityId || null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        req ? (req.ip || req.headers['x-forwarded-for'] || null) : null,
        req ? req.headers['user-agent'] || null : null,
      ]
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = { recordAudit };
