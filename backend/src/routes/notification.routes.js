const express = require('express');
const ctrl = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { z } = require('zod');

const idParamSchema = z.object({ id: z.string().uuid() });

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('notifications', 'view'), ctrl.list);
router.post('/:id/read', authorize('notifications', 'view'), validate({ params: idParamSchema }), ctrl.markRead);
router.post('/mark-all-read', authorize('notifications', 'view'), ctrl.markAllRead);

module.exports = router;
