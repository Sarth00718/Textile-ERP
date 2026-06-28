const express = require('express');
const ctrl = require('../controllers/packing.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { createPackingSchema, idParamSchema, listQuerySchema } = require('../validations/fulfillment.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('packing', 'view'), validate({ query: listQuerySchema }), ctrl.list);
router.get('/:id', authorize('packing', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/', authorize('packing', 'manage'), validate({ body: createPackingSchema }), ctrl.create);

module.exports = router;
