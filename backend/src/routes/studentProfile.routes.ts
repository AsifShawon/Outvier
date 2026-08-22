import { Router } from 'express';
import { studentProfileController } from '../controllers/studentProfile.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  updateStudentProfileSchema,
  saveUniversitySchema,
  saveProgramSchema,
} from '../validators/studentProfile.validator';

const router = Router();

router.use(protect);

router.get('/', studentProfileController.getProfile);
router.put('/', validateRequest({ body: updateStudentProfileSchema }), studentProfileController.updateProfile);
router.post('/save-university', validateRequest({ body: saveUniversitySchema }), studentProfileController.saveUniversity);
router.post('/unsave-university', studentProfileController.unsaveUniversity);
router.post('/save-program', validateRequest({ body: saveProgramSchema }), studentProfileController.saveProgram);
router.post('/unsave-program', studentProfileController.unsaveProgram);

export default router;
