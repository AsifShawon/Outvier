import { Queue, QueueOptions } from 'bullmq';
import { connection } from '../config/redis';

const defaultQueueConfig: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 10s, 20s
    },
    removeOnComplete: {
      age: 3600 * 24, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 3600 * 24 * 7, // Keep failed jobs for 7 days
    },
  },
};

// Existing sync queues
export const universitySyncQueue = new Queue('university-sync', defaultQueueConfig);
export const programSyncQueue = new Queue('program-sync', defaultQueueConfig);
export const tuitionSyncQueue = new Queue('tuition-sync', defaultQueueConfig);
export const scholarshipSyncQueue = new Queue('scholarship-sync', defaultQueueConfig);
export const rankingSyncQueue = new Queue('ranking-sync', defaultQueueConfig);
export const outcomeSyncQueue = new Queue('outcome-sync', defaultQueueConfig);

// AI ingestion queues (new)
export const programDiscoveryQueue = new Queue('program-discovery', {
  ...defaultQueueConfig,
  defaultJobOptions: {
    ...defaultQueueConfig.defaultJobOptions,
    attempts: 2, // Discovery jobs are expensive — only retry once
    backoff: {
      type: 'exponential',
      delay: 10000, // 10s delay before retry
    },
  },
});

export const batchImportQueue = new Queue('batch-import', defaultQueueConfig);

export const cricosSyncQueue = new Queue('cricos-sync', defaultQueueConfig);

// Helper to gracefully shutdown queues
export async function closeQueues() {
  await Promise.all([
    universitySyncQueue.close(),
    programSyncQueue.close(),
    tuitionSyncQueue.close(),
    scholarshipSyncQueue.close(),
    rankingSyncQueue.close(),
    outcomeSyncQueue.close(),
    programDiscoveryQueue.close(),
    batchImportQueue.close(),
    cricosSyncQueue.close(),
  ]);
}
