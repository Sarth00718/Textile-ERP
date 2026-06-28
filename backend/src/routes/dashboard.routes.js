const express = require('express');
const ctrl = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();
router.use(authenticate);

router.get('/summary', authorize('dashboard', 'view'), ctrl.summary);
router.get('/charts', authorize('dashboard', 'view'), ctrl.charts);

module.exports = router;
