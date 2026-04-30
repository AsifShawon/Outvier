import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

// Public analytics — no auth required
router.get('/', analyticsController.getPublicAnalytics);

export default router;
