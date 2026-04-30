import { Router } from 'express';
import { applicationTrackerController } from '../controllers/applicationTracker.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', applicationTrackerController.getMyApplications);
router.post('/', applicationTrackerController.addApplication);
router.patch('/:id', applicationTrackerController.updateStatus);
router.delete('/:id', applicationTrackerController.removeApplication);

export default router;
