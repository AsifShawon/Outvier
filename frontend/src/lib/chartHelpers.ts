import { FitScoreResult } from '@/types/api';
import { Program } from '@/types/program';

export const CHART_PALETTE = ['#8B5CF6', '#14B8A6', '#F59E0B', '#EF4444', '#6366F1', '#EC4899'];

export function buildRadarData(programs: (Program | { _id: string; name?: string })[], scores: FitScoreResult[]) {
  const dims: { subject: string; key: keyof FitScoreResult['breakdown'] }[] = [
    { subject: 'Affordability', key: 'affordability' },
    { subject: 'Ranking',       key: 'ranking' },
    { subject: 'Employability', key: 'employability' },
    { subject: 'Admission',     key: 'admissionMatch' },
    { subject: 'Location',      key: 'location' },
    { subject: 'Scholarship',   key: 'scholarship' },
  ];
  return dims.map(({ subject, key }) => ({
    subject,
    ...programs.reduce((acc, p) => {
      const score = scores.find(s => s.programId === String(p._id));
      return { ...acc, [String(p._id)]: score?.breakdown[key] ?? 0 };
    }, {} as Record<string, number>),
  }));
}

export function shortName(name: string, maxLen = 20): string {
  return name?.length > maxLen ? name.slice(0, maxLen) + '…' : (name ?? '');
}
