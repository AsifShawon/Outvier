/**
 * qualityRules.service.ts — Automated Data Quality Rules Engine.
 *
 * Rules:
 * 1. INVALID_CRICOS_CODE: Validates Australian CRICOS format (6 digits + 1 alphanumeric).
 * 2. IMPOSSIBLE_DATES: Checks invalid dates, start > end, deadline > start.
 * 3. UNSUPPORTED_CURRENCY: Validates ISO 4217 currency code.
 * 4. DUPLICATE_OFFERINGS: Detects duplicate campus/studyMode/cricos offerings.
 * 5. FEE_SPIKE_THRESHOLD: Flags fee changes >25% for human review.
 * 6. STALE_SOURCE: Flags sources exceeding freshness SLA.
 * 7. MISSING_EVIDENCE: Flags facts lacking supporting source URL or snippet.
 */

import { IFieldEvidence } from '../models/FieldEvidence.model';

export interface QualityViolation {
  ruleId:
    | 'INVALID_CRICOS_CODE'
    | 'IMPOSSIBLE_DATES'
    | 'UNSUPPORTED_CURRENCY'
    | 'DUPLICATE_OFFERINGS'
    | 'FEE_SPIKE_THRESHOLD'
    | 'STALE_SOURCE'
    | 'MISSING_EVIDENCE';
  severity: 'critical' | 'high' | 'medium' | 'low';
  field: string;
  message: string;
  blocking: boolean; // If true, candidate cannot be auto-approved
  metadata?: Record<string, any>;
}

export interface CandidateQualityInput {
  name?: string;
  cricosCode?: string;
  annualTuitionAud?: number;
  existingAnnualTuitionAud?: number;
  currency?: string;
  durationText?: string;
  intakes?: Array<{
    startDate?: Date | string;
    deadline?: Date | string;
    term?: string;
  }>;
  offerings?: Array<{
    campusId?: string;
    studyMode?: string;
    cricosCode?: string;
  }>;
  sourceEvidence?: Record<string, IFieldEvidence> | Map<string, IFieldEvidence>;
  sourceLastFetchedAt?: Date | string;
  sourceFreshnessSlaHours?: number;
}

const SUPPORTED_CURRENCIES = new Set(['AUD', 'USD', 'GBP', 'EUR', 'NZD', 'CAD', 'SGD']);
const DEFAULT_FEE_SPIKE_THRESHOLD_RATIO = 0.25; // 25% change

export const qualityRulesService = {
  /**
   * Run all data quality checks on an incoming candidate.
   */
  evaluate(input: CandidateQualityInput): {
    passed: boolean;
    violations: QualityViolation[];
    blockingViolations: QualityViolation[];
    autoApprovalEligible: boolean;
  } {
    const violations: QualityViolation[] = [];

    // 1. CRICOS Code Validation
    if (input.cricosCode) {
      const cricosRegex = /^\d{6}[A-Za-z0-9]$/;
      const cleanCode = input.cricosCode.trim();
      if (!cricosRegex.test(cleanCode)) {
        violations.push({
          ruleId: 'INVALID_CRICOS_CODE',
          severity: 'critical',
          field: 'cricosCode',
          message: `CRICOS code "${input.cricosCode}" does not match Australian format (6 digits + 1 alphanumeric character)`,
          blocking: true,
          metadata: { providedCode: input.cricosCode },
        });
      }
    }

    // 2. Impossible Dates Validation
    if (input.intakes && Array.isArray(input.intakes)) {
      for (const intake of input.intakes) {
        if (intake.startDate) {
          const startDateObj = new Date(intake.startDate);
          if (isNaN(startDateObj.getTime())) {
            violations.push({
              ruleId: 'IMPOSSIBLE_DATES',
              severity: 'critical',
              field: 'intakes.startDate',
              message: `Invalid calendar date format for intake start date: "${intake.startDate}"`,
              blocking: true,
            });
          }

          if (intake.deadline) {
            const deadlineObj = new Date(intake.deadline);
            if (isNaN(deadlineObj.getTime())) {
              violations.push({
                ruleId: 'IMPOSSIBLE_DATES',
                severity: 'high',
                field: 'intakes.deadline',
                message: `Invalid calendar date format for intake deadline: "${intake.deadline}"`,
                blocking: true,
              });
            } else if (deadlineObj > startDateObj) {
              violations.push({
                ruleId: 'IMPOSSIBLE_DATES',
                severity: 'critical',
                field: 'intakes.deadline',
                message: `Application deadline (${deadlineObj.toISOString().slice(0, 10)}) is after the intake start date (${startDateObj.toISOString().slice(0, 10)})`,
                blocking: true,
              });
            }
          }
        }
      }
    }

    // 3. Unsupported Currency Validation
    if (input.currency) {
      const upperCurr = input.currency.toUpperCase().trim();
      if (!SUPPORTED_CURRENCIES.has(upperCurr)) {
        violations.push({
          ruleId: 'UNSUPPORTED_CURRENCY',
          severity: 'high',
          field: 'currency',
          message: `Currency "${input.currency}" is not a recognized ISO 4217 tuition currency`,
          blocking: true,
          metadata: { currency: input.currency },
        });
      } else if (upperCurr !== 'AUD') {
        violations.push({
          ruleId: 'UNSUPPORTED_CURRENCY',
          severity: 'medium',
          field: 'currency',
          message: `Non-AUD currency "${input.currency}" supplied for Australian institution`,
          blocking: false,
          metadata: { currency: input.currency },
        });
      }
    }

    // 4. Duplicate Offerings Validation
    if (input.offerings && Array.isArray(input.offerings) && input.offerings.length > 1) {
      const seenOfferingKeys = new Set<string>();
      for (const off of input.offerings) {
        const key = `${off.campusId || 'main'}|${off.studyMode || 'on-campus'}|${off.cricosCode || 'none'}`;
        if (seenOfferingKeys.has(key)) {
          violations.push({
            ruleId: 'DUPLICATE_OFFERINGS',
            severity: 'high',
            field: 'offerings',
            message: `Duplicate offering detected for campus "${off.campusId}", mode "${off.studyMode}", CRICOS "${off.cricosCode}"`,
            blocking: true,
            metadata: { duplicateKey: key },
          });
        }
        seenOfferingKeys.add(key);
      }
    }

    // 5. Fee Spike Threshold Check
    if (
      typeof input.annualTuitionAud === 'number' &&
      input.annualTuitionAud > 0 &&
      typeof input.existingAnnualTuitionAud === 'number' &&
      input.existingAnnualTuitionAud > 0
    ) {
      const diff = Math.abs(input.annualTuitionAud - input.existingAnnualTuitionAud);
      const ratio = diff / input.existingAnnualTuitionAud;
      if (ratio > DEFAULT_FEE_SPIKE_THRESHOLD_RATIO) {
        const pct = Math.round(ratio * 100);
        violations.push({
          ruleId: 'FEE_SPIKE_THRESHOLD',
          severity: 'high',
          field: 'annualTuitionAud',
          message: `Annual tuition fee changed by ${pct}% (from $${input.existingAnnualTuitionAud} to $${input.annualTuitionAud}), exceeding the ${DEFAULT_FEE_SPIKE_THRESHOLD_RATIO * 100}% threshold`,
          blocking: true, // Requires human review
          metadata: {
            oldFee: input.existingAnnualTuitionAud,
            newFee: input.annualTuitionAud,
            percentageChange: pct,
          },
        });
      }
    }

    // 6. Stale Source Check
    if (input.sourceLastFetchedAt && input.sourceFreshnessSlaHours) {
      const fetchedDate = new Date(input.sourceLastFetchedAt);
      const ageHours = (Date.now() - fetchedDate.getTime()) / (1000 * 60 * 60);
      if (ageHours > input.sourceFreshnessSlaHours) {
        violations.push({
          ruleId: 'STALE_SOURCE',
          severity: 'medium',
          field: 'sourceLastFetchedAt',
          message: `Source data is ${Math.round(ageHours)} hours old, exceeding freshness SLA of ${input.sourceFreshnessSlaHours} hours`,
          blocking: false,
          metadata: { ageHours, slaHours: input.sourceFreshnessSlaHours },
        });
      }
    }

    // 7. Missing Evidence Check
    const criticalFields = ['annualTuitionAud', 'cricosCode'];
    if (input.sourceEvidence) {
      const evidenceMap = input.sourceEvidence instanceof Map
        ? Object.fromEntries(input.sourceEvidence)
        : input.sourceEvidence;

      for (const field of criticalFields) {
        const val = (input as any)[field];
        if (val !== undefined && val !== null && val !== '') {
          const evidence = evidenceMap[field];
          if (!evidence || !evidence.sourceUrl || !evidence.confidence) {
            violations.push({
              ruleId: 'MISSING_EVIDENCE',
              severity: 'high',
              field,
              message: `Critical field "${field}" has value (${val}) but lacks supporting source URL or confidence evidence`,
              blocking: true,
              metadata: { field, value: val },
            });
          }
        }
      }
    }

    const blockingViolations = violations.filter(v => v.blocking);
    const passed = violations.length === 0;
    const autoApprovalEligible = blockingViolations.length === 0;

    return {
      passed,
      violations,
      blockingViolations,
      autoApprovalEligible,
    };
  },
};
