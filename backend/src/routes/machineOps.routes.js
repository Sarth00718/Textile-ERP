const express = require('express');
const ctrl = require('../controllers/machineOps.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const {
  createLogSchema, logListQuerySchema,
  createBreakdownSchema, resolveBreakdownSchema, breakdownListQuerySchema,
  createMaintenanceSchema, updateMaintenanceSchema, maintenanceListQuerySchema,
  idParamSchema,
} = require('../validations/machineOps.validation');

const router = express.Router();
router.use(authenticate);

// Machine Logs
router.get('/logs', authorize('machineLogs', 'view'), validate({ query: logListQuerySchema }), ctrl.listLogs);
router.post('/logs', authorize('machineLogs', 'manage'), validate({ body: createLogSchema }), ctrl.createLog);

// Machine Breakdown
router.get('/breakdowns', authorize('machineBreakdown', 'view'), validate({ query: breakdownListQuerySchema }), ctrl.listBreakdowns);
router.get('/breakdowns/:id', authorize('machineBreakdown', 'view'), validate({ params: idParamSchema }), ctrl.getBreakdown);
router.post('/breakdowns', authorize('machineBreakdown', 'manage'), validate({ body: createBreakdownSchema }), ctrl.reportBreakdown);
router.post('/breakdowns/:id/resolve', authorize('machineBreakdown', 'manage'), validate({ params: idParamSchema, body: resolveBreakdownSchema }), ctrl.resolveBreakdown);

// Machine Maintenance
router.get('/maintenance', authorize('machineMaintenance', 'view'), validate({ query: maintenanceListQuerySchema }), ctrl.listMaintenance);
router.get('/maintenance/:id', authorize('machineMaintenance', 'view'), validate({ params: idParamSchema }), ctrl.getMaintenance);
router.post('/maintenance', authorize('machineMaintenance', 'manage'), validate({ body: createMaintenanceSchema }), ctrl.scheduleMaintenance);
router.patch('/maintenance/:id', authorize('machineMaintenance', 'manage'), validate({ params: idParamSchema, body: updateMaintenanceSchema }), ctrl.updateMaintenance);

module.exports = router;
