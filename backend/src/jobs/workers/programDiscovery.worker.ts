/**
 * programDiscovery.worker.ts
 * BullMQ worker for the program-discovery queue.
 *
 * Triggered by:
 * - Manual university upload (admin toggle "Auto-discover programs")
 * - Bulk CSV university upload (per-university job)
 * - Manual /discover-programs endpoint
 * - /refresh-programs endpoint
 *
 * Job data shape: UniversityIngestionJob (from ingestion.schema.ts)
 */

import { Worker, Job } from 'bullmq';
import { connection } from '../../config/redis';
import { IngestionJob } from '../../models/IngestionJob.model';
import { University } from '../../models/University.model';
import { programDiscoveryService } from '../../services/programDiscovery.service';
import { UniversityIngestionJob } from '../../schemas/ingestion.schema';

export const programDiscoveryWorker = new Worker<UniversityIngestionJob>(
  'program-discovery',
  async (job: Job<UniversityIngestionJob>) => {
    const { universityId, universityName, ingestionJobId, isRefresh } = job.data;
    const logPrefix = `[worker:program-discovery:${job.id}]`;

    // Find or create the IngestionJob record
    let ingestionJob = ingestionJobId
      ? await IngestionJob.findById(ingestionJobId)
      : null;

    if (!ingestionJob) {
      ingestionJob = await IngestionJob.create({
        jobType: isRefresh ? 'refresh_programs' : 'single_university',
        universityId,
        universityName,
        bullmqJobId: job.id,
        status: 'running',
        startedAt: new Date(),
        progress: {
          percent: 0,
          stage: 'starting',
        },
        logs: [{
          timestamp: new Date(),
          step: 'start',
          status: 'info',
          message: `Program discovery started for ${universityName}`,
        }],
      });
    } else {
      ingestionJob.status = 'running';
      ingestionJob.bullmqJobId = job.id || undefined;
      ingestionJob.startedAt = new Date();
      await ingestionJob.save();
    }

    // Mark university as running
    await University.findByIdAndUpdate(universityId, { ingestionStatus: 'running' });

    // Progress callback that updates both BullMQ job progress and IngestionJob
    const onProgress = async (
      percent: number,
      stage: string,
      stats?: Record<string, any>
    ) => {
      await job.updateProgress(percent);

      if (ingestionJob) {
        ingestionJob.progress.percent = percent;
        ingestionJob.progress.stage = stage;
        if (stats) {
          Object.assign(ingestionJob.progress, stats);
        }
        ingestionJob.logs.push({
          timestamp: new Date(),
          step: stage.toLowerCase().replace(/\s+/g, '_'),
          status: 'info',
          message: stage,
        });
        await ingestionJob.save();
      }

      console.log(`${logPrefix} [${percent}%] ${stage}`);
    };

    try {
      await programDiscoveryService.runDiscoveryPipeline(
        universityId,
        ingestionJob!._id.toString(),
        onProgress
      );

      // Mark completed
      if (ingestionJob) {
        ingestionJob.status = 'completed';
        ingestionJob.completedAt = new Date();
        ingestionJob.logs.push({
          timestamp: new Date(),
          step: 'completed',
          status: 'success',
          message: `Discovery pipeline completed for ${universityName}`,
        });
        await ingestionJob.save();
      }

      return {
        success: true,
        universityId,
        programsCreated: ingestionJob?.progress.programsCreated ?? 0,
        programsUpdated: ingestionJob?.progress.programsUpdated ?? 0,
      };

    } catch (error: any) {
      console.error(`${logPrefix} Pipeline failed:`, error.message);

      if (ingestionJob) {
        ingestionJob.status = 'failed';
        ingestionJob.completedAt = new Date();
        ingestionJob.errorMessages.push(error.message);
        ingestionJob.logs.push({
          timestamp: new Date(),
          step: 'failed',
          status: 'error',
          message: `Pipeline failed: ${error.message}`,
          error: error.message,
        });
        await ingestionJob.save();
      }

      // Mark university status as failed
      await University.findByIdAndUpdate(universityId, { ingestionStatus: 'failed' });

      throw error; // BullMQ will handle retries
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.INGESTION_CONCURRENCY || '2', 10),
    lockDuration: 300000, // 5 minutes to prevent stalls when local AI pegs the CPU
  }
);

programDiscoveryWorker.on('completed', (job) => {
  const result = job.returnvalue;
  console.log(
    `✅ [program-discovery] Job ${job.id} completed.`,
    `Created: ${result?.programsCreated}, Updated: ${result?.programsUpdated}`
  );
});

programDiscoveryWorker.on('failed', (job, err) => {
  console.error(`❌ [program-discovery] Job ${job?.id} failed:`, err.message);
});

programDiscoveryWorker.on('progress', (job, progress) => {
  console.log(`📊 [program-discovery] Job ${job.id} progress: ${progress}%`);
});
