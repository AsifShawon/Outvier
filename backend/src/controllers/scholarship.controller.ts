import { Request, Response, NextFunction } from 'express';
import { scholarshipService } from '../services/scholarship.service';

export const scholarshipController = {
  // Public listing
  async getAllPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, category, university, featured, sortBy, sortOrder } = req.query;
      const result = await scholarshipService.getAll({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 12,
        search: search as string,
        category: category as string,
        university: university as string,
        featured: featured === 'true',
        sortBy: sortBy as string,
        sortOrder: sortOrder as ('asc' | 'desc'),
        isAdmin: false,
      });
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  // Public detail
  async getBySlugPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await scholarshipService.getBySlug(req.params.slug, false);
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  // Admin listing
  async getAllAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, category, university, status, visibility, featured, archived, expired, sortBy, sortOrder } = req.query;
      const result = await scholarshipService.getAll({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        search: search as string,
        category: category as string,
        university: university as string,
        status: status as string,
        visibility: visibility as string,
        featured: featured === 'true',
        archived: archived === 'true' ? true : archived === 'false' ? false : undefined,
        expired: expired === 'true',
        sortBy: sortBy as string,
        sortOrder: sortOrder as ('asc' | 'desc'),
        isAdmin: true,
      });
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  // Admin get single
  async getByIdAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await scholarshipService.getById(req.params.id);
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  // Admin create
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user?.id?.toString() || 'admin';
      const item = await scholarshipService.create(req.body, adminId);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  // Admin update
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user?.id?.toString() || 'admin';
      const item = await scholarshipService.update(req.params.id, req.body, adminId);
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  // Admin archive
  async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user?.id?.toString() || 'admin';
      const { reason } = req.body;
      const item = await scholarshipService.archive(req.params.id, adminId, reason);
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  // Admin restore
  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user?.id?.toString() || 'admin';
      const item = await scholarshipService.restore(req.params.id, adminId);
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  // Admin publish/unpublish
  async changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user?.id?.toString() || 'admin';
      const { status } = req.body;
      const item = await scholarshipService.changeStatus(req.params.id, status, adminId);
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  // Admin feature
  async feature(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user?.id?.toString() || 'admin';
      const { featured } = req.body;
      const item = await scholarshipService.feature(req.params.id, featured, adminId);
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }
};
