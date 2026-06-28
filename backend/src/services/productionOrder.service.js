const repo = require('../repositories/productionOrder.repository');
const workOrderRepo = require('../repositories/workOrder.repository');
const machineRepo = require('../repositories/machine.repository');
const beamRepo = require('../repositories/beam.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');

async function listProductionOrders(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getProductionOrder(id) {
  const po = await repo.findById(id);
  if (!po) throw ApiError.notFound('Production order not found');
  return po;
}

/**
 * Creating a production order represents "Machine Assignment" in the
 * workflow spec. If a beam is supplied it must already be ALLOCATED to
 * that exact machine (Beam Allocation -> Machine Assignment ordering).
 */
async function createProductionOrder(data, userId) {
  const existing = await repo.findByNumber(data.productionOrderNo);
  if (existing) throw ApiError.conflict('A production order with this number already exists');

  const workOrder = await workOrderRepo.findById(data.workOrderId);
  if (!workOrder) throw ApiError.notFound('Work order not found');

  const machine = await machineRepo.findById(data.machineId);
  if (!machine) throw ApiError.notFound('Machine not found');

  if (data.beamId) {
    const beam = await beamRepo.findBeamById(data.beamId);
    if (!beam) throw ApiError.notFound('Beam not found');
    if (beam.status !== 'ALLOCATED' || beam.current_machine_id !== data.machineId) {
      throw ApiError.conflict('Beam must be allocated to this exact machine before it can be assigned to a production order');
    }
  }

  return withTransaction(async (client) => {
    const po = await repo.create(data, userId);
    if (workOrder.status === 'DRAFT' || workOrder.status === 'PLANNED') {
      await workOrderRepo.update(data.workOrderId, { status: 'IN_PROGRESS' }, client);
    }
    if (data.beamId) {
      await beamRepo.setBeamStatus(data.beamId, 'IN_USE', data.machineId, client);
    }
    return po;
  });
}

async function updateProductionOrder(id, data) {
  await getProductionOrder(id);
  return repo.update(id, data);
}

async function deleteProductionOrder(id) {
  const po = await getProductionOrder(id);
  if (po.status !== 'PENDING') {
    throw ApiError.conflict('Only PENDING production orders can be deleted');
  }
  await repo.remove(id);
}

module.exports = { listProductionOrders, getProductionOrder, createProductionOrder, updateProductionOrder, deleteProductionOrder };
