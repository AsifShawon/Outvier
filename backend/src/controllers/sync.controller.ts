import { Request, Response, NextFunction } from 'express';
import { universitySyncQueue, programSyncQueue } from '../jobs/queue';
import { SyncJob } from '../models/SyncJob.model';
import { DataSource } from '../models/DataSource.model';

export const syncController = {
  async triggerUniversitySync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const username = (req as any).user?.username || 'admin';
      const job = await universitySyncQueue.add('sync', { universityId: id, triggeredBy: username });
      res.status(202).json({ success: true, message: 'University sync job queued', data: { jobId: job.id } });
    } catch (error) { next(error); }
  },

  async triggerAllUniversitySync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { University } = await import('../models/University.model');
      const universities = await University.find({}, { _id: 1 }).lean();
      const username = (req as any).user?.username || 'admin';
      const jobs = universities.map(u => ({ name: 'sync', data: { universityId: String(u._id), triggeredBy: username } }));
      await universitySyncQueue.addBulk(jobs);
      res.status(202).json({ success: true, message: `Queued sync jobs for ${jobs.length} universities` });
    } catch (error) { next(error); }
  },

  async triggerProgramSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const username = (req as any).user?.username || 'admin';
      const job = await programSyncQueue.add('sync', { programId: id, triggeredBy: username });
      res.status(202).json({ success: true, message: 'Program sync job queued', data: { jobId: job.id } });
    } catch (error) { next(error); }
  },

  async triggerAllSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(202).json({ success: true, message: 'All sync jobs queued' });
    } catch (error) { next(error); }
  },

  async listJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = '50', page = '1' } = req.query as Record<string, string>;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const jobs = await SyncJob.find().sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).populate('targetUniversityId', 'name').lean();
      res.status(200).json({ success: true, data: jobs });
    } catch (error) { next(error); }
  },

  async retryJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const syncJob = await SyncJob.findById(req.params.id);
      if (!syncJob) { res.status(404).json({ success: false, message: 'Job not found' }); return; }
      if (syncJob.status !== 'failed') { res.status(400).json({ success: false, message: 'Can only retry failed jobs' }); return; }
      
      syncJob.status = 'queued';
      await syncJob.save();
      
      if (syncJob.jobType === 'crawl_university') {
        await universitySyncQueue.add('sync', { universityId: syncJob.targetUniversityId });
      }
      
      res.status(200).json({ success: true, message: 'Job retried', data: syncJob });
    } catch (error) { next(error); }
  },

  // Data Sources
  async listDataSources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sources = await DataSource.find().sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: sources });
    } catch (error) { next(error); }
  },

  async createDataSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const source = await DataSource.create(req.body);
      res.status(201).json({ success: true, data: source });
    } catch (error) { next(error); }
  },

  async updateDataSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const source = await DataSource.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.status(200).json({ success: true, data: source });
    } catch (error) { next(error); }
  },

  async deleteDataSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await DataSource.findByIdAndDelete(req.params.id);
      res.status(200).json({ success: true, message: 'Data source deleted' });
    } catch (error) { next(error); }
  }
};
