const express = require('express');
const ctrl = require('../controllers/machine.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { createSchema, updateSchema, listQuerySchema, idParamSchema } = require('../validations/machine.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('machines', 'view'), validate({ query: listQuerySchema }), ctrl.list);
router.get('/utilization', authorize('machines', 'view'), ctrl.utilization);
router.get('/:id', authorize('machines', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/', authorize('machines', 'manage'), validate({ body: createSchema }), ctrl.create);
router.patch('/:id', authorize('machines', 'manage'), validate({ params: idParamSchema, body: updateSchema }), ctrl.update);
router.delete('/:id', authorize('machines', 'manage'), validate({ params: idParamSchema }), ctrl.remove);

module.exports = router;
