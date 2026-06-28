const express = require('express');
const ctrl = require('../controllers/inventory.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const {
  createInventoryItemSchema, updateInventoryItemSchema, inventoryListQuerySchema,
  createTransactionSchema, transactionListQuerySchema, idParamSchema,
} = require('../validations/inventory.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('inventory', 'view'), validate({ query: inventoryListQuerySchema }), ctrl.list);
router.get('/low-stock', authorize('inventory', 'view'), ctrl.lowStock);
router.get('/transactions', authorize('inventoryTransactions', 'view'), validate({ query: transactionListQuerySchema }), ctrl.listTransactions);
router.post('/transactions', authorize('inventoryTransactions', 'manage'), validate({ body: createTransactionSchema }), ctrl.createTransaction);

router.get('/:id', authorize('inventory', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/', authorize('inventory', 'manage'), validate({ body: createInventoryItemSchema }), ctrl.create);
router.patch('/:id', authorize('inventory', 'manage'), validate({ params: idParamSchema, body: updateInventoryItemSchema }), ctrl.update);
router.delete('/:id', authorize('inventory', 'manage'), validate({ params: idParamSchema }), ctrl.remove);

module.exports = router;
