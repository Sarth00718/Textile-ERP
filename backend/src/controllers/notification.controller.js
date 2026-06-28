const service = require('../services/notification.service');
const { asyncHandler } = require('../utils/apiError');

const list = asyncHandler(async (req, res) => {
  const unreadOnly = req.query.unreadOnly === 'true';
  const limit = parseInt(req.query.limit, 10) || 50;
  const offset = parseInt(req.query.offset, 10) || 0;
  const items = await service.listForUser(req.user.id, { unreadOnly, limit, offset });
  res.json({ success: true, data: items });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await service.markRead(req.params.id, req.user.id);
  res.json({ success: true, data: notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  await service.markAllRead(req.user.id);
  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = { list, markRead, markAllRead };
