import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ComparisonSession } from '../models/ComparisonSession.model';
import { StudentProfile } from '../models/StudentProfile.model';
import { Program } from '../models/Program.model';
import { fitScoreService } from '../services/fitScore.service';

export const comparisonController = {
  /** POST /api/v1/comparison/create
   *  Creates a new comparison session and returns a hash
   */
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?._id;
      const crypto = await import('crypto');
      const hash = crypto.randomBytes(16).toString('hex');
      
      const session = await ComparisonSession.create({
        userId: userId || undefined,
        sessionKey: hash,
        selectedUniversityIds: [],
        selectedProgramIds: [],
      });

      res.status(201).json({ success: true, data: { hash, session } });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/v1/comparison/:hash
   *  Gets a comparison session by hash
   */
  async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hash } = req.params;
      const session = await ComparisonSession.findOne({ sessionKey: hash })
        .populate({
          path: 'selectedProgramIds',
          populate: { path: 'university', select: 'name slug state' }
        });
      
      if (!session) {
        res.status(404).json({ success: false, message: 'Session not found' });
        return;
      }
      
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  },

  /** PUT /api/v1/comparison/:hash
   *  Updates a comparison session by hash
   */
  async updateSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hash } = req.params;
      const updateData = req.body;
      const session = await ComparisonSession.findOneAndUpdate(
        { sessionKey: hash },
        { $set: updateData },
        { new: true }
      ).populate({
        path: 'selectedProgramIds',
        populate: { path: 'university', select: 'name slug state' }
      });
      
      if (!session) {
        res.status(404).json({ success: false, message: 'Session not found' });
        return;
      }
      
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/v1/comparison/:hash/add-program
   */
  async addProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hash } = req.params;
      const { programId } = req.body;

      const session = await ComparisonSession.findOneAndUpdate(
        { sessionKey: hash },
        { $addToSet: { selectedProgramIds: new Types.ObjectId(programId) } },
        { new: true }
      ).populate({
        path: 'selectedProgramIds',
        populate: { path: 'university', select: 'name slug state' }
      });

      if (!session) {
        res.status(404).json({ success: false, message: 'Session not found' });
        return;
      }

      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  },

  /** DELETE /api/v1/comparison/:hash/remove-program
   */
  async removeProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hash } = req.params;
      const { programId } = req.body;

      const session = await ComparisonSession.findOneAndUpdate(
        { sessionKey: hash },
        { $pull: { selectedProgramIds: new Types.ObjectId(programId) } },
        { new: true }
      ).populate({
        path: 'selectedProgramIds',
        populate: { path: 'university', select: 'name slug state' }
      });

      if (!session) {
        res.status(404).json({ success: false, message: 'Session not found' });
        return;
      }

      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/v1/comparison/:hash/scores
   *  Calculates fit scores for the programs currently in the session
   */
  async getScores(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hash } = req.params;

      const session = await ComparisonSession.findOne({ sessionKey: hash });
      if (!session || !session.selectedProgramIds.length) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      // Fetch the programs with university details
      const programs = await Program.find({ _id: { $in: session.selectedProgramIds } })
        .populate('university')
        .lean();

      // Fetch or mock student profile
      let profile = {};
      const userId = (req as any).user?._id;
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
