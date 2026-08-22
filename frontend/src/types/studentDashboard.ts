export interface MissingFieldItem {
  field: string;
  label: string;
  category: 'personal' | 'academics' | 'english' | 'preferences' | 'goals';
  impactPercentage: number;
  description: string;
  actionUrl: string;
}

export interface ProfileReadinessData {
  score: number;
  categoryScores: {
    personal: number;
    academics: number;
    english: number;
    preferences: number;
    goals: number;
  };
  missingFields: MissingFieldItem[];
  explanation: string;
}

export interface DocumentReadinessItem {
  id: string;
  name: string;
  status: 'pending' | 'preparing' | 'uploaded' | 'submitted' | 'verified' | 'completed' | 'not_required';
  programTitle?: string;
  universityName?: string;
  applicationId: string;
  actionUrl: string;
}

export interface DocumentReadinessData {
  score: number;
  totalRequired: number;
  uploadedCount: number;
  pendingCount: number;
  documents: DocumentReadinessItem[];
}

export interface UpcomingDeadlineItem {
  id: string;
  title: string;
  programId?: string;
  universityId?: string;
  programSlug?: string;
  providerName: string;
  deadlineDate: string;
  daysRemaining: number;
  isUrgent: boolean;
  isOverdue: boolean;
  intake?: string;
  source: string;
  lastVerifiedAt: string | null;
  actionUrl: string;
}

export interface ApplicationStageCount {
  stageKey: string;
  stageName: string;
  count: number;
  color: string;
}

export interface ApplicationTaskItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  daysRemaining: number | null;
  isOverdue: boolean;
  category?: string;
  applicationId: string;
  programTitle?: string;
}

export interface TasksSummaryData {
  overdueCount: number;
  upcomingCount: number;
  completedCount: number;
  totalCount: number;
  tasks: ApplicationTaskItem[];
}

export interface FitComponentScore {
  score: number;
  label: string;
  status: 'strong' | 'moderate' | 'review' | 'missing';
  explanation: string;
}

export interface ExplainableProgramFit {
  programId: string;
  programSlug: string;
  programName: string;
  universityName: string;
  universitySlug?: string;
  logoUrl?: string;
  state?: string;
  city?: string;
  annualTuitionAud: number;
  totalCostAud: number;
  cricosCourseCode?: string;
  level: string;
  fieldOfStudy: string;
  overallFitScore: number;
  academicFit: FitComponentScore;
  englishFit: FitComponentScore;
  budgetFit: FitComponentScore;
  preferenceFit: FitComponentScore;
  missingInputs: string[];
  isAffordable: boolean;
  sourceFreshness: {
    sourceName: string;
    lastVerifiedAt: string;
  };
}

export interface ShortlistSummaryData {
  totalCount: number;
  programs: ExplainableProgramFit[];
  affordableCount: number;
  stretchCount: number;
  budgetLimitAud: number;
}

export interface SavedProgramChangeItem {
  programId: string;
  name: string;
  universityName: string;
  changeType: 'fee_update' | 'deadline_approaching' | 'cricos_verified' | 'intake_opened';
  title: string;
  description: string;
  updatedAt: string;
  sourceFreshness: string;
}

export interface BudgetSummaryData {
  targetMaxBudgetAud: number;
  annualTuitionEstimate: number;
  monthlyLivingEstimate: number;
  totalFirstYearEstimate: number;
  totalProgramEstimate: number;
  hasDetailedPlan: boolean;
  savedPlanTitle?: string;
}

export interface CuratedRecommendationItem {
  programId: string;
  name: string;
  slug: string;
  universityName: string;
  state?: string;
  annualTuitionAud: number;
  fitScore: number;
  primaryReason: string;
  reasons: string[];
}

export interface ScholarshipMatchItem {
  id: string;
  title: string;
  slug?: string;
  universityName: string;
  amount: string;
  amountAud?: number;
  deadline?: string;
  daysRemaining?: number;
  coverageType?: string;
  eligibilitySnippet: string;
  isApplicable: boolean;
}

export interface NextActionData {
  type: 'profile' | 'shortlist' | 'document' | 'task' | 'deadline' | 'compare';
  title: string;
  description: string;
  badge: string;
  buttonLabel: string;
  actionUrl: string;
  urgency: 'high' | 'medium' | 'normal';
}

export interface StudentDashboardData {
  student: {
    id: string;
    name: string;
    email: string;
    country?: string;
    intakeGoal: string;
  };
  overallReadinessPercentage: number;
  profileReadiness: ProfileReadinessData;
  documentReadiness: DocumentReadinessData;
  nextPrimaryAction: NextActionData;
  upcomingDeadlines: UpcomingDeadlineItem[];
  applicationStages: ApplicationStageCount[];
  tasksSummary: TasksSummaryData;
  shortlistSummary: ShortlistSummaryData;
  savedProgramChanges: SavedProgramChangeItem[];
  budgetSummary: BudgetSummaryData;
  recommendations: CuratedRecommendationItem[];
  scholarships: ScholarshipMatchItem[];
  isNewUser: boolean;
  lastUpdated: string;
}
