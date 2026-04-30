import { IPriorityWeights, IStudentProfile } from '../models/StudentProfile.model';
import { IProgram } from '../models/Program.model';
import { IUniversity } from '../models/University.model';
import { RankingRecord } from '../models/RankingRecord.model';
import { OutcomeMetric } from '../models/OutcomeMetric.model';
import { Scholarship } from '../models/Scholarship.model';
import { Types } from 'mongoose';

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
}

export const fitScoreService = {
  /**
   * Get weights based on a preset.
   */
  getWeightsFromPreset(preset: string): IPriorityWeights {
    const presets: Record<string, IPriorityWeights> = {
      balanced:       { affordability: 25, ranking: 20, employability: 20, admissionMatch: 15, location: 10, scholarship: 10 },
      budget:         { affordability: 45, scholarship: 20, admissionMatch: 15, employability: 10, location: 5, ranking: 5 },
      career:         { employability: 40, ranking: 20, affordability: 15, admissionMatch: 10, scholarship: 10, location: 5 },
      prestige:       { ranking: 45, employability: 20, affordability: 10, admissionMatch: 10, scholarship: 5, location: 10 },
      'easy-admission': { admissionMatch: 40, affordability: 20, scholarship: 15, location: 10, employability: 10, ranking: 5 },
      scholarship:    { scholarship: 35, affordability: 25, admissionMatch: 15, employability: 10, ranking: 10, location: 5 },
    };
    return presets[preset] || presets.balanced;
  },

  /**
   * Calculate fit scores for a list of programs based on a student profile.
   */
  async calculateScores(profile: Partial<IStudentProfile>, programs: any[]): Promise<FitScoreResult[]> {
    const weights: IPriorityWeights = profile.priorityWeights || {
      affordability: 30,
      ranking: 20,
      employability: 20,
      admissionMatch: 15,
      location: 10,
      scholarship: 5,
    };

    // Ensure weights sum to 100 or normalize them
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0) || 100;

    // Fetch real data for ranking, employability, and scholarships
    const universityIds = programs.map(p => String(p.universityId?._id || p.university?._id || p.university));
    
    const [rankings, outcomes, scholarships] = await Promise.all([
      RankingRecord.find({
        universityId: { $in: universityIds },
        status: 'approved',
        source: 'QS'
      }).sort({ year: -1 }).lean(),
      
      OutcomeMetric.find({
        universityId: { $in: universityIds },
        status: 'approved'
      }).sort({ year: -1 }).lean(),
      
      Scholarship.find({
        universityId: { $in: universityIds },
        status: 'approved'
      }).lean()
    ]);

    // Build lookup maps
    const rankingMap = rankings.reduce((acc, r) => { 
      const id = String(r.universityId);
      if (!acc[id]) acc[id] = r; 
      return acc; 
    }, {} as Record<string, any>);

    const outcomeMap = outcomes.reduce((acc, o) => { 
      const id = String(o.universityId);
      if (!acc[id]) acc[id] = o; 
      return acc; 
    }, {} as Record<string, any>);

    const scholarshipMap = scholarships.reduce((acc, s) => {
      const key = String(s.universityId);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return programs.map(program => {
      const uniId = String(program.universityId?._id || program.university?._id || program.university);
      const universityData = (program.universityId || program.university) as any;
      const universityState = universityData?.state || '';
      
      const breakdown = {
        affordability: 0,
        ranking: 50, // default unknown
        employability: 50, // default unknown
        admissionMatch: 0,
        location: 0,
        scholarship: 0,
      };
      
      const reasons: string[] = [];

      // 1. Affordability
      const budget = profile.budgetMaxAud || 40000;
      const tuition = program.annualTuition || program.tuitionFeeInternational || 35000;
      if (tuition <= budget) {
        breakdown.affordability = 100;
        reasons.push(`Tuition ($${tuition.toLocaleString()}) is within your budget.`);
      } else {
        const diff = tuition - budget;
        breakdown.affordability = Math.max(0, 100 - Math.floor((diff / budget) * 100));
        if (breakdown.affordability < 50) reasons.push(`Tuition ($${tuition.toLocaleString()}) significantly exceeds budget.`);
      }

      // 2. Admission Match (IELTS)
      const userIelts = profile.ieltsScore || 6.5;
      const reqIelts = program.ieltsRequirement || program.englishRequirements?.match(/(\d\.\d)/)?.[0] || 6.5;
      if (userIelts >= Number(reqIelts)) {
        breakdown.admissionMatch = 100;
        reasons.push(`You meet the English requirement (IELTS ${reqIelts}).`);
      } else {
        breakdown.admissionMatch = Math.max(0, 100 - (Number(reqIelts) - userIelts) * 50);
        reasons.push(`Your IELTS (${userIelts}) is below the requirement (${reqIelts}).`);
      }

      // 3. Location
      if (universityState && profile.preferredStates && profile.preferredStates.length > 0) {
        if (profile.preferredStates.includes(universityState)) {
          breakdown.location = 100;
          reasons.push(`Located in your preferred state (${universityState}).`);
        } else {
          breakdown.location = 50;
          reasons.push(`Located in ${universityState} (not in your preferred list).`);
        }
      } else {
        breakdown.location = 80;
      }

      // 4. Ranking Score
      const rankingRecord = rankingMap[uniId];
      if (rankingRecord?.globalRank) {
        breakdown.ranking = Math.max(0, 100 - Math.floor(rankingRecord.globalRank / 10));
        reasons.push(`Top-tier university ranking (Global #${rankingRecord.globalRank}).`);
      }

      // 5. Employability Score
      const outcomeRecord = outcomeMap[uniId];
      if (outcomeRecord?.graduateEmploymentRate) {
        breakdown.employability = outcomeRecord.graduateEmploymentRate;
        reasons.push(`Strong graduate employment rate (${outcomeRecord.graduateEmploymentRate}%).`);
      }

      // 6. Scholarship Score
      const schCount = scholarshipMap[uniId] || 0;
      breakdown.scholarship = Math.min(100, schCount * 25);
      if (schCount > 0) reasons.push(`${schCount} active scholarship(s) available.`);

      // Calculate total weighted score
      let totalScore = 0;
      totalScore += (breakdown.affordability * (weights.affordability / totalWeight));
      totalScore += (breakdown.admissionMatch * (weights.admissionMatch / totalWeight));
      totalScore += (breakdown.location * (weights.location / totalWeight));
      totalScore += (breakdown.ranking * (weights.ranking / totalWeight));
      totalScore += (breakdown.employability * (weights.employability / totalWeight));
      totalScore += (breakdown.scholarship * (weights.scholarship / totalWeight));

      return {
        programId: String(program._id),
        programName: program.name,
        universityName: universityData?.name || 'Unknown',
        totalScore: Math.round(totalScore),
        breakdown,
        reasons,
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }
};
