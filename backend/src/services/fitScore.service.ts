import { IPriorityWeights, IStudentProfile } from '../models/StudentProfile.model';
import { IProgram } from '../models/Program.model';
import { IUniversity } from '../models/University.model';

export interface FitScoreResult {
  programId: string;
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

    return programs.map(program => {
      const breakdown = {
        affordability: 0,
        ranking: 0, // Simplified for now
        employability: 0, // Will be sourced from OutcomeMetric later
        admissionMatch: 0,
        location: 0,
        scholarship: 0, // Will be sourced from Scholarship model later
      };
      
      const reasons: string[] = [];

      // 1. Affordability
      const budget = profile.budgetMaxAud || 40000;
      const tuition = program.annualTuition || 35000; // fallback avg
      if (tuition <= budget) {
        breakdown.affordability = 100;
        reasons.push(`Tuition ($${tuition}) is within your budget.`);
      } else {
        // Penalty for going over budget
        const diff = tuition - budget;
        breakdown.affordability = Math.max(0, 100 - (diff / budget) * 100);
        if (breakdown.affordability < 50) reasons.push(`Tuition ($${tuition}) significantly exceeds budget.`);
      }

      // 2. Admission Match (IELTS)
      const userIelts = profile.ieltsScore || 6.5;
      const reqIelts = program.ieltsRequirement || 6.5;
      if (userIelts >= reqIelts) {
        breakdown.admissionMatch = 100;
        reasons.push(`You meet the English requirement (IELTS ${reqIelts}).`);
      } else {
        breakdown.admissionMatch = Math.max(0, 100 - (reqIelts - userIelts) * 50);
        reasons.push(`Your IELTS (${userIelts}) is below the requirement (${reqIelts}).`);
      }

      // 3. Location
      const universityData = (program.universityId || program.university) as any;
      const universityState = universityData?.state || '';
      
      if (universityState && profile.preferredStates && profile.preferredStates.length > 0) {
        if (profile.preferredStates.includes(universityState)) {
          breakdown.location = 100;
          reasons.push(`Located in your preferred state (${universityState}).`);
        } else {
          breakdown.location = 50;
        }
      } else {
        breakdown.location = 80; // Default good score if no preference
      }

      // Calculate total weighted score
      let totalScore = 0;
      totalScore += (breakdown.affordability * (weights.affordability / totalWeight));
      totalScore += (breakdown.admissionMatch * (weights.admissionMatch / totalWeight));
      totalScore += (breakdown.location * (weights.location / totalWeight));
      
      // Add dummies for non-implemented metrics so score isn't artificially low
      totalScore += (80 * (weights.ranking / totalWeight));
      totalScore += (80 * (weights.employability / totalWeight));
      totalScore += (50 * (weights.scholarship / totalWeight));

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
