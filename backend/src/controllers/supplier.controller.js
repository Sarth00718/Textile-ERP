const service = require('../services/supplier.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'supplier_code', header: 'Supplier Code' },
  { key: 'name', header: 'Name' },
  { key: 'contact_person', header: 'Contact Person' },
  { key: 'phone', header: 'Phone' },
  { key: 'email', header: 'Email' },
  { key: 'rating', header: 'Rating' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listSuppliers(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'suppliers', EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'suppliers', EXPORT_COLUMNS, result.items, 'Suppliers');
  if (req.query.format === 'pdf') return exportPdf(res, 'suppliers', 'Supplier List', EXPORT_COLUMNS, result.items);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const supplier = await service.getSupplier(req.params.id);
  res.json({ success: true, data: supplier });
});

const create = asyncHandler(async (req, res) => {
  const supplier = await service.createSupplier(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'suppliers', entityId: supplier.id, newValues: supplier, req });
  res.status(201).json({ success: true, data: supplier });
});

const update = asyncHandler(async (req, res) => {
  const before = await service.getSupplier(req.params.id);
  const supplier = await service.updateSupplier(req.params.id, req.body);
  await recordAudit({ userId: req.user.id, action: 'UPDATE', entityType: 'suppliers', entityId: supplier.id, oldValues: before, newValues: supplier, req });
  res.json({ success: true, data: supplier });
});

const remove = asyncHandler(async (req, res) => {
  const before = await service.getSupplier(req.params.id);
  await service.deleteSupplier(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'DELETE', entityType: 'suppliers', entityId: req.params.id, oldValues: before, req });
  res.json({ success: true, message: 'Supplier deleted successfully' });
});

module.exports = { list, getOne, create, update, remove };
