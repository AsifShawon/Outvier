/**
 * aiExtraction.service.ts
 * AI Brain for Outvier's program ingestion pipeline.
 *
 * Functions:
 * - extractProgramFromPage()     — send cleaned page to AI, get structured JSON
 * - normalizeProgramData()       — merge extractions from multiple sources
 * - compareProgramData()         — diff existing vs incoming program
 * - generateConfidenceScore()    — 0-100 score based on source quality + completeness
 * - generateAdminSummary()       — human-readable summary for admin review
 * - detectMissingFields()        — list important missing fields
 *
 * Provider-agnostic: uses existing aiService.getModel() pattern.
 * Falls back to rule-based extraction if AI fails.
 */

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { aiService } from './ai.service';
import {
  ProgramExtractionResultSchema,
  ProgramExtractionResult,
  ProgramNormalizedRecord,
  ConfidenceInput,
} from '../schemas/ingestion.schema';

// ---------------------------------------------------------------------------
// System prompt for extraction
// ---------------------------------------------------------------------------

const EXTRACTION_SYSTEM_PROMPT = `
You are a precise data extraction engine for Outvier, an Australian university comparison platform.

Your task: Extract structured program/course information from the provided web page text.

STRICT RULES:
1. Return ONLY valid JSON matching the schema below. No markdown, no explanation.
2. If a field is not found in the text, set it to null. NEVER invent or guess values.
3. NEVER hallucinate fees, CRICOS codes, IELTS scores, dates, or requirements.
4. Keep fee values in their original currency (usually AUD).
5. Keep original wording for requirements — do not paraphrase.
6. If data is ambiguous, add a warning to the warnings array.
7. Degree levels must be one of: Bachelor, Master, PhD, Diploma, Graduate Certificate, Graduate Diploma, Associate Degree, Certificate, Other.
8. CRICOS codes are 6-digit numbers followed by a letter (e.g., "012345A").
9. IELTS scores are numbers like 6.5, 7.0. PTE scores are integers like 58, 65.
10. If you see "international students" fees, use those for tuition.
11. DO NOT include any "thinking" or "reasoning" blocks (like <think> tags). Return ONLY the JSON.

SCHEMA:
{
  "programName": string | null,
  "degreeLevel": "Bachelor"|"Master"|"PhD"|"Diploma"|"Graduate Certificate"|"Graduate Diploma"|"Associate Degree"|"Certificate"|"Other" | null,
  "faculty": string | null,
  "fieldOfStudy": string | null,
  "discipline": string | null,
  "cricosCode": string | null,
  "programCode": string | null,
  "campus": string | null,
  "city": string | null,
  "state": string | null,
  "deliveryMode": "on-campus"|"online"|"hybrid" | null,
  "studyMode": "full-time"|"part-time"|"both" | null,
  "domesticAvailable": boolean | null,
  "internationalAvailable": boolean | null,
  "officialProgramUrl": string | null,
  "duration": string | null,
  "estimatedCompletionTime": string | null,
  "courseStructure": {
    "creditPoints": number | null,
    "numberOfUnits": number | null,
    "coreCourses": string[],
    "electiveCourses": string[],
    "majors": string[],
    "hasInternship": boolean | null,
    "hasThesis": boolean | null,
    "notes": string | null
  } | null,
  "academicEntryRequirements": string | null,
  "minimumGPA": string | null,
  "prerequisiteSubjects": string[],
  "englishRequirements": {
    "ieltsOverall": number | null,
    "ieltsBandMin": number | null,
    "toefl": number | null,
    "pte": number | null,
    "duolingo": number | null,
    "notes": string | null,
    "sourceUrl": string | null
  } | null,
  "portfolioRequired": boolean | null,
  "workExperienceRequired": boolean | null,
  "countrySpecificRequirements": string | null,
  "tuition": {
    "annualTuitionFee": number | null,
    "totalEstimatedTuitionFee": number | null,
    "currency": "AUD",
    "feeYear": string | null,
    "applicationFee": number | null,
    "indicativeLivingCost": number | null,
    "additionalCosts": {} | null,
    "sourceUrl": string | null
  } | null,
  "scholarships": {
    "available": boolean,
    "names": string[],
    "url": string | null
  } | null,
  "intakes": {
    "months": string[],
    "semesterAvailability": string[],
    "applicationDeadline": string | null,
    "internationalDeadline": string | null,
    "startDate": string | null,
    "nextAvailableIntake": string | null
  } | null,
  "careerOutcomes": {
    "opportunities": string[],
    "jobRoles": string[],
    "industryPathways": string[],
    "accreditation": string[],
    "professionalBodies": string[],
    "graduateOutcomeUrl": string | null
  } | null,
  "aiSummary": string | null,
  "warnings": [{ "field": string, "message": string, "severity": "low"|"medium"|"high" }]
}
`.trim();

// ---------------------------------------------------------------------------
// Rule-based fallback extraction
// ---------------------------------------------------------------------------

function ruleBasedExtract(text: string, sourceUrl: string): Partial<ProgramExtractionResult> {
  const result: Partial<ProgramExtractionResult> = {
    warnings: [{ field: 'general', message: 'AI unavailable — rule-based extraction only. Low confidence.', severity: 'high' }],
  };

  // Program name — look for common patterns or first non-empty line
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
  if (lines.length > 0) {
    // Usually the first line is the title, or contains "Bachelor", "Master", etc.
    const titleCandidates = lines.slice(0, 5);
    const bestCandidate = titleCandidates.find(l => 
      l.length < 150 && 
      (l.includes('Bachelor') || l.includes('Master') || l.includes('Doctor') || l.includes('Diploma'))
    ) || titleCandidates[0];
    
    if (bestCandidate && bestCandidate.length < 200) {
      result.programName = bestCandidate;
    }
  }

  // Degree level
  const degreeLevels = ['Bachelor', 'Master', 'PhD', 'Diploma', 'Graduate Certificate', 'Graduate Diploma', 'Associate Degree', 'Certificate'];
  for (const level of degreeLevels) {
    if (text.includes(level)) {
      result.degreeLevel = level as ProgramExtractionResult['degreeLevel'];
      break;
    }
  }

  // CRICOS code
  const cricosMatch = text.match(/CRICOS[^:]*:?\s*([0-9]{6}[A-Za-z])/i);
  if (cricosMatch) result.cricosCode = cricosMatch[1].toUpperCase();

  // Duration
  const durationMatch = text.match(/(\d+(?:\.\d+)?)\s*years?\s*(?:full[- ]time)?/i);
  if (durationMatch) result.duration = durationMatch[0].trim();

  // IELTS
  const ieltsMatch = text.match(/IELTS[^0-9]*([5-9](?:\.[05])?)/i);
  if (ieltsMatch) {
    result.englishRequirements = {
      ieltsOverall: parseFloat(ieltsMatch[1]),
    };
  }

  // Annual tuition (Australian fee format)
  const feeMatch = text.match(/\$([0-9,]+)\s*(?:per year|p\.?a\.?|annually)/i);
  if (feeMatch) {
    result.tuition = {
      annualTuitionFee: parseFloat(feeMatch[1].replace(/,/g, '')),
      currency: 'AUD',
    };
  }

  // Intakes
  const months = ['February', 'March', 'July', 'August', 'November', 'January', 'June', 'September'];
  const foundMonths = months.filter(m => text.includes(m));
  if (foundMonths.length > 0) {
    result.intakes = { months: foundMonths };
  }

  result.officialProgramUrl = sourceUrl;
  return result;
}

// ---------------------------------------------------------------------------
// Main AI extraction function
// ---------------------------------------------------------------------------

export const aiExtractionService = {
  /**
   * Extract structured program data from cleaned page text.
   * Falls back to rule-based if AI fails.
   */
  async extractProgramFromPage(
    pageText: string,
    sourceUrl: string,
    universityName: string
  ): Promise<ProgramExtractionResult & { _aiUsed: boolean }> {
    const contextPrompt = `
University: ${universityName}
Source URL: ${sourceUrl}

Page Content:
${pageText.substring(0, 8000)}
`.trim();

    let aiUsed = false;

    try {
      const model = await aiService.getModel();
      
      const invokeOptions: any = {};
      if (process.env.DEFAULT_AI_PROVIDER === 'ollama') {
        invokeOptions.format = 'json';
      } else if (process.env.DEFAULT_AI_PROVIDER === 'groq') {
        invokeOptions.response_format = { type: 'json_object' };
      }

      const response = await model.invoke([
        new SystemMessage(EXTRACTION_SYSTEM_PROMPT),
        new HumanMessage(contextPrompt),
      ], invokeOptions);

      const rawContent = response.content.toString().trim();

      // Strip possible "thinking" blocks from reasoning models (e.g. DeepSeek-R1 via Ollama)
      const cleanContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

      // Strip possible markdown code fences
      const jsonStr = cleanContent
        .replace(/^```json?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();

      let parsed: any;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        // AI returned non-JSON
        console.warn('[aiExtraction] AI returned non-JSON, using rule-based fallback:', sourceUrl);
        const fallback = ruleBasedExtract(pageText, sourceUrl);
        return { 
          programName: null, 
          degreeLevel: null, 
          ...fallback, 
          _aiUsed: false,
          warnings: [{ field: 'general', message: 'AI returned non-JSON response', severity: 'high' }]
        } as any;
      }

      // Validate with Zod
      const validated = ProgramExtractionResultSchema.safeParse(parsed);
      if (!validated.success) {
        console.warn('[aiExtraction] Zod validation failed for URL:', sourceUrl);
        console.warn('[aiExtraction] Validation Errors:', JSON.stringify(validated.error.errors, null, 2));
        console.warn('[aiExtraction] Raw AI Content:', rawContent);
        
        const fallback = ruleBasedExtract(pageText, sourceUrl);
        return { 
          programName: null, 
          degreeLevel: null, 
          ...fallback, 
          _aiUsed: false,
          warnings: [
            { field: 'general', message: 'AI output schema validation failed', severity: 'high' },
            ...(fallback.warnings || [])
          ]
        } as any;
      }

      aiUsed = true;
      return { ...validated.data, _aiUsed: true };

    } catch (aiErr: any) {
      console.warn('[aiExtraction] AI call failed, using rule-based fallback:', aiErr.message);
      const fallback = ruleBasedExtract(pageText, sourceUrl);
      return { 
        programName: null, 
        degreeLevel: null, 
        ...fallback, 
        _aiUsed: false,
        warnings: [{
          field: 'general',
          message: `AI unavailable: ${aiErr.message}. Rule-based extraction used.`,
          severity: 'high',
        }]
      } as any;
    }
  },

  /**
   * Merge multiple extraction results from different sources.
   * Higher-priority sources win conflicts. Source priority:
   * CRICOS > TEQSA > UNIVERSITY_OFFICIAL > FEE_PAGE > REQUIREMENT_PAGE > SCHOLARSHIP_PAGE > SECONDARY
   */
  normalizeProgramData(
    extractions: Array<{
      data: ProgramExtractionResult;
      sourceUrl: string;
      sourceType: string;
      sourcePriority: number; // higher = more trusted
    }>,
    universityId: string,
    universityName: string
  ): ProgramNormalizedRecord {
    // Sort by priority descending
    const sorted = [...extractions].sort((a, b) => b.sourcePriority - a.sourcePriority);

    const merged: Record<string, any> = {};
    const sourceEvidence: Record<string, any> = {};

    const fieldsToPick: (keyof ProgramExtractionResult)[] = [
      'programName', 'degreeLevel', 'faculty', 'fieldOfStudy', 'discipline',
      'cricosCode', 'programCode', 'campus', 'city', 'state', 'deliveryMode',
      'studyMode', 'domesticAvailable', 'internationalAvailable', 'officialProgramUrl',
      'duration', 'estimatedCompletionTime', 'courseStructure', 'academicEntryRequirements',
      'minimumGPA', 'prerequisiteSubjects', 'englishRequirements', 'portfolioRequired',
      'workExperienceRequired', 'countrySpecificRequirements', 'tuition', 'scholarships',
      'intakes', 'careerOutcomes',
    ];

    for (const field of fieldsToPick) {
      for (const extraction of sorted) {
        const val = (extraction.data as any)[field];
        if (val !== null && val !== undefined && !(Array.isArray(val) && val.length === 0)) {
          if (merged[field] === undefined) {
            merged[field] = val;
            sourceEvidence[field] = {
              value: typeof val === 'object' ? '[object]' : val,
              sourceUrl: extraction.sourceUrl,
              sourceType: extraction.sourceType,
              confidence: extraction.sourcePriority * 10,
              extractedAt: new Date().toISOString(),
            };
          }
          break;
        }
      }
    }

    // Collect all source URLs
    const sourceUrls = [...new Set(extractions.map(e => e.sourceUrl))];

    // Collect all warnings
    const allWarnings = extractions.flatMap(e => e.data.warnings || []);

    const extractedAt = new Date().toISOString();
    const confidenceScore = this.generateConfidenceScore({
      hasOfficialSource: extractions.some(e => e.sourceType === 'UNIVERSITY_OFFICIAL'),
      hasCricosCode: !!merged.cricosCode,
      hasFeeData: !!merged.tuition?.annualTuitionFee,
      hasRequirementData: !!(merged.academicEntryRequirements || merged.englishRequirements),
      hasCourseStructure: !!merged.courseStructure,
      hasIntakeData: !!(merged.intakes?.months?.length),
      hasScholarshipData: merged.scholarships?.available === true,
      multipleSourcesAgree: extractions.length > 1,
      aiWarnings: allWarnings.filter(w => w.severity === 'high').length,
      fieldsExtracted: Object.keys(merged).filter(k => merged[k] !== null).length,
      totalFields: fieldsToPick.length,
    });

    const missingFields = this.detectMissingFields(merged as ProgramExtractionResult);
    const aiSummary = sorted[0]?.data.aiSummary || null;

    return {
      ...merged,
      universityId,
      universityName,
      sourceUrls,
      sourceEvidence,
      confidenceScore,
      missingFields,
      needsAdminReview: true,
      dataSourceType: sorted[0]?.sourceType as any,
      extractedAt,
      lastCheckedAt: extractedAt,
      warnings: allWarnings,
      aiSummary,
    } as ProgramNormalizedRecord;
  },

  /**
   * Compare existing program data with incoming data.
   * Returns a per-field diff showing changed fields.
   */
  compareProgramData(
    existing: Record<string, unknown>,
    incoming: Record<string, unknown>
  ): Record<string, { old: unknown; new: unknown }> {
    const diff: Record<string, { old: unknown; new: unknown }> = {};
    const allKeys = new Set([...Object.keys(existing), ...Object.keys(incoming)]);

    for (const key of allKeys) {
      const oldVal = existing[key];
      const newVal = incoming[key];
      const oldStr = JSON.stringify(oldVal);
      const newStr = JSON.stringify(newVal);
      if (oldStr !== newStr && newVal !== undefined && newVal !== null) {
        diff[key] = { old: oldVal, new: newVal };
      }
    }

    return diff;
  },

  /**
   * Calculate a 0-100 confidence score for extracted program data.
   */
  generateConfidenceScore(input: ConfidenceInput): number {
    let score = 0;

    // Source quality (max 40)
    if (input.hasOfficialSource) score += 25;
    if (input.hasCricosCode) score += 15;

    // Data completeness (max 35)
    const completeness = input.fieldsExtracted / input.totalFields;
    score += Math.round(completeness * 35);

    // Specific field presence (max 20)
    if (input.hasFeeData) score += 5;
    if (input.hasRequirementData) score += 5;
    if (input.hasCourseStructure) score += 4;
    if (input.hasIntakeData) score += 3;
    if (input.hasScholarshipData) score += 3;

    // Multi-source agreement bonus (max 5)
    if (input.multipleSourcesAgree) score += 5;

    // Penalty for AI warnings
    const warningPenalty = Math.min(input.aiWarnings * 5, 20);
    score -= warningPenalty;

    return Math.max(0, Math.min(100, score));
  },

  /**
   * Generate a human-readable summary for admin review UI.
   */
  generateAdminSummary(program: Partial<ProgramNormalizedRecord>): string {
    const parts: string[] = [];

    if (program.programName) parts.push(`**${program.programName}**`);
    if (program.degreeLevel) parts.push(`(${program.degreeLevel})`);
    if (program.faculty) parts.push(`— ${program.faculty}`);
    if (program.duration) parts.push(`• Duration: ${program.duration}`);
    if (program.tuition?.annualTuitionFee) {
      parts.push(`• Annual Tuition: ${program.tuition.currency} $${program.tuition.annualTuitionFee.toLocaleString()}`);
    }
    if (program.cricosCode) parts.push(`• CRICOS: ${program.cricosCode}`);
    if (program.confidenceScore !== undefined) {
      parts.push(`• Confidence: ${program.confidenceScore}/100`);
    }
    if (program.missingFields && program.missingFields.length > 0) {
      parts.push(`• Missing: ${program.missingFields.slice(0, 5).join(', ')}`);
    }

    return parts.join(' ');
  },

  /**
   * Detect important missing fields that an admin should fill in.
   */
  detectMissingFields(program: Partial<ProgramExtractionResult>): string[] {
    const importantFields: Array<[keyof ProgramExtractionResult, string]> = [
      ['programName', 'Program Name'],
      ['degreeLevel', 'Degree Level'],
      ['fieldOfStudy', 'Field of Study'],
      ['duration', 'Duration'],
      ['campus', 'Campus'],
      ['officialProgramUrl', 'Official URL'],
      ['cricosCode', 'CRICOS Code'],
      ['academicEntryRequirements', 'Academic Requirements'],
      ['englishRequirements', 'English Requirements'],
    ];

    const missing: string[] = [];
    for (const [field, label] of importantFields) {
      const val = program[field];
      if (val === null || val === undefined || val === '') {
        missing.push(label);
      }
    }

    if (!program.tuition?.annualTuitionFee) missing.push('Annual Tuition Fee');
    if (!program.intakes?.months?.length) missing.push('Intake Months');

    return missing;
  },
};
