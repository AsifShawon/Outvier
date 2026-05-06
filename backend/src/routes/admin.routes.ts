import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { syncController } from '../controllers/sync.controller';
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
router.get('/dashboard/activities', adminController.getActivities);
router.get('/dashboard/recent-additions', adminController.getRecentAdditions);
router.get('/users', adminController.getUsers);

// University CRUD
router.get('/universities', adminController.listUniversities);
router.get('/universities/:id', adminController.getUniversity);
router.get('/universities/:slug/programs', programController.getByUniversity);
router.post('/universities', validate(createUniversitySchema), adminController.createUniversity);
router.post('/universities/:id/trigger-enrichment', syncController.triggerUniversitySync);
router.put('/universities/:id', validate(updateUniversitySchema), adminController.updateUniversity);
router.delete('/universities/:id', adminController.deleteUniversity);

// Program CRUD
router.post('/programs', validate(createProgramSchema), adminController.createProgram);
router.put('/programs/:id', validate(updateProgramSchema), adminController.updateProgram);
router.delete('/programs/:id', adminController.deleteProgram);

// Bulk Uploads
router.post('/universities/bulk-upload', upload.single('file'), uploadController.uploadUniversities);
router.post('/programs/bulk-upload', upload.single('file'), uploadController.uploadPrograms);
router.get('/uploads', uploadController.getUploadHistory);

// Rankings
router.get('/rankings', adminController.getRankings);
router.post('/rankings', adminController.createRanking);
router.put('/rankings/:id', adminController.updateRanking);
router.post('/rankings/recheck', adminController.recheckAllRankings);
router.post('/rankings/:id/recheck', adminController.recheckRanking);
router.delete('/rankings/:id', adminController.deleteRanking);

// Scholarships
router.get('/scholarships', adminController.getScholarships);
router.post('/scholarships', adminController.createScholarship);
router.post('/scholarships/ai-find', adminController.aiFindScholarships);
router.delete('/scholarships/:id', adminController.deleteScholarship);

// Outcomes
router.get('/outcomes', adminController.getOutcomes);
router.post('/outcomes', adminController.createOutcome);
router.post('/outcomes/ai-enrich', adminController.aiEnrichOutcomes);
router.delete('/outcomes/:id', adminController.deleteOutcome);

export default router;
