import { Request, Response, NextFunction } from 'express';
import { StudentProfile } from '../models/StudentProfile.model';
import { fitScoreService } from '../services/fitScore.service';
import { sendSuccess } from '../utils/response.util';
import { UpdateStudentProfileDTO } from '../validators/studentProfile.validator';

export const studentProfileController = {
  /** GET /api/v1/profile */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      let profile = await StudentProfile.findOne({ userId })
        .populate('savedUniversities')
        .populate({
          path: 'savedPrograms',
          populate: { path: 'university' },
        });

      if (!profile) {
        profile = await StudentProfile.create({ userId });
      }

      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  },

  /** PUT /api/v1/profile */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const updates: UpdateStudentProfileDTO = req.body;

      // If priorityPreset is set, automatically compute priorityWeights if not explicitly provided
      if (updates.priorityPreset && !updates.priorityWeights) {
        updates.priorityWeights = fitScoreService.getWeightsFromPreset(updates.priorityPreset);
      }

      const profile = await StudentProfile.findOneAndUpdate(
        { userId },
        { $set: updates },
        { new: true, upsert: true, runValidators: true }
      );

      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  },

  async saveUniversity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { universityId } = req.body;
      const profile = await StudentProfile.findOneAndUpdate(
        { userId: (req as any).user.id },
        { $addToSet: { savedUniversities: universityId } },
        { new: true, upsert: true, runValidators: true }
      );

      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  },

  async unsaveUniversity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { universityId } = req.params;
      const profile = await StudentProfile.findOneAndUpdate(
        { userId: (req as any).user.id },
        { $pull: { savedUniversities: universityId } },
        { new: true }
      );

      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  },

  async saveProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { programId } = req.body;
      const profile = await StudentProfile.findOneAndUpdate(
        { userId: (req as any).user.id },
        { $addToSet: { savedPrograms: programId } },
        { new: true, upsert: true, runValidators: true }
      );

      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  },

  async unsaveProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { programId } = req.params;
      const profile = await StudentProfile.findOneAndUpdate(
        { userId: (req as any).user.id },
        { $pull: { savedPrograms: programId } },
        { new: true }
      );

      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  },

  async calculateFit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { programId } = req.params;

      const profile = await StudentProfile.findOne({ userId });
      if (!profile) {
        throw Object.assign(new Error('Profile not found'), { statusCode: 404 });
      }

      const { Program } = await import('../models/Program.model');
      const program = await Program.findById(programId);
      if (!program) {
        throw Object.assign(new Error('Program not found'), { statusCode: 404 });
      }

      const results = await fitScoreService.calculateScores(profile, [program]);
      sendSuccess(res, results[0] || null);
    } catch (error) {
      next(error);
    }
  },
};
