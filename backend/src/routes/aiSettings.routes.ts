import { Router } from 'express';
import { aiSettingsController } from '../controllers/aiSettings.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';

const router = Router();

router.use(protect, adminOnly);

router.get('/', aiSettingsController.getSettings);
router.post('/', aiSettingsController.upsertSetting);
router.post('/test', aiSettingsController.testConnection);
router.post('/activate', aiSettingsController.activateProvider);

export default router;
