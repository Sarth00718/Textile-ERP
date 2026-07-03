const repo = require('../repositories/dailyProductionEntry.repository');
const productionOrderRepo = require('../repositories/productionOrder.repository');
const workOrderRepo = require('../repositories/workOrder.repository');
const fabricRollRepo = require('../repositories/fabricRoll.repository');
const inventoryRepo = require('../repositories/inventory.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');
const { notifyRoles } = require('./notification.service');

async function listEntries(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({
    ...reqQuery,
    limit: reqQuery.format ? undefined : limit,
    offset: reqQuery.format ? undefined : offset,
  });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getEntry(id) {
  const entry = await repo.findById(id);
  if (!entry) throw ApiError.notFound('Daily production entry not found');
  return entry;
}

/**
 * Recording a daily production entry is the single most consequential write
 * in the system. In ONE transaction it:
 *
 *   1. Validates rejected qty ≤ produced qty
 *   2. Inserts the daily_production_entries row
 *   3. Increments produced_quantity_meters on the parent production_order
 *      (PENDING -> IN_PROGRESS -> COMPLETED)
 *   4. On PO completion: releases the machine to IDLE, checks if all POs
 *      under the work order are done and auto-completes the work order
 *   5. Optionally consumes raw material from inventory
 *   6. Creates a fabric_roll (status PRODUCED) — nextRollNumber runs inside
 *      the transaction to prevent duplicate roll numbers under concurrency
 */
async function createEntry(data, userId) {
  // Guard: rejected quantity cannot exceed produced quantity
  const produced = Number(data.quantityProducedMeters || 0);
  const rejected = Number(data.quantityRejectedMeters || 0);
  if (rejected > produced) {
    throw ApiError.badRequest(
      `Rejected quantity (${rejected}m) cannot exceed produced quantity (${produced}m)`
    );
  }

  const productionOrder = await productionOrderRepo.findById(data.productionOrderId);
  if (!productionOrder) throw ApiError.notFound('Production order not found');
  if (['COMPLETED', 'CANCELLED'].includes(productionOrder.status)) {
    throw ApiError.conflict(`Cannot log production against a ${productionOrder.status} production order`);
  }

  let rawMaterialItem = null;
  if (data.rawMaterialItemId) {
    rawMaterialItem = await inventoryRepo.findById(data.rawMaterialItemId);
    if (!rawMaterialItem) throw ApiError.notFound('Raw material inventory item not found');
    const qtyNeeded = Number(data.rawMaterialQuantity || data.yarnConsumedKg || 0);
    if (qtyNeeded > 0 && Number(rawMaterialItem.current_stock) < qtyNeeded) {
      throw ApiError.conflict(
        `Insufficient stock of ${rawMaterialItem.name}: ` +
        `available ${rawMaterialItem.current_stock} ${rawMaterialItem.unit}, need ${qtyNeeded}`
      );
    }
  }

  const result = await withTransaction(async (client) => {
    // 1. Insert daily entry
    const entry = await repo.create(
      { ...data, machineId: productionOrder.machine_id },
      userId,
      client
    );

    // 2. Cascade to production order (auto-transitions status)
    const updatedPO = await productionOrderRepo.incrementProduced(
      data.productionOrderId,
      produced,
      client
    );

    // 3. On PO completion: free machine + auto-complete work order if all POs done
    if (updatedPO.status === 'COMPLETED') {
      await client.query(
        `UPDATE machines SET status = 'IDLE', updated_at = NOW() WHERE id = $1`,
        [productionOrder.machine_id]
      );

      const allDone = await workOrderRepo.checkAllPOsCompleted(productionOrder.work_order_id, client);
      if (allDone) {
        await workOrderRepo.update(productionOrder.work_order_id, { status: 'COMPLETED' }, client);
      }
    }

    // 4. Raw material consumption inside transaction
    let consumption = null;
    if (rawMaterialItem) {
      const qty = Number(data.rawMaterialQuantity || data.yarnConsumedKg || 0);
      if (qty > 0) {
        const newStock = Number(rawMaterialItem.current_stock) - qty;
        await client.query(
          `INSERT INTO raw_material_consumptions
             (production_order_id, inventory_item_id, daily_production_entry_id,
              quantity_consumed, consumption_date, created_by)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [
            data.productionOrderId, data.rawMaterialItemId, entry.id,
            qty, data.entryDate || new Date().toISOString().slice(0, 10), userId,
          ]
        );
        await client.query(
          `UPDATE inventory_items SET current_stock = $1, updated_at = NOW() WHERE id = $2`,
          [newStock, data.rawMaterialItemId]
        );
        await client.query(
          `INSERT INTO inventory_transactions
             (inventory_item_id, txn_type, quantity, balance_after, reference_type, reference_id, performed_by)
           VALUES ($1,'OUT',$2,$3,'daily_production_entries',$4,$5)`,
          [data.rawMaterialItemId, qty, newStock, entry.id, userId]
        );
        consumption = { itemId: data.rawMaterialItemId, quantity: qty, newStock };
      }
    }

    // 5. Fabric roll creation — nextRollNumber runs inside transaction (race-safe)
    let roll = null;
    if (data.createFabricRoll !== false && produced > 0) {
      roll = await fabricRollRepo.create(
        {
          productionOrderId: data.productionOrderId,
          dailyProductionEntryId: entry.id,
          fabricDesignId: productionOrder.fabric_design_id,
          lengthMeters: produced,
          weightKg: data.rollWeightKg || null,
          warehouseLocation: data.warehouseLocation || null,
        },
        client
      );
    }

    return { entry, productionOrder: updatedPO, consumption, roll };
  });

  // Post-transaction notifications (fire-and-forget)
  if (result.productionOrder.status === 'COMPLETED') {
    notifyRoles({
      roles: ['OWNER', 'MANAGER', 'SUPERVISOR'],
      title: 'Production Order Completed',
      message: `Production order ${result.productionOrder.production_order_no} reached its target quantity.`,
      severity: 'INFO',
      module: 'productionOrders',
      referenceType: 'production_orders',
      referenceId: result.productionOrder.id,
    }).catch(() => {});
  }

  if (rawMaterialItem && result.consumption) {
    const { newStock } = result.consumption;
    if (Number(newStock) <= Number(rawMaterialItem.reorder_level)) {
      notifyRoles({
        roles: ['OWNER', 'MANAGER'],
        title: 'Low Inventory Alert',
        message: `${rawMaterialItem.name} stock is now ${newStock} ${rawMaterialItem.unit}, ` +
                 `at or below reorder level (${rawMaterialItem.reorder_level}).`,
        severity: 'WARNING',
        module: 'inventory',
        referenceType: 'inventory_items',
        referenceId: rawMaterialItem.id,
      }).catch(() => {});
    }
  }

  return result;
}

module.exports = { listEntries, getEntry, createEntry };
