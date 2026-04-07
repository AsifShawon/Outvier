import { Request, Response, NextFunction } from 'express';
import { universityService } from '../services/university.service';

export const universityController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, state, type } = req.query;
      const result = await universityService.getAll({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 12,
        search: search as string,
        state: state as string,
        type: type as string,
      });
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const university = await universityService.getBySlug(req.params.slug);
      res.status(200).json({ success: true, data: university });
    } catch (error) {
      next(error);
    }
  },

  async getStates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const states = await universityService.getStates();
      res.status(200).json({ success: true, data: states });
    } catch (error) {
      next(error);
    }
  },
};
