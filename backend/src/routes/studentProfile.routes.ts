import { Router } from 'express';
import { studentProfileController } from '../controllers/studentProfile.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', studentProfileController.getProfile);
router.put('/', studentProfileController.updateProfile);
router.post('/save-university', studentProfileController.saveUniversity);
router.post('/unsave-university', studentProfileController.unsaveUniversity);
router.post('/save-program', studentProfileController.saveProgram);
router.post('/unsave-program', studentProfileController.unsaveProgram);

export default router;
