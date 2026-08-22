import { Router } from 'express';
import { studentDashboardController } from '../controllers/studentDashboard.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protected student dashboard endpoint
router.get('/me', protect, studentDashboardController.getMyDashboard);

export default router;
