const repo = require('../repositories/customer.repository');
const { query } = require('../config/db');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');

async function listCustomers(reqQuery) {
  if (reqQuery.format) {
    const { rows } = await repo.list({ ...reqQuery, limit: undefined, offset: undefined });
    return { items: rows };
  }
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getCustomer(id) {
  const customer = await repo.findById(id);
  if (!customer) throw ApiError.notFound('Customer not found');
  return customer;
}

async function createCustomer(data, userId) {
  const existing = await repo.findByCode(data.customerCode);
  if (existing) throw ApiError.conflict('A customer with this code already exists');
  return repo.create(data, userId);
}

async function updateCustomer(id, data) {
  await getCustomer(id);
  return repo.update(id, data);
}

async function deleteCustomer(id) {
  await getCustomer(id);
  // Guard: cannot deactivate if there are open/pending sales orders
  const { rows } = await query(
    `SELECT COUNT(*) FROM sales_orders WHERE customer_id = $1 AND status NOT IN ('DELIVERED','CANCELLED')`,
    [id]
  );
  if (parseInt(rows[0].count, 10) > 0) {
    throw ApiError.conflict('Cannot deactivate this customer — they have open sales orders. Close or cancel those orders first.');
  }
  await repo.remove(id);
}

module.exports = { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer };
