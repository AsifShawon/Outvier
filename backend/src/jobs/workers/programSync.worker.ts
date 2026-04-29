import { Worker, Job } from 'bullmq';
import { connection } from '../../config/redis';

export const programSyncWorker = new Worker(
  'program-sync',
  async (job: Job) => {
    console.log(`Processing program sync job ${job.id}`);
    return { success: true };
  },
  { connection }
);
