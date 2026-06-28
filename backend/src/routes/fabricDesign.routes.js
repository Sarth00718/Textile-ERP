const express = require('express');
const ctrl = require('../controllers/fabricDesign.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { createSchema, updateSchema, listQuerySchema, idParamSchema } = require('../validations/fabricDesign.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('fabricDesign', 'view'), validate({ query: listQuerySchema }), ctrl.list);
router.get('/:id', authorize('fabricDesign', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/', authorize('fabricDesign', 'manage'), validate({ body: createSchema }), ctrl.create);
router.patch('/:id', authorize('fabricDesign', 'manage'), validate({ params: idParamSchema, body: updateSchema }), ctrl.update);
router.delete('/:id', authorize('fabricDesign', 'manage'), validate({ params: idParamSchema }), ctrl.remove);

module.exports = router;
