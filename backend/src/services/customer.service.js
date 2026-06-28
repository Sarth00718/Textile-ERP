const repo = require('../repositories/customer.repository');
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
  await repo.remove(id);
}

module.exports = { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer };
