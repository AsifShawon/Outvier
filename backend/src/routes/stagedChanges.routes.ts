import { Router } from 'express';
import { stagedChangesController } from '../controllers/stagedChanges.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';

const router = Router();

router.use(protect, adminOnly);

/** GET /api/v1/admin/staged-changes */
router.get('/', stagedChangesController.list);

/** POST /api/v1/admin/staged-changes/:id/approve */
router.post('/:id/approve', stagedChangesController.approve);

/** POST /api/v1/admin/staged-changes/:id/reject */
router.post('/:id/reject', stagedChangesController.reject);

/** POST /api/v1/admin/staged-changes/:id/edit-approve */
router.post('/:id/edit-approve', stagedChangesController.editAndApprove);

export default router;
