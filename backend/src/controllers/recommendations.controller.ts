import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { StudentProfile } from '../models/StudentProfile.model';
import { Program } from '../models/Program.model';
import { fitScoreService } from '../services/fitScore.service';

export const recommendationsController = {
  /** GET /api/v1/recommendations/me
   *  Returns top program recommendations for the authenticated student.
   */
  async getMyRecommendations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const profile = userId
        ? await StudentProfile.findOne({ userId })
        : null;

      const programs = await Program.find({ status: 'active' })
        .populate('university', 'name slug state city ranking logo logoUrl')
        .limit(200)
        .lean();

      const scores = await fitScoreService.calculateScores(profile || {}, programs);
      const top = scores.slice(0, 10);

      res.status(200).json({ success: true, data: top, profileFound: !!profile });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/v1/recommendations/profile
   *  Returns recommendations for an arbitrary profile payload (no auth required, for preview).
   */
  async getRecommendationsForProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = req.body || {};

      const programs = await Program.find({ status: 'active' })
        .populate('university', 'name slug state city ranking logo logoUrl')
        .limit(200)
        .lean();

      const scores = await fitScoreService.calculateScores(profile, programs);
      const top = scores.slice(0, 10);

      res.status(200).json({ success: true, data: top });
    } catch (error) {
      next(error);
    }
  },
};
