/**
 * canonical.adapters.test.ts — Unit & Integration Tests for Read Adapters & API Serializers.
 * Verifies that:
 *  - Adapters synthesize legacy fields for backward compatibility
 *  - Serializers format clean canonical output for frontend code
 *  - Analytics queries operate cleanly on canonical fields without guessing
 */
import assert from 'node:assert/strict';
import test, { describe, before, after } from 'node:test';
import mongoose from 'mongoose';

import { canonicalReadAdapter } from '../adapters/canonicalReadAdapter';
import { canonicalSerializer } from '../serializers/canonical.serializer';
import { Program } from '../models/Program.model';
import { University } from '../models/University.model';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/outvier_test_canonical_adapters';

describe('Compatibility Read Adapters, Serializers & Analytics Tests', () => {
  let isDbConnected = false;

  before(async () => {
    try {
      await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 3000 });
      isDbConnected = true;
    } catch {
      console.log('⚠️ MongoDB not running locally. Running standalone adapter unit tests.');
    }
  });

  after(async () => {
    if (isDbConnected) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  });

  describe('1. Program Read Adapter Tests', () => {
    test('adaptProgram resolves canonical fieldOfStudy and synthesizes legacy field', () => {
      const rawProgram = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Bachelor of Software Engineering (Honours)',
        slug: 'bachelor-of-software-engineering-unsw',
        level: 'bachelor',
        field: 'Information Technology',
        duration: '4 years full-time',
        tuitionFeeInternational: 49500,
        campusMode: 'on-campus',
        university: new mongoose.Types.ObjectId(),
        universityName: 'UNSW Sydney',
        universitySlug: 'unsw-sydney',
      };

      const canonical = canonicalReadAdapter.adaptProgram(rawProgram);

      // Canonical outputs
      assert.equal(canonical.name, 'Bachelor of Software Engineering (Honours)');
      assert.equal(canonical.fieldOfStudy, 'Information Technology');
      assert.equal(canonical.primaryFeeAnnualAud, 49500);
      assert.equal(canonical.duration.years, 4);
      assert.equal(canonical.duration.text, '4 years full-time');

      // Legacy synthesized outputs
      assert.equal(canonical.field, 'Information Technology');
      assert.equal(canonical.annualTuition, 49500);
      assert.equal(canonical.tuitionFeeInternational, 49500);
      assert.equal(canonical.campusMode, 'on-campus');
      assert.equal(canonical.universityName, 'UNSW Sydney');
    });

    test('adaptProgram prioritizes canonical fieldOfStudy and primaryFeeAnnualAud over legacy values', () => {
      const rawProgram = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Master of Data Science',
        slug: 'master-of-data-science-unsw',
        level: 'master',
        fieldOfStudy: 'Data Science & Artificial Intelligence',
        primaryFeeAnnualAud: 47000,
        primaryFeeTotalAud: 94000,
        durationStructure: { durationYears: 2, durationText: '2 years' },
        field: 'Old Legacy Field',
        annualTuition: 42000,
      };

      const canonical = canonicalReadAdapter.adaptProgram(rawProgram);

      assert.equal(canonical.fieldOfStudy, 'Data Science & Artificial Intelligence');
      assert.equal(canonical.primaryFeeAnnualAud, 47000);
      assert.equal(canonical.primaryFeeTotalAud, 94000);
      assert.equal(canonical.duration.years, 2);
    });
  });

  describe('2. University Read Adapter Tests', () => {
    test('adaptUniversity maps canonical provider fields and preserves legacy aliases', () => {
      const rawUni = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Australian National University',
        slug: 'australian-national-university',
        shortName: 'ANU',
        officialWebsite: 'https://www.anu.edu.au',
        logoUrl: 'https://www.anu.edu.au/logo.png',
        providerType: 'university',
        cricosProviderCode: '00120C',
        teqsaProviderId: 'PRV12002',
        state: 'ACT',
        city: 'Canberra',
        programCount: 150,
        primaryRank: 34,
      };

      const canonical = canonicalReadAdapter.adaptUniversity(rawUni);

      // Canonical properties
      assert.equal(canonical.name, 'Australian National University');
      assert.equal(canonical.shortName, 'ANU');
      assert.equal(canonical.officialWebsite, 'https://www.anu.edu.au');
      assert.equal(canonical.logoUrl, 'https://www.anu.edu.au/logo.png');
      assert.equal(canonical.providerType, 'university');
      assert.equal(canonical.primaryRank, 34);

      // Legacy aliases
      assert.equal(canonical.website, 'https://www.anu.edu.au');
      assert.equal(canonical.logo, 'https://www.anu.edu.au/logo.png');
      assert.equal(canonical.ranking, 34);
      assert.equal(canonical.location, 'Canberra, ACT');
    });
  });

  describe('3. API Serializer Tests', () => {
    test('canonicalSerializer.serializeProgram produces clean nested structures for frontend', () => {
      const rawProgram = {
        _id: new mongoose.Types.ObjectId(),
        provider: new mongoose.Types.ObjectId(),
        providerName: 'University of Sydney',
        providerSlug: 'university-of-sydney',
        name: 'Bachelor of Advanced Computing',
        slug: 'bachelor-of-advanced-computing-usyd',
        level: 'bachelor',
        fieldOfStudy: 'Computer Science',
        discipline: 'Software Engineering',
        primaryFeeAnnualAud: 52000,
        primaryFeeTotalAud: 208000,
        durationStructure: { durationYears: 4, durationText: '4 years full-time' },
        status: 'active',
        availableStudyModes: ['on-campus', 'hybrid'],
        availableCampusCities: ['Sydney', 'Camperdown'],
        careerPathways: ['Chief Technology Officer', 'Software Architect'],
        activeIntakeCount: 2,
      };

      const serialized = canonicalSerializer.serializeProgram(rawProgram);

      assert.equal(serialized.name, 'Bachelor of Advanced Computing');
      assert.equal(serialized.fieldOfStudy, 'Computer Science');
      assert.equal(serialized.discipline, 'Software Engineering');
      assert.equal(serialized.fees.primaryAnnualAud, 52000);
      assert.equal(serialized.fees.currency, 'AUD');
      assert.equal(serialized.duration.years, 4);
      assert.equal(serialized.provider.name, 'University of Sydney');
      assert.deepEqual(serialized.studyModes, ['on-campus', 'hybrid']);
      assert.equal(serialized.activeIntakeCount, 2);
    });

    test('canonicalSerializer.serializeUniversity produces clean stats and campus blocks', () => {
      const rawUni = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Monash University',
        slug: 'monash-university',
        state: 'VIC',
        city: 'Melbourne',
        officialWebsite: 'https://www.monash.edu',
        providerType: 'university',
        cricosProviderCode: '00008C',
        programCount: 320,
        primaryRank: 42,
        campusDetails: [
          { name: 'Clayton', city: 'Clayton', state: 'VIC' },
          { name: 'Caulfield', city: 'Caulfield', state: 'VIC' },
        ],
      };

      const serialized = canonicalSerializer.serializeUniversity(rawUni);

      assert.equal(serialized.name, 'Monash University');
      assert.equal(serialized.stats.programCount, 320);
      assert.equal(serialized.stats.primaryRank, 42);
      assert.equal(serialized.campuses.length, 2);
      assert.equal(serialized.campuses[0].name, 'Clayton');
    });
  });

  if (isDbConnected) {
    describe('4. Analytics Canonical Aggregation Accuracy (Zero Guesswork)', () => {
      before(async () => {
        await Program.deleteMany({});
        await University.deleteMany({});

        const uni = await University.create({
          name: 'Analytics Test University',
          slug: 'analytics-test-uni',
          state: 'NSW',
          providerType: 'university',
        });

        await Program.create([
          {
            name: 'CS 101',
            slug: 'cs-101',
            provider: uni._id,
            university: uni._id,
            providerName: uni.name,
            providerSlug: uni.slug,
            level: 'bachelor',
            fieldOfStudy: 'Information Technology',
            primaryFeeAnnualAud: 40000,
            status: 'active',
          },
          {
            name: 'CS 102',
            slug: 'cs-102',
            provider: uni._id,
            university: uni._id,
            providerName: uni.name,
            providerSlug: uni.slug,
            level: 'master',
            fieldOfStudy: 'Information Technology',
            primaryFeeAnnualAud: 50000,
            status: 'active',
          },
          {
            name: 'BIZ 101',
            slug: 'biz-101',
            provider: uni._id,
            university: uni._id,
            providerName: uni.name,
            providerSlug: uni.slug,
            level: 'bachelor',
            fieldOfStudy: 'Business & Management',
            primaryFeeAnnualAud: 30000,
            status: 'active',
          },
        ]);
      });

      test('Direct canonical aggregation averages tuition accurately without $ifNull guessing', async () => {
        const stats = await Program.aggregate([
          { $match: { status: 'active', primaryFeeAnnualAud: { $gt: 0 } } },
          {
            $group: {
              _id: '$fieldOfStudy',
              avgTuition: { $avg: '$primaryFeeAnnualAud' },
              count: { $sum: 1 },
            },
          },
          { $sort: { avgTuition: -1 } },
        ]);

        assert.equal(stats.length, 2);

        const itGroup = stats.find(s => s._id === 'Information Technology');
        assert.ok(itGroup);
        assert.equal(itGroup.count, 2);
        assert.equal(itGroup.avgTuition, 45000); // (40000 + 50000) / 2

        const bizGroup = stats.find(s => s._id === 'Business & Management');
        assert.ok(bizGroup);
        assert.equal(bizGroup.count, 1);
        assert.equal(bizGroup.avgTuition, 30000);
      });
    });
  }
});
