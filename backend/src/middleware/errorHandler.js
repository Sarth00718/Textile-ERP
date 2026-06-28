const logger = require('../utils/logger');
const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isApiError ? err.message : 'Internal server error';

  if (statusCode >= 500) {
    logger.error(err.message, { stack: err.stack, path: req.originalUrl, method: req.method });
  } else {
    logger.warn(err.message, { path: req.originalUrl, method: req.method, statusCode });
  }

  const payload = {
    success: false,
    message,
  };
  if (err.details) payload.details = err.details;
  if (env.env !== 'production' && statusCode >= 500) payload.stack = err.stack;

  res.status(statusCode).json(payload);
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFoundHandler };
