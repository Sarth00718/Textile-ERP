const service = require('../services/beam.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');

const list = asyncHandler(async (req, res) => {
  const result = await service.listBeams(req.query);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const beam = await service.getBeam(req.params.id);
  res.json({ success: true, data: beam });
});

const create = asyncHandler(async (req, res) => {
  const beam = await service.createBeam(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'beams', entityId: beam.id, newValues: beam, req });
  res.status(201).json({ success: true, data: beam });
});

const update = asyncHandler(async (req, res) => {
  const before = await service.getBeam(req.params.id);
  const beam = await service.updateBeam(req.params.id, req.body);
  await recordAudit({ userId: req.user.id, action: 'UPDATE', entityType: 'beams', entityId: beam.id, oldValues: before, newValues: beam, req });
  res.json({ success: true, data: beam });
});

const remove = asyncHandler(async (req, res) => {
  const before = await service.getBeam(req.params.id);
  await service.deleteBeam(req.params.id);
  await recordAudit({ userId: req.user.id, action: 'DELETE', entityType: 'beams', entityId: req.params.id, oldValues: before, req });
  res.json({ success: true, message: 'Beam deleted successfully' });
});

const allocate = asyncHandler(async (req, res) => {
  const allocation = await service.allocateBeam(req.body, req.user.id);
  await recordAudit({ userId: req.user.id, action: 'ALLOCATE', entityType: 'beam_allocations', entityId: allocation.id, newValues: allocation, req });
  res.status(201).json({ success: true, data: allocation });
});

const listAllocations = asyncHandler(async (req, res) => {
  const result = await service.listAllocations(req.query);
  res.json({ success: true, ...result });
});

const getAllocation = asyncHandler(async (req, res) => {
  const a = await service.getAllocation(req.params.id);
  res.json({ success: true, data: a });
});

const release = asyncHandler(async (req, res) => {
  const a = await service.releaseAllocation(req.params.id, req.body.metersUsed);
  await recordAudit({ userId: req.user.id, action: 'RELEASE', entityType: 'beam_allocations', entityId: a.id, newValues: a, req });
  res.json({ success: true, data: a });
});

module.exports = { list, getOne, create, update, remove, allocate, listAllocations, getAllocation, release };
