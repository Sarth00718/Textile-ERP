const express = require('express');
const ctrl = require('../controllers/department.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { createSchema, updateSchema, listQuerySchema, idParamSchema } = require('../validations/department.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('departments', 'view'), validate({ query: listQuerySchema }), ctrl.list);
router.get('/:id', authorize('departments', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/', authorize('departments', 'manage'), validate({ body: createSchema }), ctrl.create);
router.patch('/:id', authorize('departments', 'manage'), validate({ params: idParamSchema, body: updateSchema }), ctrl.update);
router.delete('/:id', authorize('departments', 'manage'), validate({ params: idParamSchema }), ctrl.remove);

module.exports = router;
