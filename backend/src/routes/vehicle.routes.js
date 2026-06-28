const express = require('express');
const ctrl = require('../controllers/vehicle.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { createVehicleSchema, updateVehicleSchema, idParamSchema, listQuerySchema } = require('../validations/fulfillment.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('vehicles', 'view'), validate({ query: listQuerySchema }), ctrl.list);
router.get('/:id', authorize('vehicles', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/', authorize('vehicles', 'manage'), validate({ body: createVehicleSchema }), ctrl.create);
router.patch('/:id', authorize('vehicles', 'manage'), validate({ params: idParamSchema, body: updateVehicleSchema }), ctrl.update);
router.delete('/:id', authorize('vehicles', 'manage'), validate({ params: idParamSchema }), ctrl.remove);

module.exports = router;
