import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ComparisonSession } from '../models/ComparisonSession.model';
import { StudentProfile } from '../models/StudentProfile.model';
import { Program } from '../models/Program.model';
import { fitScoreService } from '../services/fitScore.service';

export const comparisonController = {
  /** GET /api/v1/comparison/session
   *  Gets or creates a comparison session for the user/anonymous key
   */
  async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?._id;
      const sessionKey = req.headers['x-session-key'] as string;

      if (!userId && !sessionKey) {
        res.status(400).json({ success: false, message: 'Must provide Auth or x-session-key' });
        return;
      }

      let session;
      if (userId) {
        session = await ComparisonSession.findOne({ userId }).populate('selectedProgramIds');
      } else {
        session = await ComparisonSession.findOne({ sessionKey }).populate('selectedProgramIds');
      }

      if (!session) {
        session = await ComparisonSession.create({
          userId: userId || undefined,
          sessionKey: userId ? undefined : sessionKey,
          selectedUniversityIds: [],
          selectedProgramIds: [],
        });
      }

      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/v1/comparison/add-program
   */
  async addProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { programId } = req.body;
      const userId = (req as any).user?._id;
      const sessionKey = req.headers['x-session-key'] as string;

      const filter = userId ? { userId } : { sessionKey };
      const session = await ComparisonSession.findOneAndUpdate(
        filter,
        { $addToSet: { selectedProgramIds: new Types.ObjectId(programId) } },
        { new: true, upsert: true }
      ).populate('selectedProgramIds');

      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/v1/comparison/remove-program
   */
  async removeProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { programId } = req.body;
      const userId = (req as any).user?._id;
      const sessionKey = req.headers['x-session-key'] as string;

      const filter = userId ? { userId } : { sessionKey };
      const session = await ComparisonSession.findOneAndUpdate(
        filter,
        { $pull: { selectedProgramIds: new Types.ObjectId(programId) } },
        { new: true }
      ).populate('selectedProgramIds');

      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/v1/comparison/scores
   *  Calculates fit scores for the programs currently in the session
   */
  async getScores(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?._id;
      const sessionKey = req.headers['x-session-key'] as string;
      const filter = userId ? { userId } : { sessionKey };

      const session = await ComparisonSession.findOne(filter);
      if (!session || !session.selectedProgramIds.length) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      // Fetch the programs with university details
      const programs = await Program.find({ _id: { $in: session.selectedProgramIds } })
        .populate('universityId')
        .lean();

      // Fetch or mock student profile
      let profile = {};
      if (userId) {
        const p = await StudentProfile.findOne({ userId }).lean();
        if (p) profile = p;
      }

      const scores = await fitScoreService.calculateScores(profile, programs);

      // Save scores to session cache
      session.generatedScores = scores.reduce((acc: any, s) => {
        acc[s.programId] = s;
        return acc;
      }, {});
      await session.save();

      res.status(200).json({ success: true, data: scores });
    } catch (error) {
      next(error);
    }
  }
};
