const express = require('express');
const ctrl = require('../controllers/operations.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const {
  createElectricitySchema, createWaterSchema, createProductivitySchema, createWasteSchema, listQuerySchema,
} = require('../validations/operations.validation');

const router = express.Router();
router.use(authenticate);

router.get('/electricity', authorize('electricityMonitoring', 'view'), validate({ query: listQuerySchema }), ctrl.listElectricity);
router.post('/electricity', authorize('electricityMonitoring', 'manage'), validate({ body: createElectricitySchema }), ctrl.createElectricity);

router.get('/water', authorize('waterMonitoring', 'view'), validate({ query: listQuerySchema }), ctrl.listWater);
router.post('/water', authorize('waterMonitoring', 'manage'), validate({ body: createWaterSchema }), ctrl.createWater);

router.get('/productivity', authorize('workerProductivity', 'view'), validate({ query: listQuerySchema }), ctrl.listProductivity);
router.post('/productivity', authorize('workerProductivity', 'manage'), validate({ body: createProductivitySchema }), ctrl.recordProductivity);

router.get('/waste', authorize('wasteManagement', 'view'), validate({ query: listQuerySchema }), ctrl.listWaste);
router.post('/waste', authorize('wasteManagement', 'manage'), validate({ body: createWasteSchema }), ctrl.createWaste);

module.exports = router;
