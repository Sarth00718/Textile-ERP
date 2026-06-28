const { ApiError } = require('../utils/apiError');

/**
 * Validates req.body / req.query / req.params against Zod schemas.
 * schemas = { body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }
 * On success, replaces req.body/query/params with the parsed (coerced) data.
 */
function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err.errors) {
        const details = err.errors.map((e) => ({ path: e.path.join('.'), message: e.message }));
        return next(ApiError.badRequest('Validation failed', details));
      }
      next(err);
    }
  };
}

module.exports = { validate };
