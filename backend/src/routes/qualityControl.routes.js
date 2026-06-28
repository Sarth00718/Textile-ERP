const express = require('express');
const ctrl = require('../controllers/qualityControl.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { createQCSchema, idParamSchema, listQuerySchema } = require('../validations/fulfillment.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('qualityControl', 'view'), validate({ query: listQuerySchema }), ctrl.list);
router.get('/:id', authorize('qualityControl', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/', authorize('qualityControl', 'manage'), validate({ body: createQCSchema }), ctrl.create);

module.exports = router;
