const service = require('../services/qualityControl.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'roll_no', header: 'Roll No' },
  { key: 'inspected_by_name', header: 'Inspector' },
  { key: 'inspection_date', header: 'Date' },
  { key: 'result', header: 'Result' },
  { key: 'defect_type', header: 'Defect Type' },
  { key: 'defect_points', header: 'Defect Points' },
  { key: 'grade', header: 'Grade' },
  { key: 'remarks', header: 'Remarks' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listInspections(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'quality-inspections', EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'quality-inspections', EXPORT_COLUMNS, result.items, 'Quality Control');
  if (req.query.format === 'pdf') return exportPdf(res, 'quality-inspections', 'Quality Control Inspections', EXPORT_COLUMNS, result.items);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const insp = await service.getInspection(req.params.id);
  res.json({ success: true, data: insp });
});

const create = asyncHandler(async (req, res) => {
  const insp = await service.recordInspection(req.body);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'quality_inspections', entityId: insp.id, newValues: insp, req });
  res.status(201).json({ success: true, data: insp });
});

module.exports = { list, getOne, create };
