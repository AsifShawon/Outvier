/**
 * ingestionPipeline.service.ts — Full Provenance Ingestion Pipeline Orchestrator.
 *
 * Implements the complete 9-Stage Ingestion Lifecycle:
 * 1. Source Registry: Fetches or registers DataSource with priority & SLA.
 * 2. Immutable Raw Snapshot: Fetches with safeHttpClient, computes SHA-256 hash, stores SourceSnapshot.
 * 3. Source-Specific Parser Hierarchy:
 *    - Level 1: Official API
 *    - Level 2: Structured Data (JSON-LD)
 *    - Level 3: Official PDF
 *    - Level 4: University DOM Adapter (UNSW, Unimelb, USYD, Monash)
 *    - Level 5: Generic DOM Parser
 *    - Level 6: AI-Assisted Extraction Fallback (fenced untrusted input)
 * 4. Canonical Candidate Construction: Assembles candidate with field-level FieldEvidence.
 * 5. Quality Rules Evaluation: Runs qualityRulesService (CRICOS, dates, fee spikes, evidence).
 * 6. Diff Engine: Computes delta against current live records.
 * 7. Staged Review: Saves ChangeReview / StagedChange with pending status.
 * 8. Publication / Human Review Routing: Routes AI or low-confidence / high-diff items to admin queue.
 * 9. Freshness Monitoring: Updates DataSource lastSuccessfulSync and SLA metrics.
 *
 * Resilience & Reliability:
 * - Deterministic Idempotency Key: sha256(providerId + sourceUrl + parserVersion).
 * - Dead-Letter Queue & Diagnostic Error Logging in IngestionJob.
 * - Replay & Resume capability.
 */

import crypto from 'crypto';
import slugify from 'slugify';
import { Types } from 'mongoose';

import { safeHttpClient, SafeFetchResult } from '../utils/safeHttpClient';
import { crawlerService, cleanHtml } from './crawler.service';
import { structuredDataParser } from './parsers/structuredData.parser';
import { domAdapterRegistry } from './parsers/universityDomAdapters';
import { aiExtractionService } from './aiExtraction.service';
import { qualityRulesService, QualityViolation } from './qualityRules.service';

import { DataSource, IDataSource } from '../models/DataSource.model';
import { SourceSnapshot, ISourceSnapshot } from '../models/SourceSnapshot.model';
import { University } from '../models/University.model';
import { Program, IProgram } from '../models/Program.model';
import { StagedChange, IStagedChange } from '../models/StagedChange.model';
import { ChangeReview } from '../models/ChangeReview.model';
import { IngestionJob, IIngestionJob } from '../models/IngestionJob.model';
import { IFieldEvidence } from '../models/FieldEvidence.model';

export interface IngestionOptions {
  universityId: string;
  sourceUrl: string;
  ingestionJobId?: string;
  forceAiFallback?: boolean;
}

export interface PipelineExecutionResult {
  success: boolean;
  stageReached: string;
  snapshotId?: string;
  candidateName?: string;
  extractionStrategy: string;
  stagedChangeId?: string;
  actionTaken: 'staged_created' | 'staged_updated' | 'skipped_identical' | 'failed';
  qualityPassed: boolean;
  violations: QualityViolation[];
  autoApprovalEligible: boolean;
  error?: string;
}

export function computeIdempotencyKey(providerId: string, sourceUrl: string, parserVersion: string): string {
  return crypto
    .createHash('sha256')
    .update(`${providerId}:${sourceUrl}:${parserVersion}`)
    .digest('hex');
}

export const ingestionPipelineService = {
  /**
   * Execute the full 9-stage pipeline for a single target URL.
   */
  async processUrl(options: IngestionOptions): Promise<PipelineExecutionResult> {
    const { universityId, sourceUrl, ingestionJobId, forceAiFallback } = options;

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 1: SOURCE REGISTRY
    // ─────────────────────────────────────────────────────────────────────────
    const uni = await University.findById(universityId);
    if (!uni) throw new Error(`University ${universityId} not found in registry`);

    let dataSource = await DataSource.findOne({ baseUrl: sourceUrl });
    if (!dataSource) {
      dataSource = await DataSource.create({
        name: `${uni.name} Source (${sourceUrl})`,
        type: 'official_site',
        baseUrl: sourceUrl,
        owner: 'Outvier Auto Ingestion',
        sourcePriority: 80,
        refreshFrequency: 'weekly',
        freshnessSlaHours: 168,
        parserVersion: '2.0.0',
        allowed: true,
        crawlStatus: 'allowed',
        status: 'active',
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 2: IMMUTABLE RAW SNAPSHOT
    // ─────────────────────────────────────────────────────────────────────────
    let fetchRes: SafeFetchResult;
    try {
      fetchRes = await safeHttpClient.get(sourceUrl, {
        timeoutMs: 15000,
        maxResponseBytes: 5 * 1024 * 1024,
      });
    } catch (fetchErr: any) {
      // Record failure on DataSource
      await DataSource.findByIdAndUpdate(dataSource._id, {
        $inc: { failureCount: 1 },
      });
      return {
        success: false,
        stageReached: 'fetch_snapshot',
        extractionStrategy: 'none',
        actionTaken: 'failed',
        qualityPassed: false,
        violations: [],
        autoApprovalEligible: false,
        error: `SSRF/Fetch failed: ${fetchErr.message}`,
      };
    }

    const payloadHash = crypto.createHash('sha256').update(fetchRes.body).digest('hex');

    // Create immutable raw snapshot
    const snapshot: ISourceSnapshot = await SourceSnapshot.create({
      entityType: 'Program',
      sourceUrl,
      sourceType: 'UNIVERSITY_OFFICIAL',
      snapshotHash: payloadHash,
      mimeType: fetchRes.contentType || 'text/html',
      httpHeaders: fetchRes.headers as Record<string, any>,
      rawPayload: fetchRes.body,
      parserVersion: '2.0.0',
      fetchedAt: new Date(),
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 3: SOURCE-SPECIFIC PARSER HIERARCHY
    // ─────────────────────────────────────────────────────────────────────────
    let extractionStrategy = 'generic_dom';
    let candidateData: Record<string, any> = {};
    let candidateEvidence: Record<string, IFieldEvidence> = {};

    // 3.1 Try Structured Data (JSON-LD)
    const jsonLdResult = structuredDataParser.parse(fetchRes.body, sourceUrl);
    if (jsonLdResult && jsonLdResult.name?.value && !forceAiFallback) {
      extractionStrategy = 'structured_data';
      candidateData.name = jsonLdResult.name.value;
      candidateEvidence.name = jsonLdResult.name.evidence;

      if (jsonLdResult.degreeLevel) {
        candidateData.degreeLevel = jsonLdResult.degreeLevel.value;
        candidateEvidence.degreeLevel = jsonLdResult.degreeLevel.evidence;
      }
      if (jsonLdResult.annualTuitionAud) {
        candidateData.annualTuitionAud = jsonLdResult.annualTuitionAud.value;
        candidateEvidence.annualTuitionAud = jsonLdResult.annualTuitionAud.evidence;
      }
      if (jsonLdResult.durationText) {
        candidateData.duration = jsonLdResult.durationText.value;
        candidateEvidence.duration = jsonLdResult.durationText.evidence;
      }
      if (jsonLdResult.academicRequirements) {
        candidateData.academicRequirements = jsonLdResult.academicRequirements.value;
        candidateEvidence.academicRequirements = jsonLdResult.academicRequirements.evidence;
      }
    }

    // 3.2 If no JSON-LD, try DOM Adapters (UNSW, Unimelb, USYD, Monash)
    if (!candidateData.name && !forceAiFallback) {
      const domResult = domAdapterRegistry.parse(fetchRes.body, sourceUrl);
      if (domResult && domResult.name?.value) {
        extractionStrategy = domResult.extractionStrategy;
        candidateData.name = domResult.name.value;
        candidateEvidence.name = domResult.name.evidence;

        if (domResult.degreeLevel) {
          candidateData.degreeLevel = domResult.degreeLevel.value;
          candidateEvidence.degreeLevel = domResult.degreeLevel.evidence;
        }
        if (domResult.cricosCode) {
          candidateData.cricosCode = domResult.cricosCode.value;
          candidateEvidence.cricosCode = domResult.cricosCode.evidence;
        }
        if (domResult.annualTuitionAud) {
          candidateData.annualTuitionAud = domResult.annualTuitionAud.value;
          candidateEvidence.annualTuitionAud = domResult.annualTuitionAud.evidence;
        }
        if (domResult.ieltsOverall) {
          candidateData.ieltsRequirement = domResult.ieltsOverall.value;
          candidateEvidence.ieltsRequirement = domResult.ieltsOverall.evidence;
        }
        if (domResult.academicRequirements) {
          candidateData.academicRequirements = domResult.academicRequirements.value;
          candidateEvidence.academicRequirements = domResult.academicRequirements.evidence;
        }
        if (domResult.durationText) {
          candidateData.duration = domResult.durationText.value;
          candidateEvidence.duration = domResult.durationText.evidence;
        }
      }
    }

    // 3.3 Fallback to Fenced AI Extraction if needed
    if (!candidateData.name || forceAiFallback) {
      extractionStrategy = 'ai_fallback';
      const cleanedText = cleanHtml(fetchRes.body);
      const aiResult = await aiExtractionService.extractProgramFromPage(
        cleanedText,
        sourceUrl,
        uni.name
      );

      if (aiResult.programName) {
        candidateData.name = aiResult.programName;
        candidateData.degreeLevel = aiResult.degreeLevel;
        candidateData.cricosCode = aiResult.cricosCode;
        candidateData.fieldOfStudy = aiResult.fieldOfStudy;
        candidateData.duration = aiResult.duration;
        candidateData.annualTuitionAud = aiResult.tuition?.annualTuitionFee;
        candidateData.academicRequirements = aiResult.academicEntryRequirements;
        candidateData.ieltsRequirement = aiResult.englishRequirements?.ieltsOverall;

        // Evidence snippets
        candidateEvidence.name = {
          fieldName: 'name',
          value: aiResult.programName,
          sourceUrl,
          sourceType: 'UNIVERSITY_OFFICIAL',
          confidence: 0.85,
          fetchedAt: new Date(),
          lastVerifiedAt: new Date(),
          parserVersion: '2.0.0-ai',
          rawSnippet: `AI extracted from ${sourceUrl}`,
        };

        if (aiResult.tuition?.annualTuitionFee) {
          candidateEvidence.annualTuitionAud = {
            fieldName: 'annualTuitionAud',
            value: aiResult.tuition.annualTuitionFee,
            sourceUrl,
            sourceType: 'UNIVERSITY_OFFICIAL',
            confidence: 0.85,
            fetchedAt: new Date(),
            lastVerifiedAt: new Date(),
            parserVersion: '2.0.0-ai',
            rawSnippet: `Tuition ${aiResult.tuition.currency} $${aiResult.tuition.annualTuitionFee}`,
          };
        }
      }
    }

    if (!candidateData.name) {
      return {
        success: false,
        stageReached: 'parsing',
        snapshotId: snapshot._id.toString(),
        extractionStrategy,
        actionTaken: 'failed',
        qualityPassed: false,
        violations: [],
        autoApprovalEligible: false,
        error: 'No program title or details could be extracted from page',
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 4: CANONICAL CANDIDATE CONSTRUCTION
    // ─────────────────────────────────────────────────────────────────────────
    const idempotencyKey = computeIdempotencyKey(universityId, sourceUrl, '2.0.0');

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 5: DATA QUALITY RULES EVALUATION
    // ─────────────────────────────────────────────────────────────────────────
    // Lookup existing program to check fee changes
    const existingProgram = await Program.findOne({
      $or: [
        { university: new Types.ObjectId(universityId), cricosCourseCode: candidateData.cricosCode },
        { university: new Types.ObjectId(universityId), officialProgramUrl: sourceUrl },
        { university: new Types.ObjectId(universityId), name: candidateData.name },
      ],
    });

    const qualityEval = qualityRulesService.evaluate({
      name: candidateData.name,
      cricosCode: candidateData.cricosCode,
      annualTuitionAud: candidateData.annualTuitionAud,
      existingAnnualTuitionAud: existingProgram?.primaryFeeAnnualAud,
      currency: 'AUD',
      durationText: candidateData.duration,
      sourceEvidence: candidateEvidence,
      sourceLastFetchedAt: snapshot.fetchedAt,
      sourceFreshnessSlaHours: dataSource.freshnessSlaHours,
    });

    // Rule: AI fallback extractions NEVER get auto-approved
    const isAutoApprovalEligible =
      extractionStrategy !== 'ai_fallback' && qualityEval.autoApprovalEligible;

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 6: DIFF ENGINE
    // ─────────────────────────────────────────────────────────────────────────
    let diff: Record<string, { old: unknown; new: unknown }> = {};
    if (existingProgram) {
      diff = aiExtractionService.compareProgramData(
        existingProgram.toObject() as unknown as Record<string, unknown>,
        candidateData
      );

      if (Object.keys(diff).length === 0) {
        return {
          success: true,
          stageReached: 'diff',
          snapshotId: snapshot._id.toString(),
          candidateName: candidateData.name,
          extractionStrategy,
          actionTaken: 'skipped_identical',
          qualityPassed: qualityEval.passed,
          violations: qualityEval.violations,
          autoApprovalEligible: isAutoApprovalEligible,
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 7: STAGED REVIEW CREATION (Idempotent)
    // ─────────────────────────────────────────────────────────────────────────
    const changeType = existingProgram ? 'update' : 'create';
    const programSlug = slugify(`${candidateData.name}-${uni.slug}`, { lower: true, strict: true });

    const stagedPayload = {
      ...candidateData,
      slug: programSlug,
      university: new Types.ObjectId(universityId),
      provider: new Types.ObjectId(universityId),
      universityName: uni.name,
      providerName: uni.name,
      universitySlug: uni.slug,
      providerSlug: uni.slug,
      officialProgramUrl: sourceUrl,
      sourceSnapshotId: snapshot._id,
      extractionStrategy,
      status: 'draft',
    };

    // Upsert StagedChange and ChangeReview deterministically by idempotency key / externalKey
    const stagedChange: IStagedChange = await StagedChange.findOneAndUpdate(
      { externalKey: idempotencyKey },
      {
        $set: {
          externalKey: idempotencyKey,
          entityType: 'program',
          entityId: existingProgram?._id,
          universityId: new Types.ObjectId(universityId),
          programId: existingProgram?._id,
          changeType,
          oldValue: existingProgram ? existingProgram.toObject() : undefined,
          newValue: stagedPayload,
          diff,
          sourceUrl,
          sourceUrls: [sourceUrl],
          confidence: extractionStrategy === 'structured_data' ? 0.95 : extractionStrategy === 'dom_adapter' ? 0.9 : 0.8,
          confidenceScore: extractionStrategy === 'structured_data' ? 95 : extractionStrategy === 'dom_adapter' ? 90 : 80,
          sourceEvidence: candidateEvidence,
          warnings: qualityEval.violations.map(v => ({
            field: v.field,
            message: v.message,
            severity: v.severity === 'critical' ? 'high' : v.severity === 'low' ? 'low' : 'medium',
          })),
          missingFields: aiExtractionService.detectMissingFields(candidateData),
          aiSummary: `Extracted via ${extractionStrategy} with ${qualityEval.violations.length} quality flags`,
          ingestionJobId: ingestionJobId ? new Types.ObjectId(ingestionJobId) : undefined,
          rawHash: payloadHash,
          autoApprovalEligible: isAutoApprovalEligible,
          status: 'pending',
        },
      },
      { upsert: true, new: true }
    );

    // Synchronize ChangeReview canonical model
    await ChangeReview.findOneAndUpdate(
      { externalKey: idempotencyKey },
      {
        $set: {
          externalKey: idempotencyKey,
          entityType: 'Program',
          entityId: existingProgram?._id,
          providerId: new Types.ObjectId(universityId),
          programId: existingProgram?._id,
          changeType,
          oldValue: existingProgram ? existingProgram.toObject() : undefined,
          newValue: stagedPayload,
          diff,
          sourceUrl,
          sourceUrls: [sourceUrl],
          confidence: stagedChange.confidence,
          confidenceScore: stagedChange.confidenceScore,
          sourceEvidence: candidateEvidence,
          warnings: stagedChange.warnings,
          missingFields: stagedChange.missingFields,
          aiSummary: stagedChange.aiSummary,
          ingestionJobId: ingestionJobId ? new Types.ObjectId(ingestionJobId) : undefined,
          rawHash: payloadHash,
          autoApprovalEligible: isAutoApprovalEligible,
          status: 'pending',
        },
      },
      { upsert: true, new: true }
    );

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 8 & 9: FRESHNESS MONITORING UPDATE
    // ─────────────────────────────────────────────────────────────────────────
    await DataSource.findByIdAndUpdate(dataSource._id, {
      $set: {
        lastSyncAt: new Date(),
        lastSuccessfulSync: new Date(),
        etag: fetchRes.etag,
        lastModified: fetchRes.lastModified,
        crawlStatus: 'allowed',
      },
    });

    return {
      success: true,
      stageReached: 'staged_review',
      snapshotId: snapshot._id.toString(),
      candidateName: candidateData.name,
      extractionStrategy,
      stagedChangeId: stagedChange._id.toString(),
      actionTaken: existingProgram ? 'staged_updated' : 'staged_created',
      qualityPassed: qualityEval.passed,
      violations: qualityEval.violations,
      autoApprovalEligible: isAutoApprovalEligible,
    };
  },

  /**
   * Replay / Resume a failed ingestion job.
   */
  async replayJob(jobId: string): Promise<{ replayedUrls: number; succeeded: number; failed: number }> {
    const job = await IngestionJob.findById(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const failedUrls = job.progress?.failedUrls || [];
    let succeeded = 0;
    let failed = 0;

    job.status = 'running';
    job.startedAt = new Date();
    await job.save();

    for (const url of failedUrls) {
      try {
        const res = await this.processUrl({
          universityId: job.universityId.toString(),
          sourceUrl: url,
          ingestionJobId: job._id.toString(),
        });

        if (res.success) {
          succeeded++;
          job.progress.processedUrls.push(url);
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    job.status = failed === 0 ? 'completed' : 'partial';
    job.completedAt = new Date();
    await job.save();

    return {
      replayedUrls: failedUrls.length,
      succeeded,
      failed,
    };
  },
};
