const authService = require('../services/auth.service');
const { asyncHandler } = require('../utils/apiError');
const { recordAudit } = require('../services/audit.service');

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  await recordAudit({ userId: req.user?.id, action: 'CREATE', entityType: 'users', entityId: user.id, newValues: user, req });
  res.status(201).json({ success: true, data: user });
});

const login = asyncHandler(async (req, res) => {
  const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
  const { user, accessToken, refreshToken } = await authService.login(req.body, meta);
  res.json({ success: true, data: { user, accessToken, refreshToken } });
});

const refresh = asyncHandler(async (req, res) => {
  const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
  const result = await authService.refresh(req.body.refreshToken, meta);
  res.json({ success: true, data: result });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.json({ success: true, message: 'Logged out successfully' });
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  res.json({ success: true, message: 'Password changed successfully. Please log in again.' });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.json({ success: true, data: user });
});

module.exports = { register, login, refresh, logout, changePassword, me };
