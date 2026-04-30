import { Request, Response, NextFunction } from 'express';
import { StudentProfile } from '../models/StudentProfile.model';

export const studentProfileController = {
  /** GET /api/v1/profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user._id;
      let profile = await StudentProfile.findOne({ userId })
        .populate('savedUniversities')
        .populate({
          path: 'savedPrograms',
          populate: { path: 'university' }
        });

      if (!profile) {
        profile = await StudentProfile.create({ userId });
      }

      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  },

  /** PUT /api/v1/profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user._id;
      const updates = req.body;

      // Don't allow changing the userId
      delete updates.userId;

      const profile = await StudentProfile.findOneAndUpdate(
        { userId },
        { $set: updates },
        { new: true, upsert: true }
      );

      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  },

  async saveUniversity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { universityId } = req.body;
      const profile = await StudentProfile.findOneAndUpdate(
        { userId: (req as any).user._id },
        { $addToSet: { savedUniversities: universityId } },
        { new: true, upsert: true }
      );
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  },

  async unsaveUniversity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { universityId } = req.body;
      const profile = await StudentProfile.findOneAndUpdate(
        { userId: (req as any).user._id },
        { $pull: { savedUniversities: universityId } },
        { new: true }
      );
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  },

  async saveProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { programId } = req.body;
      const profile = await StudentProfile.findOneAndUpdate(
        { userId: (req as any).user._id },
        { $addToSet: { savedPrograms: programId } },
        { new: true, upsert: true }
      );
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  },

  async unsaveProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { programId } = req.body;
      const profile = await StudentProfile.findOneAndUpdate(
        { userId: (req as any).user._id },
        { $pull: { savedPrograms: programId } },
        { new: true }
      );
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }
};
