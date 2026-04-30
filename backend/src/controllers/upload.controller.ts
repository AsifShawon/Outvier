import { Request, Response, NextFunction } from 'express';
import { uploadService } from '../services/upload.service';

export const uploadController = {
  async uploadUniversities(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }
      const job = await uploadService.processUniversitiesCSV(req.file.buffer, req.file.originalname);
      res.json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  },

  async uploadPrograms(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }
      const job = await uploadService.processProgramsCSV(req.file.buffer, req.file.originalname);
      res.json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  },

  async getUploadHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const jobs = await uploadService.getUploadJobs();
      res.json({ success: true, data: jobs });
    } catch (error) {
      next(error);
    }
  }
};
