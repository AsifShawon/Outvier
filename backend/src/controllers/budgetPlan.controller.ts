import { Request, Response, NextFunction } from 'express';
import { BudgetPlan } from '../models/BudgetPlan.model';

export const budgetPlanController = {
  async getMyPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await BudgetPlan.find({ userId: (req as any).user._id }).sort({ updatedAt: -1 });
      res.json({ success: true, data: plans });
    } catch (error) {
      next(error);
    }
  },

  async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await BudgetPlan.create({
        ...req.body,
        userId: (req as any).user._id,
      });
      res.status(201).json({ success: true, data: plan });
    } catch (error) {
      next(error);
    }
  },

  async updatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const plan = await BudgetPlan.findOneAndUpdate(
        { _id: id, userId: (req as any).user._id },
        req.body,
        { new: true }
      );
      if (!plan) {
        res.status(404).json({ success: false, message: 'Plan not found' });
        return;
      }
      res.json({ success: true, data: plan });
    } catch (error) {
      next(error);
    }
  },

  async deletePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const plan = await BudgetPlan.findOneAndDelete({ _id: id, userId: (req as any).user._id });
      if (!plan) {
        res.status(404).json({ success: false, message: 'Plan not found' });
        return;
      }
      res.json({ success: true, message: 'Plan deleted' });
    } catch (error) {
      next(error);
    }
  }
};
