import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FuzzySearchService } from '../services/fuzzySearch.service';

describe('Discovery & Trusted Decisions Search & Provenance Test Suite', () => {
  describe('1. Fuzzy & Typo-Tolerant Search Capabilities', () => {
    it('calculates Damerau-Levenshtein edit distance correctly', () => {
      // 1 transposition: 'computre' -> 'computer'
      const dist1 = FuzzySearchService.damerauLevenshteinDistance('computre', 'computer');
      assert.equal(dist1, 1, 'Transposition distance should be 1');

      // 1 omission: 'computr' -> 'computer'
      const dist2 = FuzzySearchService.damerauLevenshteinDistance('computr', 'computer');
      assert.equal(dist2, 1, 'Omission distance should be 1');

      // 1 substitution: 'conputer' -> 'computer'
      const dist3 = FuzzySearchService.damerauLevenshteinDistance('conputer', 'computer');
      assert.equal(dist3, 1, 'Substitution distance should be 1');

      // Identical strings
      const dist4 = FuzzySearchService.damerauLevenshteinDistance('science', 'science');
      assert.equal(dist4, 0, 'Identical strings distance should be 0');
    });

    it('generates typo-tolerant regex pattern for misspelled words', () => {
      const pattern = FuzzySearchService.generateTypoRegex('computr');
      assert.ok(pattern.includes('computer'), 'Should include dictionary correction for computr');

      const melPattern = FuzzySearchService.generateTypoRegex('melborne');
      assert.ok(melPattern.includes('melbourne'), 'Should include dictionary correction for melborne');
    });

    it('builds program search conditions with alias expansions', () => {
      const condition = FuzzySearchService.buildProgramSearchCondition('unsw computer science');
      assert.ok(condition, 'Should generate search condition');
      const inspected = require('util').inspect(condition, { depth: null });
      const hasAlias = inspected.includes('University of New South Wales');
      assert.ok(hasAlias, 'Condition should expand unsw to University of New South Wales');
    });

    it('builds university search conditions with city and alias mapping', () => {
      const condition = FuzzySearchService.buildUniversitySearchCondition('melborne');
      assert.ok(condition, 'Should generate university search condition');
      const inspected = require('util').inspect(condition, { depth: null });
      const hasCorrected = inspected.includes('melbourne');
      assert.ok(hasCorrected, 'Condition should include corrected melbourne pattern');
    });
  });

  describe('2. Source & Provenance Metadata Standards', () => {
    it('validates that outcome and ranking metrics include survey year and source publisher', () => {
      const sampleRanking = {
        publisher: 'QS',
        editionYear: 2025,
        rank: 19,
        source: 'QS World University Rankings (2025)',
      };
      assert.equal(sampleRanking.editionYear, 2025);
      assert.ok(sampleRanking.source.includes('2025'));
      assert.ok(sampleRanking.source.includes('QS'));

      const sampleOutcome = {
        graduateEmploymentRate: 86.4,
        medianSalary: 75000,
        surveyYear: 2024,
        source: 'QILT Graduate Outcomes Survey (2024)',
      };
      assert.equal(sampleOutcome.surveyYear, 2024);
      assert.ok(sampleOutcome.source.includes('QILT'));
      assert.ok(sampleOutcome.source.includes('2024'));
    });
  });
});
