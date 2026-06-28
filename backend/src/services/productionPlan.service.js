const repo = require('../repositories/productionPlan.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');

async function listPlans(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getPlan(id) {
  const plan = await repo.findById(id);
  if (!plan) throw ApiError.notFound('Production plan not found');
  return plan;
}

async function createPlan(data, userId) {
  if (new Date(data.endDate) < new Date(data.startDate)) {
    throw ApiError.badRequest('endDate cannot be before startDate');
  }
  const existing = await repo.findByCode(data.planCode);
  if (existing) throw ApiError.conflict('A production plan with this code already exists');
  return repo.create(data, userId);
}

async function updatePlan(id, data) {
  await getPlan(id);
  return repo.update(id, data);
}

async function deletePlan(id) {
  await getPlan(id);
  await repo.remove(id);
}

module.exports = { listPlans, getPlan, createPlan, updatePlan, deletePlan };
