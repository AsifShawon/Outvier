'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GitCompare,
  AlertOctagon,
  Clock,
  Activity as ActivityIcon,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  Eye,
  AlertTriangle,
  FileText,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api/admin.api';
import {
  ReviewQueueItem,
  FailedJobItem,
  OverdueSourceItem,
  RecentActivityItem,
} from '@/types/adminDashboard';
import { cn } from '@/lib/utils';

export interface OperationsSectionProps {
  reviewQueue?: ReviewQueueItem[];
  recentlyFailedJobs?: FailedJobItem[];
  sourcesOverdue?: OverdueSourceItem[];
  recentActivity?: RecentActivityItem[];
  isLoading?: boolean;
  onRefreshQueue?: () => void;
}

export function OperationsSection({
  reviewQueue = [],
  recentlyFailedJobs = [],
  sourcesOverdue = [],
  recentActivity = [],
  isLoading = false,
  onRefreshQueue,
}: OperationsSectionProps) {
  const router = useRouter();
  const [approvingId, setApprovingId] = React.useState<string | null>(null);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setApprovingId(id);
      await adminApi.approveStagedChange(id);
      toast.success('Staged change approved and published.');
      if (onRefreshQueue) onRefreshQueue();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve staged change');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setRejectingId(id);
      await adminApi.rejectStagedChange(id);
      toast.success('Staged change rejected.');
      if (onRefreshQueue) onRefreshQueue();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject staged change');
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <Card className="bg-card/90 dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
      <Tabs defaultValue="review-queue" className="w-full">
        {/* Header Tabs */}
        <CardHeader className="p-4 sm:p-5 border-b border-border/60 dark:border-slate-800/60 bg-muted/20 dark:bg-slate-900/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold font-display text-foreground tracking-tight">
                Operations & Action Center
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Real-time review queues, synchronization failures, SLA refresh tasks, and application events
              </CardDescription>
            </div>

            <TabsList className="bg-surface-elevated dark:bg-slate-900 border border-border/60 dark:border-slate-800 p-1 rounded-xl h-auto flex flex-wrap">
              <TabsTrigger
                value="review-queue"
                className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 py-1.5 gap-1.5"
              >
                <GitCompare className="h-3.5 w-3.5" />
                <span>Review Queue</span>
                {reviewQueue.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold">
                    {reviewQueue.length}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="failed-jobs"
                className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 py-1.5 gap-1.5"
              >
                <AlertOctagon className="h-3.5 w-3.5" />
                <span>Failed Jobs</span>
                {recentlyFailedJobs.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded-full text-[10px] font-bold">
                    {recentlyFailedJobs.length}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="overdue-sources"
                className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 py-1.5 gap-1.5"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Overdue Refresh</span>
                {sourcesOverdue.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded-full text-[10px] font-bold">
                    {sourcesOverdue.length}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="recent-activity"
                className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 py-1.5 gap-1.5"
              >
                <ActivityIcon className="h-3.5 w-3.5" />
                <span>Recent Activity</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Tab 1: Review Queue */}
          <TabsContent value="review-queue" className="m-0 focus:outline-none">
            {isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : reviewQueue.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-teal-400 mx-auto" />
                <p className="text-sm font-semibold text-foreground">Review Queue is Clear</p>
                <p className="text-xs text-muted-foreground">All staged changes have been reviewed and published.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/40 dark:bg-slate-900/60 border-b border-border/60 dark:border-slate-800 text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-4 py-3">Entity & Provider</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-center">Confidence</th>
                      <th className="px-4 py-3">Summary / Warnings</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 dark:divide-slate-800/60">
                    {reviewQueue.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-muted/20 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/staged-changes`)}
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-foreground text-sm line-clamp-1">
                            {item.entityName}
                          </div>
                          <div className="text-[11px] text-muted-foreground line-clamp-1">
                            {item.providerName}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <Badge variant="outline" className="text-[10px] capitalize bg-surface-elevated">
                            {item.entityType} ({item.changeType})
                          </Badge>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] font-bold',
                              item.confidence >= 80
                                ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                                : item.confidence >= 60
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            )}
                          >
                            {item.confidence}%
                          </Badge>
                        </td>

                        <td className="px-4 py-3.5 max-w-xs">
                          {item.warningsCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {item.warningsCount} validation warnings
                            </span>
                          ) : item.diffSummary ? (
                            <span className="text-[11px] text-muted-foreground line-clamp-1">
                              {item.diffSummary}
                            </span>
                          ) : (
                            <span className="text-[11px] text-teal-400">Ready for review</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground text-[11px]">
                          {formatDistanceToNow(parseISO(item.createdAt))} ago
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={approvingId === item.id}
                              onClick={(e) => handleApprove(item.id, e)}
                              className="h-7 px-2 text-[11px] text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 border-teal-500/30 rounded-lg"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={rejectingId === item.id}
                              onClick={(e) => handleReject(item.id, e)}
                              className="h-7 px-2 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/30 rounded-lg"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              asChild
                              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                            >
                              <Link href="/admin/staged-changes">
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-3 border-t border-border/40 dark:border-slate-800 flex justify-between items-center text-xs text-muted-foreground bg-muted/10">
              <span>Showing up to 10 prioritized staged items</span>
              <Button variant="link" size="sm" asChild className="text-primary text-xs p-0 h-auto">
                <Link href="/admin/staged-changes">
                  View Full Staging Queue <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </TabsContent>

          {/* Tab 2: Failed Jobs */}
          <TabsContent value="failed-jobs" className="m-0 focus:outline-none">
            {isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : recentlyFailedJobs.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-teal-400 mx-auto" />
                <p className="text-sm font-semibold text-foreground">No Pipeline Failures</p>
                <p className="text-xs text-muted-foreground">All sync and ingestion jobs executed successfully.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/40 dark:bg-slate-900/60 border-b border-border/60 dark:border-slate-800 text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-4 py-3">Pipeline Job</th>
                      <th className="px-4 py-3">Target Provider</th>
                      <th className="px-4 py-3">Error Diagnosis</th>
                      <th className="px-4 py-3">Failed At</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 dark:divide-slate-800/60">
                    {recentlyFailedJobs.map((job) => (
                      <tr
                        key={job.id}
                        className="hover:bg-muted/20 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-rose-400 line-clamp-1">{job.jobType}</div>
                          <span className="text-[10px] text-muted-foreground">{job.source}</span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-foreground">{job.target}</td>
                        <td className="px-4 py-3.5 max-w-sm">
                          <p className="text-rose-300 font-mono text-[11px] bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/20 line-clamp-2">
                            {job.errorMessage}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(parseISO(job.failedAt))} ago
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="h-7 px-2.5 text-[11px] rounded-lg border-border/60"
                          >
                            <Link href="/admin/cricos/runs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Inspect Logs
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-3 border-t border-border/40 dark:border-slate-800 flex justify-between items-center text-xs text-muted-foreground bg-muted/10">
              <span>Automatic retries scheduled on next background worker cycle</span>
              <Button variant="link" size="sm" asChild className="text-primary text-xs p-0 h-auto">
                <Link href="/admin/cricos/runs">
                  View All Sync Runs <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </TabsContent>

          {/* Tab 3: Sources Overdue */}
          <TabsContent value="overdue-sources" className="m-0 focus:outline-none">
            {isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : sourcesOverdue.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-teal-400 mx-auto" />
                <p className="text-sm font-semibold text-foreground">All Feeds Up to Date</p>
                <p className="text-xs text-muted-foreground">Every connector and catalog feed is within its freshness SLA.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/40 dark:bg-slate-900/60 border-b border-border/60 dark:border-slate-800 text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-4 py-3">Source Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Target SLA</th>
                      <th className="px-4 py-3">Overdue Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 dark:divide-slate-800/60">
                    {sourcesOverdue.map((src) => (
                      <tr
                        key={src.id}
                        className="hover:bg-muted/20 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3.5 font-semibold text-foreground">{src.name}</td>
                        <td className="px-4 py-3.5 capitalize text-muted-foreground">{src.type.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{src.slaHours} hours</td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            <Clock className="h-3 w-3" />
                            {src.daysOverdue} days overdue
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            asChild
                            className="h-7 px-2.5 text-[11px] rounded-lg"
                          >
                            <Link href="/admin/cricos">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Trigger Sync
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* Tab 4: Recent Activity */}
          <TabsContent value="recent-activity" className="m-0 focus:outline-none">
            {isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <ActivityIcon className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                <p className="text-sm font-medium text-foreground">No recent events recorded</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40 dark:divide-slate-800/60">
                {recentActivity.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 hover:bg-muted/10 dark:hover:bg-slate-800/30 transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            act.status === 'success'
                              ? 'bg-teal-400'
                              : act.status === 'error'
                              ? 'bg-rose-400'
                              : act.status === 'warning'
                              ? 'bg-amber-400'
                              : 'bg-purple-400'
                          )}
                        />
                        <span className="font-semibold text-xs text-foreground">{act.title}</span>
                        {act.user && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <User className="h-3 w-3" />
                            {act.user}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{act.description}</p>
                    </div>

                    <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDistanceToNow(parseISO(act.timestamp))} ago
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
