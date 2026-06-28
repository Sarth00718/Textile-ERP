const { can } = require('../config/permissions');
const { ApiError } = require('../utils/apiError');

/**
 * Express middleware factory enforcing RBAC for a given module/action.
 * Usage: router.post('/', authenticate, authorize('employees', 'manage'), handler)
 */
function authorize(moduleName, action) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!can(req.user.role, moduleName, action)) {
      return next(
        ApiError.forbidden(`Role '${req.user.role}' is not permitted to '${action}' on '${moduleName}'`)
      );
    }
    next();
  };
}

module.exports = { authorize };
