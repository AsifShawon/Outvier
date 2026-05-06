import { Request, Response, NextFunction } from 'express';
import { programService } from '../services/program.service';

export const programController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, level, field, campusMode, city, sortBy, sortOrder } = req.query;
      const result = await programService.getAll({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 12,
        search: search as string,
        level: level as string,
        field: field as string,
        campusMode: campusMode as string,
        city: city as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as ('asc' | 'desc'),
      });
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async getCities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cities = await programService.getCities();
      res.status(200).json({ success: true, data: cities });
    } catch (error) {
      next(error);
    }
  },

  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const program = await programService.getBySlug(req.params.slug);
      res.status(200).json({ success: true, data: program });
    } catch (error) {
      next(error);
    }
  },

  async getByUniversity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = req.query;
      const result = await programService.getByUniversity(req.params.slug, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async getFields(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fields = await programService.getFields();
      res.status(200).json({ success: true, data: fields });
    } catch (error) {
      next(error);
    }
  },
};
