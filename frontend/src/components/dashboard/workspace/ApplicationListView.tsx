'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { applicationWorkspaceApi, ApplicationWorkspaceItem, ApplicationStage } from '@/lib/api/applicationWorkspace.api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  Building2,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Clock,
  Loader2,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface ApplicationListViewProps {
  onSelectApplication: (id: string) => void;
  onOpenWizard: () => void;
}

const STAGE_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  draft: { label: 'Draft', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400', border: 'border-slate-500/30' },
  ready_for_review: { label: 'Ready for Review', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  changes_requested: { label: 'Changes Requested', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
  staff_verified: { label: 'Staff Verified', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
  external_submission_required: { label: 'Submission Required', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
  submitted_externally: { label: 'Submitted Externally', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30' },
  provider_confirmed: { label: 'Provider Confirmed', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400', border: 'border-teal-500/30' },
  offer: { label: 'Offer Received', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  rejected: { label: 'Rejected', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', border: 'border-rose-500/30' },
  withdrawn: { label: 'Withdrawn', color: 'bg-slate-500/10 text-slate-500', border: 'border-slate-500/20' },
};

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  'student-reported': { label: 'Student', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
  'staff-verified': { label: 'Staff', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  'provider-confirmed': { label: 'Provider', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
  'integration-confirmed': { label: 'Integration', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
};

export function ApplicationListView({ onSelectApplication, onOpenWizard }: ApplicationListViewProps) {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const debouncedSearch = useDebounce(search, 300);

  const { data: res, isLoading } = useQuery({
    queryKey: ['workspace-applications-list', { debouncedSearch, stageFilter }],
    queryFn: () =>
      applicationWorkspaceApi.getApplications({
        search: debouncedSearch || undefined,
        stage: stageFilter !== 'all' ? stageFilter : undefined,
      }),
  });

  const applications = res?.data?.data || [];

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications by program, university, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-background"
          />
        </div>

        {/* Stage Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Stages' },
            { id: 'draft', label: 'Draft' },
            { id: 'ready_for_review', label: 'In Review' },
            { id: 'submitted_externally', label: 'Applied' },
            { id: 'offer', label: 'Offer' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStageFilter(pill.id)}
              className={cn(
                'px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                stageFilter === pill.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground'
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table Card */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <GraduationCap className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-semibold text-foreground">No applications found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Start tracking a new program application or adjust your search filters.
            </p>
            <Button
              type="button"
              onClick={onOpenWizard}
              size="sm"
              className="text-xs mt-2"
            >
              Start New Application
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Program & Institution</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Status Source</th>
                  <th className="py-3 px-4">Target Intake</th>
                  <th className="py-3 px-4">Readiness</th>
                  <th className="py-3 px-4">Vault Docs</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.map((app) => {
                  const stageConfig = STAGE_CONFIG[app.stage] || STAGE_CONFIG.draft;
                  const sourceConfig = SOURCE_CONFIG[app.statusSource] || SOURCE_CONFIG['student-reported'];
                  const score = app.readinessPercentage || 0;
                  const progName = app.programChoice?.customProgramName || app.title;
                  const uniName = app.programChoice?.customUniversityName || app.subtitle || 'Institution';
                  const docsCount = Array.isArray(app.documents) ? app.documents.length : 0;

                  return (
                    <tr
                      key={app._id}
                      onClick={() => onSelectApplication(app._id)}
                      className="hover:bg-accent/40 cursor-pointer transition-colors group"
                    >
                      {/* Program & Uni */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-0 max-w-[280px]">
                          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <GraduationCap className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {progName}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">{uniName}</p>
                          </div>
                        </div>
                      </td>

                      {/* Stage */}
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-bold capitalize', stageConfig.color, stageConfig.border)}
                        >
                          ● {stageConfig.label}
                        </Badge>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={cn('text-[10px] font-mono', sourceConfig.color)}>
                          {sourceConfig.label}
                        </Badge>
                      </td>

                      {/* Intake */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-foreground">
                          {app.programChoice?.intakeTerm || 'Feb'} {app.programChoice?.intakeYear || 2027}
                        </span>
                        {app.deadline && (
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            Due {format(new Date(app.deadline), 'MMM d')}
                          </span>
                        )}
                      </td>

                      {/* Readiness */}
                      <td className="py-3.5 px-4 min-w-[120px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="font-bold text-foreground">{score}%</span>
                          </div>
                          <Progress value={score} className="h-1.5 bg-muted" />
                        </div>
                      </td>

                      {/* Docs */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          {docsCount} doc(s)
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs gap-1 text-primary group-hover:translate-x-0.5 transition-transform"
                        >
                          <span>Workspace</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
