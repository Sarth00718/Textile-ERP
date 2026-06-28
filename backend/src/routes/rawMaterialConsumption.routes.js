const express = require('express');
const ctrl = require('../controllers/rawMaterialConsumption.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('rawMaterialConsumption', 'view'), ctrl.list);

module.exports = router;
