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
      const { 
        programId, 
        universityId, 
        customProgramName, 
        customUniversityName, 
        status, 
        priority,
        intake,
        deadline,
        notes 
      } = req.body;
      
      let finalUniversityId = universityId;
      
      if (programId) {
        const program = await Program.findById(programId);
        if (program) {
          finalUniversityId = program.university;
        }
      }

      const application = await ApplicationTracker.create({
        userId: (req as any).user._id,
        programId,
        universityId: finalUniversityId,
        customProgramName,
        customUniversityName,
        status: status || 'researching',
        priority: priority || 'medium',
        intake,
        deadline,
        notes,
        documentChecklist: [
          { name: 'Passport', key: 'passport', status: 'pending' },
          { name: 'Academic Transcript', key: 'transcript', status: 'pending' },
          { name: 'CV / Resume', key: 'cv', status: 'pending' },
          { name: 'Statement of Purpose', key: 'sop', status: 'pending' },
          { name: 'English Proficiency Test', key: 'english_test', status: 'pending' },
        ],
        history: [{
          status: status || 'researching',
          note: 'Application created',
          updatedAt: new Date()
        }]
      });

      res.status(201).json({ success: true, data: application });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, notes, deadline, priority, intake, tasks, documentChecklist } = req.body;

      const application = await ApplicationTracker.findOne({ _id: id, userId: (req as any).user._id });

      if (!application) {
        res.status(404).json({ success: false, message: 'Application not found' });
        return;
      }

      const oldStatus = application.status;
      
      if (status) application.status = status;
      if (notes) application.notes = notes;
      if (deadline) application.deadline = deadline;
      if (priority) application.priority = priority;
      if (intake) application.intake = intake;
      if (tasks) application.tasks = tasks;
      if (documentChecklist) application.documentChecklist = documentChecklist;

      if (status && status !== oldStatus) {
        application.history.push({
          status,
          note: `Status changed from ${oldStatus} to ${status}`,
          updatedAt: new Date()
        });
      }

      await application.save();
      res.json({ success: true, data: application });
    } catch (error) {
      next(error);
    }
  },

  async updateDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { key, status, fileUrl } = req.body;

      const application = await ApplicationTracker.findOne({ _id: id, userId: (req as any).user._id });
      if (!application) {
        res.status(404).json({ success: false, message: 'Application not found' });
        return;
      }

      const docIndex = application.documentChecklist.findIndex(d => d.key === key);
      if (docIndex > -1) {
        application.documentChecklist[docIndex].status = status;
        if (fileUrl) application.documentChecklist[docIndex].fileUrl = fileUrl;
        application.documentChecklist[docIndex].updatedAt = new Date();
      } else {
        application.documentChecklist.push({
          name: key.replace(/_/g, ' '),
          key,
          status,
          fileUrl,
          updatedAt: new Date()
        });
      }

      await application.save();
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
