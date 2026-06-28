const express = require('express');
const ctrl = require('../controllers/customer.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { createCustomerSchema, updateCustomerSchema, idParamSchema, listQuerySchema } = require('../validations/sales.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('customers', 'view'), validate({ query: listQuerySchema }), ctrl.list);
router.get('/:id', authorize('customers', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/', authorize('customers', 'manage'), validate({ body: createCustomerSchema }), ctrl.create);
router.patch('/:id', authorize('customers', 'manage'), validate({ params: idParamSchema, body: updateCustomerSchema }), ctrl.update);
router.delete('/:id', authorize('customers', 'manage'), validate({ params: idParamSchema }), ctrl.remove);

module.exports = router;
