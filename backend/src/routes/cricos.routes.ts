import { Router } from 'express';
import { cricosController } from '../controllers/cricos.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';

const router = Router();

// All routes protected by admin
router.use(protect, adminOnly);

router.get('/resources', cricosController.getResources);
router.post('/inspect-fields', cricosController.inspectFields);
router.post('/preview-provider', cricosController.previewProvider);
router.post('/sync-provider', cricosController.syncProvider);
router.post('/sync-university/:universityId', cricosController.syncUniversity);
router.get('/sync-runs', cricosController.getSyncRuns);
router.get('/sync-runs/:id', cricosController.getSyncRunDetail);

router.get('/raw/institutions', cricosController.getRawInstitutions);
router.get('/raw/courses', cricosController.getRawCourses);
router.get('/raw/locations', cricosController.getRawLocations);
router.get('/raw/course-locations', cricosController.getRawCourseLocations);

export default router;
