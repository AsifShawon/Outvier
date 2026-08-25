'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Building2,
  GraduationCap,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step10Props {
  data: any;
  onChange: (fields: Record<string, any>) => void;
}

export function Step10ReviewReadiness({ data }: Step10Props) {
  // Compute local readiness score
  const readiness = useMemo(() => {
    let score = 0;
    const checks: { label: string; done: boolean; pts: number }[] = [];

    // 1. Program & Intake
    const hasProg = !!(data.programChoice?.programId || data.programChoice?.customProgramName || data.title);
    const hasIntake = !!(data.programChoice?.intakeTerm || data.deadline);
    const progPts = (hasProg ? 10 : 0) + (hasIntake ? 5 : 0);
    score += progPts;
    checks.push({ label: 'Program & Intake Selected', done: progPts === 15, pts: 15 });

    // 2. Identity
    const idn = data.identity || {};
    const hasNames = !!(idn.firstName && idn.lastName);
    const hasEmail = !!idn.email;
    const hasDob = !!idn.dateOfBirth;
    const idnPts = (hasNames ? 7 : 0) + (hasEmail ? 4 : 0) + (hasDob ? 4 : 0);
    score += idnPts;
    checks.push({ label: 'Personal Identity & Contact', done: idnPts === 15, pts: 15 });

    // 3. Citizenship & Passport
    const hasCitizen = !!idn.citizenshipCountry;
    const hasPassport = !!(idn.passportNumberMasked || idn.passportExpiryDate);
    const visaPts = (hasCitizen ? 5 : 0) + (hasPassport ? 5 : 0);
    score += visaPts;
    checks.push({ label: 'Citizenship & Passport Details', done: visaPts === 10, pts: 10 });

    // 4. Academic History
    const acad = data.academicRecords || [];
    const hasAcad = acad.length > 0;
    const acadPts = hasAcad ? 15 : 0;
    score += acadPts;
    checks.push({ label: 'Academic Qualifications', done: hasAcad, pts: 15 });

    // 5. English Test
    const eng = data.englishTestRecords || [];
    const hasEng = eng.length > 0 && eng[0].overallScore > 0;
    const engPts = hasEng ? 10 : 0;
    score += engPts;
    checks.push({ label: 'English Language Score', done: hasEng, pts: 10 });

    // 6. Employment (optional/bonus)
    const emp = data.employmentRecords || [];
    score += 10;
    checks.push({ label: 'Employment & Experience', done: true, pts: 10 });

    // 7. Documents Vault
    const docs = data.documents || [];
    const hasDocs = docs.length >= 2;
    const docPts = docs.length >= 2 ? 15 : docs.length === 1 ? 8 : 0;
    score += docPts;
    checks.push({ label: 'Secure Documents (Passport & Transcripts)', done: hasDocs, pts: 15 });

    // 8. References
    score += 5;
    checks.push({ label: 'Referees & Recommendations', done: true, pts: 5 });

    // 9. Statements & Consents
    const consents = data.consents || [];
    const hasConsents = consents.some((c: any) => c.agreed);
    const conPts = hasConsents ? 5 : 0;
    score += conPts;
    checks.push({ label: 'Declarations & Consent Accepted', done: hasConsents, pts: 5 });

    return {
      score: Math.min(100, score),
      checks,
    };
  }, [data]);

  const progName = data.programChoice?.customProgramName || data.title || 'Selected Program';
  const uniName = data.programChoice?.customUniversityName || data.subtitle || 'Target University';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Step 10: Application Review & Readiness
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Review your application completeness, validation score, and submission snapshot before finalizing.
        </p>
      </div>

      {/* Readiness Gauge Card */}
      <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Overall Readiness
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black font-display text-foreground">
                {readiness.score}%
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-bold capitalize',
                  readiness.score >= 80
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : readiness.score >= 50
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                )}
              >
                {readiness.score >= 80 ? 'Ready for Submission' : readiness.score >= 50 ? 'Partially Complete' : 'Incomplete'}
              </Badge>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold font-mono">
            {readiness.score >= 80 ? '✓' : '!'}
          </div>
        </div>

        <Progress value={readiness.score} className="h-2 bg-muted" />

        {/* Section Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          {readiness.checks.map((chk, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center justify-between p-2 rounded-lg text-xs border',
                chk.done
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-foreground'
                  : 'bg-amber-500/5 border-amber-500/20 text-muted-foreground'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                {chk.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                )}
                <span className="truncate">{chk.label}</span>
              </div>
              <span className="font-mono text-[10px] font-semibold shrink-0">
                {chk.done ? `${chk.pts} pts` : '0 pts'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Snapshot Summary Box */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <FileCheck className="h-4 w-4 text-primary" />
          Application Summary Snapshot
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-background border border-border">
            <span className="text-[10px] text-muted-foreground font-medium uppercase">Program & Intake</span>
            <p className="font-bold text-foreground truncate mt-0.5">{progName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{uniName}</p>
            <p className="text-[10px] font-mono text-primary mt-1">
              {data.programChoice?.intakeTerm || 'Feb'} {data.programChoice?.intakeYear || 2027}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-background border border-border">
            <span className="text-[10px] text-muted-foreground font-medium uppercase">Applicant</span>
            <p className="font-bold text-foreground truncate mt-0.5">
              {data.identity?.firstName || 'Student'} {data.identity?.lastName || ''}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{data.identity?.email || '-'}</p>
            <p className="text-[10px] font-mono text-muted-foreground mt-1">
              Passport: {data.identity?.passportNumberMasked || 'Pending'}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-background border border-border">
            <span className="text-[10px] text-muted-foreground font-medium uppercase">Credentials & Vault</span>
            <p className="font-bold text-foreground truncate mt-0.5">
              {data.academicRecords?.length || 0} Academic Record(s)
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {data.englishTestRecords?.[0]
                ? `${data.englishTestRecords[0].testType} (${data.englishTestRecords[0].overallScore})`
                : 'English Test Pending'}
            </p>
            <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {data.documents?.length || 0} Secure Document(s)
            </p>
          </div>
        </div>
      </div>

      {/* Important Product Rule Banner */}
      <div className="p-3.5 rounded-xl bg-muted border border-border text-xs flex items-start gap-2.5">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">Outvier Submission Governance Rule</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Outvier does not claim it submitted an application unless a verified university integration actually executed it. When logging self-reported external submissions, your submission is tagged as <span className="font-mono text-primary">student-reported</span> with full audit traceability.
          </p>
        </div>
      </div>
    </div>
  );
}
