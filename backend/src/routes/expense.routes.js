const express = require('express');
const ctrl = require('../controllers/expense.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { createExpenseSchema, updateExpenseSchema, idParamSchema, listQuerySchema } = require('../validations/operations.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('expenses', 'view'), validate({ query: listQuerySchema }), ctrl.list);
router.get('/summary', authorize('expenses', 'view'), ctrl.summary);
router.get('/:id', authorize('expenses', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/', authorize('expenses', 'manage'), validate({ body: createExpenseSchema }), ctrl.create);
router.patch('/:id', authorize('expenses', 'manage'), validate({ params: idParamSchema, body: updateExpenseSchema }), ctrl.update);
router.delete('/:id', authorize('expenses', 'manage'), validate({ params: idParamSchema }), ctrl.remove);

module.exports = router;
