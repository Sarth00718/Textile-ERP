const repo = require('../repositories/productionOrder.repository');
const workOrderRepo = require('../repositories/workOrder.repository');
const machineRepo = require('../repositories/machine.repository');
const beamRepo = require('../repositories/beam.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');

async function listProductionOrders(reqQuery) {
  if (reqQuery.format) {
    const { rows } = await repo.list({ ...reqQuery, limit: undefined, offset: undefined });
    return { items: rows };
  }
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
 * Creating a production order represents "Machine Assignment".
 *
 * Guards:
 *  1. Work order must exist and not be COMPLETED/CANCELLED
 *  2. Machine must exist, must be IDLE (not already running/in maintenance/breakdown)
 *  3. Machine must not already have an active PENDING or IN_PROGRESS production order
 *  4. If beam supplied: must be ALLOCATED to this exact machine
 */
async function createProductionOrder(data, userId) {
  const existing = await repo.findByNumber(data.productionOrderNo);
  if (existing) throw ApiError.conflict('A production order with this number already exists');

  const workOrder = await workOrderRepo.findById(data.workOrderId);
  if (!workOrder) throw ApiError.notFound('Work order not found');
  if (['COMPLETED', 'CANCELLED'].includes(workOrder.status)) {
    throw ApiError.conflict(`Cannot create a production order under a ${workOrder.status} work order`);
  }

  const machine = await machineRepo.findById(data.machineId);
  if (!machine) throw ApiError.notFound('Machine not found');
  if (['BREAKDOWN', 'MAINTENANCE'].includes(machine.status)) {
    throw ApiError.conflict(`Machine is currently in ${machine.status} state and cannot be assigned`);
  }

  // Prevent overbooking: machine must not already have an active (non-completed) PO
  const activePO = await repo.findActiveByMachine(data.machineId);
  if (activePO) {
    throw ApiError.conflict(
      `Machine already has an active production order (${activePO.production_order_no}). ` +
      'Complete or cancel it before assigning a new one.'
    );
  }

  if (data.beamId) {
    const beam = await beamRepo.findBeamById(data.beamId);
    if (!beam) throw ApiError.notFound('Beam not found');
    if (beam.status !== 'ALLOCATED' || beam.current_machine_id !== data.machineId) {
      throw ApiError.conflict('Beam must be allocated to this exact machine before it can be assigned to a production order');
    }
  }

  return withTransaction(async (client) => {
    const po = await repo.create(data, userId, client);
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
  const po = await getProductionOrder(id);

  // State transition guard
  if (data.status && data.status !== po.status) {
    const VALID = {
      PENDING:     ['IN_PROGRESS', 'CANCELLED', 'ON_HOLD'],
      IN_PROGRESS: ['COMPLETED', 'ON_HOLD', 'CANCELLED'],
      ON_HOLD:     ['IN_PROGRESS', 'CANCELLED'],
      COMPLETED:   [],
      CANCELLED:   [],
    };
    const allowed = VALID[po.status] || [];
    if (!allowed.includes(data.status)) {
      throw ApiError.badRequest(`Cannot transition production order from ${po.status} to ${data.status}`);
    }
  }

  return repo.update(id, data);
}

/**
 * Deleting a PENDING production order must also:
 *  - Release any beam back to ALLOCATED (was IN_USE -> ALLOCATED since PO hadn't started)
 *  - Revert work order to PLANNED if no other POs exist under it
 */
async function deleteProductionOrder(id) {
  const po = await getProductionOrder(id);
  if (po.status !== 'PENDING') {
    throw ApiError.conflict('Only PENDING production orders can be deleted');
  }

  await withTransaction(async (client) => {
    await repo.remove(id, client);

    // Release beam back to ALLOCATED state if one was assigned
    if (po.beam_id) {
      await beamRepo.setBeamStatus(po.beam_id, 'ALLOCATED', po.machine_id, client);
    }

    // If no more POs under this work order, revert it back to PLANNED
    const hasOtherPOs = await repo.countByWorkOrder(po.work_order_id, client);
    if (hasOtherPOs === 0) {
      await workOrderRepo.update(po.work_order_id, { status: 'PLANNED' }, client);
    }
  });
}

module.exports = {
  listProductionOrders, getProductionOrder, createProductionOrder,
  updateProductionOrder, deleteProductionOrder,
};
