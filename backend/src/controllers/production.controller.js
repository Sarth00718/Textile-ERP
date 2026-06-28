const planService = require('../services/productionPlan.service');
const woService = require('../services/workOrder.service');
const poService = require('../services/productionOrder.service');
const dpeService = require('../services/dailyProductionEntry.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');

// ---- Production Plans ----
const listPlans = asyncHandler(async (req, res) => {
  const result = await planService.listPlans(req.query);
  res.json({ success: true, ...result });
});
const getPlan = asyncHandler(async (req, res) => {
  const plan = await planService.getPlan(req.params.id);
  res.json({ success: true, data: plan });
});
const createPlan = asyncHandler(async (req, res) => {
  const plan = await planService.createPlan(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'production_plans', entityId: plan.id, newValues: plan, req });
  res.status(201).json({ success: true, data: plan });
});
const updatePlan = asyncHandler(async (req, res) => {
  const before = await planService.getPlan(req.params.id);
  const plan = await planService.updatePlan(req.params.id, req.body);
  await recordAudit({ userId: req.user.id, action: 'UPDATE', entityType: 'production_plans', entityId: plan.id, oldValues: before, newValues: plan, req });
  res.json({ success: true, data: plan });
});
const removePlan = asyncHandler(async (req, res) => {
  const before = await planService.getPlan(req.params.id);
  await planService.deletePlan(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'DELETE', entityType: 'production_plans', entityId: req.params.id, oldValues: before, req });
  res.json({ success: true, message: 'Production plan deleted successfully' });
});

// ---- Work Orders ----
const listWorkOrders = asyncHandler(async (req, res) => {
  const result = await woService.listWorkOrders(req.query);
  res.json({ success: true, ...result });
});
const getWorkOrder = asyncHandler(async (req, res) => {
  const wo = await woService.getWorkOrder(req.params.id);
  res.json({ success: true, data: wo });
});
const createWorkOrder = asyncHandler(async (req, res) => {
  const wo = await woService.createWorkOrder(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'work_orders', entityId: wo.id, newValues: wo, req });
  res.status(201).json({ success: true, data: wo });
});
const updateWorkOrder = asyncHandler(async (req, res) => {
  const before = await woService.getWorkOrder(req.params.id);
  const wo = await woService.updateWorkOrder(req.params.id, req.body);
  await recordAudit({ userId: req.user.id, action: 'UPDATE', entityType: 'work_orders', entityId: wo.id, oldValues: before, newValues: wo, req });
  res.json({ success: true, data: wo });
});
const removeWorkOrder = asyncHandler(async (req, res) => {
  const before = await woService.getWorkOrder(req.params.id);
  await woService.deleteWorkOrder(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'DELETE', entityType: 'work_orders', entityId: req.params.id, oldValues: before, req });
  res.json({ success: true, message: 'Work order deleted successfully' });
});

// ---- Production Orders ----
const listProductionOrders = asyncHandler(async (req, res) => {
  const result = await poService.listProductionOrders(req.query);
  res.json({ success: true, ...result });
});
const getProductionOrder = asyncHandler(async (req, res) => {
  const po = await poService.getProductionOrder(req.params.id);
  res.json({ success: true, data: po });
});
const createProductionOrder = asyncHandler(async (req, res) => {
  const po = await poService.createProductionOrder(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'production_orders', entityId: po.id, newValues: po, req });
  res.status(201).json({ success: true, data: po });
});
const updateProductionOrder = asyncHandler(async (req, res) => {
  const before = await poService.getProductionOrder(req.params.id);
  const po = await poService.updateProductionOrder(req.params.id, req.body);
  await recordAudit({ userId: req.user.id, action: 'UPDATE', entityType: 'production_orders', entityId: po.id, oldValues: before, newValues: po, req });
  res.json({ success: true, data: po });
});
const removeProductionOrder = asyncHandler(async (req, res) => {
  const before = await poService.getProductionOrder(req.params.id);
  await poService.deleteProductionOrder(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'DELETE', entityType: 'production_orders', entityId: req.params.id, oldValues: before, req });
  res.json({ success: true, message: 'Production order deleted successfully' });
});

// ---- Daily Production Entry ----
const listDailyEntries = asyncHandler(async (req, res) => {
  const result = await dpeService.listEntries(req.query);
  res.json({ success: true, ...result });
});
const getDailyEntry = asyncHandler(async (req, res) => {
  const entry = await dpeService.getEntry(req.params.id);
  res.json({ success: true, data: entry });
});
const createDailyEntry = asyncHandler(async (req, res) => {
  const result = await dpeService.createEntry(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'daily_production_entries', entityId: result.entry.id, newValues: result.entry, req });
  res.status(201).json({ success: true, data: result });
});

module.exports = {
  listPlans, getPlan, createPlan, updatePlan, removePlan,
  listWorkOrders, getWorkOrder, createWorkOrder, updateWorkOrder, removeWorkOrder,
  listProductionOrders, getProductionOrder, createProductionOrder, updateProductionOrder, removeProductionOrder,
  listDailyEntries, getDailyEntry, createDailyEntry,
};
