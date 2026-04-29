import { universitySyncWorker } from './universitySync.worker';
import { programSyncWorker } from './programSync.worker';
import { tuitionSyncWorker } from './tuitionSync.worker';
import { scholarshipSyncWorker } from './scholarshipSync.worker';
import { rankingSyncWorker } from './rankingSync.worker';
import { outcomeSyncWorker } from './outcomeSync.worker';

// Export workers to prevent them from being garbage collected
export const workers = {
  universitySyncWorker,
  programSyncWorker,
  tuitionSyncWorker,
  scholarshipSyncWorker,
  rankingSyncWorker,
  outcomeSyncWorker,
};

// Graceful shutdown helper for workers
export async function closeWorkers() {
  await Promise.all(
    Object.values(workers).map(worker => worker.close())
  );
}
