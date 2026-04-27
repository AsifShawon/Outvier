import { Worker, Job } from 'bullmq';
import { connection } from '../../config/redis';
import { University } from '../../models/University.model';
import { StagedChange } from '../../models/StagedChange.model';
import { SyncJob } from '../../models/SyncJob.model';
import { universityOfficialConnector } from '../../services/connectors/universityOfficial.connector';

export interface UniversitySyncJobData {
  universityId: string;
  triggeredBy?: string;
}

export const universitySyncWorker = new Worker<UniversitySyncJobData>(
  'university-sync',
  async (job: Job<UniversitySyncJobData>) => {
    const { universityId, triggeredBy } = job.data;
    
    // 1. Create a SyncJob record to track this attempt
    const syncJob = await SyncJob.create({
      jobType: 'crawl_university',
      targetUniversityId: universityId,
      status: 'running',
      startedAt: new Date(),
    });

    try {
      // 2. Fetch the university
      const university = await University.findById(universityId);
      if (!university) {
        throw new Error(`University ${universityId} not found`);
      }

      if (!university.officialWebsite && !university.website) {
         throw new Error(`University ${universityId} has no website configured`);
      }

      const website = university.officialWebsite || university.website;

      // 3. Run the connector
      const results = await universityOfficialConnector.execute(universityId, { website });
      
      const successfulResults = results.filter(r => r.success && r.data && Object.keys(r.data).length > 0);
      
      let stagedChangesCreated = 0;

      // 4. Create StagedChanges for successful results
      for (const result of successfulResults) {
        if (!result.data) continue;

        // Compare with old values (very basic comparison for demo)
        const oldValue: any = {};
        let hasChanges = false;

        for (const [key, value] of Object.entries(result.data)) {
          const currentVal = (university as any)[key];
          if (currentVal !== value) {
            oldValue[key] = currentVal;
            hasChanges = true;
          }
        }

        if (hasChanges) {
          await StagedChange.create({
            entityType: 'university',
            entityId: university._id,
            changeType: 'update',
            sourceUrl: result.sourceUrl,
            confidence: result.confidence,
            oldValue,
            newValue: result.data,
            universityId: university._id,
          });
          stagedChangesCreated++;
        }
      }

      // 5. Update SyncJob status
      syncJob.status = 'completed';
      syncJob.finishedAt = new Date();
      syncJob.stats = {
        recordsFound: successfulResults.length,
        recordsChanged: stagedChangesCreated,
        errors: 0
      };
      await syncJob.save();

      return { success: true, stagedChanges: stagedChangesCreated };

    } catch (error: any) {
      syncJob.status = 'failed';
      syncJob.finishedAt = new Date();
      syncJob.logs = [error.message];
      syncJob.stats = { ...syncJob.stats, errors: 1 };
      await syncJob.save();
      throw error;
    }
  },
  { connection }
);

universitySyncWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} (University Sync) completed. Staged changes: ${job.returnvalue.stagedChanges}`);
});

universitySyncWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} (University Sync) failed:`, err.message);
});
