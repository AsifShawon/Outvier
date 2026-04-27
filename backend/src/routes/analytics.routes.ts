import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';

const router = Router();

router.use(protect, adminOnly);

router.get('/powerbi/token', analyticsController.getPowerBiToken);

export default router;
