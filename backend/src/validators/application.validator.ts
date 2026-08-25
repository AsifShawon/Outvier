import { z } from 'zod';

export const applicationStageSchema = z.enum([
  'draft',
  'ready_for_review',
  'changes_requested',
  'staff_verified',
  'external_submission_required',
  'submitted_externally',
  'provider_confirmed',
  'offer',
  'rejected',
  'withdrawn',
]);

export const statusSourceSchema = z.enum([
  'student-reported',
  'staff-verified',
  'provider-confirmed',
  'integration-confirmed',
]);

export const applicantIdentitySchema = z.object({
  title: z.string().trim().max(20).optional(),
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  middleName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say', 'other']).optional(),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().max(30).optional(),
  currentAddress: z.object({
    street: z.string().trim().max(200).optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    postalCode: z.string().trim().max(20).optional(),
    country: z.string().trim().max(100).optional(),
  }).optional(),
  citizenshipCountry: z.string().trim().max(100).optional(),
  countryOfBirth: z.string().trim().max(100).optional(),
  dualCitizenship: z.boolean().optional(),
  secondCitizenshipCountry: z.string().trim().max(100).optional(),
  passportNumberMasked: z.string().trim().max(50).optional(),
  passportExpiryDate: z.coerce.date().optional(),
  passportCountryOfIssue: z.string().trim().max(100).optional(),
  currentVisaStatus: z.enum(['none', 'student', 'tourist', 'work', 'permanent_resident', 'other']).optional(),
  visaExpiryDate: z.coerce.date().optional(),
  emergencyContact: z.object({
    name: z.string().trim().max(100).optional(),
    relationship: z.string().trim().max(50).optional(),
    email: z.string().trim().email().optional().or(z.literal('')),
    phone: z.string().trim().max(30).optional(),
  }).optional(),
}).optional();

export const academicRecordSchema = z.object({
  id: z.string().optional(),
  qualificationLevel: z.enum([
    'high_school',
    'bachelor',
    'master',
    'doctorate',
    'diploma',
    'certificate',
    'other',
  ]),
  institutionName: z.string().trim().min(1, 'Institution is required').max(200),
  country: z.string().trim().min(1, 'Country is required').max(100),
  fieldOfStudy: z.string().trim().min(1, 'Field is required').max(150),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  gradingScale: z.string().trim().max(50).optional(),
  gpaAchieved: z.string().trim().max(50).optional(),
  isCompleted: z.boolean().default(true),
  transcriptDocumentId: z.string().optional(),
});

export const englishTestRecordSchema = z.object({
  id: z.string().optional(),
  testType: z.enum(['IELTS', 'PTE', 'TOEFL_IBT', 'DUOLINGO', 'CAMBRIDGE', 'MOI_EXEMPT', 'OTHER']),
  testDate: z.coerce.date().optional(),
  trfOrRegistrationNumber: z.string().trim().max(100).optional(),
  overallScore: z.number().min(0).max(160),
  listeningScore: z.number().min(0).max(160).optional(),
  readingScore: z.number().min(0).max(160).optional(),
  writingScore: z.number().min(0).max(160).optional(),
  speakingScore: z.number().min(0).max(160).optional(),
  expiryDate: z.coerce.date().optional(),
  documentId: z.string().optional(),
});

export const employmentRecordSchema = z.object({
  id: z.string().optional(),
  employerName: z.string().trim().min(1, 'Employer name is required').max(150),
  jobTitle: z.string().trim().min(1, 'Job title is required').max(150),
  employmentType: z.enum(['full_time', 'part_time', 'internship', 'contract']).default('full_time'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isCurrent: z.boolean().default(false),
  responsibilities: z.string().trim().max(2000).optional(),
  country: z.string().trim().max(100).optional(),
});

export const referenceSchema = z.object({
  id: z.string().optional(),
  refereeName: z.string().trim().min(1, 'Referee name is required').max(100),
  designation: z.string().trim().min(1, 'Designation is required').max(100),
  organization: z.string().trim().min(1, 'Organization is required').max(150),
  relationship: z.enum(['academic_supervisor', 'employer', 'professor', 'colleague', 'other']),
  email: z.string().trim().email('Valid referee email is required'),
  phone: z.string().trim().max(30).optional(),
  referenceLetterDocId: z.string().optional(),
});

export const consentSchema = z.object({
  consentType: z.enum([
    'data_processing',
    'terms_of_service',
    'declarations_accuracy',
    'agent_representation',
  ]),
  agreed: z.boolean(),
  agreedAt: z.coerce.date().optional(),
});

export const createApplicationSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  subtitle: z.string().trim().max(300).optional(),
  programId: z.string().optional(),
  universityId: z.string().optional(),
  customProgramName: z.string().trim().max(200).optional(),
  customUniversityName: z.string().trim().max(200).optional(),
  campusName: z.string().trim().max(100).optional(),
  studyLevel: z.string().trim().max(100).optional(),
  fieldOfStudy: z.string().trim().max(150).optional(),
  intakeTerm: z.string().trim().max(50).optional(),
  intakeYear: z.number().int().min(2024).max(2035).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  deadline: z.coerce.date().optional(),
  notes: z.string().trim().max(5000).optional(),
  identity: applicantIdentitySchema,
  academicRecords: z.array(academicRecordSchema).optional(),
  englishTestRecords: z.array(englishTestRecordSchema).optional(),
  employmentRecords: z.array(employmentRecordSchema).optional(),
  references: z.array(referenceSchema).optional(),
  consents: z.array(consentSchema).optional(),
  statementOfPurpose: z.string().trim().max(20000).optional(),
  tags: z.array(z.string().trim().max(50)).default([]),
}).strict();

export const updateApplicationSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  subtitle: z.string().trim().max(300).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  deadline: z.coerce.date().optional().nullable(),
  notes: z.string().trim().max(5000).optional(),
  officialApplicationUrl: z.string().url().optional().or(z.literal('')).nullable(),
  portalApplicationNumber: z.string().trim().max(100).optional(),
  programChoice: z.object({
    programId: z.string().optional(),
    universityId: z.string().optional(),
    customProgramName: z.string().trim().max(200).optional(),
    customUniversityName: z.string().trim().max(200).optional(),
    campusName: z.string().trim().max(100).optional(),
    studyLevel: z.string().trim().max(100).optional(),
    fieldOfStudy: z.string().trim().max(150).optional(),
    intakeTerm: z.string().trim().max(50).optional(),
    intakeYear: z.number().int().optional(),
    attendanceMode: z.enum(['on-campus', 'online', 'hybrid']).optional(),
    estimatedTuitionAud: z.number().optional(),
  }).optional(),
  identity: applicantIdentitySchema,
  academicRecords: z.array(academicRecordSchema).optional(),
  englishTestRecords: z.array(englishTestRecordSchema).optional(),
  employmentRecords: z.array(employmentRecordSchema).optional(),
  references: z.array(referenceSchema).optional(),
  consents: z.array(consentSchema).optional(),
  statementOfPurpose: z.string().trim().max(20000).optional(),
  tags: z.array(z.string().trim().max(50)).optional(),
  archived: z.boolean().optional(),
}).strict();

export const updateStageSchema = z.object({
  stage: applicationStageSchema,
  statusSource: statusSourceSchema.default('student-reported'),
  reason: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
  partnerApplicationRef: z.string().trim().max(100).optional(),
  partnerName: z.string().trim().max(150).optional(),
}).strict();

export const createSnapshotSchema = z.object({
  method: z.enum(['student-manual', 'staff-assisted', 'partner-integration']).default('student-manual'),
  partnerName: z.string().trim().max(150).optional(),
  partnerApplicationRef: z.string().trim().max(100).optional(),
  isVerifiedIntegration: z.boolean().default(false),
}).strict();

export const taskItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1).max(200),
  category: z.enum(['document', 'form', 'fee', 'interview', 'visa', 'general']).default('general'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.coerce.date().optional().nullable(),
  completed: z.boolean().default(false),
  assignedToRole: z.enum(['student', 'staff', 'reviewer']).default('student'),
});

export const updateTasksSchema = z.object({
  tasks: z.array(taskItemSchema),
}).strict();

export const communicationSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(5000),
  channel: z.enum(['comment', 'student_query', 'staff_feedback', 'system_alert']).default('comment'),
  attachments: z.array(z.string()).optional(),
  isInternalOnly: z.boolean().default(false),
}).strict();

export const assignReviewerSchema = z.object({
  reviewerId: z.string().min(1, 'Reviewer ID is required'),
}).strict();
