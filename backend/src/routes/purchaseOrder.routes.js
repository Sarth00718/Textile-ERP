const express = require('express');
const ctrl = require('../controllers/purchaseOrder.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { createPOSchema, receivePOSchema, idParamSchema, listQuerySchema } = require('../validations/procurement.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('purchaseOrders', 'view'), validate({ query: listQuerySchema }), ctrl.list);
router.get('/:id', authorize('purchaseOrders', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/', authorize('purchaseOrders', 'manage'), validate({ body: createPOSchema }), ctrl.create);
router.post('/:id/send', authorize('purchaseOrders', 'manage'), validate({ params: idParamSchema }), ctrl.send);
router.post('/:id/cancel', authorize('purchaseOrders', 'manage'), validate({ params: idParamSchema }), ctrl.cancel);
router.post('/:id/receive', authorize('purchaseOrders', 'manage'), validate({ params: idParamSchema, body: receivePOSchema }), ctrl.receive);

module.exports = router;
