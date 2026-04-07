import { Router } from 'express';
import { universityController } from '../controllers/university.controller';
import { programController } from '../controllers/program.controller';

const router = Router();

router.get('/', universityController.getAll);
router.get('/states', universityController.getStates);
router.get('/:slug', universityController.getBySlug);
router.get('/:slug/programs', programController.getByUniversity);

export default router;
