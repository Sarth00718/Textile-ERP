const express = require('express');
const ctrl = require('../controllers/beam.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const {
  createBeamSchema, updateBeamSchema, beamListQuerySchema,
  allocateSchema, releaseSchema, allocationListQuerySchema, idParamSchema,
} = require('../validations/beam.validation');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('beams', 'view'), validate({ query: beamListQuerySchema }), ctrl.list);
router.get('/allocations', authorize('beamAllocation', 'view'), validate({ query: allocationListQuerySchema }), ctrl.listAllocations);
router.get('/allocations/:id', authorize('beamAllocation', 'view'), validate({ params: idParamSchema }), ctrl.getAllocation);
router.post('/allocations', authorize('beamAllocation', 'manage'), validate({ body: allocateSchema }), ctrl.allocate);
router.post('/allocations/:id/release', authorize('beamAllocation', 'manage'), validate({ params: idParamSchema, body: releaseSchema }), ctrl.release);

router.get('/:id', authorize('beams', 'view'), validate({ params: idParamSchema }), ctrl.getOne);
router.post('/', authorize('beams', 'manage'), validate({ body: createBeamSchema }), ctrl.create);
router.patch('/:id', authorize('beams', 'manage'), validate({ params: idParamSchema, body: updateBeamSchema }), ctrl.update);
router.delete('/:id', authorize('beams', 'manage'), validate({ params: idParamSchema }), ctrl.remove);

module.exports = router;
