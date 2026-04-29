import { Worker, Job } from 'bullmq';
import { connection } from '../../config/redis';

export const rankingSyncWorker = new Worker(
  'ranking-sync',
  async (job: Job) => {
    console.log(`Processing ranking sync job ${job.id}`);
    return { success: true };
  },
  { connection }
);
