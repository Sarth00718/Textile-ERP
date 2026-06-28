const repo = require('../repositories/salesOrder.repository');
const customerRepo = require('../repositories/customer.repository');
const fabricDesignRepo = require('../repositories/fabricDesign.repository');
const { ApiError } = require('../utils/apiError');
const { getPagination, buildMeta } = require('../utils/queryHelpers');
const { withTransaction } = require('../config/db');

async function listSalesOrders(reqQuery) {
  const { page, pageSize, offset, limit } = getPagination(reqQuery);
  const { rows, total } = await repo.list({ ...reqQuery, limit, offset });
  return { items: rows, meta: buildMeta(total, page, pageSize) };
}

async function getSalesOrder(id) {
  const so = await repo.findById(id);
  if (!so) throw ApiError.notFound('Sales order not found');
  const items = await repo.findItemsBySO(id);
  return { ...so, items };
}

async function createSalesOrder(data, userId) {
  const existing = await repo.findByNumber(data.soNumber);
  if (existing) throw ApiError.conflict('A sales order with this number already exists');
  const customer = await customerRepo.findById(data.customerId);
  if (!customer) throw ApiError.notFound('Customer not found');

  for (const item of data.items) {
    const design = await fabricDesignRepo.findById(item.fabricDesignId);
    if (!design) throw ApiError.notFound(`Fabric design ${item.fabricDesignId} not found`);
  }

  const subtotal = data.items.reduce((sum, i) => sum + i.quantityMeters * i.unitPrice, 0);
  const totalAmount = subtotal + (data.taxAmount || 0);

  return withTransaction(async (client) => {
    const so = await repo.create(data, subtotal, totalAmount, userId, client);
    const items = [];
    for (const item of data.items) {
      items.push(await repo.createItem(so.id, item, client));
    }
    return { ...so, items };
  });
}

const VALID_TRANSITIONS = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION: ['READY', 'CANCELLED'],
  READY: ['PARTIALLY_DISPATCHED', 'DISPATCHED', 'CANCELLED'],
  PARTIALLY_DISPATCHED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: [],
  CANCELLED: [],
};

async function updateStatus(id, newStatus) {
  const so = await getSalesOrder(id);
  const allowed = VALID_TRANSITIONS[so.status] || [];
  if (!allowed.includes(newStatus)) {
    throw ApiError.badRequest(`Cannot transition sales order from ${so.status} to ${newStatus}`);
  }
  return repo.updateStatus(id, newStatus);
}

async function recordPayment(id, amount) {
  const so = await getSalesOrder(id);
  const newPaid = Number(so.amount_paid) + Number(amount);
  if (newPaid > Number(so.total_amount) + 0.01) {
    throw ApiError.badRequest(`Payment of ${amount} would exceed the order total. Remaining due: ${(so.total_amount - so.amount_paid).toFixed(2)}`);
  }
  return repo.recordPayment(id, amount);
}

module.exports = { listSalesOrders, getSalesOrder, createSalesOrder, updateStatus, recordPayment };
