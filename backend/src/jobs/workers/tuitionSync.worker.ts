import { Worker, Job } from 'bullmq';
import { connection } from '../../config/redis';

export const tuitionSyncWorker = new Worker(
  'tuition-sync',
  async (job: Job) => {
    console.log(`Processing tuition sync job ${job.id}`);
    return { success: true };
  },
  { connection }
);
