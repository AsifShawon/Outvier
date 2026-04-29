import { Worker, Job } from 'bullmq';
import { connection } from '../../config/redis';

export const scholarshipSyncWorker = new Worker(
  'scholarship-sync',
  async (job: Job) => {
    console.log(`Processing scholarship sync job ${job.id}`);
    return { success: true };
  },
  { connection }
);
