import { Router } from 'express';
import { stagedChangesController } from '../controllers/stagedChanges.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  listStagedChangesQuerySchema,
  bulkApproveRejectSchema,
  rejectStagedChangeSchema,
  editAndApproveSchema,
} from '../validators/stagedChanges.validator';

const router = Router();

router.use(protect, adminOnly);

router.get('/', validateRequest({ query: listStagedChangesQuerySchema }), stagedChangesController.list);
router.post('/bulk-approve', validateRequest({ body: bulkApproveRejectSchema }), stagedChangesController.bulkApprove);
router.post('/bulk-reject', validateRequest({ body: bulkApproveRejectSchema }), stagedChangesController.bulkReject);
router.post('/bulk-approve-cricos', stagedChangesController.bulkApproveCricos);
router.post('/:id/approve', stagedChangesController.approve);
router.post('/:id/reject', validateRequest({ body: rejectStagedChangeSchema }), stagedChangesController.reject);
router.post('/:id/edit-approve', validateRequest({ body: editAndApproveSchema }), stagedChangesController.editAndApprove);

export default router;
