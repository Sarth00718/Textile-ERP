const express = require('express');
const ctrl = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
} = require('../validations/auth.validation');

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate a user and receive access/refresh tokens
 *     tags: [Auth]
 */
router.post('/login', validate({ body: loginSchema }), ctrl.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Exchange a valid refresh token for a new token pair
 *     tags: [Auth]
 */
router.post('/refresh', validate({ body: refreshSchema }), ctrl.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Revoke a refresh token
 *     tags: [Auth]
 */
router.post('/logout', ctrl.logout);

// Only OWNER/MANAGER can create new user accounts (employee onboarding flow)
router.post(
  '/register',
  authenticate,
  authorize('employees', 'manage'),
  validate({ body: registerSchema }),
  ctrl.register
);

router.get('/me', authenticate, ctrl.me);
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), ctrl.changePassword);

module.exports = router;
