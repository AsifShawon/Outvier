/**
 * structuredData.parser.ts — Schema.org JSON-LD & Microdata Course Parser.
 * Extracts structured Course & EducationalOccupationalProgram definitions with exact JSON evidence.
 */

import * as cheerio from 'cheerio';
import { IFieldEvidence } from '../../models/FieldEvidence.model';

export interface ParsedFact<T = any> {
  value: T;
  evidence: IFieldEvidence;
}

export interface StructuredProgramCandidate {
  name?: ParsedFact<string>;
  degreeLevel?: ParsedFact<string>;
  providerName?: ParsedFact<string>;
  fieldOfStudy?: ParsedFact<string>;
  description?: ParsedFact<string>;
  cricosCode?: ParsedFact<string>;
  annualTuitionAud?: ParsedFact<number>;
  totalTuitionAud?: ParsedFact<number>;
  durationText?: ParsedFact<string>;
  academicRequirements?: ParsedFact<string>;
  rawJsonLd?: any;
  extractionStrategy: 'structured_data';
}

export const structuredDataParser = {
  /**
   * Parse JSON-LD scripts from HTML and extract Course facts.
   */
  parse(html: string, sourceUrl: string): StructuredProgramCandidate | null {
    const $ = cheerio.load(html);
    const scripts = $('script[type="application/ld+json"]');

    if (scripts.length === 0) return null;

    let targetCourseNode: any = null;
    let rawJsonSnippet: string = '';

    scripts.each((_, el) => {
      try {
        const text = $(el).text().trim();
        if (!text) return;
        const parsed = JSON.parse(text);

        // Check if root object is Course or EducationalOccupationalProgram
        const nodes = Array.isArray(parsed) ? parsed : parsed['@graph'] ? parsed['@graph'] : [parsed];

        for (const node of nodes) {
          const type = node['@type'];
          if (
            type === 'Course' ||
            type === 'EducationalOccupationalProgram' ||
            (Array.isArray(type) && (type.includes('Course') || type.includes('EducationalOccupationalProgram')))
          ) {
            targetCourseNode = node;
            rawJsonSnippet = JSON.stringify(node, null, 2);
            break;
          }
        }
      } catch {
        // Skip invalid JSON-LD script tags
      }
    });

    if (!targetCourseNode) return null;

    const candidate: StructuredProgramCandidate = {
      rawJsonLd: targetCourseNode,
      extractionStrategy: 'structured_data',
    };

    const makeEvidence = (fieldName: string, value: any, snippet?: string): IFieldEvidence => ({
      fieldName,
      value,
      sourceUrl,
      sourceType: 'UNIVERSITY_OFFICIAL',
      confidence: 0.95,
      fetchedAt: new Date(),
      lastVerifiedAt: new Date(),
      parserVersion: '1.0.0-jsonld',
      rawSnippet: snippet || rawJsonSnippet.slice(0, 500),
    });

    // 1. Name
    if (targetCourseNode.name) {
      candidate.name = {
        value: String(targetCourseNode.name).trim(),
        evidence: makeEvidence('name', targetCourseNode.name, `name: "${targetCourseNode.name}"`),
      };
    }

    // 2. Description
    if (targetCourseNode.description) {
      candidate.description = {
        value: String(targetCourseNode.description).trim(),
        evidence: makeEvidence('description', targetCourseNode.description),
      };
    }

    // 3. Provider
    const providerObj = targetCourseNode.provider || targetCourseNode.offeredBy;
    if (providerObj?.name) {
      candidate.providerName = {
        value: String(providerObj.name).trim(),
        evidence: makeEvidence('providerName', providerObj.name, `provider: "${providerObj.name}"`),
      };
    }

    // 4. Credential / Degree Level
    const credential = targetCourseNode.educationalCredentialAwarded || targetCourseNode.programType;
    if (credential) {
      candidate.degreeLevel = {
        value: String(credential).trim(),
        evidence: makeEvidence('degreeLevel', credential, `credential: "${credential}"`),
      };
    }

    // 5. Offers / Fees
    const offers = targetCourseNode.offers || targetCourseNode.hasCourseInstance?.offers;
    if (offers) {
      const offerList = Array.isArray(offers) ? offers : [offers];
      for (const offer of offerList) {
        if (offer.price !== undefined) {
          const priceNum = typeof offer.price === 'number' ? offer.price : parseFloat(String(offer.price).replace(/[^0-9.]/g, ''));
          if (!isNaN(priceNum) && priceNum > 0) {
            candidate.annualTuitionAud = {
              value: priceNum,
              evidence: makeEvidence('annualTuitionAud', priceNum, JSON.stringify(offer)),
            };
            break;
          }
        }
      }
    }

    // 6. Prerequisites / Academic Requirements
    if (targetCourseNode.coursePrerequisites) {
      const prereq = typeof targetCourseNode.coursePrerequisites === 'string'
        ? targetCourseNode.coursePrerequisites
        : JSON.stringify(targetCourseNode.coursePrerequisites);
      candidate.academicRequirements = {
        value: prereq,
        evidence: makeEvidence('academicRequirements', prereq),
      };
    }

    // 7. Duration
    if (targetCourseNode.timeToComplete) {
      candidate.durationText = {
        value: String(targetCourseNode.timeToComplete),
        evidence: makeEvidence('durationText', targetCourseNode.timeToComplete),
      };
    }

    return candidate;
  },
};
