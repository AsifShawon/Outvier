'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationWorkspaceApi, ApplicationWorkspaceItem, ApplicationStage } from '@/lib/api/applicationWorkspace.api';
import { ProgramIntakeHeader } from './ProgramIntakeHeader';
import { ApplicationSectionTabs } from './ApplicationSectionTabs';
import { TaskTimelineSection } from './TaskTimelineSection';
import { RequirementsMatchingSection } from './RequirementsMatchingSection';
import { AuditActivityHistory } from './AuditActivityHistory';
import { CommunicationsThread } from './CommunicationsThread';
import { WorkspaceSummarySidebar } from './WorkspaceSummarySidebar';
import { ApplicationWizardModal } from '../wizard/ApplicationWizardModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  Sparkles,
  Send,
  Camera,
  Archive,
  Trash2,
  Lock,
  Loader2,
  Layout,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ApplicationWorkspaceViewProps {
  applicationId: string;
  onBack?: () => void;
}

export function ApplicationWorkspaceView({ applicationId, onBack }: ApplicationWorkspaceViewProps) {
  const qc = useQueryClient();
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['application-workspace-detail', applicationId],
    queryFn: () => applicationWorkspaceApi.getApplication(applicationId),
    enabled: !!applicationId,
  });

  const appData = res?.data?.data?.application;
  const readiness = res?.data?.data?.readiness;

  const updateStageMutation = useMutation({
    mutationFn: (stage: ApplicationStage) =>
      applicationWorkspaceApi.updateStage(applicationId, {
        stage,
        statusSource: 'student-reported',
        reason: `Student moved stage to ${stage}`,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application-workspace-detail', applicationId] });
      qc.invalidateQueries({ queryKey: ['workspace-applications'] });
      qc.invalidateQueries({ queryKey: ['tracker-items'] });
      toast.success('Stage updated successfully! 🎉');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update stage');
    },
  });

  const snapshotMutation = useMutation({
    mutationFn: () => applicationWorkspaceApi.createSnapshot(applicationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application-workspace-detail', applicationId] });
      toast.success('Immutable Version Snapshot Generated! 🔒');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create snapshot');
    },
  });

  if (isLoading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm font-semibold text-foreground">Loading application workspace...</p>
      </div>
    );
  }

  if (isError || !appData) {
    return (
      <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-3">
        <p className="text-sm font-bold text-foreground">Application Not Found</p>
        <p className="text-xs text-muted-foreground">The requested application could not be retrieved.</p>
        {onBack && (
          <Button type="button" onClick={onBack} size="sm" variant="outline" className="text-xs">
            Back to Overview
          </Button>
        )}
      </div>
    );
  }

  const progName = appData.programChoice?.customProgramName || appData.title;
  const uniName = appData.programChoice?.customUniversityName || appData.subtitle || 'Institution';

  return (
    <div className="space-y-6 pb-20">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            {onBack ? (
              <button onClick={onBack} className="hover:text-foreground flex items-center gap-1 cursor-pointer">
                <ChevronLeft className="h-3 w-3" />
                <span>Workspace</span>
              </button>
            ) : (
              <Link href="/dashboard/tracker" className="hover:text-foreground flex items-center gap-1">
                <Layout className="h-3 w-3" />
                <span>Workspace</span>
              </Link>
            )}
            <span>/</span>
            <span className="text-foreground">{uniName}</span>
            <span>/</span>
            <span className="text-primary truncate max-w-[200px]">{progName}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-display text-foreground tracking-tight">
            Application Master Detail
          </h2>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!appData.isLocked && (
            <Button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              size="sm"
              variant="outline"
              className="text-xs h-8 gap-1.5 bg-card hover:bg-accent/40"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              10-Step Wizard
            </Button>
          )}

          {appData.stage === 'draft' && (
            <Button
              type="button"
              onClick={() => updateStageMutation.mutate('ready_for_review')}
              disabled={updateStageMutation.isPending}
              size="sm"
              className="text-xs h-8 gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              Submit for Review
            </Button>
          )}

          {(appData.stage === 'draft' || appData.stage === 'ready_for_review') && (
            <Button
              type="button"
              onClick={() => updateStageMutation.mutate('submitted_externally')}
              disabled={updateStageMutation.isPending}
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
            >
              <FileCheck className="h-3.5 w-3.5" />
              Log External Submission
            </Button>
          )}

          <Button
            type="button"
            onClick={() => snapshotMutation.mutate()}
            disabled={snapshotMutation.isPending}
            variant="ghost"
            size="sm"
            className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground"
            title="Create Immutable Snapshot"
          >
            <Camera className="h-3.5 w-3.5" />
            Snapshot v{appData.currentVersionNumber + 1}
          </Button>
        </div>
      </div>

      {/* Two-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Main Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Program and Intake Header */}
          <ProgramIntakeHeader
            application={appData}
            onEdit={() => setIsWizardOpen(true)}
          />

          {/* 2. Application Sections Hub */}
          <ApplicationSectionTabs
            application={appData}
            onRefresh={() => refetch()}
          />

          {/* 3. Task Timeline & Checklist */}
          <TaskTimelineSection
            application={appData}
            onUpdate={() => refetch()}
          />

          {/* 4. Requirements & Eligibility Matching */}
          <RequirementsMatchingSection
            application={appData}
          />

          {/* 5. Activity History & Status Source Audit */}
          <AuditActivityHistory
            events={appData.statusEvents}
          />

          {/* 6. Reviewer Feedback & Communications Thread */}
          <CommunicationsThread
            applicationId={applicationId}
            communications={appData.communications}
            onMessageSent={() => refetch()}
          />
        </div>

        {/* Right Summary Panel (4 cols) */}
        <div className="lg:col-span-4 sticky top-6">
          <WorkspaceSummarySidebar
            application={appData}
            readiness={readiness}
            onOpenWizard={() => setIsWizardOpen(true)}
          />
        </div>
      </div>

      {/* 10-Step Wizard Modal */}
      <ApplicationWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        initialData={appData}
        onComplete={() => refetch()}
      />
    </div>
  );
}
