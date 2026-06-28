const service = require('../services/fabricDesign.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'design_code', header: 'Design Code' },
  { key: 'name', header: 'Name' },
  { key: 'fabric_type', header: 'Fabric Type' },
  { key: 'width_inches', header: 'Width (in)' },
  { key: 'weight_gsm', header: 'Weight (GSM)' },
  { key: 'standard_rate', header: 'Standard Rate' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listDesigns(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'fabric-designs', EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'fabric-designs', EXPORT_COLUMNS, result.items, 'Fabric Designs');
  if (req.query.format === 'pdf') return exportPdf(res, 'fabric-designs', 'Fabric Design List', EXPORT_COLUMNS, result.items);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const design = await service.getDesign(req.params.id);
  res.json({ success: true, data: design });
});

const create = asyncHandler(async (req, res) => {
  const design = await service.createDesign(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'fabric_designs', entityId: design.id, newValues: design, req });
  res.status(201).json({ success: true, data: design });
});

const update = asyncHandler(async (req, res) => {
  const before = await service.getDesign(req.params.id);
  const design = await service.updateDesign(req.params.id, req.body);
  await recordAudit({ userId: req.user.id, action: 'UPDATE', entityType: 'fabric_designs', entityId: design.id, oldValues: before, newValues: design, req });
  res.json({ success: true, data: design });
});

const remove = asyncHandler(async (req, res) => {
  const before = await service.getDesign(req.params.id);
  await service.deleteDesign(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'DELETE', entityType: 'fabric_designs', entityId: req.params.id, oldValues: before, req });
  res.json({ success: true, message: 'Fabric design deleted successfully' });
});

module.exports = { list, getOne, create, update, remove };
