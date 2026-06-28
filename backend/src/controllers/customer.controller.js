const service = require('../services/customer.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'customer_code', header: 'Customer Code' },
  { key: 'name', header: 'Name' },
  { key: 'contact_person', header: 'Contact Person' },
  { key: 'phone', header: 'Phone' },
  { key: 'email', header: 'Email' },
  { key: 'credit_limit', header: 'Credit Limit' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listCustomers(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'customers', EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'customers', EXPORT_COLUMNS, result.items, 'Customers');
  if (req.query.format === 'pdf') return exportPdf(res, 'customers', 'Customer List', EXPORT_COLUMNS, result.items);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const customer = await service.getCustomer(req.params.id);
  res.json({ success: true, data: customer });
});

const create = asyncHandler(async (req, res) => {
  const customer = await service.createCustomer(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'customers', entityId: customer.id, newValues: customer, req });
  res.status(201).json({ success: true, data: customer });
});

const update = asyncHandler(async (req, res) => {
  const before = await service.getCustomer(req.params.id);
  const customer = await service.updateCustomer(req.params.id, req.body);
  await recordAudit({ userId: req.user.id, action: 'UPDATE', entityType: 'customers', entityId: customer.id, oldValues: before, newValues: customer, req });
  res.json({ success: true, data: customer });
});

const remove = asyncHandler(async (req, res) => {
  const before = await service.getCustomer(req.params.id);
  await service.deleteCustomer(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'DELETE', entityType: 'customers', entityId: req.params.id, oldValues: before, req });
  res.json({ success: true, message: 'Customer deleted successfully' });
});

module.exports = { list, getOne, create, update, remove };
