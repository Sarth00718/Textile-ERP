const express = require('express');
const ctrl = require('../controllers/factorySettings.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { updateSchema } = require('../validations/factorySettings.validation');

const router = express.Router();

router.get('/public', ctrl.getPublicSettings);

router.use(authenticate);

router.get('/', authorize('factorySettings', 'view'), ctrl.getOne);
router.patch('/', authorize('factorySettings', 'manage'), validate({ body: updateSchema }), ctrl.update);

module.exports = router;
