import { Router } from 'express';
import { comparisonController } from '../controllers/comparison.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// We use optionalAuth so both logged-in users and anonymous users can use this
router.use(optionalAuth);

router.post('/create', comparisonController.createSession);
router.get('/:hash', comparisonController.getSession);
router.put('/:hash', comparisonController.updateSession);
router.post('/:hash/add-program', comparisonController.addProgram);
router.delete('/:hash/remove-program', comparisonController.removeProgram);
router.post('/:hash/add-university', comparisonController.addUniversity);
router.delete('/:hash/remove-university', comparisonController.removeUniversity);
router.get('/:hash/scores', comparisonController.getScores);

export default router;
