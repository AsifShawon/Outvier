/**
 * ingestion.routes.ts
 * All AI-assisted ingestion endpoints for admin use.
 */
import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.middleware';
import { ingestionController } from '../controllers/ingestion.controller';

const router = Router();

// All ingestion routes are admin-only
router.use(protect, adminOnly);

// University-level discovery
router.post('/universities/:id/discover-programs', ingestionController.discoverPrograms);
router.post('/universities/:id/refresh-programs', ingestionController.refreshPrograms);
router.get('/universities/:id/discovered-programs', ingestionController.getDiscoveredPrograms);

// Ingestion job management
router.get('/ingestion-jobs', ingestionController.listIngestionJobs);
router.get('/ingestion-jobs/:jobId', ingestionController.getIngestionJob);
router.get('/ingestion-jobs/:jobId/logs', ingestionController.getIngestionJobLogs);
router.post('/ingestion-jobs/:jobId/retry', ingestionController.retryIngestionJob);
router.post('/ingestion-jobs/:jobId/cancel', ingestionController.cancelIngestionJob);

// Program evidence and field refresh
router.get('/programs/:id/source-evidence', ingestionController.getProgramSourceEvidence);
router.patch('/programs/:id/refresh-field', ingestionController.refreshProgramField);

export default router;
