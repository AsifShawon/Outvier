import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createUniversitySchema, updateUniversitySchema } from '../validators/university.validator';
import { createProgramSchema, updateProgramSchema } from '../validators/program.validator';
import { programController } from '../controllers/program.controller';
import { upload } from '../services/upload.service';

const router = Router();

// All admin routes require auth
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/uploads', adminController.getUploadHistory);

// University CRUD — bulk-upload BEFORE :id to avoid route conflict
router.post('/universities/bulk-upload', upload.single('file'), adminController.uploadUniversitiesCSV);
router.get('/universities/:slug/programs', programController.getByUniversity);
router.post('/universities', validate(createUniversitySchema), adminController.createUniversity);
router.put('/universities/:id', validate(updateUniversitySchema), adminController.updateUniversity);
router.delete('/universities/:id', adminController.deleteUniversity);

// Program CRUD — bulk-upload BEFORE :id
router.post('/programs/bulk-upload', upload.single('file'), adminController.uploadProgramsCSV);
router.post('/programs', validate(createProgramSchema), adminController.createProgram);
router.put('/programs/:id', validate(updateProgramSchema), adminController.updateProgram);
router.delete('/programs/:id', adminController.deleteProgram);

export default router;
