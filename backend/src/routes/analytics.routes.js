import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import * as analytics from '../controllers/analytics.controller.js';

const router = Router();
router.get('/', authenticate, requireRole(['ADMIN', 'MANAGER']), analytics.getAnalytics);

export default router;
