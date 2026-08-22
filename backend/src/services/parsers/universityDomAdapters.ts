/**
 * universityDomAdapters.ts — DOM Adapters for Australian University Site Structures.
 * Extracts course facts with precise supporting HTML/text fragments (FieldEvidence).
 */

import * as cheerio from 'cheerio';
import { IFieldEvidence } from '../../models/FieldEvidence.model';
import { ParsedFact } from './structuredData.parser';

export interface DomParsedProgramCandidate {
  name?: ParsedFact<string>;
  degreeLevel?: ParsedFact<string>;
  fieldOfStudy?: ParsedFact<string>;
  cricosCode?: ParsedFact<string>;
  durationText?: ParsedFact<string>;
  annualTuitionAud?: ParsedFact<number>;
  domesticAnnualTuitionAud?: ParsedFact<number>;
  ieltsOverall?: ParsedFact<number>;
  academicRequirements?: ParsedFact<string>;
  intakeMonths?: ParsedFact<string[]>;
  campus?: ParsedFact<string>;
  studyMode?: ParsedFact<string>;
  extractionStrategy: 'dom_adapter' | 'generic_dom';
  adapterName: string;
}

export interface UniversityDomAdapter {
  name: string;
  matches(url: string, html: string): boolean;
  parse(html: string, sourceUrl: string): DomParsedProgramCandidate | null;
}

function makeEvidence(
  fieldName: string,
  value: any,
  sourceUrl: string,
  snippet: string,
  confidence = 0.9,
  parserVersion = '1.0.0-dom'
): IFieldEvidence {
  return {
    fieldName,
    value,
    sourceUrl,
    sourceType: 'UNIVERSITY_OFFICIAL',
    confidence,
    fetchedAt: new Date(),
    lastVerifiedAt: new Date(),
    parserVersion,
    rawSnippet: snippet.slice(0, 500).trim(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. UNSW DOM ADAPTER
// ─────────────────────────────────────────────────────────────────────────────
export const unswDomAdapter: UniversityDomAdapter = {
  name: 'UNSW Sydney DOM Adapter',
  matches(url: string, html: string): boolean {
    return url.includes('unsw.edu.au') || html.includes('UNSW Sydney') || html.includes('unsw-course-details');
  },
  parse(html: string, sourceUrl: string): DomParsedProgramCandidate | null {
    const $ = cheerio.load(html);
    const candidate: DomParsedProgramCandidate = {
      extractionStrategy: 'dom_adapter',
      adapterName: 'UNSW Sydney DOM Adapter',
    };

    // Name
    const titleEl = $('.course-title, .program-header h1, h1.page-title').first();
    if (titleEl.length > 0) {
      const name = titleEl.text().trim();
      candidate.name = {
        value: name,
        evidence: makeEvidence('name', name, sourceUrl, $.html(titleEl)),
      };
    }

    // Degree Level
    const levelEl = $('.degree-level, .study-level, [data-testid="degree-level"]').first();
    if (levelEl.length > 0) {
      const level = levelEl.text().trim();
      candidate.degreeLevel = {
        value: level,
        evidence: makeEvidence('degreeLevel', level, sourceUrl, $.html(levelEl)),
      };
    }

    // CRICOS
    const cricosEl = $('.cricos-code, [data-cricos]').first();
    const cricosText = cricosEl.length > 0 ? cricosEl.text() : $('body').text();
    const cricosMatch = cricosText.match(/CRICOS[^:]*:?\s*([0-9]{6}[A-Za-z0-9])/i);
    if (cricosMatch) {
      candidate.cricosCode = {
        value: cricosMatch[1].toUpperCase(),
        evidence: makeEvidence('cricosCode', cricosMatch[1].toUpperCase(), sourceUrl, cricosEl.length > 0 ? $.html(cricosEl) : cricosMatch[0]),
      };
    }

    // Fees Table (e.g. table.fee-table or international vs domestic rows)
    $('table.fee-schedule tr, table.fees tr, .fees-table tr').each((_, row) => {
      const rowText = $(row).text();
      if (rowText.toLowerCase().includes('international')) {
        const feeMatch = rowText.match(/\$([0-9,]+)/);
        if (feeMatch) {
          const fee = parseFloat(feeMatch[1].replace(/,/g, ''));
          candidate.annualTuitionAud = {
            value: fee,
            evidence: makeEvidence('annualTuitionAud', fee, sourceUrl, $.html(row)),
          };
        }
      }
      if (rowText.toLowerCase().includes('domestic') || rowText.toLowerCase().includes('commonwealth supported')) {
        const feeMatch = rowText.match(/\$([0-9,]+)/);
        if (feeMatch) {
          const fee = parseFloat(feeMatch[1].replace(/,/g, ''));
          candidate.domesticAnnualTuitionAud = {
            value: fee,
            evidence: makeEvidence('domesticAnnualTuitionAud', fee, sourceUrl, $.html(row)),
          };
        }
      }
    });

    // Duration
    const durEl = $('.duration, .course-duration').first();
    if (durEl.length > 0) {
      const text = durEl.text().trim();
      candidate.durationText = {
        value: text,
        evidence: makeEvidence('durationText', text, sourceUrl, $.html(durEl)),
      };
    }

    return candidate.name ? candidate : null;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. UNIVERSITY OF MELBOURNE DOM ADAPTER
// ─────────────────────────────────────────────────────────────────────────────
export const unimelbDomAdapter: UniversityDomAdapter = {
  name: 'University of Melbourne DOM Adapter',
  matches(url: string, html: string): boolean {
    return url.includes('unimelb.edu.au') || html.includes('University of Melbourne') || html.includes('course-hero');
  },
  parse(html: string, sourceUrl: string): DomParsedProgramCandidate | null {
    const $ = cheerio.load(html);
    const candidate: DomParsedProgramCandidate = {
      extractionStrategy: 'dom_adapter',
      adapterName: 'University of Melbourne DOM Adapter',
    };

    // Course Title
    const titleEl = $('h1.course-hero__title, .course-header__title, h1').first();
    if (titleEl.length > 0) {
      const name = titleEl.text().trim();
      candidate.name = {
        value: name,
        evidence: makeEvidence('name', name, sourceUrl, $.html(titleEl)),
      };
    }

    // Overview details list
    $('.course-overview__item, .quick-facts__item').each((_, el) => {
      const label = $(el).find('.label, dt').text().toLowerCase();
      const valText = $(el).find('.value, dd').text().trim();

      if (label.includes('cricos')) {
        const match = valText.match(/([0-9]{6}[A-Za-z0-9])/);
        if (match) {
          candidate.cricosCode = {
            value: match[1].toUpperCase(),
            evidence: makeEvidence('cricosCode', match[1].toUpperCase(), sourceUrl, $.html(el)),
          };
        }
      }

      if (label.includes('fee') || label.includes('international fee')) {
        const match = valText.match(/\$([0-9,]+)/);
        if (match) {
          const fee = parseFloat(match[1].replace(/,/g, ''));
          candidate.annualTuitionAud = {
            value: fee,
            evidence: makeEvidence('annualTuitionAud', fee, sourceUrl, $.html(el)),
          };
        }
      }

      if (label.includes('duration')) {
        candidate.durationText = {
          value: valText,
          evidence: makeEvidence('durationText', valText, sourceUrl, $.html(el)),
        };
      }

      if (label.includes('intake') || label.includes('start date')) {
        const months = ['February', 'March', 'July', 'August', 'November']
          .filter(m => valText.includes(m));
        if (months.length > 0) {
          candidate.intakeMonths = {
            value: months,
            evidence: makeEvidence('intakeMonths', months, sourceUrl, $.html(el)),
          };
        }
      }
    });

    return candidate.name ? candidate : null;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. UNIVERSITY OF SYDNEY DOM ADAPTER (ACCORDION SECTIONS)
// ─────────────────────────────────────────────────────────────────────────────
export const usydDomAdapter: UniversityDomAdapter = {
  name: 'University of Sydney DOM Adapter',
  matches(url: string, html: string): boolean {
    return url.includes('sydney.edu.au') || html.includes('University of Sydney') || html.includes('accordion-section');
  },
  parse(html: string, sourceUrl: string): DomParsedProgramCandidate | null {
    const $ = cheerio.load(html);
    const candidate: DomParsedProgramCandidate = {
      extractionStrategy: 'dom_adapter',
      adapterName: 'University of Sydney DOM Adapter',
    };

    // Course Name
    const titleEl = $('h1.c-hero-course__title, h1.page-title, h1').first();
    if (titleEl.length > 0) {
      const name = titleEl.text().trim();
      candidate.name = {
        value: name,
        evidence: makeEvidence('name', name, sourceUrl, $.html(titleEl)),
      };
    }

    // Accordions / Requirement Sections
    $('.accordion-item, .c-accordion__section').each((_, acc) => {
      const headerText = $(acc).find('.accordion-header, .c-accordion__title').text().toLowerCase();
      const contentText = $(acc).find('.accordion-content, .c-accordion__body').text().trim();

      // English Requirements
      if (headerText.includes('english') || headerText.includes('language')) {
        const ieltsMatch = contentText.match(/IELTS[^0-9]*([5-9](?:\.[05])?)/i);
        if (ieltsMatch) {
          candidate.ieltsOverall = {
            value: parseFloat(ieltsMatch[1]),
            evidence: makeEvidence('ieltsOverall', parseFloat(ieltsMatch[1]), sourceUrl, $.html(acc)),
          };
        }
      }

      // Admission / Entry Criteria
      if (headerText.includes('admission') || headerText.includes('entry') || headerText.includes('requirement')) {
        candidate.academicRequirements = {
          value: contentText.slice(0, 1000),
          evidence: makeEvidence('academicRequirements', contentText.slice(0, 1000), sourceUrl, $.html(acc)),
        };
      }

      // Fees
      if (headerText.includes('fee') || headerText.includes('cost')) {
        const feeMatch = contentText.match(/\$([0-9,]+)/);
        if (feeMatch) {
          const fee = parseFloat(feeMatch[1].replace(/,/g, ''));
          candidate.annualTuitionAud = {
            value: fee,
            evidence: makeEvidence('annualTuitionAud', fee, sourceUrl, $.html(acc)),
          };
        }
      }
    });

    return candidate.name ? candidate : null;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. MONASH UNIVERSITY DOM ADAPTER
// ─────────────────────────────────────────────────────────────────────────────
export const monashDomAdapter: UniversityDomAdapter = {
  name: 'Monash University DOM Adapter',
  matches(url: string, html: string): boolean {
    return url.includes('monash.edu') || html.includes('Monash University') || html.includes('monash-course-card');
  },
  parse(html: string, sourceUrl: string): DomParsedProgramCandidate | null {
    const $ = cheerio.load(html);
    const candidate: DomParsedProgramCandidate = {
      extractionStrategy: 'dom_adapter',
      adapterName: 'Monash University DOM Adapter',
    };

    // Course Name
    const titleEl = $('h1.course-title, .monash-header h1, h1').first();
    if (titleEl.length > 0) {
      const name = titleEl.text().trim();
      candidate.name = {
        value: name,
        evidence: makeEvidence('name', name, sourceUrl, $.html(titleEl)),
      };
    }

    // Key facts cards
    $('.course-key-fact, .key-facts-item').each((_, el) => {
      const label = $(el).find('.label, strong').text().toLowerCase();
      const text = $(el).text();

      if (label.includes('cricos') || text.includes('CRICOS')) {
        const match = text.match(/([0-9]{6}[A-Za-z0-9])/);
        if (match) {
          candidate.cricosCode = {
            value: match[1].toUpperCase(),
            evidence: makeEvidence('cricosCode', match[1].toUpperCase(), sourceUrl, $.html(el)),
          };
        }
      }

      if (label.includes('international') && (label.includes('fee') || text.includes('$'))) {
        const match = text.match(/\$([0-9,]+)/);
        if (match) {
          const fee = parseFloat(match[1].replace(/,/g, ''));
          candidate.annualTuitionAud = {
            value: fee,
            evidence: makeEvidence('annualTuitionAud', fee, sourceUrl, $.html(el)),
          };
        }
      }

      if (label.includes('duration')) {
        const durText = $(el).find('.value').text().trim() || text.trim();
        candidate.durationText = {
          value: durText,
          evidence: makeEvidence('durationText', durText, sourceUrl, $.html(el)),
        };
      }
    });

    return candidate.name ? candidate : null;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. GENERIC DOM PARSER (HEURISTIC)
// ─────────────────────────────────────────────────────────────────────────────
export const genericDomParser = {
  name: 'Generic Heuristic DOM Parser',
  parse(html: string, sourceUrl: string): DomParsedProgramCandidate | null {
    const $ = cheerio.load(html);
    const candidate: DomParsedProgramCandidate = {
      extractionStrategy: 'generic_dom',
      adapterName: 'Generic Heuristic DOM Parser',
    };

    // Title
    const h1 = $('h1').first();
    if (h1.length > 0) {
      const name = h1.text().trim();
      if (name.length > 3 && name.length < 200) {
        candidate.name = {
          value: name,
          evidence: makeEvidence('name', name, sourceUrl, $.html(h1), 0.7, '1.0.0-generic'),
        };
      }
    }

    // Search full body text for CRICOS
    const bodyText = $('body').text();
    const cricosMatch = bodyText.match(/CRICOS[^:]*:?\s*([0-9]{6}[A-Za-z0-9])/i);
    if (cricosMatch) {
      candidate.cricosCode = {
        value: cricosMatch[1].toUpperCase(),
        evidence: makeEvidence('cricosCode', cricosMatch[1].toUpperCase(), sourceUrl, cricosMatch[0], 0.85, '1.0.0-generic'),
      };
    }

    // Search for Annual Tuition
    const feeMatch = bodyText.match(/\$([0-9,]+)\s*(?:AUD)?\s*(?:per year|p\.?a\.?|annually|annual tuition)/i);
    if (feeMatch) {
      const fee = parseFloat(feeMatch[1].replace(/,/g, ''));
      candidate.annualTuitionAud = {
        value: fee,
        evidence: makeEvidence('annualTuitionAud', fee, sourceUrl, feeMatch[0], 0.8, '1.0.0-generic'),
      };
    }

    // Search for IELTS
    const ieltsMatch = bodyText.match(/IELTS[^0-9]*([5-9](?:\.[05])?)/i);
    if (ieltsMatch) {
      candidate.ieltsOverall = {
        value: parseFloat(ieltsMatch[1]),
        evidence: makeEvidence('ieltsOverall', parseFloat(ieltsMatch[1]), sourceUrl, ieltsMatch[0], 0.8, '1.0.0-generic'),
      };
    }

    return candidate.name ? candidate : null;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY
// ─────────────────────────────────────────────────────────────────────────────
const DOM_ADAPTERS: UniversityDomAdapter[] = [
  unswDomAdapter,
  unimelbDomAdapter,
  usydDomAdapter,
  monashDomAdapter,
];

export const domAdapterRegistry = {
  findAdapter(url: string, html: string): UniversityDomAdapter | null {
    return DOM_ADAPTERS.find(a => a.matches(url, html)) || null;
  },

  parse(html: string, sourceUrl: string): DomParsedProgramCandidate | null {
    const adapter = this.findAdapter(sourceUrl, html);
    if (adapter) {
      const result = adapter.parse(html, sourceUrl);
      if (result) return result;
    }
    return genericDomParser.parse(html, sourceUrl);
  },
};
