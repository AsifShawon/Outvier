'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentDashboardApi } from '@/lib/api/studentDashboard.api';
import { StudentDashboardData } from '@/types/studentDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Modular Dashboard Components
import { StudentHeader } from '@/components/dashboard/StudentHeader';
import { ReadinessGaugeCard } from '@/components/dashboard/ReadinessGaugeCard';
import { NextActionCard } from '@/components/dashboard/NextActionCard';
import { NextDeadlineCard } from '@/components/dashboard/NextDeadlineCard';
import { ShortlistBudgetCard } from '@/components/dashboard/ShortlistBudgetCard';
import { StagePipelineTimeline } from '@/components/dashboard/StagePipelineTimeline';
import { UpcomingDeadlinesList } from '@/components/dashboard/UpcomingDeadlinesList';
import { PrioritizedTaskList } from '@/components/dashboard/PrioritizedTaskList';
import { ShortlistCostComparison } from '@/components/dashboard/ShortlistCostComparison';
import { ExplainableFitComparison } from '@/components/dashboard/ExplainableFitComparison';
import { SavedProgramsAttention } from '@/components/dashboard/SavedProgramsAttention';
import { ScholarshipMatches } from '@/components/dashboard/ScholarshipMatches';
import { OnboardingEmptyState } from '@/components/dashboard/OnboardingEmptyState';

export default function DashboardPage() {
  const {
    data: dashboardResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['student-dashboard-me'],
    queryFn: async () => {
      const res = await studentDashboardApi.getMyDashboard();
      return res.data.data;
    },
    staleTime: 30 * 1000, // 30 seconds stale time
  });

  const dashboard = dashboardResponse;

  if (isLoading) {
    return (
      <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-0">
        {/* Header Skeleton */}
        <Skeleton className="h-28 w-full rounded-3xl" />

        {/* 4 Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-3xl" />
          ))}
        </div>

        {/* Pipeline Skeleton */}
        <Skeleton className="h-36 w-full rounded-3xl" />

        {/* Main Columns Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-display text-foreground">
            Unable to load your application roadmap
          </h2>
          <p className="text-xs text-muted-foreground">
            {(error as any)?.message || 'We could not fetch your readiness data. Please check your connection.'}
          </p>
        </div>
        <Button onClick={() => refetch()} className="rounded-xl font-semibold text-xs">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Retry Connection
        </Button>
      </div>
    );
  }

  const nextDeadline = dashboard.upcomingDeadlines?.[0];

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 max-w-7xl mx-auto px-2 sm:px-0">
      {/* 1. Personalized Header */}
      <section aria-label="Personalized Greeting & Intake Goal">
        <StudentHeader
          studentName={dashboard.student?.name}
          intakeGoal={dashboard.student?.intakeGoal}
          primaryAction={dashboard.nextPrimaryAction}
        />
      </section>

      {/* 2. Top Summary Row (4 Core Operational Readiness Cards) */}
      <section aria-label="Core Readiness Snapshot" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Readiness Progress */}
        <ReadinessGaugeCard
          readiness={dashboard.profileReadiness}
          overallPercentage={dashboard.overallReadinessPercentage}
        />

        {/* Card 2: Next Action */}
        <NextActionCard action={dashboard.nextPrimaryAction} />

        {/* Card 3: Next Deadline */}
        <NextDeadlineCard
          deadline={nextDeadline}
          totalDeadlinesCount={dashboard.upcomingDeadlines?.length || 0}
        />

        {/* Card 4: Shortlist & Budget Status */}
        <ShortlistBudgetCard shortlist={dashboard.shortlistSummary} />
      </section>

      {/* 3. New User Guided Onboarding (Conditional) */}
      {dashboard.isNewUser && (
        <section aria-label="Getting Started Roadmap">
          <OnboardingEmptyState
            profileScore={dashboard.profileReadiness?.score || 0}
            hasShortlist={(dashboard.shortlistSummary?.totalCount || 0) > 0}
          />
        </section>
      )}

      {/* 4. Application Stage Pipeline */}
      <section aria-label="Application Milestone Timeline">
        <StagePipelineTimeline stages={dashboard.applicationStages} />
      </section>

      {/* 5. Main Area (Deadlines & Actionable Task Checklist) */}
      <section aria-label="Approaching Deadlines & Tasks" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingDeadlinesList deadlines={dashboard.upcomingDeadlines} />
        <PrioritizedTaskList tasksSummary={dashboard.tasksSummary} />
      </section>

      {/* 6. Saved Programs Freshness & Attention Alerts (if any) */}
      {dashboard.savedProgramChanges?.length > 0 && (
        <section aria-label="Shortlist Freshness Alerts">
          <SavedProgramsAttention changes={dashboard.savedProgramChanges} />
        </section>
      )}

      {/* 7. Decision Area: Cost Comparison vs Budget */}
      {dashboard.shortlistSummary?.programs?.length > 0 && (
        <section aria-label="Tuition Cost Comparison">
          <ShortlistCostComparison
            programs={dashboard.shortlistSummary.programs}
            targetBudgetAud={dashboard.budgetSummary?.targetMaxBudgetAud || 40000}
          />
        </section>
      )}

      {/* 8. Decision Area: Explainable Fit Comparison */}
      {dashboard.shortlistSummary?.programs?.length > 0 && (
        <section aria-label="Explainable Fit Analysis">
          <ExplainableFitComparison programs={dashboard.shortlistSummary.programs} />
        </section>
      )}

      {/* 9. Decision Area: Matching Scholarships */}
      {dashboard.scholarships?.length > 0 && (
        <section aria-label="Matching Scholarships">
          <ScholarshipMatches scholarships={dashboard.scholarships} />
        </section>
      )}
    </div>
  );
}
