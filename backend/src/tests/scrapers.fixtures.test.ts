/**
 * scrapers.fixtures.test.ts — Unit Tests for University DOM Adapters & Structured Data Parsers.
 * Tests parsers against real-world HTML structure fixtures and verifies exact FieldEvidence snippets.
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import fs from 'fs';
import path from 'path';

import { structuredDataParser } from '../services/parsers/structuredData.parser';
import {
  unswDomAdapter,
  unimelbDomAdapter,
  usydDomAdapter,
  monashDomAdapter,
  domAdapterRegistry,
} from '../services/parsers/universityDomAdapters';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

function loadFixture(fileName: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, fileName), 'utf-8');
}

describe('University Scraper & Structured Data Fixture Tests', () => {
  describe('1. Schema.org Course JSON-LD Parser', () => {
    test('extracts course facts and stores exact JSON-LD snippet in FieldEvidence', () => {
      const html = loadFixture('unimelb_jsonld_course.html');
      const sourceUrl = 'https://study.unimelb.edu.au/find/courses/graduate/master-of-computer-science/';

      const result = structuredDataParser.parse(html, sourceUrl);

      assert.ok(result);
      assert.equal(result.name?.value, 'Master of Computer Science');
      assert.equal(result.degreeLevel?.value, 'Master');
      assert.equal(result.providerName?.value, 'The University of Melbourne');
      assert.equal(result.annualTuitionAud?.value, 49800);
      assert.equal(result.durationText?.value, '2 years full-time');

      // Verify evidence snippet preservation
      assert.ok(result.name?.evidence.rawSnippet);
      assert.ok(result.annualTuitionAud?.evidence.rawSnippet);
      assert.equal(result.annualTuitionAud?.evidence.confidence, 0.95);
      assert.equal(result.annualTuitionAud?.evidence.sourceUrl, sourceUrl);
    });
  });

  describe('2. UNSW Sydney Table-Based Fee Adapter', () => {
    test('extracts degree, CRICOS code, and annual international/domestic fees from HTML table', () => {
      const html = loadFixture('unsw_table_fees.html');
      const sourceUrl = 'https://www.unsw.edu.au/degrees/bachelor-of-engineering-honours';

      const result = unswDomAdapter.parse(html, sourceUrl);

      assert.ok(result);
      assert.equal(result.name?.value, 'Bachelor of Engineering (Honours)');
      assert.equal(result.degreeLevel?.value, 'Bachelor');
      assert.equal(result.cricosCode?.value, '004753G');
      assert.equal(result.annualTuitionAud?.value, 51240);
      assert.equal(result.domesticAnnualTuitionAud?.value, 8950);
      assert.equal(result.durationText?.value, 'Duration: 4 years full-time');

      // Verify evidence snippet
      assert.ok(result.annualTuitionAud?.evidence.rawSnippet?.includes('51,240'));
      assert.ok(result.cricosCode?.evidence.rawSnippet?.includes('004753G'));
    });
  });

  describe('3. University of Sydney Accordion Requirements Adapter', () => {
    test('extracts course title, IELTS scores, and admission prerequisites from accordion elements', () => {
      const html = loadFixture('usyd_accordion_requirements.html');
      const sourceUrl = 'https://www.sydney.edu.au/courses/courses/ug/bachelor-of-science.html';

      const result = usydDomAdapter.parse(html, sourceUrl);

      assert.ok(result);
      assert.equal(result.name?.value, 'Bachelor of Science');
      assert.equal(result.ieltsOverall?.value, 6.5);
      assert.equal(result.annualTuitionAud?.value, 54500);
      assert.ok(result.academicRequirements?.value.includes('ATAR of 80.00'));

      // Verify evidence snippet
      assert.ok(result.ieltsOverall?.evidence.rawSnippet?.includes('Academic IELTS'));
      assert.ok(result.annualTuitionAud?.evidence.rawSnippet?.includes('54,500'));
    });
  });

  describe('4. Monash University Key Facts Adapter', () => {
    test('extracts CRICOS code, duration, tuition, and campus facts', () => {
      const html = loadFixture('monash_cricos_intakes.html');
      const sourceUrl = 'https://www.monash.edu/study/courses/find-a-course/data-science-c6004';

      const result = monashDomAdapter.parse(html, sourceUrl);

      assert.ok(result);
      assert.equal(result.name?.value, 'Master of Data Science');
      assert.equal(result.cricosCode?.value, '085349A');
      assert.equal(result.annualTuitionAud?.value, 49200);
      assert.ok(result.durationText?.value.includes('2 years full-time'));

      // Verify evidence snippet
      assert.ok(result.cricosCode?.evidence.rawSnippet?.includes('085349A'));
    });
  });

  describe('5. DOM Adapter Registry Dispatch', () => {
    test('dispatches to matching university adapter automatically based on URL or HTML content', () => {
      const unswHtml = loadFixture('unsw_table_fees.html');
      const unswParsed = domAdapterRegistry.parse(unswHtml, 'https://www.unsw.edu.au/courses/1');
      assert.equal(unswParsed?.adapterName, 'UNSW Sydney DOM Adapter');

      const usydHtml = loadFixture('usyd_accordion_requirements.html');
      const usydParsed = domAdapterRegistry.parse(usydHtml, 'https://www.sydney.edu.au/courses/2');
      assert.equal(usydParsed?.adapterName, 'University of Sydney DOM Adapter');

      const monashHtml = loadFixture('monash_cricos_intakes.html');
      const monashParsed = domAdapterRegistry.parse(monashHtml, 'https://www.monash.edu/study/3');
      assert.equal(monashParsed?.adapterName, 'Monash University DOM Adapter');
    });
  });
});
