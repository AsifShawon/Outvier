import { Router } from 'express';
import { scholarshipController } from '../controllers/scholarship.controller';

const router = Router();

router.get('/', scholarshipController.getAllPublic);
router.get('/:slug', scholarshipController.getBySlugPublic);

export default router;
