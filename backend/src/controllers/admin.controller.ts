import { Request, Response, NextFunction } from 'express';
import { universityService } from '../services/university.service';
import { programService } from '../services/program.service';
import { uploadService } from '../services/upload.service';
import { University } from '../models/University.model';
import { Program } from '../models/Program.model';
import { User } from '../models/User.model';

export const adminController = {
  // Dashboard stats
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [totalUniversities, totalPrograms, totalUsers] = await Promise.all([
        University.countDocuments(),
        Program.countDocuments(),
        User.countDocuments(),
      ]);
      const programsByLevel = await Program.aggregate([
        { $group: { _id: '$level', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      const universitiesByState = await University.aggregate([
        { $group: { _id: '$state', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      res.status(200).json({
        success: true,
        data: { totalUniversities, totalPrograms, totalUsers, programsByLevel, universitiesByState },
      });
    } catch (error) {
      next(error);
    }
  },

  // University CRUD
  async createUniversity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const university = await universityService.create(req.body);
      res.status(201).json({ success: true, data: university });
    } catch (error) {
      next(error);
    }
  },

  async updateUniversity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const university = await universityService.update(req.params.id, req.body);
      res.status(200).json({ success: true, data: university });
    } catch (error) {
      next(error);
    }
  },

  async deleteUniversity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await universityService.delete(req.params.id);
      res.status(200).json({ success: true, message: 'University deleted' });
    } catch (error) {
      next(error);
    }
  },

  // Program CRUD
  async createProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const program = await programService.create(req.body);
      res.status(201).json({ success: true, data: program });
    } catch (error) {
      next(error);
    }
  },

  async updateProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const program = await programService.update(req.params.id, req.body);
      res.status(200).json({ success: true, data: program });
    } catch (error) {
      next(error);
    }
  },

  async deleteProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await programService.delete(req.params.id);
      res.status(200).json({ success: true, message: 'Program deleted' });
    } catch (error) {
      next(error);
    }
  },

  // Bulk upload
  async uploadUniversitiesCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }
      const job = await uploadService.processUniversitiesCSV(req.file.buffer, req.file.originalname);
      res.status(200).json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  },

  async uploadProgramsCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }
      const job = await uploadService.processProgramsCSV(req.file.buffer, req.file.originalname);
      res.status(200).json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  },

  async getUploadHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobs = await uploadService.getUploadJobs();
      res.status(200).json({ success: true, data: jobs });
    } catch (error) {
      next(error);
    }
  },

  // Users list
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await User.find().select('-password');
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  },
};
