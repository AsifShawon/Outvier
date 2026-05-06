import { Router } from 'express';
import { budgetPlanController } from '../controllers/budgetPlan.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', budgetPlanController.getMyPlans);
router.post('/', budgetPlanController.createPlan);
router.patch('/:id', budgetPlanController.updatePlan);
router.delete('/:id', budgetPlanController.deletePlan);

export default router;
