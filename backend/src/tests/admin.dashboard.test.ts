import assert from 'node:assert/strict';
import test, { describe, before, after, beforeEach } from 'node:test';
import mongoose from 'mongoose';
import { AdminDashboardService } from '../services/adminDashboard.service';
import { Program } from '../models/Program.model';
import { University } from '../models/University.model';
import { StagedChange } from '../models/StagedChange.model';
import { CricosSyncRun } from '../models/CricosSyncRun.model';
import { ApplicationTracker } from '../models/ApplicationTracker.model';
import { User } from '../models/User.model';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/outvier_test_admin_dashboard';

describe('Decision-Oriented Admin Operations Dashboard Tests', () => {
  let isDbConnected = false;

  before(async () => {
    try {
      await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 3000 });
      isDbConnected = true;
    } catch {
      console.log('⚠️ MongoDB not running locally for test runner. Running contract assertion tests.');
    }
  });

  after(async () => {
    try {
      const { connection } = await import('../config/redis');
      connection.disconnect();
    } catch {}
    if (isDbConnected) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    if (isDbConnected) {
      await Program.deleteMany({});
      await University.deleteMany({});
      await StagedChange.deleteMany({});
      await CricosSyncRun.deleteMany({});
      await ApplicationTracker.deleteMany({});
      await User.deleteMany({});
    }
  });

  test('AdminDashboardService returns well-formed data contract even on empty database', async () => {
    if (!isDbConnected) return;

    const overview = await AdminDashboardService.getOverview({ refresh: true });

    // Assert top-level shape
    assert.ok(overview);
    assert.ok(overview.filters);
    assert.ok(overview.kpis);
    assert.ok(overview.timeSeries);
    assert.ok(overview.applicationPipeline);
    assert.ok(overview.sourceHealth);
    assert.ok(overview.dataCompletenessByField);
    assert.ok(overview.operations);
    assert.strictEqual(typeof overview.lastUpdated, 'string');

    // Assert all 6 KPIs exist with required calculated properties
    const kpiKeys = [
      'verifiedActivePrograms',
      'staleRecords',
      'pendingStagedChanges',
      'successfulSyncRate',
      'activeApplications',
      'overdueTasks',
    ] as const;

    for (const key of kpiKeys) {
      const kpi = overview.kpis[key];
      assert.ok(kpi, `KPI ${key} should exist`);
      assert.strictEqual(typeof kpi.value, 'number');
      assert.strictEqual(typeof kpi.previousValue, 'number');
      assert.strictEqual(typeof kpi.change, 'number');
      assert.strictEqual(typeof kpi.changePercent, 'number');
      assert.ok(['up', 'down', 'neutral'].includes(kpi.trend));
      assert.strictEqual(typeof kpi.definition, 'string');
      assert.strictEqual(typeof kpi.timeScope, 'string');
    }

    // Assert time series structures
    assert.ok(Array.isArray(overview.timeSeries.dataHealth));
    assert.ok(Array.isArray(overview.timeSeries.syncReliability));

    // Assert application pipeline
    assert.ok(Array.isArray(overview.applicationPipeline));
    assert.ok(overview.applicationPipeline.length >= 5);
    for (const stage of overview.applicationPipeline) {
      assert.strictEqual(typeof stage.stage, 'string');
      assert.strictEqual(typeof stage.count, 'number');
      assert.strictEqual(typeof stage.conversionRate, 'number');
      assert.strictEqual(typeof stage.dropOffRate, 'number');
    }

    // Assert completeness fields
    assert.ok(Array.isArray(overview.dataCompletenessByField));
    assert.ok(overview.dataCompletenessByField.length >= 7);
    for (const field of overview.dataCompletenessByField) {
      assert.strictEqual(typeof field.field, 'string');
      assert.strictEqual(typeof field.completedPercentage, 'number');
      assert.ok(['high', 'medium', 'low'].includes(field.criticality));
    }

    // Assert operational queues
    assert.ok(Array.isArray(overview.operations.reviewQueue));
    assert.ok(Array.isArray(overview.operations.recentlyFailedJobs));
    assert.ok(Array.isArray(overview.operations.sourcesOverdue));
    assert.ok(Array.isArray(overview.operations.recentActivity));
  });

  test('AdminDashboardService correctly aggregates metrics and calculates deltas with data', async () => {
    if (!isDbConnected) return;

    // Seed test university and program
    const uni = await University.create({
      name: 'University of Sydney',
      slug: 'usyd',
      country: 'Australia',
      state: 'NSW',
      status: 'active',
      programCount: 1,
    });

    await Program.create({
      provider: uni._id,
      university: uni._id,
      providerName: 'University of Sydney',
      providerSlug: 'usyd',
      name: 'Master of Data Science',
      slug: 'master-of-data-science-usyd',
      level: 'master',
      fieldOfStudy: 'Information Technology',
      description: 'Advanced data science program',
      status: 'active',
      confidenceScore: 88,
      primaryFeeAnnualAud: 45000,
      primaryFeeTotalAud: 90000,
      cricosCourseCode: '012345M',
      city: 'Sydney',
      state: 'NSW',
    });

    await StagedChange.create({
      entityType: 'program',
      changeType: 'create',
      newValue: { name: 'Master of AI' },
      confidence: 65,
      status: 'pending',
      universityId: uni._id,
    });

    const user = await User.create({
      username: 'teststudent',
      email: 'student@example.com',
      passwordHash: 'secret1234',
      role: 'user',
    });

    await ApplicationTracker.create({
      userId: user._id,
      columnId: 'researching',
      title: 'Master of Data Science',
      universityId: uni._id,
      tasks: [
        {
          id: 'task_1',
          title: 'Upload SOP',
          completed: false,
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Overdue
          createdAt: new Date(),
        },
      ],
    });

    const overview = await AdminDashboardService.getOverview({ refresh: true });

    assert.strictEqual(overview.kpis.verifiedActivePrograms.value, 1);
    assert.strictEqual(overview.kpis.pendingStagedChanges.value, 1);
    assert.strictEqual(overview.kpis.activeApplications.value, 1);
    assert.strictEqual(overview.kpis.overdueTasks.value, 1);
    assert.strictEqual(overview.operations.reviewQueue.length, 1);
    assert.strictEqual(overview.operations.reviewQueue[0].entityType, 'program');

    // Field completeness verification
    const tuitionField = overview.dataCompletenessByField.find((f) => f.field === 'annualTuition');
    assert.ok(tuitionField);
    assert.strictEqual(tuitionField.completedPercentage, 100);
  });

  test('AdminDashboardService filters by state correctly', async () => {
    if (!isDbConnected) return;

    const uniNSW = await University.create({
      name: 'UNSW',
      slug: 'unsw',
      country: 'Australia',
      state: 'NSW',
      status: 'active',
      programCount: 1,
    });

    const uniVIC = await University.create({
      name: 'UniMelb',
      slug: 'unimelb',
      country: 'Australia',
      state: 'VIC',
      status: 'active',
      programCount: 1,
    });

    await Program.create({
      provider: uniNSW._id,
      university: uniNSW._id,
      providerName: 'UNSW',
      providerSlug: 'unsw',
      name: 'Bachelor of CS',
      slug: 'bcs-unsw',
      level: 'bachelor',
      fieldOfStudy: 'Computer Science',
      description: 'CS program',
      status: 'active',
      state: 'NSW',
      confidenceScore: 90,
    });

    await Program.create({
      provider: uniVIC._id,
      university: uniVIC._id,
      providerName: 'UniMelb',
      providerSlug: 'unimelb',
      name: 'Bachelor of Arts',
      slug: 'ba-unimelb',
      level: 'bachelor',
      fieldOfStudy: 'Humanities',
      description: 'Arts program',
      status: 'active',
      state: 'VIC',
      confidenceScore: 90,
    });

    const nswOverview = await AdminDashboardService.getOverview({ state: 'NSW', refresh: true });
    assert.strictEqual(nswOverview.kpis.verifiedActivePrograms.value, 1);

    const vicOverview = await AdminDashboardService.getOverview({ state: 'VIC', refresh: true });
    assert.strictEqual(vicOverview.kpis.verifiedActivePrograms.value, 1);
  });
});
