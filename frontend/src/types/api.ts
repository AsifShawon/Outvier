export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: { field: string; message: string }[];
}

export interface DashboardStats {
  totalUniversities: number;
  totalPrograms: number;
  totalCampuses: number;
  totalUsers: number;
  totalScholarships: number;
  totalApplications: number;
  pendingStagedChanges: number;
  lastCricosSync: {
    status: string;
    startedAt: string;
    completedAt?: string;
  } | null;
  failedSyncRuns: number;
  programsByLevel: { _id: string; count: number }[];
  universitiesByState: { _id: string; count: number }[];
  programsByField: { _id: string; count: number }[];
  userSignups: { _id: string; count: number }[];
}

export interface UploadJob {
  _id: string;
  entity: 'universities' | 'programs';
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  successCount: number;
  errorCount: number;
  rowErrors: { row: number; message: string }[];
  createdAt: string;
}

export interface FitScoreRawMetrics {
  annualTuitionAud: number | null;
  totalTuitionAud: number | null;
  globalRank: number | null;
  nationalRank: number | null;
  subjectRank: number | null;
  graduateEmploymentRate: number | null;
  medianSalary: number | null;
  teachingQuality: number | null;
  studentSupport: number | null;
  overallExperience: number | null;
  minimumGPA: number | null;
  ieltsRequired: number | null;
  hasInternship: boolean;
  applicationDeadline: string | null;
}

export interface FitScoreBreakdown {
  affordability: number;
  ranking: number;
  employability: number;
  admissionMatch: number;
  location: number;
  scholarship: number;
}

export interface FitScoreResult {
  programId: string;
  programName?: string;
  universityName?: string;
  totalScore: number;
  breakdown: FitScoreBreakdown;
  reasons: string[];
  rawMetrics: FitScoreRawMetrics;
}

export interface UniversityAnalytics {
  globalRank: number | null;
  nationalRank: number | null;
  subjectRank: number | null;
  rankingSource: string | null;
  graduateEmploymentRate: number | null;
  medianSalary: number | null;
  teachingQuality: number | null;
  studentSupport: number | null;
  learnerEngagement: number | null;
  overallExperience: number | null;
}
