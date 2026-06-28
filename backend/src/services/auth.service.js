const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const authRepo = require('../repositories/auth.repository');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { ApiError } = require('../utils/apiError');
const env = require('../config/env');

const SALT_ROUNDS = 12;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function sanitizeUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    departmentId: user.department_id,
    avatarUrl: user.avatar_url,
    isActive: user.is_active,
    lastLoginAt: user.last_login_at,
  };
}

function buildTokens(user) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });
  return { accessToken, refreshToken };
}

async function register({ fullName, email, phone, password, role, departmentId }) {
  const existing = await authRepo.findUserByEmail(email);
  if (existing) {
    throw ApiError.conflict('A user with this email already exists');
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await authRepo.createUser({ fullName, email, phone, passwordHash, role, departmentId });
  return sanitizeUser(user);
}

async function login({ email, password }, meta = {}) {
  const user = await authRepo.findUserByEmail(email);
  if (!user || !user.is_active) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const { accessToken, refreshToken } = buildTokens(user);
  const decoded = verifyRefreshToken(refreshToken);
  await authRepo.storeRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(decoded.exp * 1000),
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
  });
  await authRepo.updateLastLogin(user.id);

  return { user: sanitizeUser(user), accessToken, refreshToken };
}

async function refresh(refreshToken, meta = {}) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await authRepo.findRefreshTokenByHash(tokenHash);
  if (!stored) {
    throw ApiError.unauthorized('Refresh token has been revoked or is unknown');
  }

  const user = await authRepo.findUserById(decoded.sub);
  if (!user || !user.is_active) {
    throw ApiError.unauthorized('User account is inactive');
  }

  // Rotate: revoke old, issue new
  await authRepo.revokeRefreshToken(stored.id);
  const { accessToken, refreshToken: newRefreshToken } = buildTokens(user);
  const newDecoded = verifyRefreshToken(newRefreshToken);
  await authRepo.storeRefreshToken({
    userId: user.id,
    tokenHash: hashToken(newRefreshToken),
    expiresAt: new Date(newDecoded.exp * 1000),
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
  });

  return { accessToken, refreshToken: newRefreshToken, user: sanitizeUser(user) };
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  const stored = await authRepo.findRefreshTokenByHash(tokenHash);
  if (stored) {
    await authRepo.revokeRefreshToken(stored.id);
  }
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await authRepo.findUserById(userId);
  if (!user) throw ApiError.notFound('User not found');
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw ApiError.badRequest('Current password is incorrect');
  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await authRepo.updatePasswordHash(userId, newHash);
  await authRepo.revokeAllUserTokens(userId);
}

async function getProfile(userId) {
  const user = await authRepo.findUserById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return sanitizeUser(user);
}

module.exports = { register, login, refresh, logout, changePassword, getProfile, sanitizeUser };
