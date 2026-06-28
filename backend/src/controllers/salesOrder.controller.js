const service = require('../services/salesOrder.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'so_number', header: 'SO Number' },
  { key: 'customer_name', header: 'Customer' },
  { key: 'order_date', header: 'Order Date' },
  { key: 'status', header: 'Status' },
  { key: 'total_amount', header: 'Total Amount' },
  { key: 'amount_paid', header: 'Amount Paid' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listSalesOrders(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'sales-orders', EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'sales-orders', EXPORT_COLUMNS, result.items, 'Sales Orders');
  if (req.query.format === 'pdf') return exportPdf(res, 'sales-orders', 'Sales Order List', EXPORT_COLUMNS, result.items);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const so = await service.getSalesOrder(req.params.id);
  res.json({ success: true, data: so });
});

const create = asyncHandler(async (req, res) => {
  const so = await service.createSalesOrder(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'sales_orders', entityId: so.id, newValues: so, req });
  res.status(201).json({ success: true, data: so });
});

const updateStatus = asyncHandler(async (req, res) => {
  const before = await service.getSalesOrder(req.params.id);
  const so = await service.updateStatus(req.params.id, req.body.status);
  await recordAudit({ userId: req.user.id, action: 'UPDATE_STATUS', entityType: 'sales_orders', entityId: so.id, oldValues: before, newValues: so, req });
  res.json({ success: true, data: so });
});

const recordPayment = asyncHandler(async (req, res) => {
  const so = await service.recordPayment(req.params.id, req.body.amount);
  await recordAudit({ userId: req.user.id, action: 'RECORD_PAYMENT', entityType: 'sales_orders', entityId: so.id, newValues: { amount: req.body.amount }, req });
  res.json({ success: true, data: so });
});

module.exports = { list, getOne, create, updateStatus, recordPayment };
