const repo = require('../repositories/workOrder.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');

const VALID_TRANSITIONS = {
  DRAFT: ['PLANNED', 'CANCELLED'],
  PLANNED: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'ON_HOLD', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

async function listWorkOrders(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getWorkOrder(id) {
  const wo = await repo.findById(id);
  if (!wo) throw ApiError.notFound('Work order not found');
  return wo;
}

async function createWorkOrder(data, userId) {
  const existing = await repo.findByNumber(data.workOrderNo);
  if (existing) throw ApiError.conflict('A work order with this number already exists');
  return repo.create(data, userId);
}

async function updateWorkOrder(id, data) {
  const existing = await getWorkOrder(id);
  if (data.status && data.status !== existing.status) {
    const allowed = VALID_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(data.status)) {
      throw ApiError.badRequest(`Cannot transition work order from ${existing.status} to ${data.status}`);
    }
  }
  return repo.update(id, data);
}

async function deleteWorkOrder(id) {
  const wo = await getWorkOrder(id);
  if (wo.status !== 'DRAFT') {
    throw ApiError.conflict('Only DRAFT work orders can be deleted');
  }
  await repo.remove(id);
}

module.exports = { listWorkOrders, getWorkOrder, createWorkOrder, updateWorkOrder, deleteWorkOrder };
