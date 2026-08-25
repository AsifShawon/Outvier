import crypto from 'crypto';
import { Types } from 'mongoose';
import { IApplication, Application, ApplicationStage } from '../models/Application.model';
import { ApplicationVersion, IApplicationVersion, ISubmissionReceipt } from '../models/ApplicationVersion.model';
import { StatusEvent, StatusSource, IStatusEvent } from '../models/StatusEvent.model';
import { DocumentRecord } from '../models/Document.model';

export const VALID_TRANSITIONS: Record<ApplicationStage, ApplicationStage[]> = {
  draft: ['ready_for_review', 'withdrawn', 'submitted_externally'],
  ready_for_review: ['changes_requested', 'staff_verified', 'submitted_externally', 'draft', 'withdrawn'],
  changes_requested: ['ready_for_review', 'draft', 'withdrawn'],
  staff_verified: ['external_submission_required', 'submitted_externally', 'ready_for_review', 'withdrawn'],
  external_submission_required: ['submitted_externally', 'withdrawn', 'draft'],
  submitted_externally: ['provider_confirmed', 'offer', 'rejected', 'withdrawn'],
  provider_confirmed: ['offer', 'rejected', 'withdrawn'],
  offer: ['withdrawn', 'draft'],
  rejected: ['draft', 'withdrawn'],
  withdrawn: ['draft'],
};

export const STUDENT_ALLOWED_STAGES: ApplicationStage[] = [
  'draft',
  'ready_for_review',
  'submitted_externally',
  'withdrawn',
];

export class ApplicationWorkflowService {
  /**
   * Validates whether a state transition and status source is permitted for the actor.
   */
  validateTransition(
    currentStage: ApplicationStage,
    targetStage: ApplicationStage,
    targetStatusSource: StatusSource,
    actor: { id: string; role: string }
  ): { valid: boolean; error?: string } {
    // 1. Transition path validation
    const allowedTargets = VALID_TRANSITIONS[currentStage] || [];
    if (currentStage !== targetStage && !allowedTargets.includes(targetStage)) {
      return {
        valid: false,
        error: `Invalid stage transition from '${currentStage}' to '${targetStage}'`,
      };
    }

    // 2. Student role constraints
    if (actor.role !== 'admin') {
      if (!STUDENT_ALLOWED_STAGES.includes(targetStage)) {
        return {
          valid: false,
          error: `Students cannot transition application to '${targetStage}'. This action requires staff verification or provider integration.`,
        };
      }

      if (
        targetStatusSource === 'staff-verified' ||
        targetStatusSource === 'provider-confirmed' ||
        targetStatusSource === 'integration-confirmed'
      ) {
        return {
          valid: false,
          error: `Students cannot set status source to '${targetStatusSource}'. Only 'student-reported' is allowed for student accounts.`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Computes the 0-100% readiness percentage across all application sections.
   */
  calculateReadiness(application: Partial<IApplication>): {
    score: number;
    breakdown: Record<string, { completed: boolean; score: number; maxScore: number; details?: string }>;
    missingRequirements: string[];
  } {
    const breakdown: Record<string, { completed: boolean; score: number; maxScore: number; details?: string }> = {};
    const missing: string[] = [];

    // 1. Program & Intake (15 pts)
    const prog = application.programChoice;
    const hasProg = !!(prog?.programId || prog?.customProgramName);
    const hasIntake = !!(prog?.intakeTerm || application.deadline);
    const progScore = (hasProg ? 10 : 0) + (hasIntake ? 5 : 0);
    breakdown.programIntake = {
      completed: progScore === 15,
      score: progScore,
      maxScore: 15,
      details: hasProg ? (hasIntake ? 'Complete' : 'Missing Intake') : 'Select target program',
    };
    if (!hasProg) missing.push('Target program selection');
    if (!hasIntake) missing.push('Intake term or deadline');

    // 2. Personal Identity (15 pts)
    const idn = application.identity;
    const hasNames = !!(idn?.firstName && idn?.lastName);
    const hasEmail = !!idn?.email;
    const hasDob = !!idn?.dateOfBirth;
    const identityScore = (hasNames ? 7 : 0) + (hasEmail ? 4 : 0) + (hasDob ? 4 : 0);
    breakdown.personalIdentity = {
      completed: identityScore === 15,
      score: identityScore,
      maxScore: 15,
      details: hasNames && hasEmail && hasDob ? 'Complete' : 'Incomplete personal details',
    };
    if (!hasNames) missing.push('Full legal name');
    if (!hasDob) missing.push('Date of birth');

    // 3. Citizenship & Passport / Visa (10 pts)
    const hasCitizen = !!idn?.citizenshipCountry;
    const hasPassport = !!(idn?.passportNumberMasked || idn?.passportExpiryDate);
    const visaScore = (hasCitizen ? 5 : 0) + (hasPassport ? 5 : 0);
    breakdown.citizenshipVisa = {
      completed: visaScore === 10,
      score: visaScore,
      maxScore: 10,
      details: hasCitizen && hasPassport ? 'Complete' : 'Missing passport/citizenship context',
    };
    if (!hasCitizen) missing.push('Country of citizenship');
    if (!hasPassport) missing.push('Passport information');

    // 4. Academic History (15 pts)
    const academics = application.academicRecords || [];
    const hasAcademics = academics.length > 0 && academics.some((a) => a.institutionName && a.qualificationLevel);
    const acadScore = hasAcademics ? 15 : 0;
    breakdown.academicHistory = {
      completed: hasAcademics,
      score: acadScore,
      maxScore: 15,
      details: hasAcademics ? `${academics.length} record(s) added` : 'Add prior academic qualifications',
    };
    if (!hasAcademics) missing.push('Prior academic qualification record');

    // 5. English Proficiency (10 pts)
    const english = application.englishTestRecords || [];
    const hasEnglish = english.length > 0 && english.some((e) => e.overallScore > 0);
    const engScore = hasEnglish ? 10 : 0;
    breakdown.englishProficiency = {
      completed: hasEnglish,
      score: engScore,
      maxScore: 10,
      details: hasEnglish ? `${english[0].testType}: ${english[0].overallScore}` : 'Add English test score (IELTS/PTE/TOEFL)',
    };
    if (!hasEnglish) missing.push('English language proficiency score');

    // 6. Employment / Experience (10 pts)
    const emp = application.employmentRecords || [];
    const empScore = emp.length > 0 ? 10 : 10; // optional for undergrad, counted as satisfied
    breakdown.employment = {
      completed: true,
      score: empScore,
      maxScore: 10,
      details: emp.length > 0 ? `${emp.length} employment record(s)` : 'Optional / Not required',
    };

    // 7. Documents (15 pts)
    const docs = application.documents || [];
    const hasDocs = docs.length >= 2;
    const docScore = docs.length >= 2 ? 15 : docs.length === 1 ? 8 : 0;
    breakdown.documents = {
      completed: hasDocs,
      score: docScore,
      maxScore: 15,
      details: `${docs.length} document(s) uploaded (Passport, Transcript recommended)`,
    };
    if (docs.length < 2) missing.push('Key documents (Passport & Academic Transcript)');

    // 8. References (5 pts)
    const refs = application.references || [];
    const refScore = refs.length > 0 ? 5 : 5; // Optional
    breakdown.references = {
      completed: true,
      score: refScore,
      maxScore: 5,
      details: refs.length > 0 ? `${refs.length} referee(s) added` : 'Optional',
    };

    // 9. Statements & Consents (5 pts)
    const consents = application.consents || [];
    const hasConsent = consents.some((c) => c.agreed);
    const sopScore = hasConsent ? 5 : (application.statementOfPurpose ? 3 : 0);
    breakdown.statementsConsent = {
      completed: hasConsent,
      score: sopScore,
      maxScore: 5,
      details: hasConsent ? 'Declarations accepted' : 'Accept applicant declarations',
    };
    if (!hasConsent) missing.push('Applicant declaration & consent');

    const totalScore = Math.min(
      100,
      progScore + identityScore + visaScore + acadScore + engScore + empScore + docScore + refScore + sopScore
    );

    return {
      score: totalScore,
      breakdown,
      missingRequirements: missing,
    };
  }

  /**
   * Generates an immutable application version snapshot upon submission or snapshot request.
   */
  async createImmutableSnapshot({
    application,
    submittedBy,
    method = 'student-manual',
    partnerName,
    partnerApplicationRef,
    isVerifiedIntegration = false,
  }: {
    application: IApplication;
    submittedBy: Types.ObjectId;
    method?: 'student-manual' | 'staff-assisted' | 'partner-integration';
    partnerName?: string;
    partnerApplicationRef?: string;
    isVerifiedIntegration?: boolean;
  }): Promise<IApplicationVersion> {
    const nextVersionNumber = (application.currentVersionNumber || 0) + 1;
    const submissionId = `SUB-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Generate disclaimer adhering strictly to the product rule
    const disclaimer = isVerifiedIntegration
      ? `Verified University Submission: Transmitted and acknowledged via official Outvier Partner Integration with ${partnerName || 'Partner Institution'}.`
      : 'Self-Reported External Submission: Outvier has NOT verified transmission with the partner university. Application was logged manually by student.';

    const receipt: ISubmissionReceipt = {
      submissionId,
      method,
      partnerName,
      partnerApplicationRef,
      submittedBy,
      submittedAt: new Date(),
      isVerifiedIntegration,
      disclaimer,
    };

    // Snapshot complete data
    const snapshotData = {
      applicationId: application._id,
      title: application.title,
      programChoice: application.programChoice,
      identity: application.identity,
      academicRecords: application.academicRecords,
      englishTestRecords: application.englishTestRecords,
      employmentRecords: application.employmentRecords,
      references: application.references,
      documents: application.documents,
      consents: application.consents,
      statementOfPurpose: application.statementOfPurpose,
      tasks: application.tasks,
      stage: application.stage,
      statusSource: application.statusSource,
      deadline: application.deadline,
      submissionReceipt: receipt,
      snapshottedAt: new Date().toISOString(),
    };

    // Canonical JSON stringify for deterministic SHA-256 hash
    const canonicalJson = JSON.stringify(snapshotData, Object.keys(snapshotData).sort());
    const immutableChecksum = crypto.createHash('sha256').update(canonicalJson).digest('hex');

    const versionRecord = await ApplicationVersion.create({
      applicationId: application._id,
      versionNumber: nextVersionNumber,
      submittedAt: new Date(),
      submittedBy,
      stageAtSnapshot: application.stage,
      statusSourceAtSnapshot: application.statusSource,
      snapshotData,
      immutableChecksum,
      submissionReceipt: receipt,
    });

    // Update application lock state and receipt
    application.currentVersionNumber = nextVersionNumber;
    application.isLocked = true;
    application.submissionReceipt = receipt;
    await application.save();

    return versionRecord;
  }

  /**
   * Records an auditable status transition event.
   */
  async recordStatusEvent({
    applicationId,
    fromStage,
    toStage,
    fromStatusSource,
    toStatusSource,
    changedBy,
    changedByRole,
    actorName,
    reason,
    notes,
    metadata,
  }: {
    applicationId: Types.ObjectId;
    fromStage: string;
    toStage: string;
    fromStatusSource?: StatusSource;
    toStatusSource: StatusSource;
    changedBy: Types.ObjectId;
    changedByRole: 'user' | 'admin' | 'system' | 'integration';
    actorName?: string;
    reason?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
  }): Promise<IStatusEvent> {
    const event = await StatusEvent.create({
      applicationId,
      fromStage,
      toStage,
      fromStatusSource,
      toStatusSource,
      changedBy,
      changedByRole,
      actorName,
      reason,
      notes,
      metadata,
    });

    await Application.findByIdAndUpdate(applicationId, {
      $push: { statusEvents: event._id },
    });

    return event;
  }
}

export const applicationWorkflowService = new ApplicationWorkflowService();
