import { Worker, Job } from 'bullmq';
import { connection } from '../../config/redis';

export const outcomeSyncWorker = new Worker(
  'outcome-sync',
  async (job: Job) => {
    console.log(`Processing outcome sync job ${job.id}`);
    return { success: true };
  },
  { connection }
);
