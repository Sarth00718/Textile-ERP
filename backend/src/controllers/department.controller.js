const service = require('../services/department.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');

const list = asyncHandler(async (req, res) => {
  const result = await service.listDepartments(req.query);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const dept = await service.getDepartment(req.params.id);
  res.json({ success: true, data: dept });
});

const create = asyncHandler(async (req, res) => {
  const dept = await service.createDepartment(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'departments', entityId: dept.id, newValues: dept, req });
  res.status(201).json({ success: true, data: dept });
});

const update = asyncHandler(async (req, res) => {
  const before = await service.getDepartment(req.params.id);
  const dept = await service.updateDepartment(req.params.id, req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'UPDATE', entityType: 'departments', entityId: dept.id, oldValues: before, newValues: dept, req });
  res.json({ success: true, data: dept });
});

const remove = asyncHandler(async (req, res) => {
  const before = await service.getDepartment(req.params.id);
  await service.deleteDepartment(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'DELETE', entityType: 'departments', entityId: req.params.id, oldValues: before, req });
  res.json({ success: true, message: 'Department deleted successfully' });
});

module.exports = { list, getOne, create, update, remove };
