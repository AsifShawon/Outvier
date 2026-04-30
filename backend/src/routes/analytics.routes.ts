import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';

const router = Router();

router.use(protect, adminOnly);

// Analytics config (Metabase vs PowerBI)
router.get('/config', analyticsController.getAnalyticsConfig);

// Built-in aggregation stats
router.get('/native', analyticsController.getNativeStats);

// Admin business dashboard stats
router.get('/', analyticsController.getAdminAnalytics);

export default router;
