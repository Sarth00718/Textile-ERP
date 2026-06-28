const express = require('express');
const ctrl = require('../controllers/payroll.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { generateSchema, idParamSchema, listQuerySchema } = require('../validations/payroll.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('payroll', 'view'), validate({ query: listQuerySchema }), ctrl.list);
router.get('/:id', authorize('payroll', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/generate', authorize('payroll', 'manage'), validate({ body: generateSchema }), ctrl.generate);
router.post('/:id/mark-paid', authorize('payroll', 'manage'), validate({ params: idParamSchema }), ctrl.markPaid);

module.exports = router;
