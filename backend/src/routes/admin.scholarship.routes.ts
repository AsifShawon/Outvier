import { Router } from 'express';
import { scholarshipController } from '../controllers/scholarship.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';

const router = Router();

// Apply admin auth middleware to all routes
router.use(protect, adminOnly);

router.get('/', scholarshipController.getAllAdmin);
router.get('/:id', scholarshipController.getByIdAdmin);
router.post('/', scholarshipController.create);
router.patch('/:id', scholarshipController.update);
router.patch('/:id/archive', scholarshipController.archive);
router.patch('/:id/restore', scholarshipController.restore);
router.patch('/:id/status', scholarshipController.changeStatus);
router.patch('/:id/feature', scholarshipController.feature);

export default router;
