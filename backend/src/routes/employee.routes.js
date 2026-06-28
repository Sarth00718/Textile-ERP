const express = require('express');
const ctrl = require('../controllers/employee.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { createSchema, updateSchema, listQuerySchema, idParamSchema } = require('../validations/employee.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('employees', 'view'), validate({ query: listQuerySchema }), ctrl.list);
router.get('/:id', authorize('employees', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/', authorize('employees', 'manage'), validate({ body: createSchema }), ctrl.create);
router.patch('/:id', authorize('employees', 'manage'), validate({ params: idParamSchema, body: updateSchema }), ctrl.update);
router.delete('/:id', authorize('employees', 'manage'), validate({ params: idParamSchema }), ctrl.remove);

module.exports = router;
