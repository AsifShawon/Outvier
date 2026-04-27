import { Router } from 'express';
import { syncController } from '../controllers/sync.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';

const router = Router();

router.use(protect, adminOnly);

/** POST /api/v1/admin/sync/university/all */
router.post('/university/all', syncController.triggerAllUniversitySync);

/** POST /api/v1/admin/sync/university/:id */
router.post('/university/:id', syncController.triggerUniversitySync);

/** GET /api/v1/admin/sync/jobs */
router.get('/jobs', syncController.listJobs);

export default router;
