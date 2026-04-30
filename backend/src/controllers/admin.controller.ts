import { Request, Response, NextFunction } from 'express';
import { universityService } from '../services/university.service';
import { programService } from '../services/program.service';
import { University } from '../models/University.model';
import { Program } from '../models/Program.model';
import { User } from '../models/User.model';
import { RankingRecord } from '../models/RankingRecord.model';
import { Scholarship } from '../models/Scholarship.model';
import { OutcomeMetric } from '../models/OutcomeMetric.model';

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

  // Users list
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await User.find().select('-passwordHash');
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  },

  // Rankings CRUD
  async getRankings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rankings = await RankingRecord.find().populate('universityId', 'name slug').sort({ year: -1 });
      res.json({ success: true, data: rankings });
    } catch (error) { next(error); }
  },
  async createRanking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ranking = await RankingRecord.create(req.body);
      res.status(201).json({ success: true, data: ranking });
    } catch (error) { next(error); }
  },
  async deleteRanking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await RankingRecord.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Ranking deleted' });
    } catch (error) { next(error); }
  },

  // Scholarships CRUD
  async getScholarships(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scholarships = await Scholarship.find().populate('universityId', 'name slug').sort({ createdAt: -1 });
      res.json({ success: true, data: scholarships });
    } catch (error) { next(error); }
  },
  async createScholarship(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scholarship = await Scholarship.create(req.body);
      res.status(201).json({ success: true, data: scholarship });
    } catch (error) { next(error); }
  },
  async deleteScholarship(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await Scholarship.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Scholarship deleted' });
    } catch (error) { next(error); }
  },

  // Outcomes CRUD
  async getOutcomes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const outcomes = await OutcomeMetric.find().populate('universityId', 'name slug').sort({ year: -1 });
      res.json({ success: true, data: outcomes });
    } catch (error) { next(error); }
  },
  async createOutcome(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const outcome = await OutcomeMetric.create(req.body);
      res.status(201).json({ success: true, data: outcome });
    } catch (error) { next(error); }
  },
  async deleteOutcome(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await OutcomeMetric.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Outcome deleted' });
    } catch (error) { next(error); }
  },
};
