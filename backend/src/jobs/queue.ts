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

// Define Queues
export const universitySyncQueue = new Queue('university-sync', defaultQueueConfig);
export const programSyncQueue = new Queue('program-sync', defaultQueueConfig);
export const tuitionSyncQueue = new Queue('tuition-sync', defaultQueueConfig);
export const scholarshipSyncQueue = new Queue('scholarship-sync', defaultQueueConfig);
export const rankingSyncQueue = new Queue('ranking-sync', defaultQueueConfig);
export const outcomeSyncQueue = new Queue('outcome-sync', defaultQueueConfig);

// Helper to gracefully shutdown queues
export async function closeQueues() {
  await universitySyncQueue.close();
  await programSyncQueue.close();
  await tuitionSyncQueue.close();
  await scholarshipSyncQueue.close();
  await rankingSyncQueue.close();
  await outcomeSyncQueue.close();
}
