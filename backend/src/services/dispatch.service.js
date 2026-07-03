const repo = require('../repositories/dispatch.repository');
const packingRepo = require('../repositories/packing.repository');
const fabricRollRepo = require('../repositories/fabricRoll.repository');
const salesOrderRepo = require('../repositories/salesOrder.repository');
const workOrderRepo = require('../repositories/workOrder.repository');
const vehicleRepo = require('../repositories/vehicle.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');
const { notifyRoles } = require('./notification.service');

async function listDispatches(reqQuery) {
  if (reqQuery.format) {
    const { rows } = await repo.list({ ...reqQuery, limit: undefined, offset: undefined });
    return { items: rows };
  }
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getDispatch(id) {
  const d = await repo.findById(id);
  if (!d) throw ApiError.notFound('Dispatch not found');
  const items = await repo.findItemsByDispatch(id);
  return { ...d, items };
}

/**
 * Creating a dispatch is the culmination of the production->fulfillment chain.
 *
 * Guards:
 *  1. Sales order must be in a dispatchable state
 *  2. Vehicle (if supplied) must be AVAILABLE
 *  3. Every packing record must be PACKED — not already DISPATCHED (no double-dispatch)
 *  4. No duplicate packing records in the same dispatch request
 *
 * In one transaction:
 *  - Creates dispatch + dispatch_items
 *  - Flips rolls -> DISPATCHED, packing records -> DISPATCHED
 *  - Updates sales_order_items.quantity_dispatched_meters
 *  - Auto-transitions SO status (PARTIALLY_DISPATCHED / DISPATCHED)
 *  - If SO is fully DISPATCHED and linked work order exists, auto-completes the work order
 *  - Marks vehicle ON_TRIP
 */
async function createDispatch(data, userId) {
  const salesOrder = await salesOrderRepo.findById(data.salesOrderId);
  if (!salesOrder) throw ApiError.notFound('Sales order not found');
  if (!['CONFIRMED', 'IN_PRODUCTION', 'READY', 'PARTIALLY_DISPATCHED'].includes(salesOrder.status)) {
    throw ApiError.conflict(`Cannot dispatch against a sales order with status ${salesOrder.status}`);
  }

  if (data.vehicleId) {
    const vehicle = await vehicleRepo.findById(data.vehicleId);
    if (!vehicle) throw ApiError.notFound('Vehicle not found');
    if (vehicle.status !== 'AVAILABLE') throw ApiError.conflict('Vehicle is not currently available');
  }

  // Validate packing records and detect duplicates within same request
  const seenPackingIds = new Set();
  const packingRecords = [];
  for (const item of data.items) {
    if (seenPackingIds.has(item.packingRecordId)) {
      throw ApiError.badRequest(`Packing record ${item.packingRecordId} appears more than once in this dispatch`);
    }
    seenPackingIds.add(item.packingRecordId);

    const pr = await packingRepo.findById(item.packingRecordId);
    if (!pr) throw ApiError.notFound(`Packing record ${item.packingRecordId} not found`);
    if (pr.status === 'DISPATCHED') {
      throw ApiError.conflict(`Packing record ${pr.package_no} has already been dispatched`);
    }
    if (pr.status !== 'PACKED') {
      throw ApiError.conflict(`Packing record ${pr.package_no} must be in PACKED status (current: ${pr.status})`);
    }
    packingRecords.push(pr);
  }

  const totalWeight = packingRecords.reduce((sum, pr) => sum + Number(pr.package_weight_kg || 0), 0);
  const soItems = await salesOrderRepo.findItemsBySO(data.salesOrderId);

  const result = await withTransaction(async (client) => {
    const dispatch = await repo.create(
      data, salesOrder.customer_id, totalWeight, packingRecords.length, userId, client
    );

    const dispatchedByDesign = {};
    for (const pr of packingRecords) {
      await repo.createItem(dispatch.id, pr.id, pr.fabric_roll_id, pr.length_meters, client);
      await fabricRollRepo.setStatus(pr.fabric_roll_id, 'DISPATCHED', client);
      await packingRepo.setStatus(pr.id, 'DISPATCHED', client);
      dispatchedByDesign[pr.fabric_design_id] =
        (dispatchedByDesign[pr.fabric_design_id] || 0) + Number(pr.length_meters);
    }

    // Update dispatched quantities on sales order items
    for (const soItem of soItems) {
      const dispatchedQty = dispatchedByDesign[soItem.fabric_design_id];
      if (dispatchedQty) {
        await salesOrderRepo.incrementItemDispatched(soItem.id, dispatchedQty, client);
      }
    }

    // Re-read to get accurate totals after increment
    const refreshedItems = await salesOrderRepo.findItemsBySO(data.salesOrderId);
    const fullyDispatched = refreshedItems.every(
      (i) => Number(i.quantity_dispatched_meters) >= Number(i.quantity_meters)
    );
    const partiallyDispatched = refreshedItems.some(
      (i) => Number(i.quantity_dispatched_meters) > 0
    );
    const newSOStatus = fullyDispatched
      ? 'DISPATCHED'
      : partiallyDispatched
        ? 'PARTIALLY_DISPATCHED'
        : salesOrder.status;
    await salesOrderRepo.updateStatus(data.salesOrderId, newSOStatus, client);

    // If SO is now fully DISPATCHED and there is a linked work order,
    // auto-complete the work order (all production is done and delivered)
    if (fullyDispatched && salesOrder.sales_order_id) {
      const linkedWO = await client.query(
        `SELECT id, status FROM work_orders WHERE sales_order_id = $1 AND status NOT IN ('COMPLETED','CANCELLED')`,
        [data.salesOrderId]
      );
      for (const wo of linkedWO.rows) {
        await workOrderRepo.update(wo.id, { status: 'COMPLETED' }, client);
      }
    }

    if (data.vehicleId) {
      await vehicleRepo.setStatus(data.vehicleId, 'ON_TRIP', client);
    }

    return { ...dispatch, items: await repo.findItemsByDispatch(dispatch.id) };
  });

  await notifyRoles({
    roles: ['OWNER', 'MANAGER'],
    title: 'Dispatch Created',
    message: `Dispatch ${result.dispatch_no} created for SO ${salesOrder.so_number} — ${packingRecords.length} package(s), ${totalWeight.toFixed(1)} kg total.`,
    severity: 'INFO',
    module: 'dispatch',
    referenceType: 'dispatches',
    referenceId: result.id,
  }).catch(() => {});

  return result;
}

async function markInTransit(id) {
  const d = await getDispatch(id);
  if (d.status !== 'PENDING') {
    throw ApiError.conflict('Only a PENDING dispatch can be marked in transit');
  }
  return repo.setStatus(id, 'IN_TRANSIT', null);
}

/**
 * Marking a dispatch delivered frees the vehicle back to AVAILABLE.
 */
async function markDelivered(id) {
  const d = await getDispatch(id);
  if (d.status !== 'IN_TRANSIT') {
    throw ApiError.conflict(
      `Only an IN_TRANSIT dispatch can be marked as delivered (current status: ${d.status})`
    );
  }

  const updated = await withTransaction(async (client) => {
    const result = await repo.setStatus(id, 'DELIVERED', new Date().toISOString(), client);
    if (d.vehicle_id) {
      await vehicleRepo.setStatus(d.vehicle_id, 'AVAILABLE', client);
    }
    return result;
  });

  await notifyRoles({
    roles: ['OWNER', 'MANAGER'],
    title: 'Dispatch Delivered',
    message: `Dispatch ${d.dispatch_no} has been delivered to ${d.customer_name}.`,
    severity: 'INFO',
    module: 'dispatch',
    referenceType: 'dispatches',
    referenceId: id,
  }).catch(() => {});

  return updated;
}

module.exports = { listDispatches, getDispatch, createDispatch, markInTransit, markDelivered };
