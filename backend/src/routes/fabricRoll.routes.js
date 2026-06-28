const express = require('express');
const ctrl = require('../controllers/fabricRoll.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { updateRollStatusSchema, idParamSchema, listQuerySchema } = require('../validations/production.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('fabricRolls', 'view'), validate({ query: listQuerySchema }), ctrl.list);
router.get('/:id', authorize('fabricRolls', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.patch('/:id/status', authorize('fabricRolls', 'manage'), validate({ params: idParamSchema, body: updateRollStatusSchema }), ctrl.updateStatus);

module.exports = router;
