const express = require('express');
const ctrl = require('../controllers/leave.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { createSchema, rejectSchema, listQuerySchema, idParamSchema } = require('../validations/leave.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('leave', 'view'), validate({ query: listQuerySchema }), ctrl.list);
router.get('/:id', authorize('leave', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/', authorize('leave', 'request'), validate({ body: createSchema }), ctrl.create);
router.post('/:id/approve', authorize('leave', 'manage'), validate({ params: idParamSchema }), ctrl.approve);
router.post('/:id/reject', authorize('leave', 'manage'), validate({ params: idParamSchema, body: rejectSchema }), ctrl.reject);
router.post('/:id/cancel', authorize('leave', 'request'), validate({ params: idParamSchema }), ctrl.cancel);

module.exports = router;
