const { query } = require('../config/db');

async function list({ entityType, userId, action, startDate, endDate, limit, offset }) {
  const conditions = [];
  const params = [];
  if (entityType) {
    params.push(entityType);
    conditions.push(`al.entity_type = $${params.length}`);
  }
  if (userId) {
    params.push(userId);
    conditions.push(`al.user_id = $${params.length}`);
  }
  if (action) {
    params.push(action);
    conditions.push(`al.action = $${params.length}`);
  }
  if (startDate) {
    params.push(startDate);
    conditions.push(`al.created_at >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    conditions.push(`al.created_at <= $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM audit_logs al ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT al.*, u.full_name AS user_name, u.email AS user_email
     FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id
     ${whereClause} ORDER BY al.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows, total };
}

module.exports = { list };
