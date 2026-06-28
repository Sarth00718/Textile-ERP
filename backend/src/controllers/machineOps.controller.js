const service = require('../services/machineOps.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');

// ---- Logs ----
const createLog = asyncHandler(async (req, res) => {
  const log = await service.recordLog(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'machine_logs', entityId: log.id, newValues: log, req });
  res.status(201).json({ success: true, data: log });
});

const listLogs = asyncHandler(async (req, res) => {
  const result = await service.listLogs(req.query);
  res.json({ success: true, ...result });
});

// ---- Breakdown ----
const reportBreakdown = asyncHandler(async (req, res) => {
  const breakdown = await service.reportBreakdown(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'machine_breakdowns', entityId: breakdown.id, newValues: breakdown, req });
  res.status(201).json({ success: true, data: breakdown });
});

const listBreakdowns = asyncHandler(async (req, res) => {
  const result = await service.listBreakdowns(req.query);
  res.json({ success: true, ...result });
});

const getBreakdown = asyncHandler(async (req, res) => {
  const b = await service.getBreakdown(req.params.id);
  res.json({ success: true, data: b });
});

const resolveBreakdown = asyncHandler(async (req, res) => {
  const b = await service.resolveBreakdown(req.params.id, req.body.resolvedBy || req.user.id, req.body.resolutionNotes);
  await recordAudit({ userId: req.user.id, action: 'RESOLVE', entityType: 'machine_breakdowns', entityId: b.id, newValues: b, req });
  res.json({ success: true, data: b });
});

// ---- Maintenance ----
const scheduleMaintenance = asyncHandler(async (req, res) => {
  const m = await service.scheduleMaintenance(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'machine_maintenance', entityId: m.id, newValues: m, req });
  res.status(201).json({ success: true, data: m });
});

const listMaintenance = asyncHandler(async (req, res) => {
  const result = await service.listMaintenance(req.query);
  res.json({ success: true, ...result });
});

const getMaintenance = asyncHandler(async (req, res) => {
  const m = await service.getMaintenance(req.params.id);
  res.json({ success: true, data: m });
});

const updateMaintenance = asyncHandler(async (req, res) => {
  const before = await service.getMaintenance(req.params.id);
  const m = await service.updateMaintenance(req.params.id, req.body);
  await recordAudit({ userId: req.user.id, action: 'UPDATE', entityType: 'machine_maintenance', entityId: m.id, oldValues: before, newValues: m, req });
  res.json({ success: true, data: m });
});

module.exports = {
  createLog, listLogs,
  reportBreakdown, listBreakdowns, getBreakdown, resolveBreakdown,
  scheduleMaintenance, listMaintenance, getMaintenance, updateMaintenance,
};
