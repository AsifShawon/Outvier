import { Worker, Job } from 'bullmq';
import { connection } from '../../config/redis';
import { QSRankingsConnector } from '../../services/connectors/qsRankings.connector';

export const rankingSyncWorker = new Worker(
  'ranking-sync',
  async (job: Job) => {
    const { rankingId, universityId, universityName, source } = job.data;
    console.log(`Processing ranking sync job ${job.id} for ${universityName} (${source})`);
    
    try {
      if (source === 'QS') {
        const connector = new QSRankingsConnector();
        const result = await connector.fetch(universityId, universityName);
        return result;
      }
      
      // Fallback or other connectors...
      return { success: false, message: `No connector for source ${source}` };
    } catch (error) {
      console.error(`Error in ranking sync worker:`, error);
      throw error;
    }
  },
  { connection }
);
