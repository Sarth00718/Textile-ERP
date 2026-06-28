const service = require('../services/dashboard.service');
const { asyncHandler } = require('../utils/apiError');

const summary = asyncHandler(async (req, res) => {
  const data = await service.getDashboardSummary();
  res.json({ success: true, data });
});

const charts = asyncHandler(async (req, res) => {
  const data = await service.getCharts();
  res.json({ success: true, data });
});

module.exports = { summary, charts };
