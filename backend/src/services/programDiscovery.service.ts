/**
 * programDiscovery.service.ts
 * Orchestrates the full program discovery pipeline for a university.
 *
 * Pipeline:
 * 1. Crawl official website for program URLs
 * 2. Fetch and clean each program page
 * 3. Send to AI extraction
 * 4. Normalize + deduplicate results
 * 5. Create StagedChange records (never direct publish)
 *
 * This service is called by the BullMQ worker.
 * Progress updates are pushed via a callback so the worker can update the IngestionJob.
 */

import slugify from 'slugify';
import { crawlerService, UrlType } from './crawler.service';
import { aiExtractionService } from './aiExtraction.service';
import { StagedChange } from '../models/StagedChange.model';
import { Program } from '../models/Program.model';
import { University } from '../models/University.model';
import { IngestionJob, IIngestionJob } from '../models/IngestionJob.model';
import { ProgramExtractionResult, ProgramNormalizedRecord } from '../schemas/ingestion.schema';
import { Types } from 'mongoose';

const MAX_PROGRAMS = parseInt(process.env.MAX_PROGRAMS_PER_UNIVERSITY || '200', 10);

// Source type priority (higher = more trusted)
const SOURCE_PRIORITY: Record<UrlType, number> = {
  course_detail: 9,
  course_list: 7,
  requirement: 7,
  fee: 7,
  scholarship: 6,
  sitemap: 5,
  other: 2,
};

// Map url types to source type strings
const URL_TYPE_TO_SOURCE_TYPE: Record<UrlType, string> = {
  course_detail: 'UNIVERSITY_OFFICIAL',
  course_list: 'UNIVERSITY_OFFICIAL',
  fee: 'FEE_PAGE',
  requirement: 'REQUIREMENT_PAGE',
  scholarship: 'SCHOLARSHIP_PAGE',
  sitemap: 'UNIVERSITY_OFFICIAL',
  other: 'SECONDARY',
};

export type ProgressCallback = (
  percent: number,
  stage: string,
  stats?: Partial<IIngestionJob['progress']>
) => Promise<void>;

export const programDiscoveryService = {
  /**
   * Main entry point: discover, extract, and stage programs for a university.
   */
  async runDiscoveryPipeline(
    universityId: string,
    ingestionJobId: string,
    onProgress: ProgressCallback
  ): Promise<void> {
    const logPrefix = `[discovery:${universityId}]`;

    await onProgress(10, 'Fetching university record');

    // 1. Fetch university
    const university = await University.findById(universityId);
    if (!university) throw new Error(`University ${universityId} not found`);

    const website = university.officialWebsite || university.website;
    if (!website) throw new Error(`University ${universityId} has no official website`);

    // Ensure URL is valid
    let officialWebsite: string;
    try {
      const u = new URL(website.startsWith('http') ? website : `https://${website}`);
      officialWebsite = u.toString();
    } catch {
      throw new Error(`University website is not a valid URL: ${website}`);
    }

    await onProgress(20, 'Discovering program URLs (sitemap + crawl)');

    // 2. Crawl for program URLs
    let crawlResult;
    try {
      crawlResult = await crawlerService.discoverProgramUrls(officialWebsite);
    } catch (err: any) {
      throw new Error(`Crawler failed: ${err.message}`);
    }

    const { classifiedUrls, pagesVisited } = crawlResult;
    const programUrls = classifiedUrls.filter(
      u => u.urlType === 'course_detail' || u.urlType === 'course_list'
    );

    await onProgress(35, `Found ${programUrls.length} program URLs across ${pagesVisited} pages`, {
      pagesVisited,
      urlsFound: programUrls.length,
      failedUrls: crawlResult.errors.map(e => e.url),
    });

    console.log(`${logPrefix} Found ${programUrls.length} program URLs`);

    // 3. Extract from each URL
    const extractions: Array<{
      data: ProgramExtractionResult;
      sourceUrl: string;
      sourceType: string;
      sourcePriority: number;
    }> = [];

    let processed = 0;
    const urlsToProcess = programUrls.slice(0, MAX_PROGRAMS);

    // Fetch existing processed URLs from job to support resume
    const ingestionJob = await IngestionJob.findById(ingestionJobId);
    const alreadyProcessed = new Set(ingestionJob?.progress.processedUrls || []);

    for (const classifiedUrl of urlsToProcess) {
      const { url, urlType } = classifiedUrl;

      // Skip if already processed in this job
      if (alreadyProcessed.has(url)) {
        console.log(`${logPrefix} Skipping already processed URL: ${url}`);
        processed++;
        continue;
      }

      // Double check: does a StagedChange already exist for this URL and job?
      const existingStaged = await StagedChange.findOne({
        ingestionJobId: new Types.ObjectId(ingestionJobId),
        sourceUrls: url,
      });

      if (existingStaged) {
        console.log(`${logPrefix} Skipping URL with existing StagedChange: ${url}`);
        alreadyProcessed.add(url);
        processed++;
        continue;
      }

      try {
        const page = await crawlerService.fetchAndClean(url);
        if (!page || page.text.length < 100) {
          // Mark as processed even if empty/failed to avoid infinite retry
          await IngestionJob.findByIdAndUpdate(ingestionJobId, {
            $addToSet: { 'progress.processedUrls': url }
          });
          continue;
        }

        // Chunk for AI if large
        const chunks = crawlerService.chunkText(page.text, 6000);
        for (const chunk of chunks.slice(0, 2)) { // max 2 chunks per page
          const extracted = await aiExtractionService.extractProgramFromPage(
            chunk,
            url,
            university.name
          );

          if (extracted.programName || extracted.degreeLevel || extracted.cricosCode || extracted.tuition?.annualTuitionFee) {
            extractions.push({
              data: extracted,
              sourceUrl: url,
              sourceType: URL_TYPE_TO_SOURCE_TYPE[urlType],
              sourcePriority: SOURCE_PRIORITY[urlType],
            });
          }
        }

        // Mark URL as processed in DB
        await IngestionJob.findByIdAndUpdate(ingestionJobId, {
          $addToSet: { 'progress.processedUrls': url }
        });

        processed++;
        const percent = 35 + Math.round((processed / urlsToProcess.length) * 35);
        await onProgress(percent, `Extracting programs (${processed}/${urlsToProcess.length})`);

      } catch (err: any) {
        console.warn(`${logPrefix} Error processing ${url}:`, err.message);
        // Mark as processed even on error to avoid sticking on one failing URL
        await IngestionJob.findByIdAndUpdate(ingestionJobId, {
          $addToSet: { 'progress.processedUrls': url }
        });
      }
    }

    await onProgress(70, `Extracted ${extractions.length} program records. Normalizing...`);

    // 4. Group extractions by program (using cricosCode > officialProgramUrl > name+level)
    const groupedExtractions = groupByProgram(extractions);

    await onProgress(78, `Grouped into ${groupedExtractions.size} unique programs. Staging...`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // 5. For each unique program, normalize and create staged change
    for (const [_key, programExtractions] of groupedExtractions) {
      if (created + updated >= MAX_PROGRAMS) break;

      try {
        const normalized = aiExtractionService.normalizeProgramData(
          programExtractions,
          universityId,
          university.name
        );

        if (!normalized.programName && !normalized.cricosCode) {
          skipped++;
          continue;
        }

        // Check for existing program (deduplication)
        const existingProgram = await findExistingProgram(universityId, normalized);

        if (existingProgram) {
          // Create update staged change
          const diff = aiExtractionService.compareProgramData(
            existingProgram.toObject() as unknown as Record<string, unknown>,
            normalized as unknown as Record<string, unknown>
          );

          if (Object.keys(diff).length === 0) {
            skipped++;
            continue;
          }

          await StagedChange.create({
            entityType: 'program',
            entityId: existingProgram._id,
            universityId: new Types.ObjectId(universityId),
            programId: existingProgram._id,
            changeType: 'update',
            oldValue: existingProgram.toObject(),
            newValue: normalized,
            diff,
            sourceUrl: normalized.sourceUrls?.[0] || '',
            sourceUrls: normalized.sourceUrls,
            confidence: normalized.confidenceScore / 100,
            confidenceScore: normalized.confidenceScore,
            sourceEvidence: normalized.sourceEvidence,
            warnings: normalized.warnings || [],
            missingFields: normalized.missingFields || [],
            aiSummary: aiExtractionService.generateAdminSummary(normalized),
            ingestionJobId: new Types.ObjectId(ingestionJobId),
            status: 'pending',
          });
          updated++;

        } else {
          // Create new staged change
          const programSlug = generateProgramSlug(normalized.programName || 'program', university.slug || '');

          await StagedChange.create({
            entityType: 'program',
            universityId: new Types.ObjectId(universityId),
            changeType: 'create',
            newValue: {
              ...normalized,
              // Map to Program model fields
              name: normalized.programName,
              slug: programSlug,
              university: new Types.ObjectId(universityId),
              universityName: university.name,
              universitySlug: university.slug,
              level: mapDegreeLevel(normalized.degreeLevel),
              field: normalized.fieldOfStudy || normalized.discipline || 'General',
              campusMode: normalized.deliveryMode || 'on-campus',
              status: 'draft',
              ingestionJobId: new Types.ObjectId(ingestionJobId),
            },
            sourceUrl: normalized.sourceUrls?.[0] || '',
            sourceUrls: normalized.sourceUrls,
            confidence: normalized.confidenceScore / 100,
            confidenceScore: normalized.confidenceScore,
            sourceEvidence: normalized.sourceEvidence,
            warnings: normalized.warnings || [],
            missingFields: normalized.missingFields || [],
            aiSummary: aiExtractionService.generateAdminSummary(normalized),
            ingestionJobId: new Types.ObjectId(ingestionJobId),
            status: 'pending',
          });
          created++;
        }

      } catch (err: any) {
        console.warn(`${logPrefix} Error staging program:`, err.message);
        skipped++;
      }
    }

    await onProgress(95, 'Staged changes created. Finalizing...', {
      programsDiscovered: groupedExtractions.size,
      programsCreated: created,
      programsUpdated: updated,
      programsSkipped: skipped,
    });

    // 6. Mark university ingestion status
    await University.findByIdAndUpdate(universityId, {
      ingestionStatus: 'completed',
      lastSyncedAt: new Date(),
    });

    await onProgress(100, `Discovery complete. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Group extraction results by program identity.
 * Priority: CRICOS code → officialProgramUrl → normalized(name+level)
 */
function groupByProgram(
  extractions: Array<{
    data: ProgramExtractionResult;
    sourceUrl: string;
    sourceType: string;
    sourcePriority: number;
  }>
): Map<string, typeof extractions> {
  const map = new Map<string, typeof extractions>();

  for (const extraction of extractions) {
    const { data } = extraction;
    let key: string;

    if (data.cricosCode) {
      key = `cricos:${data.cricosCode.toUpperCase()}`;
    } else if (data.officialProgramUrl) {
      key = `url:${data.officialProgramUrl}`;
    } else if (data.programName && data.degreeLevel) {
      key = `name:${slugify(data.programName, { lower: true })}:${data.degreeLevel}`;
    } else {
      key = `url:${extraction.sourceUrl}`;
    }

    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(extraction);
  }

  return map;
}

/**
 * Find an existing program by deduplication keys.
 */
async function findExistingProgram(
  universityId: string,
  normalized: ProgramNormalizedRecord
) {
  // 1. By CRICOS code
  if (normalized.cricosCode) {
    const byCode = await Program.findOne({
      university: new Types.ObjectId(universityId),
      $or: [
        { cricosCourseCode: normalized.cricosCode },
        { 'dataQuality.cricosCode': normalized.cricosCode },
      ],
    });
    if (byCode) return byCode;
  }

  // 2. By official URL
  if (normalized.officialProgramUrl) {
    const byUrl = await Program.findOne({
      university: new Types.ObjectId(universityId),
      $or: [
        { officialProgramUrl: normalized.officialProgramUrl },
        { website: normalized.officialProgramUrl },
      ],
    });
    if (byUrl) return byUrl;
  }

  // 3. By name + level
  if (normalized.programName && normalized.degreeLevel) {
    const level = mapDegreeLevel(normalized.degreeLevel);
    const byName = await Program.findOne({
      university: new Types.ObjectId(universityId),
      name: { $regex: new RegExp(`^${escapeRegex(normalized.programName)}$`, 'i') },
      level,
    });
    if (byName) return byName;
  }

  return null;
}

/**
 * Map AI degree levels to Program model enum values.
 */
function mapDegreeLevel(
  degreeLevel: string | null | undefined
): 'bachelor' | 'master' | 'phd' | 'diploma' | 'certificate' | 'graduate_certificate' {
  if (!degreeLevel) return 'bachelor';
  const dl = degreeLevel.toLowerCase();
  if (dl.includes('bachelor')) return 'bachelor';
  if (dl.includes('master')) return 'master';
  if (dl.includes('phd') || dl.includes('doctor')) return 'phd';
  if (dl.includes('graduate certificate')) return 'graduate_certificate';
  if (dl.includes('graduate diploma')) return 'certificate';
  if (dl.includes('diploma')) return 'diploma';
  if (dl.includes('certificate')) return 'certificate';
  return 'bachelor';
}

/**
 * Generate a unique program slug.
 */
function generateProgramSlug(name: string, universitySlug: string): string {
  const base = slugify(`${name}-${universitySlug}`, { lower: true, strict: true });
  return `${base}-${Date.now()}`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
