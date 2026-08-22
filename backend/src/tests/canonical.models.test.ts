/**
 * canonical.models.test.ts — Unit & Schema Validation Tests for Canonical Entities.
 * Validates entity schemas, typed dates, timezones, multi-basis fees, ranking observations,
 * and provenance structures.
 */
import assert from 'node:assert/strict';
import test, { describe, before, after } from 'node:test';
import mongoose from 'mongoose';

import {
  University,
  Program,
  Campus,
  ProgramOffering,
  Intake,
  FeeObservation,
  EntryRequirement,
  EnglishRequirement,
  RankingObservation,
  OutcomeMetric,
  Scholarship,
  SourceSnapshot,
  FieldEvidence,
} from '../models';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/outvier_test_canonical_models';

describe('Canonical Data Model & Provenance Schema Unit Tests', () => {
  let isDbConnected = false;

  before(async () => {
    try {
      await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 3000 });
      isDbConnected = true;
    } catch {
      console.log('⚠️ MongoDB not running locally. Running standalone schema validation tests.');
    }
  });

  after(async () => {
    if (isDbConnected) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  });

  describe('1. FieldEvidence & SourceSnapshot Provenance Validation', () => {
    test('FieldEvidence schema validates required sourceUrl, confidence (0..1), and parserVersion', () => {
      const validEvidence = new FieldEvidence({
        fieldName: 'annualTuition',
        value: 38000,
        sourceUrl: 'https://www.unsw.edu.au/fees/2025',
        sourceType: 'UNIVERSITY_OFFICIAL',
        confidence: 0.95,
        fetchedAt: new Date('2025-01-10T12:00:00Z'),
        lastVerifiedAt: new Date('2025-02-01T15:30:00Z'),
        parserVersion: '2.1.0',
        rawSnippet: 'International Student Annual Fee: AUD $38,000',
      });

      assert.equal(validEvidence.validateSync(), undefined);
      assert.equal(validEvidence.sourceType, 'UNIVERSITY_OFFICIAL');
      assert.equal(validEvidence.confidence, 0.95);
      assert.equal(validEvidence.parserVersion, '2.1.0');
    });

    test('FieldEvidence rejects confidence scores outside [0, 1] range', () => {
      const invalidEvidence = new FieldEvidence({
        sourceUrl: 'https://example.com',
        sourceType: 'SECONDARY',
        confidence: 1.5, // Invalid > 1
        parserVersion: '1.0.0',
      });

      const err = invalidEvidence.validateSync();
      assert.ok(err);
      assert.ok(err.errors.confidence);
    });

    test('SourceSnapshot schema stores raw payloads with SHA-256 hash and timestamps', () => {
      const snapshot = new SourceSnapshot({
        entityType: 'Program',
        sourceUrl: 'https://www.sydney.edu.au/courses/bachelor-of-science',
        sourceType: 'UNIVERSITY_OFFICIAL',
        snapshotHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        mimeType: 'text/html',
        rawPayload: '<html><head><title>Bachelor of Science</title></head><body>...</body></html>',
        parserVersion: '1.0.0',
        fetchedAt: new Date('2025-02-15T08:00:00Z'),
      });

      assert.equal(snapshot.validateSync(), undefined);
      assert.equal(snapshot.entityType, 'Program');
      assert.equal(snapshot.mimeType, 'text/html');
    });
  });

  describe('2. ProgramOffering & Intake Typed Schedule Validation', () => {
    test('ProgramOffering connects program, provider, campus, studyMode, and CRICOS', () => {
      const progId = new mongoose.Types.ObjectId();
      const provId = new mongoose.Types.ObjectId();
      const campId = new mongoose.Types.ObjectId();

      const offering = new ProgramOffering({
        program: progId,
        provider: provId,
        campus: campId,
        studyMode: 'hybrid',
        attendanceType: 'full-time',
        cricosCourseCode: '012345M',
        cricosStatus: 'registered',
        domesticAvailable: true,
        internationalAvailable: true,
        availabilityStatus: 'open',
        status: 'active',
        primaryAnnualFeeAud: 42000,
      });

      assert.equal(offering.validateSync(), undefined);
      assert.equal(offering.studyMode, 'hybrid');
      assert.equal(offering.cricosStatus, 'registered');
    });

    test('Intake enforces typed ISO Date objects and IANA timezones', () => {
      const progId = new mongoose.Types.ObjectId();
      const provId = new mongoose.Types.ObjectId();

      const intake = new Intake({
        program: progId,
        provider: provId,
        academicYear: 2026,
        term: 'Semester 1',
        startDate: new Date('2026-02-23T00:00:00Z'),
        censusDate: new Date('2026-03-31T23:59:59Z'),
        applicationDeadlineDomestic: new Date('2026-01-31T23:59:59Z'),
        applicationDeadlineInternational: new Date('2025-11-30T23:59:59Z'),
        timezone: 'Australia/Sydney',
        status: 'open',
      });

      assert.equal(intake.validateSync(), undefined);
      assert.ok(intake.startDate instanceof Date);
      assert.ok(intake.applicationDeadlineInternational instanceof Date);
      assert.equal(intake.timezone, 'Australia/Sydney');
      assert.equal(intake.academicYear, 2026);
    });
  });

  describe('3. FeeObservation Multi-Basis & Applicability Validation', () => {
    test('FeeObservation captures amount, currency, feeBasis, academicYear, audience, and dates', () => {
      const progId = new mongoose.Types.ObjectId();
      const provId = new mongoose.Types.ObjectId();

      const fee = new FeeObservation({
        provider: provId,
        program: progId,
        academicYear: 2025,
        feeBasis: 'annual',
        audience: 'international',
        amount: 45500,
        currency: 'AUD',
        effectiveStartDate: new Date('2025-01-01'),
        effectiveEndDate: new Date('2025-12-31'),
        isEstimate: false,
        status: 'verified',
        sourceEvidence: {
          fieldName: 'amount',
          value: 45500,
          sourceUrl: 'https://fees.unimelb.edu.au/2025',
          sourceType: 'FEE_SCHEDULE',
          confidence: 0.98,
          fetchedAt: new Date(),
          lastVerifiedAt: new Date(),
          parserVersion: '1.0.0',
        },
      });

      assert.equal(fee.validateSync(), undefined);
      assert.equal(fee.feeBasis, 'annual');
      assert.equal(fee.audience, 'international');
      assert.equal(fee.amount, 45500);
      assert.equal(fee.currency, 'AUD');
    });

    test('FeeObservation supports domestic per_credit_point and non_tuition fees', () => {
      const progId = new mongoose.Types.ObjectId();
      const provId = new mongoose.Types.ObjectId();

      const feeCredit = new FeeObservation({
        provider: provId,
        program: progId,
        academicYear: 2025,
        feeBasis: 'per_credit_point',
        audience: 'domestic',
        amount: 350,
        currency: 'AUD',
        status: 'verified',
        sourceEvidence: {
          sourceUrl: 'https://fees.unimelb.edu.au/credit',
          sourceType: 'UNIVERSITY_OFFICIAL',
          confidence: 0.95,
          fetchedAt: new Date(),
          lastVerifiedAt: new Date(),
          parserVersion: '1.0.0',
        },
      });

      assert.equal(feeCredit.validateSync(), undefined);
      assert.equal(feeCredit.feeBasis, 'per_credit_point');
      assert.equal(feeCredit.audience, 'domestic');
    });
  });

  describe('4. RankingObservation Licensed Tracking & OutcomeMetric Validation', () => {
    test('RankingObservation requires publisher, editionYear, rankingType, and verificationDate', () => {
      const provId = new mongoose.Types.ObjectId();

      const ranking = new RankingObservation({
        provider: provId,
        publisher: 'QS',
        editionYear: 2025,
        rankingType: 'overall',
        rank: 19,
        rankBand: 'top50',
        score: 91.2,
        nationalRank: 2,
        licensedSourceRef: 'QS World University Rankings 2025 License #78901',
        publicationDate: new Date('2024-06-04'),
        verificationDate: new Date('2024-06-10'),
        status: 'verified',
        sourceEvidence: {
          sourceUrl: 'https://www.topuniversities.com/rankings/2025',
          sourceType: 'RANKING_PUBLISHER',
          confidence: 1.0,
          fetchedAt: new Date(),
          lastVerifiedAt: new Date(),
          parserVersion: '1.0.0',
        },
      });

      assert.equal(ranking.validateSync(), undefined);
      assert.equal(ranking.publisher, 'QS');
      assert.equal(ranking.rank, 19);
      assert.equal(ranking.licensedSourceRef, 'QS World University Rankings 2025 License #78901');
    });

    test('OutcomeMetric enforces publisher, surveyYear, metricType, and verificationDate', () => {
      const provId = new mongoose.Types.ObjectId();

      const outcome = new OutcomeMetric({
        provider: provId,
        publisher: 'QILT',
        surveyYear: 2024,
        metricType: 'full_time_employment_rate',
        metricValue: 84.5,
        unit: 'percentage',
        studyLevel: 'undergraduate',
        fieldOfEducation: 'Computing and Information Systems',
        verificationDate: new Date('2024-11-15'),
        status: 'approved',
        sourceEvidence: {
          sourceUrl: 'https://www.qilt.edu.au/surveys/gos-2024',
          sourceType: 'QILT_GOVERNMENT',
          confidence: 0.99,
          fetchedAt: new Date(),
          lastVerifiedAt: new Date(),
          parserVersion: '1.0.0',
        },
      });

      assert.equal(outcome.validateSync(), undefined);
      assert.equal(outcome.publisher, 'QILT');
      assert.equal(outcome.metricType, 'full_time_employment_rate');
      assert.equal(outcome.metricValue, 84.5);
    });
  });

  describe('5. Requirements Models (Entry & English) Validation', () => {
    test('EntryRequirement captures academic text, minimum GPA, ATAR, and country requirements', () => {
      const progId = new mongoose.Types.ObjectId();

      const entry = new EntryRequirement({
        program: progId,
        academicRequirementText: 'Australian Year 12 or equivalent qualification with prerequisite mathematics.',
        minimumGPA: { score: 3.2, scale: 4.0 },
        atarScore: 85.0,
        prerequisiteSubjects: ['Mathematical Methods', 'Physics'],
        countrySpecificRequirements: [
          { country: 'India', qualification: 'CBSE / CISCE All India Senior School Certificate', minimumScore: '85%' },
          { country: 'China', qualification: 'Gaokao', minimumScore: '75% of total score' },
        ],
      });

      assert.equal(entry.validateSync(), undefined);
      assert.equal(entry.atarScore, 85.0);
      assert.equal(entry.countrySpecificRequirements?.length, 2);
    });

    test('EnglishRequirement captures multi-exam test scores (IELTS, PTE, TOEFL, Duolingo) and waivers', () => {
      const progId = new mongoose.Types.ObjectId();

      const english = new EnglishRequirement({
        program: progId,
        testScores: {
          ieltsOverall: 6.5,
          ieltsBandMin: 6.0,
          pteAcademic: 58,
          toeflIbt: 79,
          duolingo: 115,
        },
        waiverConditions: [
          'Completed at least 2 years of secondary education in English in Australia, New Zealand, UK, Canada, or USA.',
        ],
        notes: 'Scores must be less than 2 years old at time of application.',
      });

      assert.equal(english.validateSync(), undefined);
      assert.equal(english.testScores.ieltsOverall, 6.5);
      assert.equal(english.testScores.pteAcademic, 58);
      assert.equal(english.waiverConditions?.length, 1);
    });
  });
});
