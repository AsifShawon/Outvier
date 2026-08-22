import { Router } from 'express';
import { budgetPlanController } from '../controllers/budgetPlan.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createBudgetPlanSchema, updateBudgetPlanSchema } from '../validators/budgetPlan.validator';

const router = Router();

router.use(protect);

router.get('/', budgetPlanController.getMyPlans);
router.post('/', validateRequest({ body: createBudgetPlanSchema }), budgetPlanController.createPlan);
router.put('/:id', validateRequest({ body: updateBudgetPlanSchema }), budgetPlanController.updatePlan);
router.delete('/:id', budgetPlanController.deletePlan);

export default router;
