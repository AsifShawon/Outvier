import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(optionalAuth);

router.post('/chat', aiController.chat);

export default router;
