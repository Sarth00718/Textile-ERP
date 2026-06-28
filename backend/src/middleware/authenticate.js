const { verifyAccessToken } = require('../utils/jwt');
const { ApiError } = require('../utils/apiError');
const { query } = require('../config/db');

/**
 * Verifies the Bearer access token, loads a minimal fresh user record
 * (to catch deactivated/deleted users immediately) and attaches it to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Missing or malformed Authorization header');
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired access token');
    }

    const { rows } = await query(
      'SELECT id, full_name, email, role, department_id, is_active FROM users WHERE id = $1',
      [decoded.sub]
    );
    const user = rows[0];
    if (!user || !user.is_active) {
      throw ApiError.unauthorized('User account is inactive or no longer exists');
    }

    req.user = {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      departmentId: user.department_id,
    };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate };
