const service = require('../services/machine.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');
const { exportCsv, exportExcel, exportPdf } = require('../utils/exporters');

const EXPORT_COLUMNS = [
  { key: 'machine_code', header: 'Machine Code' },
  { key: 'name', header: 'Name' },
  { key: 'machine_type', header: 'Type' },
  { key: 'department_name', header: 'Department' },
  { key: 'status', header: 'Status' },
  { key: 'current_operator_name', header: 'Current Operator' },
];

const list = asyncHandler(async (req, res) => {
  const result = await service.listMachines(req.query);
  if (req.query.format === 'csv') return exportCsv(res, 'machines', EXPORT_COLUMNS, result.items);
  if (req.query.format === 'excel') return exportExcel(res, 'machines', EXPORT_COLUMNS, result.items, 'Machines');
  if (req.query.format === 'pdf') return exportPdf(res, 'machines', 'Machine List', EXPORT_COLUMNS, result.items);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const machine = await service.getMachine(req.params.id);
  res.json({ success: true, data: machine });
});

const utilization = asyncHandler(async (req, res) => {
  const summary = await service.getUtilization();
  res.json({ success: true, data: summary });
});

const create = asyncHandler(async (req, res) => {
  const machine = await service.createMachine(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'machines', entityId: machine.id, newValues: machine, req });
  res.status(201).json({ success: true, data: machine });
});

const update = asyncHandler(async (req, res) => {
  const before = await service.getMachine(req.params.id);
  const machine = await service.updateMachine(req.params.id, req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'UPDATE', entityType: 'machines', entityId: machine.id, oldValues: before, newValues: machine, req });
  res.json({ success: true, data: machine });
});

const remove = asyncHandler(async (req, res) => {
  const before = await service.getMachine(req.params.id);
  await service.deleteMachine(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'DELETE', entityType: 'machines', entityId: req.params.id, oldValues: before, req });
  res.json({ success: true, message: 'Machine deleted successfully' });
});

module.exports = { list, getOne, utilization, create, update, remove };
