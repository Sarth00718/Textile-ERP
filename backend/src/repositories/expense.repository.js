const { query } = require('../config/db');

async function nextExpenseNumber() {
  const { rows } = await query(
    `SELECT 'EXP-' || LPAD((COALESCE(MAX(SUBSTRING(expense_no FROM 5)::INT), 0) + 1)::TEXT, 6, '0') AS next_no
     FROM expenses WHERE expense_no ~ '^EXP-[0-9]+$'`
  );
  return rows[0].next_no;
}

async function list({ category, departmentId, startDate, endDate, limit, offset }) {
  const conditions = [];
  const params = [];
  if (category) {
    params.push(category);
    conditions.push(`e.category = $${params.length}`);
  }
  if (departmentId) {
    params.push(departmentId);
    conditions.push(`e.department_id = $${params.length}`);
  }
  if (startDate) {
    params.push(startDate);
    conditions.push(`e.expense_date >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    conditions.push(`e.expense_date <= $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM expenses e ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `
    SELECT e.*, d.name AS department_name FROM expenses e
    LEFT JOIN departments d ON d.id = e.department_id
    ${whereClause} ORDER BY e.expense_date DESC`;
  if (limit === undefined) {
    const { rows } = await query(baseQuery, params);
    return { rows, total };
  }
  params.push(limit, offset);
  const { rows } = await query(`${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, total };
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM expenses WHERE id = $1', [id]);
  return rows[0] || null;
}

async function create(data, userId) {
  const expenseNo = await nextExpenseNumber();
  const { rows } = await query(
    `INSERT INTO expenses (expense_no, category, description, amount, expense_date, department_id, payment_method, receipt_url, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      expenseNo, data.category, data.description, data.amount, data.expenseDate || new Date().toISOString().slice(0, 10),
      data.departmentId || null, data.paymentMethod || 'BANK_TRANSFER', data.receiptUrl || null, userId,
    ]
  );
  return rows[0];
}

async function update(id, data) {
  const fields = [];
  const params = [];
  const map = { category: 'category', description: 'description', amount: 'amount', expenseDate: 'expense_date', departmentId: 'department_id', paymentMethod: 'payment_method', receiptUrl: 'receipt_url' };
  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${col} = $${params.length}`);
    }
  }
  if (!fields.length) return findById(id);
  fields.push('updated_at = NOW()');
  params.push(id);
  const { rows } = await query(`UPDATE expenses SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] || null;
}

async function remove(id) {
  await query('DELETE FROM expenses WHERE id = $1', [id]);
}

async function getTotalsByCategory(startDate, endDate) {
  const { rows } = await query(
    `SELECT category, COALESCE(SUM(amount),0) AS total FROM expenses
     WHERE expense_date BETWEEN $1 AND $2 GROUP BY category`,
    [startDate, endDate]
  );
  return rows;
}

module.exports = { list, findById, create, update, remove, getTotalsByCategory };
