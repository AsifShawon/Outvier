import { Router } from 'express';
import { comparisonController } from '../controllers/comparison.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// We use optionalAuth so both logged-in users and anonymous users (with x-session-key) can use this
router.use(optionalAuth);

router.get('/session', comparisonController.getSession);
router.post('/add-program', comparisonController.addProgram);
router.post('/remove-program', comparisonController.removeProgram);
router.get('/scores', comparisonController.getScores);

export default router;
