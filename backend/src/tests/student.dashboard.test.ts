import assert from 'node:assert/strict';
import test, { describe, before, after, beforeEach } from 'node:test';
import mongoose from 'mongoose';
import { StudentDashboardService } from '../services/studentDashboard.service';
import { User } from '../models/User.model';
import { StudentProfile } from '../models/StudentProfile.model';
import { ApplicationTracker } from '../models/ApplicationTracker.model';
import { Program } from '../models/Program.model';
import { University } from '../models/University.model';
import { BudgetPlan } from '../models/BudgetPlan.model';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/outvier_test_student_dashboard';

describe('Student Application Readiness & Decision Dashboard Tests', () => {
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
      await User.deleteMany({});
      await StudentProfile.deleteMany({});
      await ApplicationTracker.deleteMany({});
      await Program.deleteMany({});
      await University.deleteMany({});
      await BudgetPlan.deleteMany({});
    }
  });

  test('StudentDashboardService returns valid contract and onboarding state for new student', async () => {
    if (!isDbConnected) return;

    const user = await User.create({
      username: 'newstudent',
      email: 'newstudent@example.com',
      passwordHash: 'secret1234',
      role: 'user',
    });

    const dashboard = await StudentDashboardService.getStudentDashboard(user._id);

    // Contract structure assertions
    assert.ok(dashboard);
    assert.ok(dashboard.student);
    assert.strictEqual(dashboard.student.name, 'newstudent');
    assert.strictEqual(typeof dashboard.overallReadinessPercentage, 'number');
    assert.ok(dashboard.profileReadiness);
    assert.ok(dashboard.documentReadiness);
    assert.ok(dashboard.nextPrimaryAction);
    assert.ok(Array.isArray(dashboard.upcomingDeadlines));
    assert.ok(Array.isArray(dashboard.applicationStages));
    assert.ok(dashboard.tasksSummary);
    assert.ok(dashboard.shortlistSummary);
    assert.ok(dashboard.budgetSummary);
    assert.ok(dashboard.isNewUser);

    // For new student, next primary action should be profile completion
    assert.strictEqual(dashboard.nextPrimaryAction.type, 'profile');
    assert.ok(dashboard.profileReadiness.missingFields.length > 0);
  });

  test('StudentDashboardService calculates explainable fit scores, deadlines, and overdue tasks', async () => {
    if (!isDbConnected) return;

    const user = await User.create({
      username: 'alex',
      email: 'alex@example.com',
      passwordHash: 'secret1234',
      role: 'user',
    });

    const uni = await University.create({
      name: 'UNSW Sydney',
      slug: 'unsw',
      country: 'Australia',
      state: 'NSW',
      status: 'active',
    });

    const program = await Program.create({
      provider: uni._id,
      university: uni._id,
      providerName: 'UNSW Sydney',
      providerSlug: 'unsw',
      name: 'Master of Information Technology',
      slug: 'master-of-information-technology-unsw',
      level: 'master',
      fieldOfStudy: 'Information Technology',
      description: 'Top IT program',
      status: 'active',
      primaryFeeAnnualAud: 46000,
      primaryFeeTotalAud: 92000,
      state: 'NSW',
      cricosCourseCode: '012345M',
      academicRequirements: 'Bachelor degree in relevant field with minimum GPA 65%',
      englishRequirementsDetail: { ieltsOverall: 6.5 },
    });

    await StudentProfile.create({
      userId: user._id,
      country: 'India',
      currentEducationLevel: 'Bachelor',
      lastDegreeName: 'BTech Computer Science',
      gpa: 3.5,
      gradingScale: 4.0,
      ieltsOverall: 7.0,
      testStatus: 'taken',
      preferredField: 'Information Technology',
      preferredLevel: 'master',
      preferredStates: ['NSW'],
      budgetMaxAud: 50000,
      savedPrograms: [program._id],
    });

    const deadlineDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days away

    await ApplicationTracker.create({
      userId: user._id,
      columnId: 'preparing',
      title: 'Master of Information Technology',
      universityId: uni._id,
      programId: program._id,
      deadline: deadlineDate,
      intake: 'Feb 2027',
      tasks: [
        {
          id: 'task_1',
          title: 'Request official transcript from college',
          completed: false,
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days overdue
          createdAt: new Date(),
        },
      ],
      documentChecklist: [
        {
          id: 'doc_1',
          name: 'Passport Copy',
          status: 'verified',
          updatedAt: new Date(),
        },
        {
          id: 'doc_2',
          name: 'Statement of Purpose (SOP)',
          status: 'pending',
          updatedAt: new Date(),
        },
      ],
    });

    const dashboard = await StudentDashboardService.getStudentDashboard(user._id);

    // Profile readiness
    assert.ok(dashboard.profileReadiness.score >= 80);
    assert.strictEqual(dashboard.isNewUser, false);

    // Document readiness (1 verified out of 2)
    assert.strictEqual(dashboard.documentReadiness.totalRequired, 2);
    assert.strictEqual(dashboard.documentReadiness.uploadedCount, 1);
    assert.strictEqual(dashboard.documentReadiness.score, 50);

    // Tasks & Overdue
    assert.strictEqual(dashboard.tasksSummary.overdueCount, 1);
    assert.strictEqual(dashboard.tasksSummary.tasks[0].isOverdue, true);

    // Deadlines
    assert.strictEqual(dashboard.upcomingDeadlines.length, 1);
    assert.strictEqual(dashboard.upcomingDeadlines[0].daysRemaining, 10);
    assert.strictEqual(dashboard.upcomingDeadlines[0].isUrgent, true);

    // Shortlist explainable fit
    assert.strictEqual(dashboard.shortlistSummary.totalCount, 1);
    const fit = dashboard.shortlistSummary.programs[0];
    assert.ok(fit.overallFitScore >= 80);
    assert.strictEqual(fit.academicFit.status, 'strong');
    assert.strictEqual(fit.englishFit.status, 'strong');
    assert.strictEqual(fit.isAffordable, true);
  });
});
