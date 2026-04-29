import { Request, Response, NextFunction } from 'express';
import { seedImportService, SeedPreviewRow } from '../services/seedImport.service';

export const importsController = {
  /** POST /api/v1/admin/imports/seed-universities
   *  Accepts a CSV file, validates it, returns a preview (no DB writes yet)
   */
  async uploadSeedCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }
      const preview = await seedImportService.preview(req.file.buffer, req.file.originalname);
      res.status(200).json({ success: true, data: preview });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/v1/admin/imports/:id/confirm
   *  Confirms a previewed import — applies writes to the database
   */
  async confirmImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const job = await seedImportService.confirm(id, (req as any).user?.username);
      res.status(200).json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/v1/admin/imports
   *  List all seed import jobs
   */
  async listImports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobs = await seedImportService.getImports();
      res.status(200).json({ success: true, data: jobs });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/v1/admin/imports/:id
   *  Get a single import job by ID
   */
  async getImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await seedImportService.getImportById(req.params.id);
      if (!job) {
        res.status(404).json({ success: false, message: 'Import not found' });
        return;
      }
      res.status(200).json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  },
};
