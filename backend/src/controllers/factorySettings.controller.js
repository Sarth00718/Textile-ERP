const service = require('../services/factorySettings.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');

const getOne = asyncHandler(async (req, res) => {
  const settings = await service.getSettings();
  res.json({ success: true, data: settings });
});

const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await service.getSettings();
  res.json({
    success: true,
    data: {
      factoryName: settings.factory_name,
      logoUrl: settings.logo_url,
    },
  });
});

const update = asyncHandler(async (req, res) => {
  const before = await service.getSettings();
  const settings = await service.updateSettings(req.body);
  await recordAudit({ userId: req.user.id, action: 'UPDATE', entityType: 'factory_settings', entityId: settings.id, oldValues: before, newValues: settings, req });
  res.json({ success: true, data: settings });
});

module.exports = { getOne, getPublicSettings, update };
