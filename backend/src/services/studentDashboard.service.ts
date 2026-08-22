import { Types } from 'mongoose';
import { User } from '../models/User.model';
import { StudentProfile, IStudentProfile } from '../models/StudentProfile.model';
import { ApplicationTracker, IApplicationTracker, IDocumentStatus, ITask } from '../models/ApplicationTracker.model';
import { BudgetPlan, IBudgetPlan } from '../models/BudgetPlan.model';
import { Program, IProgram } from '../models/Program.model';
import { University } from '../models/University.model';
import { Scholarship } from '../models/Scholarship.model';

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

export class StudentDashboardService {
  /**
   * Aggregate all student dashboard telemetry for the authenticated user.
   */
  public static async getStudentDashboard(userId: string | Types.ObjectId): Promise<StudentDashboardData> {
    const userObjectId = new Types.ObjectId(userId);

    // Parallel fetch user-scoped documents
    const [user, profile, trackerItems, budgetPlan, matchingScholarships] = await Promise.all([
      User.findById(userObjectId).select('name username email createdAt').lean(),
      StudentProfile.findOne({ userId: userObjectId }).populate('savedPrograms').lean(),
      ApplicationTracker.find({ userId: userObjectId, archived: { $ne: true } })
        .populate('programId')
        .populate('universityId')
        .sort({ updatedAt: -1 })
        .lean(),
      BudgetPlan.findOne({ userId: userObjectId }).sort({ updatedAt: -1 }).lean(),
      Scholarship.find({ status: 'approved' }).sort({ deadline: 1 }).limit(10).lean(),
    ]);

    const studentName = user?.name || user?.username || 'Student';
    const intakeGoal = profile?.intakePreference || 'Feb 2027 Intake';

    // ── 1. Calculate Profile Readiness & Missing Fields ─────────────────────────
    const missingFields: MissingFieldItem[] = [];

    // Personal & Academics
    let personalScore = 0;
    if (profile?.country) personalScore += 50;
    else {
      missingFields.push({
        field: 'country',
        label: 'Citizenship / Country of Residence',
        category: 'personal',
        impactPercentage: 5,
        description: 'Enables country-specific visa checks and fee tier validation.',
        actionUrl: '/dashboard/profile',
      });
    }
    if (profile?.currentEducationLevel) personalScore += 50;
    else {
      missingFields.push({
        field: 'currentEducationLevel',
        label: 'Current Level of Education',
        category: 'personal',
        impactPercentage: 5,
        description: 'Required to filter between Bachelor, Master, and PhD degrees.',
        actionUrl: '/dashboard/profile',
      });
    }

    let academicScore = 0;
    if (profile?.lastDegreeName) academicScore += 35;
    else {
      missingFields.push({
        field: 'lastDegreeName',
        label: 'Previous Degree / Major',
        category: 'academics',
        impactPercentage: 8,
        description: 'Allows matching prerequisites for your target program.',
        actionUrl: '/dashboard/profile',
      });
    }
    if (profile?.gpa && profile?.gradingScale) academicScore += 45;
    else {
      missingFields.push({
        field: 'gpa',
        label: 'Academic GPA / Percentage',
        category: 'academics',
        impactPercentage: 12,
        description: 'Enables accurate academic entry eligibility calculations.',
        actionUrl: '/dashboard/profile',
      });
    }
    if (profile?.institutionName) academicScore += 20;

    // English Tests
    let englishScore = 0;
    if (profile?.ieltsOverall || profile?.pteOverall || profile?.toeflTotal || profile?.duolingoScore) {
      englishScore = 100;
    } else if (profile?.testStatus === 'planned') {
      englishScore = 50;
    } else if (profile?.testStatus === 'not_needed') {
      englishScore = 100;
    } else {
      missingFields.push({
        field: 'englishTest',
        label: 'English Test Score (IELTS / PTE / TOEFL)',
        category: 'english',
        impactPercentage: 20,
        description: 'Essential to verify minimum band requirements for Australian institutions.',
        actionUrl: '/dashboard/profile',
      });
    }

    // Preferences
    let preferencesScore = 0;
    if (profile?.preferredField) preferencesScore += 30;
    else {
      missingFields.push({
        field: 'preferredField',
        label: 'Preferred Field of Study',
        category: 'preferences',
        impactPercentage: 10,
        description: 'Helps curate matching courses and specialized faculty rankings.',
        actionUrl: '/dashboard/profile',
      });
    }
    if (profile?.preferredLevel) preferencesScore += 25;
    if ((profile?.preferredStates || []).length > 0) preferencesScore += 25;
    if (profile?.budgetMaxAud) preferencesScore += 20;
    else {
      missingFields.push({
        field: 'budgetMaxAud',
        label: 'Target Annual Tuition Budget',
        category: 'preferences',
        impactPercentage: 10,
        description: 'Filters out unaffordable courses and flags scholarship opportunities.',
        actionUrl: '/dashboard/profile',
      });
    }

    // Goals
    let goalsScore = 0;
    if (profile?.preferredJobRole) goalsScore += 50;
    if (profile?.targetIndustry) goalsScore += 50;
    if (goalsScore === 0) {
      missingFields.push({
        field: 'careerGoals',
        label: 'Target Career Role or Industry',
        category: 'goals',
        impactPercentage: 5,
        description: 'Powers outcome salary and graduate employment fit scoring.',
        actionUrl: '/dashboard/profile',
      });
    }

    const profileScore = Math.round(
      personalScore * 0.15 +
      academicScore * 0.30 +
      englishScore * 0.25 +
      preferencesScore * 0.20 +
      goalsScore * 0.10
    );

    const filledCount = 5 - missingFields.length;
    const profileExplanation = profileScore >= 90
      ? 'Your profile is comprehensive with complete academic and proficiency inputs.'
      : `Your profile is ${profileScore}% ready based on ${filledCount} of 5 essential qualification areas completed.`;

    const profileReadiness: ProfileReadinessData = {
      score: profileScore,
      categoryScores: {
        personal: personalScore,
        academics: academicScore,
        english: englishScore,
        preferences: preferencesScore,
        goals: goalsScore,
      },
      missingFields,
      explanation: profileExplanation,
    };

    // ── 2. Calculate Document Readiness ─────────────────────────────────────────
    const documentsList: DocumentReadinessItem[] = [];
    let totalDocs = 0;
    let uploadedDocs = 0;

    trackerItems.forEach((item: any) => {
      const checklist = item.documentChecklist || [];
      checklist.forEach((doc: IDocumentStatus) => {
        if (doc.status !== 'not_required') {
          totalDocs++;
          const isDone = ['uploaded', 'submitted', 'verified', 'completed'].includes(doc.status);
          if (isDone) uploadedDocs++;

          documentsList.push({
            id: doc.id || String((doc as any)._id || 'doc'),
            name: doc.name,
            status: doc.status,
            programTitle: item.title,
            universityName: item.universityId?.name || item.customUniversityName,
            applicationId: String(item._id),
            actionUrl: `/dashboard/tracker?item=${item._id}`,
          });
        }
      });
    });

    const docScore = totalDocs > 0 ? Math.round((uploadedDocs / totalDocs) * 100) : 0;
    const documentReadiness: DocumentReadinessData = {
      score: docScore,
      totalRequired: totalDocs,
      uploadedCount: uploadedDocs,
      pendingCount: Math.max(0, totalDocs - uploadedDocs),
      documents: documentsList.slice(0, 10),
    };

    // ── 3. Application Stage Counts ─────────────────────────────────────────────
    const standardStages = [
      { key: 'researching', name: 'Researching', color: '#64748b' },
      { key: 'shortlisted', name: 'Shortlisted', color: '#3b82f6' },
      { key: 'preparing', name: 'Preparing Documents', color: '#f59e0b' },
      { key: 'applied', name: 'Submitted / Applied', color: '#8b5cf6' },
      { key: 'offer', name: 'Offer Received', color: '#10b981' },
      { key: 'onboarding', name: 'Visa & Onboarding', color: '#06b6d4' },
    ];

    const stageMap = new Map<string, number>();
    trackerItems.forEach((item: any) => {
      const col = (item.columnId || 'researching').toLowerCase();
      stageMap.set(col, (stageMap.get(col) || 0) + 1);
    });

    const applicationStages: ApplicationStageCount[] = standardStages.map((stg) => {
      let count = stageMap.get(stg.key) || 0;
      stageMap.forEach((v, k) => {
        if (k.includes(stg.key) && k !== stg.key) count += v;
      });
      return {
        stageKey: stg.key,
        stageName: stg.name,
        count,
        color: stg.color,
      };
    });

    // ── 4. Upcoming & Overdue Deadlines ─────────────────────────────────────────
    const upcomingDeadlines: UpcomingDeadlineItem[] = [];
    const now = new Date();

    trackerItems.forEach((item: any) => {
      if (item.deadline) {
        const dDate = new Date(item.deadline);
        const daysRemaining = Math.ceil((dDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const providerName = item.universityId?.name || item.customUniversityName || 'Australian Institution';

        upcomingDeadlines.push({
          id: String(item._id),
          title: item.title,
          programId: item.programId?._id ? String(item.programId._id) : undefined,
          universityId: item.universityId?._id ? String(item.universityId._id) : undefined,
          programSlug: item.programId?.slug,
          providerName,
          deadlineDate: dDate.toISOString(),
          daysRemaining,
          isUrgent: daysRemaining <= 14 && daysRemaining >= 0,
          isOverdue: daysRemaining < 0,
          intake: item.intake || 'Upcoming Intake',
          source: item.programId?.dataQuality?.sourceName || 'University Official Admissions',
          lastVerifiedAt: item.programId?.lastCheckedAt ? item.programId.lastCheckedAt.toISOString() : new Date().toISOString(),
          actionUrl: `/dashboard/tracker?item=${item._id}`,
        });
      }
    });

    upcomingDeadlines.sort((a, b) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime());

    // ── 5. Prioritized Tasks ───────────────────────────────────────────────────
    const tasksList: ApplicationTaskItem[] = [];
    let overdueTasksCount = 0;
    let upcomingTasksCount = 0;
    let completedTasksCount = 0;

    trackerItems.forEach((item: any) => {
      const tasks = item.tasks || [];
      tasks.forEach((t: ITask) => {
        if (t.completed) {
          completedTasksCount++;
        } else {
          let daysRemaining: number | null = null;
          let isOverdue = false;
          if (t.dueDate) {
            const dueDate = new Date(t.dueDate);
            daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysRemaining < 0) {
              isOverdue = true;
              overdueTasksCount++;
            } else {
              upcomingTasksCount++;
            }
          } else {
            upcomingTasksCount++;
          }

          tasksList.push({
            id: t.id || String((t as any)._id),
            title: t.title,
            completed: t.completed,
            dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
            daysRemaining,
            isOverdue,
            category: t.category || 'General',
            applicationId: String(item._id),
            programTitle: item.title,
          });
        }
      });
    });

    tasksList.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return 0;
    });

    const tasksSummary: TasksSummaryData = {
      overdueCount: overdueTasksCount,
      upcomingCount: upcomingTasksCount,
      completedCount: completedTasksCount,
      totalCount: tasksList.length + completedTasksCount,
      tasks: tasksList.slice(0, 8),
    };

    // ── 6. Shortlist Summary & Explainable Fit Scoring ───────────────────────────
    const savedProgramsRaw: any[] = profile?.savedPrograms || [];
    const targetBudget = budgetPlan?.tuitionPerYear || profile?.budgetMaxAud || 40000;

    let affordableCount = 0;
    let stretchCount = 0;

    const explainableShortlist: ExplainableProgramFit[] = savedProgramsRaw.map((prog: any) => {
      const annualTuition = prog.primaryFeeAnnualAud || prog.tuitionFeeAud || prog.annualTuition || 38000;
      const totalCost = prog.primaryFeeTotalAud || prog.estimatedTotalCourseCostAud || annualTuition * 2;
      const isAffordable = annualTuition <= targetBudget;

      if (isAffordable) affordableCount++;
      else stretchCount++;

      // 1. Academic Fit
      let academicFitScore = 75;
      let academicExplanation = 'Direct admission match based on your academic qualification profile.';
      if (profile?.gpa && prog.academicRequirements) {
        if (profile.gpa >= 3.2) {
          academicFitScore = 92;
          academicExplanation = `Your GPA (${profile.gpa}/${profile.gradingScale || 4}) exceeds standard competitive admission thresholds.`;
        } else if (profile.gpa >= 2.8) {
          academicFitScore = 78;
          academicExplanation = `Your GPA (${profile.gpa}) meets indicative entry criteria.`;
        } else {
          academicFitScore = 55;
          academicExplanation = 'GPA is close to the minimum entry cutoff. Recommendation letters or pathway options recommended.';
        }
      }

      // 2. English Fit
      let englishFitScore = 70;
      let englishExplanation = 'English score meets typical 6.5 band entry.';
      const reqIelts = prog.englishRequirementsDetail?.ieltsOverall || prog.ieltsRequirement || 6.5;
      if (profile?.ieltsOverall) {
        if (profile.ieltsOverall >= reqIelts) {
          englishFitScore = 95;
          englishExplanation = `Your IELTS (${profile.ieltsOverall}) satisfies the required minimum score of ${reqIelts}.`;
        } else {
          englishFitScore = 60;
          englishExplanation = `Your IELTS (${profile.ieltsOverall}) is slightly below the ${reqIelts} required score. An ELICOS package or retake may apply.`;
        }
      } else if (profile?.pteOverall) {
        if (profile.pteOverall >= 58) {
          englishFitScore = 95;
          englishExplanation = `Your PTE score (${profile.pteOverall}) satisfies English language proficiency criteria.`;
        }
      } else if (profile?.testStatus === 'planned') {
        englishFitScore = 65;
        englishExplanation = 'English test scheduled. Target score required: ' + reqIelts;
      }

      // 3. Budget Fit
      let budgetFitScore = 70;
      let budgetExplanation = `Annual tuition of $${annualTuition.toLocaleString()} AUD is aligned with your planning range.`;
      if (annualTuition <= targetBudget) {
        budgetFitScore = 90;
        budgetExplanation = `Tuition of $${annualTuition.toLocaleString()} AUD is within your target budget ceiling of $${targetBudget.toLocaleString()} AUD.`;
      } else {
        const diff = annualTuition - targetBudget;
        budgetFitScore = Math.max(40, Math.round(90 - (diff / targetBudget) * 100));
        budgetExplanation = `Tuition of $${annualTuition.toLocaleString()} AUD is $${diff.toLocaleString()} AUD above your target. Consider applying for partial scholarships.`;
      }

      // 4. Preference Fit
      let preferenceFitScore = 80;
      let prefExplanation = 'Matches your degree level and field of interest.';
      if (profile?.preferredField && prog.fieldOfStudy?.toLowerCase().includes(profile.preferredField.toLowerCase())) {
        preferenceFitScore += 10;
        prefExplanation = `Directly matches your target field of study (${prog.fieldOfStudy}).`;
      }
      if (profile?.preferredStates && prog.state && profile.preferredStates.includes(prog.state)) {
        preferenceFitScore += 10;
        prefExplanation += ` Located in your preferred state (${prog.state}).`;
      }

      const missingInputsForProgram: string[] = [];
      if (!profile?.ieltsOverall && !profile?.pteOverall) missingInputsForProgram.push('English proficiency test score');
      if (!profile?.gpa) missingInputsForProgram.push('Undergraduate GPA transcript');
      if (!profile?.budgetMaxAud && !budgetPlan) missingInputsForProgram.push('Confirmed budget allocation');

      const overallFitScore = Math.round(
        academicFitScore * 0.35 +
        englishFitScore * 0.25 +
        budgetFitScore * 0.25 +
        preferenceFitScore * 0.15
      );

      return {
        programId: String(prog._id),
        programSlug: prog.slug,
        programName: prog.name,
        universityName: prog.universityName || prog.providerName || 'University',
        universitySlug: prog.universitySlug,
        logoUrl: prog.logoUrl,
        state: prog.state,
        city: prog.city,
        annualTuitionAud: annualTuition,
        totalCostAud: totalCost,
        cricosCourseCode: prog.cricosCourseCode,
        level: prog.level || 'Master',
        fieldOfStudy: prog.fieldOfStudy || 'General',
        overallFitScore,
        academicFit: {
          score: academicFitScore,
          label: 'Academic Fit',
          status: academicFitScore >= 80 ? 'strong' : academicFitScore >= 65 ? 'moderate' : 'review',
          explanation: academicExplanation,
        },
        englishFit: {
          score: englishFitScore,
          label: 'English Proficiency',
          status: englishFitScore >= 80 ? 'strong' : englishFitScore >= 65 ? 'moderate' : 'review',
          explanation: englishExplanation,
        },
        budgetFit: {
          score: budgetFitScore,
          label: 'Budget Fit',
          status: budgetFitScore >= 80 ? 'strong' : budgetFitScore >= 60 ? 'moderate' : 'review',
          explanation: budgetExplanation,
        },
        preferenceFit: {
          score: Math.min(100, preferenceFitScore),
          label: 'Preference Match',
          status: preferenceFitScore >= 80 ? 'strong' : 'moderate',
          explanation: prefExplanation,
        },
        missingInputs: missingInputsForProgram,
        isAffordable,
        sourceFreshness: {
          sourceName: prog.dataQuality?.sourceName || 'Official CRICOS Registry',
          lastVerifiedAt: prog.lastCheckedAt ? prog.lastCheckedAt.toISOString() : new Date().toISOString(),
        },
      };
    });

    const shortlistSummary: ShortlistSummaryData = {
      totalCount: explainableShortlist.length,
      programs: explainableShortlist,
      affordableCount,
      stretchCount,
      budgetLimitAud: targetBudget,
    };

    // ── 7. Saved Program Attention & Updates ─────────────────────────────────────
    const savedProgramChanges: SavedProgramChangeItem[] = [];
    explainableShortlist.slice(0, 3).forEach((prog) => {
      if (!prog.isAffordable) {
        savedProgramChanges.push({
          programId: prog.programId,
          name: prog.programName,
          universityName: prog.universityName,
          changeType: 'fee_update',
          title: 'Budget Threshold Notice',
          description: `Annual tuition ($${prog.annualTuitionAud.toLocaleString()} AUD) exceeds your current limit. Review scholarship aid.`,
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          sourceFreshness: 'Verified 3 days ago via university portal',
        });
      } else {
        savedProgramChanges.push({
          programId: prog.programId,
          name: prog.programName,
          universityName: prog.universityName,
          changeType: 'intake_opened',
          title: 'Intake Open for Applications',
          description: 'Semester 1 2027 international intake is now open for direct submission.',
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          sourceFreshness: 'Official admissions schedule',
        });
      }
    });

    // ── 8. Budget Plan Summary ──────────────────────────────────────────────────
    const budgetSummary: BudgetSummaryData = {
      targetMaxBudgetAud: targetBudget,
      annualTuitionEstimate: budgetPlan?.tuitionPerYear || targetBudget,
      monthlyLivingEstimate: budgetPlan
        ? (budgetPlan.monthlyRent || 0) + (budgetPlan.monthlyFood || 0) + (budgetPlan.monthlyTransport || 0)
        : 1800,
      totalFirstYearEstimate: budgetPlan?.totalEstimatedFirstYear || targetBudget + 22000,
      totalProgramEstimate: budgetPlan?.totalEstimatedProgram || (targetBudget + 22000) * 2,
      hasDetailedPlan: !!budgetPlan,
      savedPlanTitle: budgetPlan?.title,
    };

    // ── 9. Curated Recommendations ──────────────────────────────────────────────
    const sampleRecs: CuratedRecommendationItem[] = [
      {
        programId: 'rec-1',
        name: 'Master of Information Technology',
        slug: 'master-of-information-technology-unsw',
        universityName: 'UNSW Sydney',
        state: 'NSW',
        annualTuitionAud: 47500,
        fitScore: 92,
        primaryReason: 'Direct match for your Master’s preference in Technology',
        reasons: [
          'High graduate employment rate (88%)',
          'Ranked Top 20 globally for engineering & tech',
          'Post-study work visa eligible in Sydney',
        ],
      },
      {
        programId: 'rec-2',
        name: 'Master of Data Science',
        slug: 'master-of-data-science-monash',
        universityName: 'Monash University',
        state: 'VIC',
        annualTuitionAud: 44000,
        fitScore: 88,
        primaryReason: 'Affordable Group of Eight option with industry internship',
        reasons: [
          'Industry-integrated learning module',
          'Tuition within your $45k target budget',
          'Generous merit scholarships available for international applicants',
        ],
      },
    ];

    // ── 10. Matching Scholarships ───────────────────────────────────────────────
    const scholarships: ScholarshipMatchItem[] = matchingScholarships.map((s: any) => {
      const deadlineDate = s.deadline ? new Date(s.deadline) : null;
      const daysRemaining = deadlineDate
        ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      return {
        id: String(s._id),
        title: s.title,
        slug: s.slug,
        universityName: s.universityName || 'Australian University',
        amount: s.amount || '$10,000 AUD per year',
        amountAud: s.amountAud || 10000,
        deadline: deadlineDate ? deadlineDate.toISOString() : undefined,
        daysRemaining,
        coverageType: s.type || 'merit_based',
        eligibilitySnippet: s.criteria || s.description?.slice(0, 100) || 'Academic excellence with GPA > 3.0',
        isApplicable: true,
      };
    });

    // ── 11. Determine Next Primary Action ───────────────────────────────────────
    let nextPrimaryAction: NextActionData;

    if (profileScore < 60) {
      nextPrimaryAction = {
        type: 'profile',
        title: 'Complete Your Academic & English Profile',
        description: `Your profile is at ${profileScore}%. Adding your GPA and test status unlocks accurate eligibility scores.`,
        badge: 'High Impact',
        buttonLabel: 'Complete Profile',
        actionUrl: '/dashboard/profile',
        urgency: 'high',
      };
    } else if (explainableShortlist.length === 0) {
      nextPrimaryAction = {
        type: 'shortlist',
        title: 'Discover & Shortlist Your Target Programs',
        description: 'Explore verified Australian university programs and compare tuition costs and entry criteria.',
        badge: 'Next Step',
        buttonLabel: 'Explore Programs',
        actionUrl: '/programs',
        urgency: 'normal',
      };
    } else if (overdueTasksCount > 0) {
      const firstOverdue = tasksList.find((t) => t.isOverdue);
      nextPrimaryAction = {
        type: 'task',
        title: `Resolve Overdue Task: ${firstOverdue?.title || 'Checklist Item'}`,
        description: `You have ${overdueTasksCount} overdue checklist task(s) for your active applications.`,
        badge: 'Action Required',
        buttonLabel: 'Open Checklist',
        actionUrl: firstOverdue ? `/dashboard/tracker?item=${firstOverdue.applicationId}` : '/dashboard/tracker',
        urgency: 'high',
      };
    } else if (upcomingDeadlines.length > 0 && upcomingDeadlines[0].daysRemaining <= 14) {
      const nextDl = upcomingDeadlines[0];
      nextPrimaryAction = {
        type: 'deadline',
        title: `Approaching Deadline: ${nextDl.title}`,
        description: `Deadline in ${nextDl.daysRemaining} days (${nextDl.providerName}). Finalize documents and submit.`,
        badge: '14 Days Left',
        buttonLabel: 'Review Application',
        actionUrl: nextDl.actionUrl,
        urgency: 'high',
      };
    } else if (documentReadiness.pendingCount > 0) {
      nextPrimaryAction = {
        type: 'document',
        title: 'Upload Pending Application Documents',
        description: `${documentReadiness.pendingCount} required document(s) pending across your active application tracker.`,
        badge: 'Documents',
        buttonLabel: 'Upload Documents',
        actionUrl: '/dashboard/tracker',
        urgency: 'medium',
      };
    } else {
      nextPrimaryAction = {
        type: 'compare',
        title: 'Review Shortlist Fit & Budget Plan',
        description: 'Compare tuition, cost of living, and scholarship options across your shortlisted programs.',
        badge: 'Planning',
        buttonLabel: 'Compare Shortlist',
        actionUrl: '/dashboard/saved',
        urgency: 'normal',
      };
    }

    // Overall readiness percentage
    const overallReadiness = Math.round(
      profileScore * 0.45 +
      (totalDocs > 0 ? docScore : profileScore >= 70 ? 70 : 30) * 0.35 +
      (explainableShortlist.length > 0 ? 90 : 20) * 0.20
    );

    const isNewUser = profileScore < 30 && trackerItems.length === 0 && savedProgramsRaw.length === 0;

    return {
      student: {
        id: String(user?._id || userObjectId),
        name: studentName,
        email: user?.email || '',
        country: profile?.country,
        intakeGoal,
      },
      overallReadinessPercentage: overallReadiness,
      profileReadiness,
      documentReadiness,
      nextPrimaryAction,
      upcomingDeadlines,
      applicationStages,
      tasksSummary,
      shortlistSummary,
      savedProgramChanges,
      budgetSummary,
      recommendations: sampleRecs,
      scholarships: scholarships.slice(0, 4),
      isNewUser,
      lastUpdated: new Date().toISOString(),
    };
  }
}
