import { Request, Response, NextFunction } from 'express';
import { cricosSyncService } from '../services/cricos/cricosSync.service';
import { cricosCkanService } from '../services/cricos/cricosCkan.service';
import { CRICOS_RESOURCES } from '../config/cricosResources';
import { CricosSyncRun } from '../models/CricosSyncRun.model';
import { CricosInstitutionRaw } from '../models/CricosInstitutionRaw.model';
import { CricosCourseRaw } from '../models/CricosCourseRaw.model';
import { CricosLocationRaw } from '../models/CricosLocationRaw.model';
import { CricosCourseLocationRaw } from '../models/CricosCourseLocationRaw.model';
import { University } from '../models/University.model';

export const cricosController = {
  async getResources(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({ success: true, data: CRICOS_RESOURCES });
    } catch (error) {
      next(error);
    }
  },

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { StagedChange } = await import('../models/StagedChange.model');
      const [
        totalInstitutions,
        totalCourses,
        totalLocations,
        totalCourseLocations,
        pendingChanges,
        lastRun,
        failedRuns,
      ] = await Promise.all([
        CricosInstitutionRaw.countDocuments(),
        CricosCourseRaw.countDocuments(),
        CricosLocationRaw.countDocuments(),
        CricosCourseLocationRaw.countDocuments(),
        StagedChange.countDocuments({
          status: 'pending',
          entityType: { $in: ['university', 'program', 'campus', 'programLocation'] },
        }),
        CricosSyncRun.findOne().sort({ createdAt: -1 }).lean(),
        CricosSyncRun.countDocuments({ status: 'failed' }),
      ]);
      res.status(200).json({
        success: true,
        data: {
          totalInstitutions,
          totalCourses,
          totalLocations,
          totalCourseLocations,
          pendingChanges,
          lastSync: lastRun
            ? { status: lastRun.status, startedAt: lastRun.startedAt, providerCode: lastRun.providerCode }
            : null,
          failedRuns,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async inspectFields(req: Request, res: Response, next: NextFunction) {
    try {
      const { resourceId } = req.body;
      const fields = await cricosCkanService.getResourceFields(resourceId);
      const sample = await cricosCkanService.datastoreSearch({ resource_id: resourceId, limit: 1 });
      res.status(200).json({ success: true, data: { fields, sample: sample.records[0] } });
    } catch (error) {
      next(error);
    }
  },

  async previewProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerCode } = req.body;
      const preview = await cricosSyncService.previewProviderSync(providerCode);
      res.status(200).json({ success: true, data: preview });
    } catch (error) {
      next(error);
    }
  },

  async syncProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerCode } = req.body;
      if (!providerCode) {
        return res.status(400).json({ success: false, message: 'providerCode is required' });
      }
      const triggeredBy = (req as any).user?.username || 'admin';
      const syncRunId = await cricosSyncService.syncProvider(providerCode, triggeredBy);
      res.status(202).json({ success: true, data: { syncRunId } });
    } catch (error) {
      next(error);
    }
  },

  async recheckProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerCode } = req.body;
      if (!providerCode) {
        return res.status(400).json({ success: false, message: 'providerCode is required' });
      }
      const triggeredBy = (req as any).user?.username || 'admin';
      const syncRunId = await cricosSyncService.recheckProvider(providerCode, triggeredBy);
      res.status(202).json({ success: true, data: { syncRunId } });
    } catch (error) {
      next(error);
    }
  },

  async syncAllInstitutions(req: Request, res: Response, next: NextFunction) {
    try {
      const triggeredBy = (req as any).user?.username || 'admin';
      const syncRunId = await cricosSyncService.syncAllInstitutions(triggeredBy);
      res.status(202).json({ success: true, data: { syncRunId } });
    } catch (error) {
      next(error);
    }
  },

  async syncUniversity(req: Request, res: Response, next: NextFunction) {
    try {
      const { universityId } = req.params;
      const university = await University.findById(universityId);
      if (!university || !university.cricosProviderCode) {
        return res.status(400).json({ success: false, message: "University not found or missing CRICOS Provider Code" });
      }
      const triggeredBy = (req as any).user?.username || 'admin';
      const syncRunId = await cricosSyncService.syncProvider(university.cricosProviderCode, triggeredBy);
      res.status(202).json({ success: true, data: { syncRunId } });
    } catch (error) {
      next(error);
    }
  },

  async getSyncRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const [runs, total] = await Promise.all([
        CricosSyncRun.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
        CricosSyncRun.countDocuments(),
      ]);
      res.status(200).json({ 
        success: true, 
        data: runs, 
        meta: { total, page: Number(page), limit: Number(limit) } 
      });
    } catch (error) {
      next(error);
    }
  },

  async getSyncRunDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const run = await CricosSyncRun.findById(req.params.id);
      if (!run) return res.status(404).json({ success: false, message: "Sync run not found" });
      res.status(200).json({ success: true, data: run });
    } catch (error) {
      next(error);
    }
  },

  async getRawInstitutions(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerCode, q, page = 1, limit = 20 } = req.query;
      const filter: any = {};
      if (providerCode) filter.cricosProviderCode = providerCode;
      if (q) filter.$text = { $search: String(q) };
      
      const skip = (Number(page) - 1) * Number(limit);
      const [data, total] = await Promise.all([
        CricosInstitutionRaw.find(filter).skip(skip).limit(Number(limit)),
        CricosInstitutionRaw.countDocuments(filter),
      ]);
      res.status(200).json({ success: true, data, meta: { total, page: Number(page), limit: Number(limit) } });
    } catch (error) {
      next(error);
    }
  },

  async getRawCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerCode, q, page = 1, limit = 20 } = req.query;
      const filter: any = {};
      if (providerCode) filter.cricosProviderCode = providerCode;
      if (q) filter.$text = { $search: String(q) };
      
      const skip = (Number(page) - 1) * Number(limit);
      const [data, total] = await Promise.all([
        CricosCourseRaw.find(filter).skip(skip).limit(Number(limit)),
        CricosCourseRaw.countDocuments(filter),
      ]);
      res.status(200).json({ success: true, data, meta: { total, page: Number(page), limit: Number(limit) } });
    } catch (error) {
      next(error);
    }
  },

  async getRawLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerCode, page = 1, limit = 20 } = req.query;
      const filter: any = {};
      if (providerCode) filter.cricosProviderCode = providerCode;
      
      const skip = (Number(page) - 1) * Number(limit);
      const [data, total] = await Promise.all([
        CricosLocationRaw.find(filter).skip(skip).limit(Number(limit)),
        CricosLocationRaw.countDocuments(filter),
      ]);
      res.status(200).json({ success: true, data, meta: { total, page: Number(page), limit: Number(limit) } });
    } catch (error) {
      next(error);
    }
  },

  async getRawCourseLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerCode, page = 1, limit = 20 } = req.query;
      const filter: any = {};
      if (providerCode) filter.cricosProviderCode = providerCode;
      
      const skip = (Number(page) - 1) * Number(limit);
      const [data, total] = await Promise.all([
        CricosCourseLocationRaw.find(filter).skip(skip).limit(Number(limit)),
        CricosCourseLocationRaw.countDocuments(filter),
      ]);
      res.status(200).json({ success: true, data, meta: { total, page: Number(page), limit: Number(limit) } });
    } catch (error) {
      next(error);
    }
  },
};
