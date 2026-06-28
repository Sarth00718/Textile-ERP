const repo = require('../repositories/expense.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');

async function listExpenses(reqQuery) {
  if (reqQuery.format) {
    const { rows } = await repo.list({ ...reqQuery, limit: undefined, offset: undefined });
    return { items: rows };
  }
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getExpense(id) {
  const expense = await repo.findById(id);
  if (!expense) throw ApiError.notFound('Expense record not found');
  return expense;
}

async function createExpense(data, userId) {
  return repo.create(data, userId);
}

async function updateExpense(id, data) {
  await getExpense(id);
  return repo.update(id, data);
}

async function deleteExpense(id) {
  await getExpense(id);
  await repo.remove(id);
}

async function getExpenseSummary(startDate, endDate) {
  return repo.getTotalsByCategory(startDate, endDate);
}

module.exports = { listExpenses, getExpense, createExpense, updateExpense, deleteExpense, getExpenseSummary };
