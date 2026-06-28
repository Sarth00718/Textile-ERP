const service = require('../services/packing.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');

const list = asyncHandler(async (req, res) => {
  const result = await service.listPackingRecords(req.query);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const rec = await service.getPackingRecord(req.params.id);
  res.json({ success: true, data: rec });
});

const create = asyncHandler(async (req, res) => {
  const rec = await service.createPackingRecord(req.body);
  await recordAudit({ userId: req.user.id, action: 'CREATE', entityType: 'packing_records', entityId: rec.id, newValues: rec, req });
  res.status(201).json({ success: true, data: rec });
});

module.exports = { list, getOne, create };
