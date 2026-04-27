import { Request, Response, NextFunction } from 'express';
import { universitySyncQueue } from '../jobs/queue';
import { SyncJob } from '../models/SyncJob.model';

export const syncController = {
  /** POST /api/v1/admin/sync/university/:id
   *  Trigger a sync for a specific university
   */
  async triggerUniversitySync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const username = (req as any).user?.username || 'admin';

      const job = await universitySyncQueue.add('sync', {
        universityId: id,
        triggeredBy: username,
      });

      res.status(202).json({
        success: true,
        message: 'University sync job queued',
        data: { jobId: job.id },
      });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/v1/admin/sync/university/all
   *  Trigger sync for ALL universities
   */
  async triggerAllUniversitySync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // For demo purposes, we expect the client to fetch university IDs and call the single endpoint,
      // or we can fetch them here and queue them all.
      // We will do a simple implementation here:
      const { University } = await import('../models/University.model');
      const universities = await University.find({}, { _id: 1 }).lean();
      
      const username = (req as any).user?.username || 'admin';
      
      const jobs = universities.map(u => ({
        name: 'sync',
        data: { universityId: String(u._id), triggeredBy: username }
      }));

      await universitySyncQueue.addBulk(jobs);

      res.status(202).json({
        success: true,
        message: `Queued sync jobs for ${jobs.length} universities`,
      });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/v1/admin/sync/jobs
   *  List recent sync jobs
   */
  async listJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = '50', page = '1' } = req.query as Record<string, string>;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const jobs = await SyncJob.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('targetUniversityId', 'name')
        .lean();

      res.status(200).json({
        success: true,
        data: jobs,
      });
    } catch (error) {
      next(error);
    }
  }
};
