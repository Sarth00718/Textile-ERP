const service = require('../services/qualityControl.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');

const list = asyncHandler(async (req, res) => {
  const result = await service.listInspections(req.query);
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
