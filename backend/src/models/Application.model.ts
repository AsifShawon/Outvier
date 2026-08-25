import mongoose, { Document as MongooseDocument, Schema, Types } from 'mongoose';
import { StatusSource } from './StatusEvent.model';
import { ISubmissionReceipt } from './ApplicationVersion.model';

export type ApplicationStage =
  | 'draft'
  | 'ready_for_review'
  | 'changes_requested'
  | 'staff_verified'
  | 'external_submission_required'
  | 'submitted_externally'
  | 'provider_confirmed'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export interface IApplicationProgramChoice {
  programId?: Types.ObjectId;
  universityId?: Types.ObjectId;
  customProgramName?: string;
  customUniversityName?: string;
  campusName?: string;
  studyLevel?: string;
  fieldOfStudy?: string;
  intakeTerm?: string;
  intakeYear?: number;
  attendanceMode?: 'on-campus' | 'online' | 'hybrid';
  estimatedTuitionAud?: number;
  choiceOrder?: number;
}

export interface IApplicantIdentity {
  title?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other';
  email: string;
  phone?: string;
  currentAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  citizenshipCountry?: string;
  countryOfBirth?: string;
  dualCitizenship?: boolean;
  secondCitizenshipCountry?: string;
  passportNumberMasked?: string;
  passportExpiryDate?: Date;
  passportCountryOfIssue?: string;
  currentVisaStatus?: 'none' | 'student' | 'tourist' | 'work' | 'permanent_resident' | 'other';
  visaExpiryDate?: Date;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    email?: string;
    phone?: string;
  };
}

export interface IAcademicRecord {
  id: string;
  qualificationLevel:
    | 'high_school'
    | 'bachelor'
    | 'master'
    | 'doctorate'
    | 'diploma'
    | 'certificate'
    | 'other';
  institutionName: string;
  country: string;
  fieldOfStudy: string;
  startDate?: Date;
  endDate?: Date;
  gradingScale?: string;
  gpaAchieved?: string;
  isCompleted: boolean;
  transcriptDocumentId?: Types.ObjectId;
}

export interface IEnglishTestRecord {
  id: string;
  testType: 'IELTS' | 'PTE' | 'TOEFL_IBT' | 'DUOLINGO' | 'CAMBRIDGE' | 'MOI_EXEMPT' | 'OTHER';
  testDate?: Date;
  trfOrRegistrationNumber?: string;
  overallScore: number;
  listeningScore?: number;
  readingScore?: number;
  writingScore?: number;
  speakingScore?: number;
  expiryDate?: Date;
  documentId?: Types.ObjectId;
}

export interface IEmploymentRecord {
  id: string;
  employerName: string;
  jobTitle: string;
  employmentType: 'full_time' | 'part_time' | 'internship' | 'contract';
  startDate?: Date;
  endDate?: Date;
  isCurrent: boolean;
  responsibilities?: string;
  country?: string;
}

export interface IReference {
  id: string;
  refereeName: string;
  designation: string;
  organization: string;
  relationship: 'academic_supervisor' | 'employer' | 'professor' | 'colleague' | 'other';
  email: string;
  phone?: string;
  referenceLetterDocId?: Types.ObjectId;
}

export interface IConsent {
  consentType:
    | 'data_processing'
    | 'terms_of_service'
    | 'declarations_accuracy'
    | 'agent_representation';
  agreed: boolean;
  agreedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface IWorkspaceTask {
  id: string;
  title: string;
  category: 'document' | 'form' | 'fee' | 'interview' | 'visa' | 'general';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
  assignedToRole: 'student' | 'staff' | 'reviewer';
  order: number;
  createdAt: Date;
}

export interface IWorkspaceCommunication {
  id: string;
  senderId: Types.ObjectId;
  senderRole: 'user' | 'admin' | 'reviewer' | 'system';
  channel: 'comment' | 'student_query' | 'staff_feedback' | 'system_alert';
  message: string;
  attachments?: Types.ObjectId[];
  isInternalOnly: boolean;
  createdAt: Date;
}

export interface IApplication extends MongooseDocument {
  userId: Types.ObjectId;
  boardId?: Types.ObjectId;
  columnId: string;
  order: number;
  title: string;
  subtitle?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  stage: ApplicationStage;
  statusSource: StatusSource;
  assignedReviewerId?: Types.ObjectId;
  officialApplicationUrl?: string;
  portalApplicationNumber?: string;
  deadline?: Date;
  readinessPercentage: number;
  currentVersionNumber: number;
  isLocked: boolean;
  programChoice: IApplicationProgramChoice;
  identity: IApplicantIdentity;
  academicRecords: IAcademicRecord[];
  englishTestRecords: IEnglishTestRecord[];
  employmentRecords: IEmploymentRecord[];
  references: IReference[];
  documents: Types.ObjectId[];
  consents: IConsent[];
  statementOfPurpose?: string;
  tasks: IWorkspaceTask[];
  communications: IWorkspaceCommunication[];
  statusEvents: Types.ObjectId[];
  submissionReceipt?: ISubmissionReceipt;
  tags: string[];
  archived: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationProgramChoiceSchema = new Schema<IApplicationProgramChoice>(
  {
    programId: { type: Schema.Types.ObjectId, ref: 'Program' },
    universityId: { type: Schema.Types.ObjectId, ref: 'University' },
    customProgramName: { type: String, trim: true },
    customUniversityName: { type: String, trim: true },
    campusName: { type: String, trim: true },
    studyLevel: { type: String, trim: true },
    fieldOfStudy: { type: String, trim: true },
    intakeTerm: { type: String, trim: true },
    intakeYear: { type: Number },
    attendanceMode: {
      type: String,
      enum: ['on-campus', 'online', 'hybrid'],
      default: 'on-campus',
    },
    estimatedTuitionAud: { type: Number },
    choiceOrder: { type: Number, default: 1 },
  },
  { _id: false }
);

const ApplicantIdentitySchema = new Schema<IApplicantIdentity>(
  {
    title: { type: String, trim: true },
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary', 'prefer-not-to-say', 'other'],
    },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    currentAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    citizenshipCountry: { type: String, trim: true },
    countryOfBirth: { type: String, trim: true },
    dualCitizenship: { type: Boolean, default: false },
    secondCitizenshipCountry: { type: String, trim: true },
    passportNumberMasked: { type: String, trim: true },
    passportExpiryDate: { type: Date },
    passportCountryOfIssue: { type: String, trim: true },
    currentVisaStatus: {
      type: String,
      enum: ['none', 'student', 'tourist', 'work', 'permanent_resident', 'other'],
      default: 'none',
    },
    visaExpiryDate: { type: Date },
    emergencyContact: {
      name: String,
      relationship: String,
      email: String,
      phone: String,
    },
  },
  { _id: false }
);

const AcademicRecordSchema = new Schema<IAcademicRecord>(
  {
    id: { type: String, required: true },
    qualificationLevel: {
      type: String,
      enum: [
        'high_school',
        'bachelor',
        'master',
        'doctorate',
        'diploma',
        'certificate',
        'other',
      ],
      required: true,
    },
    institutionName: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    fieldOfStudy: { type: String, required: true, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    gradingScale: { type: String, trim: true },
    gpaAchieved: { type: String, trim: true },
    isCompleted: { type: Boolean, default: true },
    transcriptDocumentId: { type: Schema.Types.ObjectId, ref: 'DocumentRecord' },
  },
  { _id: false }
);

const EnglishTestRecordSchema = new Schema<IEnglishTestRecord>(
  {
    id: { type: String, required: true },
    testType: {
      type: String,
      enum: ['IELTS', 'PTE', 'TOEFL_IBT', 'DUOLINGO', 'CAMBRIDGE', 'MOI_EXEMPT', 'OTHER'],
      required: true,
    },
    testDate: { type: Date },
    trfOrRegistrationNumber: { type: String, trim: true },
    overallScore: { type: Number, required: true },
    listeningScore: { type: Number },
    readingScore: { type: Number },
    writingScore: { type: Number },
    speakingScore: { type: Number },
    expiryDate: { type: Date },
    documentId: { type: Schema.Types.ObjectId, ref: 'DocumentRecord' },
  },
  { _id: false }
);

const EmploymentRecordSchema = new Schema<IEmploymentRecord>(
  {
    id: { type: String, required: true },
    employerName: { type: String, required: true, trim: true },
    jobTitle: { type: String, required: true, trim: true },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'internship', 'contract'],
      default: 'full_time',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
    responsibilities: { type: String },
    country: { type: String, trim: true },
  },
  { _id: false }
);

const ReferenceSchema = new Schema<IReference>(
  {
    id: { type: String, required: true },
    refereeName: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    organization: { type: String, required: true, trim: true },
    relationship: {
      type: String,
      enum: ['academic_supervisor', 'employer', 'professor', 'colleague', 'other'],
      default: 'professor',
    },
    email: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    referenceLetterDocId: { type: Schema.Types.ObjectId, ref: 'DocumentRecord' },
  },
  { _id: false }
);

const ConsentSchema = new Schema<IConsent>(
  {
    consentType: {
      type: String,
      enum: [
        'data_processing',
        'terms_of_service',
        'declarations_accuracy',
        'agent_representation',
      ],
      required: true,
    },
    agreed: { type: Boolean, required: true, default: false },
    agreedAt: { type: Date, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { _id: false }
);

const WorkspaceTaskSchema = new Schema<IWorkspaceTask>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['document', 'form', 'fee', 'interview', 'visa', 'general'],
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    assignedToRole: {
      type: String,
      enum: ['student', 'staff', 'reviewer'],
      default: 'student',
    },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const WorkspaceCommunicationSchema = new Schema<IWorkspaceCommunication>(
  {
    id: { type: String, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: {
      type: String,
      enum: ['user', 'admin', 'reviewer', 'system'],
      default: 'user',
    },
    channel: {
      type: String,
      enum: ['comment', 'student_query', 'staff_feedback', 'system_alert'],
      default: 'comment',
    },
    message: { type: String, required: true, trim: true },
    attachments: [{ type: Schema.Types.ObjectId, ref: 'DocumentRecord' }],
    isInternalOnly: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ApplicationSchema = new Schema<IApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    boardId: { type: Schema.Types.ObjectId, ref: 'TrackerBoard', index: true },
    columnId: { type: String, required: true, index: true },
    order: { type: Number, default: 0 },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    notes: { type: String },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true,
    },
    stage: {
      type: String,
      enum: [
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
      ],
      default: 'draft',
      index: true,
    },
    statusSource: {
      type: String,
      enum: ['student-reported', 'staff-verified', 'provider-confirmed', 'integration-confirmed'],
      default: 'student-reported',
      index: true,
    },
    assignedReviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
    officialApplicationUrl: { type: String, trim: true },
    portalApplicationNumber: { type: String, trim: true },
    deadline: { type: Date },
    readinessPercentage: { type: Number, default: 0, min: 0, max: 100 },
    currentVersionNumber: { type: Number, default: 1 },
    isLocked: { type: Boolean, default: false },
    programChoice: { type: ApplicationProgramChoiceSchema, default: () => ({}) },
    identity: { type: ApplicantIdentitySchema },
    academicRecords: [AcademicRecordSchema],
    englishTestRecords: [EnglishTestRecordSchema],
    employmentRecords: [EmploymentRecordSchema],
    references: [ReferenceSchema],
    documents: [{ type: Schema.Types.ObjectId, ref: 'DocumentRecord' }],
    consents: [ConsentSchema],
    statementOfPurpose: { type: String },
    tasks: [WorkspaceTaskSchema],
    communications: [WorkspaceCommunicationSchema],
    statusEvents: [{ type: Schema.Types.ObjectId, ref: 'StatusEvent' }],
    submissionReceipt: { type: Schema.Types.Mixed },
    tags: [{ type: String, trim: true }],
    archived: { type: Boolean, default: false },
    archivedAt: { type: Date },
  },
  { timestamps: true }
);

ApplicationSchema.index({ userId: 1, stage: 1 });
ApplicationSchema.index({ userId: 1, archived: 1 });
ApplicationSchema.index({ userId: 1, deadline: 1 });
ApplicationSchema.index({ boardId: 1, columnId: 1, order: 1 });

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
