'use client';

import { useEffect, useState } from 'react';
import { ingestionApi } from '@/lib/api/ingestion.api';
import { IngestionJob } from '@/types/ingestion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BrainCircuit, Clock, RefreshCcw, Search, Terminal, StopCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { IngestionJobLogsModal } from '@/components/admin/IngestionJobLogsModal';

export default function AdminIngestionDashboard() {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const res = await ingestionApi.getJobs({
        page,
        limit: 20,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setJobs(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch (err) {
      console.error('Failed to fetch ingestion jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter]);

  // Poll for active jobs
  useEffect(() => {
    const hasActiveJobs = jobs.some(j => j.status === 'running' || j.status === 'queued');
    if (!hasActiveJobs) return;

    const intervalId = setInterval(() => {
      fetchJobs();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [jobs, page, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20';
      case 'failed': return 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20';
      case 'running': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20';
      case 'queued': return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20';
      case 'cancelled': return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-slate-500/20';
    }
  };

  const formatJobType = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <BrainCircuit className="h-6 w-6 text-primary" />
            </div>
            AI Ingestion Pipeline
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor automated program discovery and extraction tasks across universities.
          </p>
        </div>
        <Button variant="outline" onClick={fetchJobs} className="gap-2 shrink-0">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-xl">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search universities..."
              className="pl-9 bg-background/50 border-border/50 focus-visible:ring-primary/20"
              disabled
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val || 'all'); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[160px] bg-background/50">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-[280px]">University</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[300px]">Progress</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCcw className="h-4 w-4 animate-spin" />
                      Loading jobs...
                    </div>
                  </TableCell>
                </TableRow>
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No ingestion jobs found.
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job._id} className="border-border/50 hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium">
                      <div className="truncate" title={job.universityName}>
                        {job.universityName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        ID: {typeof job.universityId === 'object' ? job.universityId._id : job.universityId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatJobType(job.jobType)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2 pr-4">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-muted-foreground truncate max-w-[200px]" title={job.progress?.stage || 'Starting'}>
                            {job.progress?.stage || 'Starting'}
                          </span>
                          <span>{job.progress?.percent || 0}%</span>
                        </div>
                        <Progress value={job.progress?.percent || 0} className="h-1.5" />
                        {(job.status === 'completed' || job.progress?.programsCreated !== undefined) && (
                          <div className="text-[10px] text-muted-foreground flex gap-3">
                            {job.progress?.programsDiscovered !== undefined && (
                              <span title="Discovered">🔍 {job.progress.programsDiscovered}</span>
                            )}
                            {job.progress?.programsCreated !== undefined && (
                              <span className="text-emerald-500/80" title="Created Staged Changes">✨ {job.progress.programsCreated}</span>
                            )}
                            {job.progress?.programsUpdated !== undefined && (
                              <span className="text-blue-500/80" title="Updated Staged Changes">🔄 {job.progress.programsUpdated}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground whitespace-nowrap flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {job.startedAt ? formatDistanceToNow(new Date(job.startedAt), { addSuffix: true }) : 'Waiting'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(job.status === 'running' || job.status === 'queued') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                            onClick={async () => {
                              if (confirm('Are you sure you want to cancel this ingestion job?')) {
                                await ingestionApi.cancelJob(job._id);
                                fetchJobs();
                              }
                            }}
                          >
                            <StopCircle className="h-4 w-4" />
                            <span className="hidden lg:inline">Cancel</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-2 text-muted-foreground hover:text-foreground"
                          onClick={() => setSelectedJobId(job._id)}
                        >
                          <Terminal className="h-4 w-4" />
                          <span className="hidden lg:inline">Logs</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} jobs
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page * 20 >= total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Logs Modal */}
      <IngestionJobLogsModal
        jobId={selectedJobId}
        onClose={() => setSelectedJobId(null)}
        onJobRetried={() => {
          setSelectedJobId(null);
          setPage(1);
          fetchJobs();
        }}
      />
    </div>
  );
}
