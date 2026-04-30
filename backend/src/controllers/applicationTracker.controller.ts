import { Request, Response, NextFunction } from 'express';
import { ApplicationTracker } from '../models/ApplicationTracker.model';
import { Program } from '../models/Program.model';

export const applicationTrackerController = {
  async getMyApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const applications = await ApplicationTracker.find({ userId: (req as any).user._id })
        .populate({
          path: 'programId',
          select: 'name level field university universityName universitySlug logoUrl'
        })
        .populate({
          path: 'universityId',
          select: 'name slug logo'
        })
        .sort({ updatedAt: -1 });

      res.json({ success: true, data: applications });
    } catch (error) {
      next(error);
    }
  },

  async addApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const { programId, status, notes, deadline } = req.body;
      
      const program = await Program.findById(programId);
      if (!program) {
        res.status(404).json({ success: false, message: 'Program not found' });
        return;
      }

      const application = await ApplicationTracker.create({
        userId: (req as any).user._id,
        programId,
        universityId: program.university,
        status: status || 'researching',
        notes,
        deadline,
      });

      res.status(201).json({ success: true, data: application });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, notes, deadline } = req.body;

      const application = await ApplicationTracker.findOneAndUpdate(
        { _id: id, userId: (req as any).user._id },
        { status, notes, deadline },
        { new: true }
      );

      if (!application) {
        res.status(404).json({ success: false, message: 'Application not found' });
        return;
      }

      res.json({ success: true, data: application });
    } catch (error) {
      next(error);
    }
  },

  async removeApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const application = await ApplicationTracker.findOneAndDelete({
        _id: id,
        userId: (req as any).user._id,
      });

      if (!application) {
        res.status(404).json({ success: false, message: 'Application not found' });
        return;
      }

      res.json({ success: true, message: 'Application removed' });
    } catch (error) {
      next(error);
    }
  }
};
