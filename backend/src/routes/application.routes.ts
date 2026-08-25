import { Router } from 'express';
import { applicationController } from '../controllers/application.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createApplicationSchema,
  updateApplicationSchema,
  updateStageSchema,
  createSnapshotSchema,
  updateTasksSchema,
  communicationSchema,
  assignReviewerSchema,
} from '../validators/application.validator';

const router = Router();

router.use(protect);

router.get('/', applicationController.getApplications);
router.post(
  '/',
  validateRequest({ body: createApplicationSchema }),
  applicationController.createApplication
);

router.get('/:id', applicationController.getApplication);
router.patch(
  '/:id',
  validateRequest({ body: updateApplicationSchema }),
  applicationController.updateApplication
);

router.patch(
  '/:id/stage',
  validateRequest({ body: updateStageSchema }),
  applicationController.updateStage
);

router.post(
  '/:id/snapshot',
  validateRequest({ body: createSnapshotSchema }),
  applicationController.createSnapshot
);

router.get('/:id/versions', applicationController.getVersions);

router.patch(
  '/:id/tasks',
  validateRequest({ body: updateTasksSchema }),
  applicationController.updateTasks
);

router.post(
  '/:id/communications',
  validateRequest({ body: communicationSchema }),
  applicationController.addCommunication
);

router.patch(
  '/:id/assign-reviewer',
  adminOnly,
  validateRequest({ body: assignReviewerSchema }),
  applicationController.assignReviewer
);

router.delete('/:id', applicationController.deleteApplication);

export default router;
