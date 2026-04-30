import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createUniversitySchema, updateUniversitySchema } from '../validators/university.validator';
import { createProgramSchema, updateProgramSchema } from '../validators/program.validator';
import { programController } from '../controllers/program.controller';
import { upload } from '../services/upload.service';
import { uploadController } from '../controllers/upload.controller';

const router = Router();

// All admin routes require auth
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/analytics/embed-token', adminController.getEmbedToken);

// Bulk Uploads
router.post('/universities/bulk-upload', upload.single('file'), uploadController.uploadUniversities);
router.post('/programs/bulk-upload', upload.single('file'), uploadController.uploadPrograms);
router.get('/uploads', uploadController.getUploadHistory);

// University CRUD
router.get('/universities/:slug/programs', programController.getByUniversity);
router.post('/universities', validate(createUniversitySchema), adminController.createUniversity);
router.put('/universities/:id', validate(updateUniversitySchema), adminController.updateUniversity);
router.delete('/universities/:id', adminController.deleteUniversity);

// Program CRUD
router.post('/programs', validate(createProgramSchema), adminController.createProgram);
router.put('/programs/:id', validate(updateProgramSchema), adminController.updateProgram);
router.delete('/programs/:id', adminController.deleteProgram);

export default router;
