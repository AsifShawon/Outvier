import { FitScoreResult } from '@/types/api';

export const CHART_PALETTE = ['#90AB8B', '#5A7863', '#3B4953', '#B8C9A3', '#DDE6D1', '#7A9181'];

export function buildRadarData(programs: any[], scores: FitScoreResult[]) {
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
