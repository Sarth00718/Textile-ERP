const { query } = require('../config/db');

const COLUMN_MAP = {
  name: 'name', contactPerson: 'contact_person', phone: 'phone', email: 'email',
  billingAddress: 'billing_address', shippingAddress: 'shipping_address', gstNumber: 'gst_number',
  creditLimit: 'credit_limit', paymentTerms: 'payment_terms', isActive: 'is_active',
};

async function list({ search, isActive, limit, offset }) {
  const conditions = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(name ILIKE $${params.length} OR customer_code ILIKE $${params.length})`);
  }
  if (isActive !== undefined) {
    params.push(isActive === 'true');
    conditions.push(`is_active = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM customers ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const baseQuery = `SELECT * FROM customers ${whereClause} ORDER BY name`;
  if (limit === undefined) {
    const { rows } = await query(baseQuery, params);
    return { rows, total };
  }
  params.push(limit, offset);
  const { rows } = await query(`${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, total };
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM customers WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findByCode(code) {
  const { rows } = await query('SELECT * FROM customers WHERE customer_code = $1', [code]);
  return rows[0] || null;
}

async function create(data, userId) {
  const { rows } = await query(
    `INSERT INTO customers (customer_code, name, contact_person, phone, email, billing_address, shipping_address,
       gst_number, credit_limit, payment_terms, is_active, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      data.customerCode, data.name, data.contactPerson || null, data.phone || null, data.email || null,
      data.billingAddress || null, data.shippingAddress || null, data.gstNumber || null,
      data.creditLimit || 0, data.paymentTerms || null, data.isActive ?? true, userId,
    ]
  );
  return rows[0];
}

async function update(id, data) {
  const fields = [];
  const params = [];
  for (const [key, col] of Object.entries(COLUMN_MAP)) {
    if (data[key] !== undefined) {
      params.push(data[key]);
      fields.push(`${col} = $${params.length}`);
    }
  }
  if (!fields.length) return findById(id);
  fields.push('updated_at = NOW()');
  params.push(id);
  const { rows } = await query(`UPDATE customers SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0] || null;
}

async function remove(id) {
  // Soft-delete: customers may be referenced by sales_orders and dispatches (ON DELETE RESTRICT)
  await query('UPDATE customers SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [id]);
}

module.exports = { list, findById, findByCode, create, update, remove };
