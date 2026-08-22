import { Request, Response, NextFunction } from 'express';
import { BudgetPlan } from '../models/BudgetPlan.model';
import { sendSuccess, sendError } from '../utils/response.util';
import { CreateBudgetPlanDTO, UpdateBudgetPlanDTO } from '../validators/budgetPlan.validator';

export const budgetPlanController = {
  async getMyPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await BudgetPlan.find({ userId: (req as any).user.id }).sort({ updatedAt: -1 });
      sendSuccess(res, plans);
    } catch (error) {
      next(error);
    }
  },

  async createPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateBudgetPlanDTO = req.body;
      const plan = await BudgetPlan.create({
        ...data,
        userId: (req as any).user.id,
      });
      sendSuccess(res, plan, undefined, undefined, 201);
    } catch (error) {
      next(error);
    }
  },

  async updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateBudgetPlanDTO = req.body;

      const plan = await BudgetPlan.findOneAndUpdate(
        { _id: id, userId: (req as any).user.id },
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!plan) {
        sendError(res, 404, 'NOT_FOUND', 'Budget plan not found');
        return;
      }

      sendSuccess(res, plan);
    } catch (error) {
      next(error);
    }
  },

  async deletePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const plan = await BudgetPlan.findOneAndDelete({ _id: id, userId: (req as any).user.id });
      if (!plan) {
        sendError(res, 404, 'NOT_FOUND', 'Budget plan not found');
        return;
      }
      sendSuccess(res, { id, message: 'Plan deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
