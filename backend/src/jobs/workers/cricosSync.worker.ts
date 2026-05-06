import { Worker, Job } from 'bullmq';
import { connection } from '../../config/redis';
import { cricosSyncService } from '../../services/cricos/cricosSync.service';

export interface CricosSyncJobData {
  providerCode: string;
  triggeredBy?: string;
}

export const cricosSyncWorker = new Worker<CricosSyncJobData>(
  'cricos-sync',
  async (job: Job<CricosSyncJobData>) => {
    const { providerCode, triggeredBy = 'system' } = job.data;
    const syncRunId = await cricosSyncService.syncProvider(providerCode, triggeredBy);
    return { syncRunId };
  },
  { connection }
);

cricosSyncWorker.on('completed', (job) => {
  console.log(`✅ CRICOS sync job ${job.id} completed for provider ${job.data.providerCode}`);
});

cricosSyncWorker.on('failed', (job, err) => {
  console.error(`❌ CRICOS sync job ${job?.id} failed for provider ${job?.data?.providerCode}:`, err.message);
});
