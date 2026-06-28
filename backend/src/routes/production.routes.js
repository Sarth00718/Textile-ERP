const express = require('express');
const ctrl = require('../controllers/production.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const {
  createPlanSchema, updatePlanSchema,
  createWorkOrderSchema, updateWorkOrderSchema,
  createProductionOrderSchema, updateProductionOrderSchema,
  createDailyEntrySchema,
  idParamSchema, listQuerySchema,
} = require('../validations/production.validation');

const router = express.Router();
router.use(authenticate);

// Production Plans
router.get('/plans', authorize('productionPlanning', 'view'), validate({ query: listQuerySchema }), ctrl.listPlans);
router.get('/plans/:id', authorize('productionPlanning', 'view'), validate({ params: idParamSchema }), ctrl.getPlan);
router.post('/plans', authorize('productionPlanning', 'manage'), validate({ body: createPlanSchema }), ctrl.createPlan);
router.patch('/plans/:id', authorize('productionPlanning', 'manage'), validate({ params: idParamSchema, body: updatePlanSchema }), ctrl.updatePlan);
router.delete('/plans/:id', authorize('productionPlanning', 'manage'), validate({ params: idParamSchema }), ctrl.removePlan);

// Work Orders
router.get('/work-orders', authorize('workOrders', 'view'), validate({ query: listQuerySchema }), ctrl.listWorkOrders);
router.get('/work-orders/:id', authorize('workOrders', 'view'), validate({ params: idParamSchema }), ctrl.getWorkOrder);
router.post('/work-orders', authorize('workOrders', 'manage'), validate({ body: createWorkOrderSchema }), ctrl.createWorkOrder);
router.patch('/work-orders/:id', authorize('workOrders', 'manage'), validate({ params: idParamSchema, body: updateWorkOrderSchema }), ctrl.updateWorkOrder);
router.delete('/work-orders/:id', authorize('workOrders', 'manage'), validate({ params: idParamSchema }), ctrl.removeWorkOrder);

// Production Orders
router.get('/orders', authorize('productionOrders', 'view'), validate({ query: listQuerySchema }), ctrl.listProductionOrders);
router.get('/orders/:id', authorize('productionOrders', 'view'), validate({ params: idParamSchema }), ctrl.getProductionOrder);
router.post('/orders', authorize('productionOrders', 'manage'), validate({ body: createProductionOrderSchema }), ctrl.createProductionOrder);
router.patch('/orders/:id', authorize('productionOrders', 'manage'), validate({ params: idParamSchema, body: updateProductionOrderSchema }), ctrl.updateProductionOrder);
router.delete('/orders/:id', authorize('productionOrders', 'manage'), validate({ params: idParamSchema }), ctrl.removeProductionOrder);

// Daily Production Entry
router.get('/daily-entries', authorize('dailyProductionEntry', 'view'), validate({ query: listQuerySchema }), ctrl.listDailyEntries);
router.get('/daily-entries/:id', authorize('dailyProductionEntry', 'view'), validate({ params: idParamSchema }), ctrl.getDailyEntry);
router.post('/daily-entries', authorize('dailyProductionEntry', 'manage'), validate({ body: createDailyEntrySchema }), ctrl.createDailyEntry);

module.exports = router;
