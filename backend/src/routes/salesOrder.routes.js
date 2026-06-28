const express = require('express');
const ctrl = require('../controllers/salesOrder.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { createSOSchema, updateSOStatusSchema, recordPaymentSchema, idParamSchema, listQuerySchema } = require('../validations/sales.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('salesOrders', 'view'), validate({ query: listQuerySchema }), ctrl.list);
router.get('/:id', authorize('salesOrders', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/', authorize('salesOrders', 'manage'), validate({ body: createSOSchema }), ctrl.create);
router.patch('/:id/status', authorize('salesOrders', 'manage'), validate({ params: idParamSchema, body: updateSOStatusSchema }), ctrl.updateStatus);
router.post('/:id/payments', authorize('salesOrders', 'manage'), validate({ params: idParamSchema, body: recordPaymentSchema }), ctrl.recordPayment);

module.exports = router;
