import { Request, Response, NextFunction } from 'express';
import { StudentProfile } from '../models/StudentProfile.model';

export const studentProfileController = {
  /** GET /api/v1/profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user._id;
      let profile = await StudentProfile.findOne({ userId });

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
  }
};
