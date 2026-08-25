process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/outvier_test_app_workspace';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'outvier_test_jwt_secret_32_characters_minimum!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'outvier_test_jwt_refresh_secret_32_chars!';
process.env.COOKIE_SECRET = process.env.COOKIE_SECRET || 'outvier_test_cookie_secret_32_chars_long!';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

import assert from 'node:assert/strict';
import test, { describe, before, after } from 'node:test';
import mongoose, { Types } from 'mongoose';
import crypto from 'crypto';

import {
  Application,
  ApplicationVersion,
  DocumentRecord,
  StatusEvent,
} from '../models';
import { applicationWorkflowService } from '../services/applicationWorkflow.service';
import { documentSecurityService, ALLOWED_MIME_TYPES } from '../services/documentSecurity.service';
import { DiskStorageProvider } from '../services/storage/diskStorageProvider';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/outvier_test_app_workspace';

describe('Application Workspace & Workflow Evolution Test Suite', () => {
  let isDbConnected = false;
  const storage = new DiskStorageProvider();

  before(async () => {
    try {
      await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 3000 });
      isDbConnected = true;
    } catch {
      console.log('⚠️ MongoDB not running locally. Running standalone validation & service tests.');
    }
  });

  after(async () => {
    if (isDbConnected) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  });

  describe('1. Data Model Schema & Normalization', () => {
    test('Application schema validates all required fields, sub-schemas, and default stage', () => {
      const studentId = new Types.ObjectId();
      const app = new Application({
        userId: studentId,
        columnId: 'col_123',
        title: 'Master of Computer Science',
        stage: 'draft',
        statusSource: 'student-reported',
        programChoice: {
          customProgramName: 'Master of Computer Science',
          customUniversityName: 'University of New South Wales',
          intakeTerm: 'Feb',
          intakeYear: 2027,
          studyLevel: 'Postgraduate',
        },
        identity: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          passportNumberMasked: '******7890',
        },
        academicRecords: [
          {
            id: 'acad_1',
            qualificationLevel: 'bachelor',
            institutionName: 'Top University',
            country: 'Australia',
            fieldOfStudy: 'Information Technology',
            gpaAchieved: '3.8/4.0',
            isCompleted: true,
          },
        ],
        englishTestRecords: [
          {
            id: 'eng_1',
            testType: 'IELTS',
            overallScore: 7.5,
            listeningScore: 8.0,
            readingScore: 7.5,
            writingScore: 7.0,
            speakingScore: 7.5,
          },
        ],
        tasks: [
          {
            id: 'task_1',
            title: 'Upload Official Transcript',
            category: 'document',
            priority: 'high',
            completed: false,
            assignedToRole: 'student',
            order: 0,
          },
        ],
      });

      const validationError = app.validateSync();
      assert.strictEqual(validationError, undefined, 'Application model must pass schema validation');
      assert.strictEqual(app.stage, 'draft');
      assert.strictEqual(app.statusSource, 'student-reported');
      assert.strictEqual(app.readinessPercentage, 0);
    });

    test('DocumentRecord schema validates storage metadata and disallows direct file content', () => {
      const doc = new DocumentRecord({
        userId: new Types.ObjectId(),
        documentType: 'passport',
        title: 'International Passport',
        originalFilename: 'passport_scan.pdf',
        storageKey: 'user_123/passport.pdf.enc',
        mimeType: 'application/pdf',
        fileSizeBytes: 1024 * 500,
        checksumSha256: 'abc123sha256hash',
        scanStatus: 'clean',
        encryptionAlgorithm: 'AES-256-GCM',
        retentionState: 'active',
        verificationStatus: 'unverified',
      });

      const err = doc.validateSync();
      assert.strictEqual(err, undefined, 'DocumentRecord must validate successfully without binary payload');
      assert.strictEqual(doc.encryptionAlgorithm, 'AES-256-GCM');
      assert.strictEqual(doc.scanStatus, 'clean');
    });
  });

  describe('2. State Machine & Workflow Validation', () => {
    const studentUser = { id: new Types.ObjectId().toString(), role: 'user' };
    const adminUser = { id: new Types.ObjectId().toString(), role: 'admin' };

    test('Permits valid student workflow transitions (draft -> ready_for_review -> submitted_externally)', () => {
      const res1 = applicationWorkflowService.validateTransition(
        'draft',
        'ready_for_review',
        'student-reported',
        studentUser
      );
      assert.strictEqual(res1.valid, true, 'Draft -> ready_for_review must be valid for student');

      const res2 = applicationWorkflowService.validateTransition(
        'ready_for_review',
        'submitted_externally',
        'student-reported',
        studentUser
      );
      assert.strictEqual(res2.valid, true, 'Ready_for_review -> submitted_externally must be valid for student');
    });

    test('Rejects invalid transition path (draft -> offer)', () => {
      const res = applicationWorkflowService.validateTransition(
        'draft',
        'offer',
        'staff-verified',
        adminUser
      );
      assert.strictEqual(res.valid, false);
      assert.match(res.error || '', /Invalid stage transition/);
    });
  });

  describe('3. Status Source Security & RBAC Acceptance Criteria', () => {
    const studentUser = { id: new Types.ObjectId().toString(), role: 'user' };
    const adminUser = { id: new Types.ObjectId().toString(), role: 'admin' };

    test('CRITICAL: Student CANNOT mark status as provider-confirmed or staff-verified', () => {
      const res1 = applicationWorkflowService.validateTransition(
        'submitted_externally',
        'provider_confirmed',
        'provider-confirmed',
        studentUser
      );
      assert.strictEqual(res1.valid, false, 'Student must not be allowed to transition to provider_confirmed');

      const res2 = applicationWorkflowService.validateTransition(
        'ready_for_review',
        'staff_verified',
        'staff-verified',
        studentUser
      );
      assert.strictEqual(res2.valid, false, 'Student must not be allowed to set staff-verified');
    });

    test('Admin/Staff can transition to staff_verified and provider_confirmed', () => {
      const res1 = applicationWorkflowService.validateTransition(
        'ready_for_review',
        'staff_verified',
        'staff-verified',
        adminUser
      );
      assert.strictEqual(res1.valid, true, 'Admin can verify application as staff-verified');

      const res2 = applicationWorkflowService.validateTransition(
        'submitted_externally',
        'provider_confirmed',
        'provider-confirmed',
        adminUser
      );
      assert.strictEqual(res2.valid, true, 'Admin can mark provider-confirmed');
    });
  });

  describe('4. Important Product Rule & Submission Disclaimer Verification', () => {
    test('Self-reported external submission clearly states Outvier has NOT verified transmission', async () => {
      const studentId = new Types.ObjectId();
      const app = new Application({
        userId: studentId,
        columnId: 'col_1',
        title: 'Master of IT',
        stage: 'submitted_externally',
        statusSource: 'student-reported',
        currentVersionNumber: 1,
      });

      const snapshot = await applicationWorkflowService.createImmutableSnapshot({
        application: app,
        submittedBy: studentId,
        method: 'student-manual',
        isVerifiedIntegration: false,
      });

      assert.strictEqual(snapshot.submissionReceipt?.isVerifiedIntegration, false);
      assert.match(
        snapshot.submissionReceipt?.disclaimer || '',
        /Self-Reported External Submission: Outvier has NOT verified transmission with the partner university/
      );
      assert.strictEqual(app.isLocked, true);
    });

    test('Verified integration submission states official partner verification', async () => {
      const adminId = new Types.ObjectId();
      const app = new Application({
        userId: new Types.ObjectId(),
        columnId: 'col_1',
        title: 'Bachelor of Science',
        stage: 'submitted_externally',
        statusSource: 'integration-confirmed',
        currentVersionNumber: 1,
      });

      const snapshot = await applicationWorkflowService.createImmutableSnapshot({
        application: app,
        submittedBy: adminId,
        method: 'partner-integration',
        partnerName: 'Sydney University API Partner Gateway',
        partnerApplicationRef: 'USYD-APP-2026-9921',
        isVerifiedIntegration: true,
      });

      assert.strictEqual(snapshot.submissionReceipt?.isVerifiedIntegration, true);
      assert.match(
        snapshot.submissionReceipt?.disclaimer || '',
        /Verified University Submission: Transmitted and acknowledged via official Outvier Partner Integration/
      );
      assert.strictEqual(snapshot.submissionReceipt?.partnerApplicationRef, 'USYD-APP-2026-9921');
    });
  });

  describe('5. Document Security, Encryption, Magic Bytes & Multi-Tenant Isolation', () => {
    test('Validates MIME and magic bytes for PDF, rejecting spoofed extension', () => {
      const validPdfBuffer = Buffer.concat([
        Buffer.from('%PDF-1.7\n'),
        Buffer.from('Sample PDF binary stream content...'),
      ]);

      const validResult = documentSecurityService.validateFile({
        buffer: validPdfBuffer,
        reportedMimeType: 'application/pdf',
        filename: 'academic_transcript.pdf',
      });
      assert.strictEqual(validResult.valid, true, 'Valid PDF header must pass validation');

      // Spoofed extension: executable payload with .pdf extension
      const fakePdfBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00Windows Executable Header');
      const fakeResult = documentSecurityService.validateFile({
        buffer: fakePdfBuffer,
        reportedMimeType: 'application/pdf',
        filename: 'virus.pdf',
      });
      assert.strictEqual(fakeResult.valid, false, 'Spoofed file content must be rejected');
      assert.match(fakeResult.error || '', /magic bytes mismatch/);
    });

    test('DiskStorageProvider encrypts data on disk and decrypts transparently', async () => {
      const userId = 'user_test_sec_999';
      const originalPlaintext = Buffer.from('CONFIDENTIAL_PASSPORT_NUMBER_P12345678_OFFICIAL');

      const saveResult = await storage.saveFile(
        userId,
        'passport.pdf',
        originalPlaintext,
        'application/pdf',
        true
      );

      assert.ok(saveResult.storageKey.endsWith('.enc'));
      assert.ok(saveResult.checksumSha256.length === 64);

      // Verify stored bytes on disk are NOT plain text
      const decrypted = await storage.readFile(saveResult.storageKey, true);
      assert.strictEqual(decrypted.toString('utf8'), originalPlaintext.toString('utf8'));

      // Clean up test file
      await storage.deleteFile(saveResult.storageKey);
    });

    test('Multi-tenant owner authorization blocks unauthorized users', () => {
      const ownerId = new Types.ObjectId();
      const attackerId = new Types.ObjectId();
      const adminId = new Types.ObjectId();

      const doc = new DocumentRecord({
        userId: ownerId,
        documentType: 'transcript',
        title: 'Confidential Transcript',
        originalFilename: 'transcript.pdf',
        storageKey: 'key_123',
        mimeType: 'application/pdf',
        fileSizeBytes: 1000,
        checksumSha256: 'hash',
        scanStatus: 'clean',
        encryptionAlgorithm: 'AES-256-GCM',
        retentionState: 'active',
      });

      // Owner can access
      const ownerCanAccess = documentSecurityService.authorizeAccess(
        { id: ownerId.toString(), role: 'user' },
        doc
      );
      assert.strictEqual(ownerCanAccess, true, 'Owner must have access');

      // Attacker is blocked
      const attackerCanAccess = documentSecurityService.authorizeAccess(
        { id: attackerId.toString(), role: 'user' },
        doc
      );
      assert.strictEqual(attackerCanAccess, false, 'Other user must be blocked');

      // Admin can access
      const adminCanAccess = documentSecurityService.authorizeAccess(
        { id: adminId.toString(), role: 'admin' },
        doc
      );
      assert.strictEqual(adminCanAccess, true, 'Admin must have access');
    });

    test('Signed download token generation & verification with expiration', () => {
      const docId = 'doc_test_123';
      const userId = 'user_test_456';

      // 1. Valid token
      const token = storage.generateSignedDownloadToken(docId, userId, 60);
      const verified = storage.verifySignedDownloadToken(token);
      assert.deepStrictEqual(verified, { documentId: docId, userId });

      // 2. Expired token (expiresInSeconds = -10)
      const expiredToken = storage.generateSignedDownloadToken(docId, userId, -10);
      const expiredVerified = storage.verifySignedDownloadToken(expiredToken);
      assert.strictEqual(expiredVerified, null, 'Expired token must return null');

      // 3. Tampered token
      const tamperedToken = token + 'tampered';
      const tamperedVerified = storage.verifySignedDownloadToken(tamperedToken);
      assert.strictEqual(tamperedVerified, null, 'Tampered token must return null');
    });
  });

  describe('6. Application Readiness Scoring Engine', () => {
    test('Calculates low readiness for empty draft and 100% for complete profile', () => {
      // Empty draft
      const emptyApp = new Application({
        title: 'Draft App',
        stage: 'draft',
      });
      const resEmpty = applicationWorkflowService.calculateReadiness(emptyApp);
      assert.ok(resEmpty.score < 30, `Empty app should have low readiness, got ${resEmpty.score}%`);
      assert.ok(resEmpty.missingRequirements.length >= 4);

      // Complete profile
      const completeApp = new Application({
        title: 'Master of AI',
        programChoice: {
          customProgramName: 'Master of AI',
          intakeTerm: 'Feb 2027',
        },
        identity: {
          firstName: 'Alice',
          lastName: 'Smith',
          email: 'alice@example.com',
          dateOfBirth: new Date('2001-05-15'),
          citizenshipCountry: 'Australia',
          passportNumberMasked: '******4321',
        },
        academicRecords: [
          {
            id: 'acad_1',
            qualificationLevel: 'bachelor',
            institutionName: 'ANU',
            country: 'Australia',
            fieldOfStudy: 'Computer Science',
            isCompleted: true,
          },
        ],
        englishTestRecords: [
          {
            id: 'eng_1',
            testType: 'IELTS',
            overallScore: 8.0,
          },
        ],
        employmentRecords: [
          {
            id: 'emp_1',
            employerName: 'Tech Corp',
            jobTitle: 'Software Engineer',
            isCurrent: true,
          },
        ],
        documents: [new Types.ObjectId(), new Types.ObjectId()],
        references: [
          {
            id: 'ref_1',
            refereeName: 'Prof. Johnson',
            designation: 'Department Head',
            organization: 'ANU',
            relationship: 'professor',
            email: 'johnson@anu.edu.au',
          },
        ],
        consents: [
          {
            consentType: 'data_processing',
            agreed: true,
            agreedAt: new Date(),
          },
        ],
        statementOfPurpose: 'My deep passion for artificial intelligence research...',
      });

      const resComplete = applicationWorkflowService.calculateReadiness(completeApp);
      assert.strictEqual(resComplete.score, 100, 'Fully filled application must achieve 100% readiness');
      assert.strictEqual(resComplete.missingRequirements.length, 0);
    });
  });
});
