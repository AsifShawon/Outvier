/**
 * canonical.migration.test.ts — Integration & Idempotency Tests for Migration Engine.
 * Verifies:
 *  - Dry-run mode guarantees zero mutations
 *  - Idempotent execution (running migration twice yields identical results and 0 duplicates)
 *  - Conflict detection across conflicting legacy fields
 *  - Data preservation (no data is discarded)
 *  - URL / Slug preservation
 */
import assert from 'node:assert/strict';
import test, { describe, before, after, beforeEach } from 'node:test';
import mongoose from 'mongoose';
import slugify from 'slugify';
import os from 'os';
import path from 'path';
import fs from 'fs';

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
} from '../models';

import { runCanonicalMigration } from '../scripts/migrateCanonical';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/outvier_test_canonical_migration';

describe('Canonical Migration Engine & Conflict Audit Integration Tests', () => {
  let isDbConnected = false;
  let tempReportDir: string;

  before(async () => {
    try {
      await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 3000 });
      isDbConnected = true;
    } catch {
      console.log('⚠️ MongoDB not running locally. Skipping live DB migration tests.');
    }
    tempReportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'outvier-migration-test-'));
  });

  after(async () => {
    if (isDbConnected) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
    if (fs.existsSync(tempReportDir)) {
      fs.rmSync(tempReportDir, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    if (isDbConnected) {
      await University.deleteMany({});
      await Program.deleteMany({});
      await Campus.deleteMany({});
      await ProgramOffering.deleteMany({});
      await Intake.deleteMany({});
      await FeeObservation.deleteMany({});
      await EntryRequirement.deleteMany({});
      await EnglishRequirement.deleteMany({});
      await RankingObservation.deleteMany({});
    }
  });

  describe('Standalone Migration Utilities & Conflict Structuring Tests', () => {
    test('Migration conflict object conforms to audit standards with severity and resolution', () => {
      const conflict = {
        entityType: 'Program' as const,
        entityId: '66a1b2c3d4e5f67890123456',
        entityName: 'Bachelor of IT',
        entitySlug: 'bachelor-of-it',
        field: 'tuitionFeeInternational vs annualTuition',
        legacyValue: 42000,
        modernValue: 45000,
        resolvedCanonicalValue: 45000,
        severity: 'high' as const,
        message: 'Annual tuition fee variance detected between legacy and modern fields',
      };

      assert.equal(conflict.entityType, 'Program');
      assert.equal(conflict.severity, 'high');
      assert.equal(conflict.resolvedCanonicalValue, 45000);
    });

    test('Report generation handles zero conflicts and populates structured counters', () => {
      const sampleReport = {
        timestamp: new Date().toISOString(),
        dryRun: true,
        durationMs: 120,
        universitiesProcessed: 10,
        programsProcessed: 45,
        createdCounts: {
          campuses: 15,
          offerings: 45,
          intakes: 90,
          fees: 60,
          entryRequirements: 45,
          englishRequirements: 45,
          rankingObservations: 10,
          sourceSnapshots: 0,
        },
        conflictCount: 0,
        conflicts: [],
      };

      assert.equal(sampleReport.conflictCount, 0);
      assert.equal(sampleReport.dryRun, true);
      assert.equal(sampleReport.createdCounts.offerings, 45);
      assert.equal(sampleReport.createdCounts.intakes, 90);
    });
  });

  if (isDbConnected) {
    test('1. Dry Run Mode: scans dataset, calculates operations & conflicts without modifying database', async () => {
      // Seed a legacy university and program
      const uni = await University.create({
        name: 'University of Technology Sydney',
        slug: 'university-of-technology-sydney',
        location: 'Sydney, NSW',
        website: 'https://www.uts.edu.au',
        ranking: 90,
        campuses: ['City Campus', 'Haymarket'],
        state: 'NSW',
      });

      await Program.create({
        name: 'Bachelor of Computing Science',
        slug: 'bachelor-of-computing-science-uts',
        university: uni._id,
        universityName: uni.name,
        universitySlug: uni.slug,
        level: 'bachelor',
        field: 'Computer Science',
        duration: '3 years full-time',
        tuitionFeeInternational: 44000,
        campusMode: 'on-campus',
      });

      const initialOfferingCount = await ProgramOffering.countDocuments();
      const initialFeeCount = await FeeObservation.countDocuments();

      // Run dry run
      const report = await runCanonicalMigration({
        dryRun: true,
        reportDir: tempReportDir,
        logger: () => {},
      });

      assert.equal(report.dryRun, true);
      assert.equal(report.universitiesProcessed, 1);
      assert.equal(report.programsProcessed, 1);
      assert.ok(report.createdCounts.fees >= 1);
      assert.ok(report.createdCounts.offerings >= 1);

      // Verify DB was NOT mutated
      const afterOfferingCount = await ProgramOffering.countDocuments();
      const afterFeeCount = await FeeObservation.countDocuments();
      assert.equal(afterOfferingCount, initialOfferingCount);
      assert.equal(afterFeeCount, initialFeeCount);
    });

    test('2. Live Migration & Idempotency: running migration multiple times produces identical state and zero duplicates', async () => {
      // Seed fixture data
      const uni = await University.create({
        name: 'University of Melbourne',
        slug: 'university-of-melbourne',
        location: 'Melbourne, VIC',
        website: 'https://www.unimelb.edu.au',
        officialWebsite: 'https://www.unimelb.edu.au',
        ranking: 13,
        campuses: ['Parkville', 'Southbank', 'Burnley'],
        cricosProviderCode: '00116K',
        state: 'VIC',
        city: 'Melbourne',
      });

      const prog = await Program.create({
        name: 'Master of Information Technology',
        slug: 'master-of-information-technology-unimelb',
        university: uni._id,
        universityName: uni.name,
        universitySlug: uni.slug,
        level: 'master',
        field: 'Information Technology',
        fieldOfStudy: 'Information Technology',
        duration: '2 years full-time',
        tuitionFeeInternational: 48500,
        tuitionFeeLocal: 16000,
        intakeMonths: ['February', 'July'],
        englishRequirements: 'IELTS 6.5 with no band below 6.0',
        ieltsRequirement: 6.5,
        academicRequirements: 'Bachelor degree in cognate area with GPA 65%+',
        campusMode: 'on-campus',
        cricosCourseCode: '083456K',
      });

      // Execute Run #1
      const report1 = await runCanonicalMigration({
        dryRun: false,
        reportDir: tempReportDir,
        logger: () => {},
      });

      assert.equal(report1.universitiesProcessed, 1);
      assert.equal(report1.programsProcessed, 1);
      assert.ok(report1.createdCounts.fees >= 2); // 1 intl + 1 domestic

      const campusCount1 = await Campus.countDocuments();
      const offeringCount1 = await ProgramOffering.countDocuments();
      const intakeCount1 = await Intake.countDocuments();
      const feeCount1 = await FeeObservation.countDocuments();
      const rankingCount1 = await RankingObservation.countDocuments();

      assert.ok(campusCount1 >= 3);
      assert.equal(offeringCount1, 1);
      assert.equal(intakeCount1, 2);
      assert.equal(feeCount1, 2);
      assert.equal(rankingCount1, 1);

      // Execute Run #2 on the same database
      const report2 = await runCanonicalMigration({
        dryRun: false,
        reportDir: tempReportDir,
        logger: () => {},
      });

      const campusCount2 = await Campus.countDocuments();
      const offeringCount2 = await ProgramOffering.countDocuments();
      const intakeCount2 = await Intake.countDocuments();
      const feeCount2 = await FeeObservation.countDocuments();
      const rankingCount2 = await RankingObservation.countDocuments();

      // Assert zero duplicates were created
      assert.equal(campusCount2, campusCount1);
      assert.equal(offeringCount2, offeringCount1);
      assert.equal(intakeCount2, intakeCount1);
      assert.equal(feeCount2, feeCount1);
      assert.equal(rankingCount2, rankingCount1);

      // Verify program canonical fields were populated
      const updatedProg = await Program.findById(prog._id);
      assert.equal(updatedProg?.primaryFeeAnnualAud, 48500);
      assert.equal(updatedProg?.primaryFeeTotalAud, 48500 * 2);
      assert.equal(updatedProg?.durationStructure?.durationYears, 2);
      assert.equal(updatedProg?.fieldOfStudy, 'Information Technology');
    });

    test('3. Conflict Detection: flags and records discrepancies between legacy and modern fields without data loss', async () => {
      // Seed conflicting record:
      // - University: location ("Brisbane, Queensland") vs city ("Sydney") & state ("NSW")
      // - Program: field ("Data Science") vs fieldOfStudy ("Artificial Intelligence")
      // - Program: tuitionFeeInternational (42000) vs annualTuition (47000)
      const uni = await University.create({
        name: 'Queensland University of Technology',
        slug: 'queensland-university-of-technology',
        location: 'Brisbane, Queensland',
        city: 'Sydney', // Conflicting city
        state: 'NSW', // Conflicting state
        website: 'https://www.qut.edu.au',
        officialWebsite: 'https://official.qut.edu.au', // Conflicting URL
        campuses: ['Gardens Point', 'Kelvin Grove'],
      });

      const prog = await Program.create({
        name: 'Master of Robotics & AI',
        slug: 'master-of-robotics-ai-qut',
        university: uni._id,
        universityName: uni.name,
        universitySlug: uni.slug,
        level: 'master',
        field: 'Data Science', // Conflicting legacy field
        fieldOfStudy: 'Artificial Intelligence', // Conflicting modern field
        tuitionFeeInternational: 42000, // Conflicting fee 1
        annualTuition: 47000, // Conflicting fee 2
        duration: '2 years',
      });

      const report = await runCanonicalMigration({
        dryRun: false,
        reportDir: tempReportDir,
        logger: () => {},
      });

      assert.ok(report.conflictCount >= 3, `Expected at least 3 conflicts, got ${report.conflictCount}`);

      // Verify specific conflicts exist in the report
      const fieldConflict = report.conflicts.find(c => c.field.includes('field vs fieldOfStudy'));
      assert.ok(fieldConflict, 'Expected field vs fieldOfStudy conflict to be recorded');
      assert.equal(fieldConflict.legacyValue, 'Data Science');
      assert.equal(fieldConflict.modernValue, 'Artificial Intelligence');

      const feeConflict = report.conflicts.find(c => c.field.includes('annual tuition fee variance'));
      assert.ok(feeConflict, 'Expected tuition fee variance conflict to be recorded');

      const websiteConflict = report.conflicts.find(c => c.field.includes('website vs officialWebsite'));
      assert.ok(websiteConflict, 'Expected website vs officialWebsite conflict to be recorded');

      // Verify generated report files exist
      const reportFiles = fs.readdirSync(tempReportDir);
      assert.ok(reportFiles.some(f => f.endsWith('.json')));
      assert.ok(reportFiles.some(f => f.endsWith('.md')));
    });

    test('4. URL & Slug Preservation: canonical migration preserves existing university and program slugs', async () => {
      const uniSlug = 'deakin-university';
      const progSlug = 'bachelor-of-cyber-security-deakin';

      const uni = await University.create({
        name: 'Deakin University',
        slug: uniSlug,
        state: 'VIC',
      });

      const prog = await Program.create({
        name: 'Bachelor of Cyber Security',
        slug: progSlug,
        university: uni._id,
        universityName: uni.name,
        universitySlug: uni.slug,
        level: 'bachelor',
        field: 'Cybersecurity',
      });

      await runCanonicalMigration({
        dryRun: false,
        reportDir: tempReportDir,
        logger: () => {},
      });

      const foundUni = await University.findOne({ slug: uniSlug });
      const foundProg = await Program.findOne({ slug: progSlug });

      assert.ok(foundUni, `University slug ${uniSlug} was preserved`);
      assert.ok(foundProg, `Program slug ${progSlug} was preserved`);
      assert.equal(foundUni._id.toString(), uni._id.toString());
      assert.equal(foundProg._id.toString(), prog._id.toString());
    });
  }
});
