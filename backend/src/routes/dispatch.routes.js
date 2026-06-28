const express = require('express');
const ctrl = require('../controllers/dispatch.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { createDispatchSchema, idParamSchema, listQuerySchema } = require('../validations/fulfillment.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('dispatch', 'view'), validate({ query: listQuerySchema }), ctrl.list);
router.get('/:id', authorize('dispatch', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/', authorize('dispatch', 'manage'), validate({ body: createDispatchSchema }), ctrl.create);
router.post('/:id/in-transit', authorize('dispatch', 'manage'), validate({ params: idParamSchema }), ctrl.markInTransit);
router.post('/:id/delivered', authorize('dispatch', 'manage'), validate({ params: idParamSchema }), ctrl.markDelivered);

module.exports = router;
