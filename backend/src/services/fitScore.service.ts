import { IPriorityWeights, IStudentProfile } from '../models/StudentProfile.model';
import { RankingRecord } from '../models/RankingRecord.model';
import { OutcomeMetric } from '../models/OutcomeMetric.model';
import { Scholarship } from '../models/Scholarship.model';

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

export interface FitScoreResult {
  programId: string;
  programName?: string;
  universityName?: string;
  totalScore: number;
  breakdown: {
    affordability: number;
    ranking: number;
    employability: number;
    admissionMatch: number;
    location: number;
    scholarship: number;
  };
  reasons: string[];
  rawMetrics: FitScoreRawMetrics;
}

function parseScholarshipAud(amount?: string): number {
  if (!amount) return 0;
  const digits = amount.replace(/[^0-9.]/g, '');
  return parseFloat(digits) || 0;
}

function normaliseGPAScore(
  minGPA: string | undefined,
  studentGpa: number | undefined,
  scale: number | undefined
): number | null {
  if (!minGPA || studentGpa == null) return null;
  const fractionMatch = minGPA.match(/(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)/);
  if (fractionMatch) {
    const reqNorm = parseFloat(fractionMatch[1]) / parseFloat(fractionMatch[2]);
    const studentNorm = studentGpa / (scale || parseFloat(fractionMatch[2]));
    return Math.max(0, Math.min(100, 100 - ((reqNorm - studentNorm) / reqNorm) * 200));
  }
  const pctMatch = minGPA.match(/(\d+\.?\d*)%/);
  if (pctMatch) {
    const reqPct = parseFloat(pctMatch[1]);
    const studentPct = (studentGpa / (scale || 4)) * 100;
    return Math.max(0, Math.min(100, 100 - ((reqPct - studentPct) / reqPct) * 200));
  }
  return null; // ambiguous grade label — skip
}

export const fitScoreService = {
  getWeightsFromPreset(preset: string): IPriorityWeights {
    const presets: Record<string, IPriorityWeights> = {
      balanced:         { affordability: 25, ranking: 20, employability: 20, admissionMatch: 15, location: 10, scholarship: 10 },
      budget:           { affordability: 45, scholarship: 20, admissionMatch: 15, employability: 10, location: 5, ranking: 5 },
      career:           { employability: 40, ranking: 20, affordability: 15, admissionMatch: 10, scholarship: 10, location: 5 },
      prestige:         { ranking: 45, employability: 20, affordability: 10, admissionMatch: 10, scholarship: 5, location: 10 },
      'easy-admission': { admissionMatch: 40, affordability: 20, scholarship: 15, location: 10, employability: 10, ranking: 5 },
      scholarship:      { scholarship: 35, affordability: 25, admissionMatch: 15, employability: 10, ranking: 10, location: 5 },
    };
    return presets[preset] || presets.balanced;
  },

  async calculateScores(profile: Partial<IStudentProfile>, programs: any[]): Promise<FitScoreResult[]> {
    const weights: IPriorityWeights = profile.priorityWeights || {
      affordability: 30,
      ranking: 20,
      employability: 20,
      admissionMatch: 15,
      location: 10,
      scholarship: 5,
    };
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0) || 100;

    const universityIds = programs.map(p => String(p.universityId?._id || p.university?._id || p.university));

    const [allRankings, outcomes, scholarships] = await Promise.all([
      RankingRecord.find({
        universityId: { $in: universityIds },
        status: 'approved',
      }).sort({ year: -1 }).lean(),

      OutcomeMetric.find({
        universityId: { $in: universityIds },
        status: 'approved',
      }).sort({ year: -1 }).lean(),

      Scholarship.find({
        universityId: { $in: universityIds },
        status: 'approved',
      }).lean(),
    ]);

    // Best global rank across all sources per university
    const rankingMap: Record<string, { globalRank?: number; nationalRank?: number; subjectRank?: number }> = {};
    allRankings.forEach(r => {
      const id = String(r.universityId);
      if (!rankingMap[id] || (r.globalRank && r.globalRank < (rankingMap[id].globalRank ?? Infinity))) {
        rankingMap[id] = { globalRank: r.globalRank ?? undefined, nationalRank: r.nationalRank ?? undefined, subjectRank: r.subjectRank ?? undefined };
      }
    });

    // Most recent outcome per university
    const outcomeMap = outcomes.reduce((acc, o) => {
      const id = String(o.universityId);
      if (!acc[id]) acc[id] = o;
      return acc;
    }, {} as Record<string, any>);

    // Scholarship count + max monetary value per university
    const scholarshipMap: Record<string, { count: number; maxAmount: number }> = {};
    scholarships.forEach(s => {
      const key = String(s.universityId);
      if (!scholarshipMap[key]) scholarshipMap[key] = { count: 0, maxAmount: 0 };
      scholarshipMap[key].count += 1;
      const parsed = parseScholarshipAud(s.amount);
      if (parsed > scholarshipMap[key].maxAmount) scholarshipMap[key].maxAmount = parsed;
    });

    return programs.map(program => {
      const uniId = String(program.universityId?._id || program.university?._id || program.university);
      const universityData = (program.universityId || program.university) as any;

      const breakdown = {
        affordability: 0,
        ranking: 50,
        employability: 50,
        admissionMatch: 0,
        location: 0,
        scholarship: 0,
      };
      const reasons: string[] = [];

      // 1. Affordability
      const budget = profile.budgetMaxAud || 40000;
      const tuition = program.annualTuition || program.tuitionDetails?.annualTuitionFee || program.tuitionFeeInternational || 35000;
      if (tuition <= budget) {
        breakdown.affordability = 100;
        reasons.push(`Tuition ($${tuition.toLocaleString()}) is within your budget.`);
      } else {
        const diff = tuition - budget;
        breakdown.affordability = Math.max(0, 100 - Math.floor((diff / budget) * 100));
        if (breakdown.affordability < 50) reasons.push(`Tuition ($${tuition.toLocaleString()}) significantly exceeds your budget.`);
      }

      // 2. Admission Match — IELTS (60%) + GPA (40%)
      const userIelts = (profile as any).ieltsOverall ?? (profile as any).ieltsScore ?? 6.5;
      const reqIelts = program.englishRequirementsDetail?.ieltsOverall ?? program.ieltsRequirement ?? 6.5;
      const ieltsScore = userIelts >= Number(reqIelts)
        ? 100
        : Math.max(0, 100 - (Number(reqIelts) - userIelts) * 50);

      const gpaScore = normaliseGPAScore(program.minimumGPA, profile.gpa, profile.gradingScale);
      if (gpaScore !== null) {
        breakdown.admissionMatch = Math.round(ieltsScore * 0.6 + gpaScore * 0.4);
        if (gpaScore < 50) {
          reasons.push(`Your GPA may not meet the minimum requirement (${program.minimumGPA}).`);
        } else {
          reasons.push(`GPA compatible with minimum requirement (${program.minimumGPA}).`);
        }
      } else {
        breakdown.admissionMatch = ieltsScore;
      }
      if (userIelts >= Number(reqIelts)) {
        reasons.push(`You meet the English requirement (IELTS ${reqIelts}).`);
      } else {
        reasons.push(`Your IELTS (${userIelts}) is below the requirement (${reqIelts}).`);
      }

      // 3. Location — city > state > no-pref > miss
      const uniCity = universityData?.city ?? program.city ?? '';
      const uniState = universityData?.state ?? program.state ?? '';
      const hasStatePref = (profile.preferredStates?.length ?? 0) > 0;
      const hasCityPref = (profile.preferredCities?.length ?? 0) > 0;
      const cityMatch = hasCityPref && profile.preferredCities!.some(c => c.toLowerCase() === uniCity.toLowerCase());
      const stateMatch = hasStatePref && profile.preferredStates!.includes(uniState);

      if (!hasStatePref && !hasCityPref) {
        breakdown.location = 80;
      } else if (cityMatch) {
        breakdown.location = 100;
        reasons.push(`Located in your preferred city (${uniCity}).`);
      } else if (stateMatch) {
        breakdown.location = 85;
        reasons.push(`Located in your preferred state (${uniState}).`);
      } else {
        breakdown.location = 50;
        reasons.push(`Located in ${uniCity || uniState} (not in your preferred list).`);
      }

      // 4. Ranking — logarithmic scale (rank 1 = 100, rank 1200 = 0) + subject rank bonus
      const rankData = rankingMap[uniId];
      if (rankData?.globalRank) {
        const logScore = Math.max(0, 100 * (1 - Math.log(rankData.globalRank) / Math.log(1200)));
        let subjectBonus = 0;
        if (rankData.subjectRank && rankData.subjectRank <= 50) subjectBonus = 10;
        else if (rankData.subjectRank && rankData.subjectRank <= 100) subjectBonus = 5;
        breakdown.ranking = Math.min(100, Math.round(logScore + subjectBonus));
        reasons.push(`University ranked #${rankData.globalRank} globally.`);
      }

      // 5. Employability — employment rate (50%) + salary (30%) + teaching quality (20%)
      const outcomeRecord = outcomeMap[uniId];
      if (outcomeRecord) {
        const emp = outcomeRecord.graduateEmploymentRate ?? null;
        const salNorm = outcomeRecord.medianSalary
          ? Math.min(100, (outcomeRecord.medianSalary / 65000) * 100)
          : null;
        const teach = outcomeRecord.teachingQuality ?? null;
        const wEmp = emp !== null ? 0.5 : 0;
        const wSal = salNorm !== null ? 0.3 : 0;
        const wTeach = teach !== null ? 0.2 : 0;
        const totalW = wEmp + wSal + wTeach;
        if (totalW > 0) {
          const rawScore = (emp ?? 0) * 0.5 + (salNorm ?? 0) * 0.3 + (teach ?? 0) * 0.2;
          breakdown.employability = Math.round(rawScore / totalW);
        }
        const empStr = emp != null ? `${emp}%` : 'N/A';
        const salStr = outcomeRecord.medianSalary != null ? `$${outcomeRecord.medianSalary.toLocaleString()}` : 'N/A';
        reasons.push(`Employment: ${empStr}, Median salary: ${salStr}.`);
      }

      // 6. Scholarship — count (50%) + max monetary value (50%)
      const sch = scholarshipMap[uniId] ?? { count: 0, maxAmount: 0 };
      if (sch.count === 0) {
        breakdown.scholarship = 0;
      } else {
        const countScore = Math.min(100, sch.count * 25);
        const amountScore = sch.maxAmount > 0 ? Math.min(100, (sch.maxAmount / 30000) * 100) : 0;
        breakdown.scholarship = Math.round(countScore * 0.5 + amountScore * 0.5);
        const amtLabel = sch.maxAmount > 0 ? ` (up to $${Math.round(sch.maxAmount / 1000)}k)` : '';
        reasons.push(`${sch.count} scholarship(s) available${amtLabel}.`);
      }

      // Weighted total
      let totalScore = 0;
      totalScore += breakdown.affordability  * (weights.affordability  / totalWeight);
      totalScore += breakdown.admissionMatch * (weights.admissionMatch / totalWeight);
      totalScore += breakdown.location       * (weights.location       / totalWeight);
      totalScore += breakdown.ranking        * (weights.ranking        / totalWeight);
      totalScore += breakdown.employability  * (weights.employability  / totalWeight);
      totalScore += breakdown.scholarship    * (weights.scholarship    / totalWeight);

      // Raw metrics for chart data
      const rawMetrics: FitScoreRawMetrics = {
        annualTuitionAud: program.annualTuition ?? program.tuitionDetails?.annualTuitionFee ?? null,
        totalTuitionAud: program.tuitionDetails?.totalEstimatedTuitionFee ?? null,
        globalRank: rankData?.globalRank ?? null,
        nationalRank: rankData?.nationalRank ?? null,
        subjectRank: rankData?.subjectRank ?? null,
        graduateEmploymentRate: outcomeRecord?.graduateEmploymentRate ?? null,
        medianSalary: outcomeRecord?.medianSalary ?? null,
        teachingQuality: outcomeRecord?.teachingQuality ?? null,
        studentSupport: outcomeRecord?.studentSupport ?? null,
        overallExperience: outcomeRecord?.overallExperience ?? null,
        minimumGPA: (() => {
          const m = program.minimumGPA?.match(/(\d+\.?\d*)/);
          return m ? parseFloat(m[1]) : null;
        })(),
        ieltsRequired: program.englishRequirementsDetail?.ieltsOverall ?? program.ieltsRequirement ?? null,
        hasInternship: program.courseStructure?.hasInternship ?? false,
        applicationDeadline: program.intakeDetails?.internationalDeadline
          ?? program.intakeDetails?.applicationDeadline
          ?? null,
      };

      return {
        programId: String(program._id),
        programName: program.name,
        universityName: universityData?.name || 'Unknown',
        totalScore: Math.round(totalScore),
        breakdown,
        reasons,
        rawMetrics,
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }
};
