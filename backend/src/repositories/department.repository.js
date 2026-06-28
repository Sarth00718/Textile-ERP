const { query } = require('../config/db');
const { safeSortColumn, safeSortDirection } = require('../utils/queryHelpers');

const SORTABLE = ['name', 'code', 'created_at', 'updated_at'];

async function list({ search, isActive, sortBy, sortDir, limit, offset }) {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(name ILIKE $${params.length} OR code ILIKE $${params.length})`);
  }
  if (isActive !== undefined) {
    params.push(isActive === 'true');
    conditions.push(`is_active = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortCol = safeSortColumn(sortBy, SORTABLE, 'name');
  const sortDirection = safeSortDirection(sortDir);

  const countRes = await query(`SELECT COUNT(*) FROM departments ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT d.*, p.name AS parent_department_name
     FROM departments d
     LEFT JOIN departments p ON p.id = d.parent_department_id
     ${whereClause}
     ORDER BY d.${sortCol} ${sortDirection}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows, total };
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM departments WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findByCode(code) {
  const { rows } = await query('SELECT * FROM departments WHERE code = $1', [code]);
  return rows[0] || null;
}

async function create(data, userId) {
  const { rows } = await query(
    `INSERT INTO departments (name, code, description, parent_department_id, is_active, created_by, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *`,
    [data.name, data.code, data.description || null, data.parentDepartmentId || null, data.isActive ?? true, userId]
  );
  return rows[0];
}

async function update(id, data, userId) {
  const fields = [];
  const params = [];
  const map = {
    name: 'name',
    code: 'code',
    description: 'description',
    parentDepartmentId: 'parent_department_id',
    isActive: 'is_active',
  };
  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${col} = $${params.length}`);
    }
  }
  if (!fields.length) return findById(id);
  params.push(userId);
  fields.push(`updated_by = $${params.length}`);
  fields.push('updated_at = NOW()');
  params.push(id);
  const { rows } = await query(
    `UPDATE departments SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  return rows[0] || null;
}

async function remove(id) {
  await query('DELETE FROM departments WHERE id = $1', [id]);
}

async function hasEmployees(id) {
  const { rows } = await query('SELECT 1 FROM employees WHERE department_id = $1 LIMIT 1', [id]);
  return rows.length > 0;
}

module.exports = { list, findById, findByCode, create, update, remove, hasEmployees };
