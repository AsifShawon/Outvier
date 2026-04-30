import { Router } from 'express';
import { importsController } from '../controllers/imports.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';
import { upload } from '../services/upload.service';

const router = Router();

// All imports routes are admin-only
router.use(protect, adminOnly);

/** GET /api/v1/admin/imports — list import history */
router.get('/', importsController.listImports);

/** POST /api/v1/admin/imports/seed-universities — upload CSV → get preview */
router.post('/seed-universities', upload.single('file'), importsController.uploadSeedCSV);

/** GET /api/v1/admin/imports/:id — get a specific import */
router.get('/:id', importsController.getImport);

/** POST /api/v1/admin/imports/:id/confirm — confirm and apply a previewed import */
router.post('/:id/confirm', importsController.confirmImport);

/** POST /api/v1/admin/imports/:id/cancel — cancel a previewed import */
router.post('/:id/cancel', importsController.cancelImport);

export default router;
