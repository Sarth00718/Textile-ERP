const express = require('express');
const ctrl = require('../controllers/reports.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { reportListQuerySchema } = require('../validations/reports.validation');

const router = express.Router();
router.use(authenticate);

router.get('/production', authorize('reports', 'view'), validate({ query: reportListQuerySchema }), ctrl.listProduction);
router.get('/inventory', authorize('reports', 'view'), validate({ query: reportListQuerySchema }), ctrl.listInventory);
router.get('/sales', authorize('reports', 'view'), validate({ query: reportListQuerySchema }), ctrl.listSales);
router.get('/purchase', authorize('reports', 'view'), validate({ query: reportListQuerySchema }), ctrl.listPurchase);
router.get('/payroll', authorize('reports', 'view'), validate({ query: reportListQuerySchema }), ctrl.listPayroll);
router.get('/attendance', authorize('reports', 'view'), validate({ query: reportListQuerySchema }), ctrl.listAttendance);
router.get('/financial', authorize('reports', 'view'), validate({ query: reportListQuerySchema }), ctrl.listFinancial);

module.exports = router;