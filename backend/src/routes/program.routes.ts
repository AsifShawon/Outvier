import { Router } from 'express';
import { programController } from '../controllers/program.controller';

const router = Router();

router.get('/', programController.getAll);
router.get('/fields', programController.getFields);
router.get('/cities', programController.getCities);
router.get('/:slug', programController.getBySlug);

export default router;
