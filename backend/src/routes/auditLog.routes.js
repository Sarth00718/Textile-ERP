const express = require('express');
const ctrl = require('../controllers/auditLog.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('auditLogs', 'view'), ctrl.list);

module.exports = router;
