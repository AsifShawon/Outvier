import api from '../api';
import { ApiResponse } from '@/types/api';
import { DocumentRecord } from './documents.api';

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

export type StatusSource =
  | 'student-reported'
  | 'staff-verified'
  | 'provider-confirmed'
  | 'integration-confirmed';

export interface ApplicationProgramChoice {
  programId?: string | { _id: string; name: string; level?: string; fieldOfStudy?: string; [key: string]: unknown };
  universityId?: string | { _id: string; name: string; logo?: string; logoUrl?: string; country?: string; state?: string; city?: string; [key: string]: unknown };
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

export interface ApplicantIdentity {
  title?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
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
  passportExpiryDate?: string;
  passportCountryOfIssue?: string;
  currentVisaStatus?: 'none' | 'student' | 'tourist' | 'work' | 'permanent_resident' | 'other';
  visaExpiryDate?: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    email?: string;
    phone?: string;
  };
}

export interface AcademicRecord {
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
  startDate?: string;
  endDate?: string;
  gradingScale?: string;
  gpaAchieved?: string;
  isCompleted: boolean;
  transcriptDocumentId?: string;
}

export interface EnglishTestRecord {
  id: string;
  testType: 'IELTS' | 'PTE' | 'TOEFL_IBT' | 'DUOLINGO' | 'CAMBRIDGE' | 'MOI_EXEMPT' | 'OTHER';
  testDate?: string;
  trfOrRegistrationNumber?: string;
  overallScore: number;
  listeningScore?: number;
  readingScore?: number;
  writingScore?: number;
  speakingScore?: number;
  expiryDate?: string;
  documentId?: string;
}

export interface EmploymentRecord {
  id: string;
  employerName: string;
  jobTitle: string;
  employmentType: 'full_time' | 'part_time' | 'internship' | 'contract';
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  responsibilities?: string;
  country?: string;
}

export interface ReferenceItem {
  id: string;
  refereeName: string;
  designation: string;
  organization: string;
  relationship: 'academic_supervisor' | 'employer' | 'professor' | 'colleague' | 'other';
  email: string;
  phone?: string;
  referenceLetterDocId?: string;
}

export interface ConsentItem {
  consentType:
    | 'data_processing'
    | 'terms_of_service'
    | 'declarations_accuracy'
    | 'agent_representation';
  agreed: boolean;
  agreedAt?: string;
}

export interface WorkspaceTask {
  id: string;
  title: string;
  category: 'document' | 'form' | 'fee' | 'interview' | 'visa' | 'general';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  assignedToRole: 'student' | 'staff' | 'reviewer';
  order: number;
  createdAt: string;
}

export interface WorkspaceCommunication {
  id: string;
  senderId: string | { _id: string; name: string; username: string; role: string };
  senderRole: 'user' | 'admin' | 'reviewer' | 'system';
  channel: 'comment' | 'student_query' | 'staff_feedback' | 'system_alert';
  message: string;
  attachments?: string[];
  isInternalOnly: boolean;
  createdAt: string;
}

export interface StatusEventRecord {
  _id: string;
  applicationId: string;
  fromStage: string;
  toStage: string;
  fromStatusSource?: StatusSource;
  toStatusSource: StatusSource;
  changedBy: string | { _id: string; name: string; username: string; role: string; email?: string };
  changedByRole: 'user' | 'admin' | 'system' | 'integration';
  actorName?: string;
  reason?: string;
  notes?: string;
  createdAt: string;
}

export interface SubmissionReceipt {
  submissionId: string;
  method: 'student-manual' | 'staff-assisted' | 'partner-integration';
  partnerName?: string;
  partnerApplicationRef?: string;
  submittedBy: string;
  submittedAt: string;
  isVerifiedIntegration: boolean;
  receiptDocumentId?: string;
  disclaimer: string;
}

export interface ApplicationWorkspaceItem {
  _id: string;
  userId: string;
  boardId?: string;
  columnId: string;
  order: number;
  title: string;
  subtitle?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  stage: ApplicationStage;
  statusSource: StatusSource;
  assignedReviewerId?: { _id: string; name: string; email: string; username: string; role: string };
  officialApplicationUrl?: string;
  portalApplicationNumber?: string;
  deadline?: string;
  readinessPercentage: number;
  currentVersionNumber: number;
  isLocked: boolean;
  programChoice: ApplicationProgramChoice;
  identity?: ApplicantIdentity;
  academicRecords: AcademicRecord[];
  englishTestRecords: EnglishTestRecord[];
  employmentRecords: EmploymentRecord[];
  references: ReferenceItem[];
  documents: DocumentRecord[] | string[];
  consents: ConsentItem[];
  statementOfPurpose?: string;
  tasks: WorkspaceTask[];
  communications: WorkspaceCommunication[];
  statusEvents: StatusEventRecord[];
  submissionReceipt?: SubmissionReceipt;
  tags: string[];
  archived: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadinessAnalysis {
  score: number;
  breakdown: Record<string, { completed: boolean; score: number; maxScore: number; details?: string }>;
  missingRequirements: string[];
}

export interface ApplicationDetailResponse {
  application: ApplicationWorkspaceItem;
  readiness: ReadinessAnalysis;
}

export interface ApplicationVersionRecord {
  _id: string;
  applicationId: string;
  versionNumber: number;
  submittedAt: string;
  submittedBy: { _id: string; name: string; username: string; email: string; role: string };
  stageAtSnapshot: string;
  statusSourceAtSnapshot: StatusSource;
  snapshotData: Record<string, unknown>;
  immutableChecksum: string;
  submissionReceipt?: SubmissionReceipt;
  notes?: string;
  createdAt: string;
}

export const applicationWorkspaceApi = {
  getApplications: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get<ApiResponse<ApplicationWorkspaceItem[]>>('/applications', { params }),

  getApplication: (id: string) =>
    api.get<ApiResponse<ApplicationDetailResponse>>(`/applications/${id}`),

  createApplication: (data: Partial<ApplicationWorkspaceItem>) =>
    api.post<ApiResponse<ApplicationWorkspaceItem>>('/applications', data),

  updateApplication: (id: string, data: Partial<ApplicationWorkspaceItem>) =>
    api.patch<ApiResponse<ApplicationDetailResponse>>(`/applications/${id}`, data),

  updateStage: (
    id: string,
    data: {
      stage: ApplicationStage;
      statusSource?: StatusSource;
      reason?: string;
      notes?: string;
      partnerName?: string;
      partnerApplicationRef?: string;
    }
  ) => api.patch<ApiResponse<{ application: ApplicationWorkspaceItem; statusEvent: StatusEventRecord; versionSnapshot?: ApplicationVersionRecord }>>(`/applications/${id}/stage`, data),

  createSnapshot: (id: string, data?: { method?: string; partnerName?: string; partnerApplicationRef?: string; isVerifiedIntegration?: boolean }) =>
    api.post<ApiResponse<ApplicationVersionRecord>>(`/applications/${id}/snapshot`, data || {}),

  getVersions: (id: string) =>
    api.get<ApiResponse<ApplicationVersionRecord[]>>(`/applications/${id}/versions`),

  updateTasks: (id: string, tasks: WorkspaceTask[]) =>
    api.patch<ApiResponse<WorkspaceTask[]>>(`/applications/${id}/tasks`, { tasks }),

  addCommunication: (id: string, data: { message: string; channel?: string; attachments?: string[]; isInternalOnly?: boolean }) =>
    api.post<ApiResponse<WorkspaceCommunication>>(`/applications/${id}/communications`, data),

  assignReviewer: (id: string, reviewerId: string) =>
    api.patch<ApiResponse<{ message: string; assignedReviewerId: string }>>(`/applications/${id}/assign-reviewer`, { reviewerId }),

  deleteApplication: (id: string, permanent: boolean = false) =>
    api.delete<ApiResponse<{ message: string }>>(`/applications/${id}`, {
      params: { permanent: permanent ? 'true' : 'false' },
    }),
};
