import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { loginSchema } from '../validators/auth.validator';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.get('/me', protect, authController.getMe);

export default router;
