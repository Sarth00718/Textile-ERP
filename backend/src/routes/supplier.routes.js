const express = require('express');
const ctrl = require('../controllers/supplier.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { createSupplierSchema, updateSupplierSchema, idParamSchema, listQuerySchema } = require('../validations/procurement.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('suppliers', 'view'), validate({ query: listQuerySchema }), ctrl.list);
router.get('/:id', authorize('suppliers', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/', authorize('suppliers', 'manage'), validate({ body: createSupplierSchema }), ctrl.create);
router.patch('/:id', authorize('suppliers', 'manage'), validate({ params: idParamSchema, body: updateSupplierSchema }), ctrl.update);
router.delete('/:id', authorize('suppliers', 'manage'), validate({ params: idParamSchema }), ctrl.remove);

module.exports = router;
