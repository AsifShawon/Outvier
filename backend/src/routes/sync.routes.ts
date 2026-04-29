import { Router } from 'express';
import { syncController } from '../controllers/sync.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';

const router = Router();

router.use(protect, adminOnly);

/** POST /api/v1/admin/sync/university/all */
router.post('/university/all', syncController.triggerAllUniversitySync);

/** POST /api/v1/admin/sync/university/:id */
router.post('/university/:id', syncController.triggerUniversitySync);

/** POST /api/v1/admin/sync/program/:id */
router.post('/program/:id', syncController.triggerProgramSync);

/** POST /api/v1/admin/sync/all */
router.post('/all', syncController.triggerAllSync);

/** GET /api/v1/admin/sync-jobs (Wait, phase 5 says GET /api/v1/admin/sync-jobs and POST /api/v1/admin/sync-jobs/:id/retry) */
router.get('/jobs', syncController.listJobs);
router.post('/jobs/:id/retry', syncController.retryJob);

/** Data Sources */
router.get('/data-sources', syncController.listDataSources);
router.post('/data-sources', syncController.createDataSource);
router.patch('/data-sources/:id', syncController.updateDataSource);
router.delete('/data-sources/:id', syncController.deleteDataSource);

export default router;
