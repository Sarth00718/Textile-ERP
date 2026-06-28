const express = require('express');
const ctrl = require('../controllers/attendance.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { markSchema, bulkMarkSchema, updateSchema, listQuerySchema, idParamSchema } = require('../validations/attendance.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('attendance', 'view'), validate({ query: listQuerySchema }), ctrl.list);
router.get('/:id', authorize('attendance', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/', authorize('attendance', 'manage'), validate({ body: markSchema }), ctrl.mark);
router.post('/bulk', authorize('attendance', 'manage'), validate({ body: bulkMarkSchema }), ctrl.bulkMark);
router.patch('/:id', authorize('attendance', 'manage'), validate({ params: idParamSchema, body: updateSchema }), ctrl.update);
router.delete('/:id', authorize('attendance', 'manage'), validate({ params: idParamSchema }), ctrl.remove);

module.exports = router;
