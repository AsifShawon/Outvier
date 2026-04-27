import { universitySyncWorker } from './universitySync.worker';

// Export workers to prevent them from being garbage collected
export const workers = {
  universitySyncWorker,
  // Add other workers here as they are implemented
};

// Graceful shutdown helper for workers
export async function closeWorkers() {
  await Promise.all(
    Object.values(workers).map(worker => worker.close())
  );
}
