'use client';

import { ApplicationWorkspaceItem } from '@/lib/api/applicationWorkspace.api';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Sparkles, BookOpen, Award, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RequirementsMatchingSectionProps {
  application: ApplicationWorkspaceItem;
}

export function RequirementsMatchingSection({ application }: RequirementsMatchingSectionProps) {
  const academics = application.academicRecords || [];
  const english = application.englishTestRecords || [];
  const docs = application.documents || [];

  // Check Academics
  const hasBachelor = academics.some((a) => a.qualificationLevel === 'bachelor' || a.qualificationLevel === 'master');
  const studentGpa = academics[0]?.gpaAchieved || 'N/A';

  // Check English Test
  const topEnglish = english[0];
  const englishScore = topEnglish ? topEnglish.overallScore : null;
  const meetsEnglish = englishScore !== null ? englishScore >= 6.5 : false;

  // Check Passport & Transcripts
  const hasPassport = !!application.identity?.passportNumberMasked;
  const hasTranscripts = docs.length > 0;

  const checks = [
    {
      title: 'Prior Degree Qualification',
      requirement: 'Recognized Bachelor degree or equivalent',
      status: hasBachelor ? 'met' : academics.length > 0 ? 'conditional' : 'missing',
      details: hasBachelor ? `Met (${academics[0]?.qualificationLevel} in ${academics[0]?.fieldOfStudy})` : 'Undergraduate degree details pending',
      icon: BookOpen,
    },
    {
      title: 'English Language Benchmark',
      requirement: 'IELTS Academic 6.5 (min 6.0 each) or PTE 58+',
      status: meetsEnglish ? 'met' : englishScore !== null ? 'conditional' : 'missing',
      details: englishScore !== null ? `${topEnglish?.testType} Overall: ${englishScore}` : 'English scorecard required for unconditional offer',
      icon: Award,
    },
    {
      title: 'Identity & Genuine Student Context',
      requirement: 'Valid passport (6+ months) & GS statement',
      status: hasPassport && application.statementOfPurpose ? 'met' : hasPassport ? 'conditional' : 'missing',
      details: hasPassport ? 'Passport logged · SOP attached' : 'Passport number & SOP pending',
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Requirements & Eligibility Matching
        </h3>
        <span className="text-[11px] text-muted-foreground">Australian Admission Benchmarks</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {checks.map((chk, i) => {
          const Icon = chk.icon;
          return (
            <div
              key={i}
              className={cn(
                'p-4 rounded-xl border space-y-2 text-xs transition-all',
                chk.status === 'met'
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : chk.status === 'conditional'
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-rose-500/5 border-rose-500/20'
              )}
            >
              <div className="flex items-center justify-between">
                <Icon
                  className={cn(
                    'h-4 w-4',
                    chk.status === 'met'
                      ? 'text-emerald-500'
                      : chk.status === 'conditional'
                      ? 'text-amber-500'
                      : 'text-rose-500'
                  )}
                />
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider',
                    chk.status === 'met'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : chk.status === 'conditional'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  )}
                >
                  {chk.status === 'met' ? 'Requirement Met' : chk.status === 'conditional' ? 'Conditional' : 'Action Required'}
                </Badge>
              </div>

              <div>
                <p className="font-bold text-foreground">{chk.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{chk.requirement}</p>
              </div>

              <div className="pt-2 border-t border-border/60 text-[11px] font-medium text-foreground">
                {chk.details}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
