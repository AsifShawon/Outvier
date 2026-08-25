'use client';

import { ApplicationWorkspaceItem, ReadinessAnalysis } from '@/lib/api/applicationWorkspace.api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Clock,
  AlertTriangle,
  FileText,
  UserCheck,
  ExternalLink,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { format, differenceInDays, isBefore } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WorkspaceSummarySidebarProps {
  application: ApplicationWorkspaceItem;
  readiness?: ReadinessAnalysis;
  onOpenWizard?: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  draft: 'Draft',
  ready_for_review: 'Ready for Review',
  changes_requested: 'Changes Requested',
  staff_verified: 'Staff Verified',
  external_submission_required: 'External Submission Req.',
  submitted_externally: 'Submitted Externally',
  provider_confirmed: 'Provider Confirmed',
  offer: 'Offer Received',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  'student-reported': { label: 'Student-Reported', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
  'staff-verified': { label: 'Staff-Verified', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' },
  'provider-confirmed': { label: 'Provider-Confirmed', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30' },
  'integration-confirmed': { label: 'Verified Integration', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
};

export function WorkspaceSummarySidebar({
  application,
  readiness,
  onOpenWizard,
}: WorkspaceSummarySidebarProps) {
  const [copied, setCopied] = useState(false);

  const score = readiness?.score ?? application.readinessPercentage ?? 0;
  const missing = readiness?.missingRequirements ?? [];

  // Deadline countdown calculations
  const now = new Date();
  const deadlineDate = application.deadline ? new Date(application.deadline) : null;
  const daysRemaining = deadlineDate ? differenceInDays(deadlineDate, now) : null;
  const isOverdue = !!deadlineDate && isBefore(deadlineDate, now);

  const sourceConfig = SOURCE_LABELS[application.statusSource] || SOURCE_LABELS['student-reported'];
  const reviewer = application.assignedReviewerId;

  const handleCopyId = () => {
    navigator.clipboard.writeText(application._id);
    setCopied(true);
    toast.success('Application ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* 1. Readiness Percentage Card */}
      <div className="p-5 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Application Readiness
          </span>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] font-bold',
              score >= 80
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : score >= 50
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
            )}
          >
            {score >= 80 ? 'Ready' : score >= 50 ? 'In Progress' : 'Incomplete'}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black font-display text-foreground">
              {score}%
            </span>
            <span className="text-xs text-muted-foreground">Target: 100%</span>
          </div>
          <Progress value={score} className="h-2 bg-muted" />
        </div>

        {missing.length > 0 ? (
          <div className="space-y-1.5 pt-2 border-t border-border/80">
            <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Missing Items ({missing.length})
            </span>
            <div className="space-y-1">
              {missing.slice(0, 3).map((item, i) => (
                <p key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="truncate">{item}</span>
                </p>
              ))}
              {missing.length > 3 && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  + {missing.length - 3} more items
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-medium text-[11px]">All required sections complete!</span>
          </div>
        )}

        {onOpenWizard && !application.isLocked && (
          <Button
            type="button"
            onClick={onOpenWizard}
            size="sm"
            variant="outline"
            className="w-full text-xs h-8 gap-1.5 bg-background hover:bg-accent/40"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Open 10-Step Wizard
          </Button>
        )}
      </div>

      {/* 2. Application Status & Source Verification Card */}
      <div className="p-5 rounded-2xl bg-card border border-border space-y-3.5 shadow-sm text-xs">
        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
          Current State & Verification
        </span>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Stage:</span>
            <span className="font-bold text-foreground">
              {STAGE_LABELS[application.stage] || application.stage}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status Source:</span>
            <Badge variant="outline" className={cn('text-[10px] font-mono', sourceConfig.color)}>
              {sourceConfig.label}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Version:</span>
            <span className="font-mono font-bold text-foreground">
              v{application.currentVersionNumber || 1} {application.isLocked && '(Locked)'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Next Deadline Countdown Card */}
      {deadlineDate && (
        <div
          className={cn(
            'p-5 rounded-2xl border space-y-2 shadow-sm text-xs',
            isOverdue
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200'
              : daysRemaining !== null && daysRemaining <= 7
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
              : 'bg-card border-border'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Target Deadline
            </span>
            <span className="font-mono font-bold">
              {format(deadlineDate, 'MMM d, yyyy')}
            </span>
          </div>

          <div className="pt-1">
            <span className="text-2xl font-black font-display">
              {isOverdue
                ? 'Overdue'
                : daysRemaining === 0
                ? 'Due Today'
                : `${daysRemaining} Days Left`}
            </span>
          </div>
        </div>
      )}

      {/* 4. Assigned Reviewer / Counselor */}
      <div className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-sm text-xs">
        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
          Assigned Reviewer
        </span>

        {reviewer ? (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
              {reviewer.name?.charAt(0) || 'R'}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-foreground truncate">{reviewer.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{reviewer.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserCheck className="h-4 w-4" />
            <span>Staff review pending assignment</span>
          </div>
        )}
      </div>

      {/* 5. Official Application Link */}
      {application.officialApplicationUrl && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
          <span className="text-[10px] font-bold uppercase text-primary block">
            Official University Application
          </span>
          <a
            href={application.officialApplicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between font-semibold text-primary hover:underline"
          >
            <span>Launch External Portal</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* 6. Metadata & Copy ID */}
      <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-[11px] space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Application ID:</span>
          <button
            onClick={handleCopyId}
            className="font-mono text-[10px] hover:text-foreground flex items-center gap-1"
          >
            <span>{application._id.slice(0, 10)}...</span>
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Last Updated:</span>
          <span className="font-mono">{format(new Date(application.updatedAt), 'MMM d, HH:mm')}</span>
        </div>
      </div>
    </div>
  );
}
