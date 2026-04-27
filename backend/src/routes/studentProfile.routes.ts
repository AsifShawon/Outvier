import { Router } from 'express';
import { studentProfileController } from '../controllers/studentProfile.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', studentProfileController.getProfile);
router.put('/', studentProfileController.updateProfile);

export default router;
