'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ApplicationKanban } from '@/components/dashboard/ApplicationKanban';
import { WorkspaceViewTabs, WorkspaceViewMode } from '@/components/dashboard/workspace/WorkspaceViewTabs';
import { ApplicationListView } from '@/components/dashboard/workspace/ApplicationListView';
import { ApplicationCalendarView } from '@/components/dashboard/workspace/ApplicationCalendarView';
import { ApplicationWorkspaceView } from '@/components/dashboard/workspace/ApplicationWorkspaceView';
import { ApplicationWizardModal } from '@/components/dashboard/wizard/ApplicationWizardModal';
import { Layout, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function TrackerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  const initialView = (searchParams.get('view') as WorkspaceViewMode) || 'board';
  const initialId = searchParams.get('id');

  const [currentView, setCurrentView] = useState<WorkspaceViewMode>(initialId ? 'detail' : initialView);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(initialId || null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    const id = searchParams.get('id');
    const view = searchParams.get('view') as WorkspaceViewMode;
    if (id) {
      setSelectedAppId(id);
      setCurrentView('detail');
    } else if (view) {
      setCurrentView(view);
    }
  }, [searchParams]);

  const handleSelectApplication = (id: string) => {
    setSelectedAppId(id);
    setCurrentView('detail');
  };

  const handleViewChange = (view: WorkspaceViewMode) => {
    setCurrentView(view);
    if (view !== 'detail') {
      setSelectedAppId(null);
    }
  };

  const handleWizardComplete = (app: any) => {
    qc.invalidateQueries({ queryKey: ['tracker-items'] });
    qc.invalidateQueries({ queryKey: ['workspace-applications-list'] });
    qc.invalidateQueries({ queryKey: ['workspace-applications-calendar'] });
    if (app?._id) {
      handleSelectApplication(app._id);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Compact Page Header & Workspace View Switcher */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
            <Layout className="h-3 w-3" />
            <span>Dashboard</span>
            <span className="text-border">/</span>
            <span className="text-primary">Application Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-foreground">
            Application Workspace & Tracker
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">
            Manage your study journey from university discovery, document verification, and task milestones to partner submission.
          </p>
        </div>

        {/* View Switcher Tabs Bar */}
        <WorkspaceViewTabs
          currentView={currentView}
          onViewChange={handleViewChange}
          onNewApplication={() => setIsWizardOpen(true)}
          selectedAppTitle={selectedAppId ? 'Selected Detail' : undefined}
        />
      </div>

      {/* Main View Display */}
      {currentView === 'board' && (
        <div className="-mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
          <ApplicationKanban
            onSelectApplication={handleSelectApplication}
            onOpenWizard={() => setIsWizardOpen(true)}
          />
        </div>
      )}

      {currentView === 'list' && (
        <ApplicationListView
          onSelectApplication={handleSelectApplication}
          onOpenWizard={() => setIsWizardOpen(true)}
        />
      )}

      {currentView === 'calendar' && (
        <ApplicationCalendarView
          onSelectApplication={handleSelectApplication}
        />
      )}

      {currentView === 'detail' && selectedAppId && (
        <ApplicationWorkspaceView
          applicationId={selectedAppId}
          onBack={() => handleViewChange('board')}
        />
      )}

      {/* 10-Step Wizard Modal */}
      <ApplicationWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={handleWizardComplete}
      />
    </div>
  );
}
