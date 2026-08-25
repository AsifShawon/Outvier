'use client';

import { ApplicationWorkspaceItem } from '@/lib/api/applicationWorkspace.api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Building2,
  Calendar,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProgramIntakeHeaderProps {
  application: ApplicationWorkspaceItem;
  onEdit?: () => void;
}

const STAGE_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  draft: { label: 'Draft', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400', border: 'border-slate-500/30' },
  ready_for_review: { label: 'Ready for Review', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  changes_requested: { label: 'Changes Requested', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
  staff_verified: { label: 'Staff Verified', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
  external_submission_required: { label: 'External Submission Required', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
  submitted_externally: { label: 'Submitted Externally', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30' },
  provider_confirmed: { label: 'Provider Confirmed', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400', border: 'border-teal-500/30' },
  offer: { label: 'Offer Received', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  rejected: { label: 'Rejected', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', border: 'border-rose-500/30' },
  withdrawn: { label: 'Withdrawn', color: 'bg-slate-500/10 text-slate-500', border: 'border-slate-500/20' },
};

const STATUS_SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  'student-reported': { label: 'Student-Reported', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
  'staff-verified': { label: 'Staff-Verified', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' },
  'provider-confirmed': { label: 'Provider-Confirmed', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30' },
  'integration-confirmed': { label: 'Verified Integration', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
};

export function ProgramIntakeHeader({ application, onEdit }: ProgramIntakeHeaderProps) {
  const progChoice = application.programChoice || {};
  const progName = progChoice.customProgramName || application.title;
  const uniName = progChoice.customUniversityName || application.subtitle || 'Target University';

  const stageConfig = STAGE_CONFIG[application.stage] || STAGE_CONFIG.draft;
  const sourceConfig = STATUS_SOURCE_CONFIG[application.statusSource] || STATUS_SOURCE_CONFIG['student-reported'];

  const isVerifiedIntegration = application.statusSource === 'integration-confirmed';
  const isSubmitted = application.stage === 'submitted_externally' || application.stage === 'provider_confirmed' || application.stage === 'offer';

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-5">
      {/* Top Meta Line: Badges & Tags */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Stage Badge */}
          <Badge
            variant="outline"
            className={cn('text-xs font-bold px-2.5 py-1 capitalize', stageConfig.color, stageConfig.border)}
          >
            ● {stageConfig.label}
          </Badge>

          {/* Status Source Chip */}
          <Badge
            variant="outline"
            className={cn('text-[11px] font-mono font-medium px-2 py-0.5', sourceConfig.color)}
          >
            Source: {sourceConfig.label}
          </Badge>

          {/* Priority */}
          <Badge
            variant="outline"
            className={cn(
              'text-[11px] font-semibold uppercase tracking-wider',
              application.priority === 'high'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                : application.priority === 'medium'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
            )}
          >
            {application.priority} Priority
          </Badge>

          {/* Locked Version Tag */}
          {application.isLocked && (
            <Badge variant="outline" className="text-[11px] font-mono bg-primary/5 text-primary border-primary/20 flex items-center gap-1">
              <Lock className="h-2.5 w-2.5" />
              v{application.currentVersionNumber} Snapshot Locked
            </Badge>
          )}
        </div>

        {onEdit && !application.isLocked && (
          <Button
            type="button"
            onClick={onEdit}
            variant="outline"
            size="sm"
            className="text-xs h-8 gap-1.5 bg-background"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Edit Application
          </Button>
        )}
      </div>

      {/* Main Title & Institution */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-foreground">
            {progName}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5 text-foreground font-semibold">
              <Building2 className="h-4 w-4 text-primary" />
              {uniName}
            </span>
            {progChoice.campusName && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {progChoice.campusName}
              </span>
            )}
            {progChoice.studyLevel && (
              <span>· {progChoice.studyLevel}</span>
            )}
          </div>
        </div>

        {/* Tuition / Financial Snapshot */}
        {progChoice.estimatedTuitionAud ? (
          <div className="shrink-0 p-3 rounded-xl bg-background border border-border text-right">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Estimated Tuition
            </span>
            <span className="text-lg font-black font-mono text-foreground">
              AUD ${progChoice.estimatedTuitionAud.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground block">/ academic year</span>
          </div>
        ) : null}
      </div>

      {/* Intake & Deadline Chips */}
      <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border/80 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Target Intake:</span>
          <span className="font-bold text-foreground">
            {progChoice.intakeTerm || 'Feb'} {progChoice.intakeYear || 2027}
          </span>
        </div>

        {application.deadline && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">Application Deadline:</span>
            <span className="font-bold font-mono text-foreground">
              {format(new Date(application.deadline), 'MMM d, yyyy')}
            </span>
          </div>
        )}

        {application.officialApplicationUrl && (
          <a
            href={application.officialApplicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary hover:underline font-semibold ml-auto"
          >
            <span>Official University Portal</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Submission Governance Disclaimer Banner */}
      {isSubmitted && (
        <div
          className={cn(
            'p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed',
            isVerifiedIntegration
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
          )}
        >
          {isVerifiedIntegration ? (
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-bold">
              {isVerifiedIntegration
                ? 'Official Verified University Submission'
                : 'Self-Reported External Submission (Unverified)'}
            </p>
            <p className="text-[11px] opacity-90">
              {application.submissionReceipt?.disclaimer ||
                (isVerifiedIntegration
                  ? 'Application was transmitted and confirmed via official Outvier Partner Integration.'
                  : 'Outvier has NOT verified transmission with the partner university. This record reflects self-reported student activity.')}
            </p>
            {application.submissionReceipt?.partnerApplicationRef && (
              <p className="font-mono text-[10px] mt-1 font-bold">
                Reference ID: {application.submissionReceipt.partnerApplicationRef} · Submitted on {format(new Date(application.submissionReceipt.submittedAt), 'PPpp')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
