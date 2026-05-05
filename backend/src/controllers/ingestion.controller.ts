/**
 * ingestion.controller.ts
 * Admin endpoints for AI-assisted program discovery and ingestion review.
 *
 * Endpoints:
 * POST   /api/v1/admin/universities/:id/discover-programs
 * POST   /api/v1/admin/universities/:id/refresh-programs
 * GET    /api/v1/admin/ingestion-jobs
 * GET    /api/v1/admin/ingestion-jobs/:jobId
 * GET    /api/v1/admin/ingestion-jobs/:jobId/logs
 * POST   /api/v1/admin/ingestion-jobs/:jobId/retry
 * GET    /api/v1/admin/universities/:id/discovered-programs
 * GET    /api/v1/admin/programs/:id/source-evidence
 * PATCH  /api/v1/admin/programs/:id/refresh-field
 */

import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { programDiscoveryQueue } from '../jobs/queue';
import { IngestionJob } from '../models/IngestionJob.model';
import { University } from '../models/University.model';
import { Program } from '../models/Program.model';
import { StagedChange } from '../models/StagedChange.model';
import { UniversityIngestionJobSchema } from '../schemas/ingestion.schema';

export const ingestionController = {
  // ---------------------------------------------------------------------------
  // Trigger discovery for a single university
  // ---------------------------------------------------------------------------

  async discoverPrograms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { isRefresh = false } = req.body;
      const triggeredBy = (req as any).user?.username || 'admin';

      const university = await University.findById(id);
      if (!university) {
        res.status(404).json({ success: false, message: 'University not found' });
        return;
      }

      const officialWebsite = university.officialWebsite || university.website;
      if (!officialWebsite) {
        res.status(400).json({
          success: false,
          message: 'University must have an official website before program discovery can run.',
        });
        return;
      }

      // Create IngestionJob record first
      const ingestionJob = await IngestionJob.create({
        jobType: isRefresh ? 'refresh_programs' : 'single_university',
        universityId: new Types.ObjectId(id),
        universityName: university.name,
        uploadedBy: triggeredBy,
        status: 'queued',
        progress: { percent: 0, stage: 'queued' },
        logs: [{
          timestamp: new Date(),
          step: 'queued',
          status: 'info',
          message: `Discovery job queued by ${triggeredBy}`,
        }],
      });

      // Validate job data
      const jobData = UniversityIngestionJobSchema.parse({
        universityId: id,
        universityName: university.name,
        officialWebsite: officialWebsite.startsWith('http') ? officialWebsite : `https://${officialWebsite}`,
        triggeredBy,
        isRefresh,
        ingestionJobId: ingestionJob._id.toString(),
      });

      // Update university ingestion status
      await University.findByIdAndUpdate(id, { ingestionStatus: 'queued' });

      // Add to BullMQ
      const bullJob = await programDiscoveryQueue.add('discover', jobData, {
        jobId: `discovery-${id}-${Date.now()}`,
      });

      // Store BullMQ job ID
      ingestionJob.bullmqJobId = bullJob.id || undefined;
      await ingestionJob.save();

      res.status(202).json({
        success: true,
        message: `Program discovery job queued for "${university.name}"`,
        data: {
          ingestionJobId: ingestionJob._id,
          bullmqJobId: bullJob.id,
          universityId: id,
          universityName: university.name,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // ---------------------------------------------------------------------------
  // Refresh programs (re-run discovery) for an existing university
  // ---------------------------------------------------------------------------

  async refreshPrograms(req: Request, res: Response, next: NextFunction): Promise<void> {
    req.body.isRefresh = true;
    return ingestionController.discoverPrograms(req, res, next);
  },

  // ---------------------------------------------------------------------------
  // List all ingestion jobs
  // ---------------------------------------------------------------------------

  async listIngestionJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        status,
        universityId,
        page = '1',
        limit = '20',
      } = req.query as Record<string, string>;

      const filter: Record<string, unknown> = {};
      if (status) filter.status = status;
      if (universityId) filter.universityId = new Types.ObjectId(universityId);

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [jobs, total] = await Promise.all([
        IngestionJob.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('universityId', 'name slug officialWebsite')
          .select('-logs') // Exclude logs from list view (get from /logs endpoint)
          .lean(),
        IngestionJob.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: jobs,
        meta: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // ---------------------------------------------------------------------------
  // Get a specific ingestion job (status + progress)
  // ---------------------------------------------------------------------------

  async getIngestionJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await IngestionJob.findById(req.params.jobId)
        .populate('universityId', 'name slug officialWebsite ingestionStatus')
        .select('-logs') // Use /logs endpoint for logs
        .lean();

      if (!job) {
        res.status(404).json({ success: false, message: 'Ingestion job not found' });
        return;
      }

      res.status(200).json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  },

  // ---------------------------------------------------------------------------
  // Get logs for a specific ingestion job
  // ---------------------------------------------------------------------------

  async getIngestionJobLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await IngestionJob.findById(req.params.jobId)
        .select('logs status progress universityName createdAt')
        .lean();

      if (!job) {
        res.status(404).json({ success: false, message: 'Ingestion job not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          jobId: req.params.jobId,
          universityName: job.universityName,
          status: job.status,
          progress: job.progress,
          logs: job.logs,
          createdAt: job.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // ---------------------------------------------------------------------------
  // Retry a failed ingestion job
  // ---------------------------------------------------------------------------

  async retryIngestionJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ingestionJob = await IngestionJob.findById(req.params.jobId);
      if (!ingestionJob) {
        res.status(404).json({ success: false, message: 'Ingestion job not found' });
        return;
      }

      if (ingestionJob.status !== 'failed') {
        res.status(400).json({ success: false, message: 'Can only retry failed jobs' });
        return;
      }

      const university = await University.findById(ingestionJob.universityId);
      if (!university) {
        res.status(404).json({ success: false, message: 'University not found' });
        return;
      }

      const officialWebsite = university.officialWebsite || university.website;
      if (!officialWebsite) {
        res.status(400).json({ success: false, message: 'University has no official website' });
        return;
      }

      // Reset job
      ingestionJob.status = 'queued';
      ingestionJob.errorMessages = [];
      ingestionJob.progress = { percent: 0, stage: 'queued' } as any;
      ingestionJob.logs.push({
        timestamp: new Date(),
        step: 'retry',
        status: 'info',
        message: `Job retried by ${(req as any).user?.username || 'admin'}`,
      });
      await ingestionJob.save();

      const jobData = UniversityIngestionJobSchema.parse({
        universityId: ingestionJob.universityId.toString(),
        universityName: ingestionJob.universityName,
        officialWebsite: officialWebsite.startsWith('http') ? officialWebsite : `https://${officialWebsite}`,
        triggeredBy: (req as any).user?.username || 'admin',
        isRefresh: false,
        ingestionJobId: ingestionJob._id.toString(),
      });

      await University.findByIdAndUpdate(ingestionJob.universityId, { ingestionStatus: 'queued' });
      await programDiscoveryQueue.add('discover', jobData);

      res.status(202).json({
        success: true,
        message: 'Ingestion job retried',
        data: { ingestionJobId: ingestionJob._id },
      });
    } catch (error) {
      next(error);
    }
  },

  // ---------------------------------------------------------------------------
  // Cancel a running ingestion job
  // ---------------------------------------------------------------------------

  async cancelIngestionJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ingestionJob = await IngestionJob.findById(req.params.jobId);
      if (!ingestionJob) {
        res.status(404).json({ success: false, message: 'Ingestion job not found' });
        return;
      }

      if (['completed', 'failed', 'cancelled'].includes(ingestionJob.status)) {
        res.status(400).json({ success: false, message: `Cannot cancel a job that is already ${ingestionJob.status}` });
        return;
      }

      // 1. Try to stop the BullMQ job if ID is known
      if (ingestionJob.bullmqJobId) {
        const bullJob = await programDiscoveryQueue.getJob(ingestionJob.bullmqJobId);
        if (bullJob) {
          try {
            await bullJob.remove();
          } catch (err) {
            // Job might be active, try to discard it so it won't retry
            await bullJob.discard();
          }
        }
      }

      // 2. Update status in database
      ingestionJob.status = 'cancelled'; 
      ingestionJob.logs.push({
        timestamp: new Date(),
        step: 'cancel',
        status: 'warn',
        message: `Job manually cancelled by ${(req as any).user?.username || 'admin'}`,
      });
      await ingestionJob.save();

      // 3. Reset university status
      if (ingestionJob.universityId) {
        await University.findByIdAndUpdate(ingestionJob.universityId, { ingestionStatus: 'idle' });
      }

      res.status(200).json({
        success: true,
        message: 'Ingestion job cancellation requested',
        data: { ingestionJobId: ingestionJob._id },
      });
    } catch (error) {
      next(error);
    }
  },

  // ---------------------------------------------------------------------------
  // List discovered (staged) programs for a university
  // ---------------------------------------------------------------------------

  async getDiscoveredPrograms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { page = '1', limit = '20', status = 'pending' } = req.query as Record<string, string>;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [changes, total] = await Promise.all([
        StagedChange.find({
          universityId: new Types.ObjectId(id),
          entityType: 'program',
          status,
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        StagedChange.countDocuments({
          universityId: new Types.ObjectId(id),
          entityType: 'program',
          status,
        }),
      ]);

      res.status(200).json({
        success: true,
        data: changes,
        meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
      });
    } catch (error) {
      next(error);
    }
  },

  // ---------------------------------------------------------------------------
  // Get source evidence for a published program
  // ---------------------------------------------------------------------------

  async getProgramSourceEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const program = await Program.findById(req.params.id)
        .select('sourceEvidence sourceUrls confidenceScore missingFields warnings dataSourceType extractedAt lastCheckedAt aiSummary name universityName')
        .lean();

      if (!program) {
        res.status(404).json({ success: false, message: 'Program not found' });
        return;
      }

      res.status(200).json({ success: true, data: program });
    } catch (error) {
      next(error);
    }
  },

  // ---------------------------------------------------------------------------
  // Refresh a single field on an existing program (re-fetch from source)
  // ---------------------------------------------------------------------------

  async refreshProgramField(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { field } = req.body as { field: string };

      if (!field) {
        res.status(400).json({ success: false, message: 'field is required in request body' });
        return;
      }

      const program = await Program.findById(id);
      if (!program) {
        res.status(404).json({ success: false, message: 'Program not found' });
        return;
      }

      const university = await University.findById(program.university);
      const sourceUrl = program.officialProgramUrl || program.website || university?.officialWebsite;

      if (!sourceUrl) {
        res.status(400).json({ success: false, message: 'No source URL available to refresh from' });
        return;
      }

      // Import lazily to avoid circular deps at module load time
      const { crawlerService } = await import('../services/crawler.service');
      const { aiExtractionService } = await import('../services/aiExtraction.service');

      const page = await crawlerService.fetchAndClean(sourceUrl);
      if (!page) {
        res.status(503).json({ success: false, message: 'Could not fetch source page' });
        return;
      }

      const extracted = await aiExtractionService.extractProgramFromPage(
        page.text,
        sourceUrl,
        university?.name || ''
      );

      const fieldValue = (extracted as any)[field];
      if (fieldValue === null || fieldValue === undefined) {
        res.status(200).json({
          success: true,
          message: `Field "${field}" not found in source page`,
          data: { field, value: null, sourceUrl },
        });
        return;
      }

      // Create a staged change for this field update
      await StagedChange.create({
        entityType: 'program',
        entityId: program._id,
        universityId: program.university,
        programId: program._id,
        changeType: 'update',
        oldValue: { [field]: (program as any)[field] },
        newValue: { [field]: fieldValue },
        diff: { [field]: { old: (program as any)[field], new: fieldValue } },
        sourceUrl,
        confidence: extracted._aiUsed ? 0.8 : 0.4,
        confidenceScore: extracted._aiUsed ? 80 : 40,
        status: 'pending',
      });

      res.status(200).json({
        success: true,
        message: `Field "${field}" refresh staged for admin review`,
        data: { field, extractedValue: fieldValue, sourceUrl },
      });
    } catch (error) {
      next(error);
    }
  },
};
