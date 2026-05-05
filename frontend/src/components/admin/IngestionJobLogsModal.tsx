'use client';

import { useEffect, useState } from 'react';
import { ingestionApi } from '@/lib/api/ingestion.api';
import { IngestionJob, IIngestionJobLog } from '@/types/ingestion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Clock, Terminal, RotateCcw, StopCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  jobId: string | null;
  onClose: () => void;
  onJobRetried?: () => void;
}

export function IngestionJobLogsModal({ jobId, onClose, onJobRetried }: Props) {
  const [jobData, setJobData] = useState<{
    logs: IIngestionJobLog[];
    progress: IngestionJob['progress'];
    status: IngestionJob['status'];
    universityName: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setJobData(null);
      return;
    }

    let intervalId: NodeJS.Timeout;

    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const data = await ingestionApi.getJobLogs(jobId);
        setJobData(data as any);
        
        // If running, poll every 3 seconds
        if (data.status === 'running' || data.status === 'queued') {
          intervalId = setInterval(async () => {
            const freshData = await ingestionApi.getJobLogs(jobId);
            setJobData(freshData as any);
            if (freshData.status !== 'running' && freshData.status !== 'queued') {
              clearInterval(intervalId);
            }
          }, 3000);
        }
      } catch (err) {
        console.error('Failed to fetch job logs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId]);

  const handleRetry = async () => {
    if (!jobId) return;
    try {
      setIsRetrying(true);
      await ingestionApi.retryJob(jobId);
      toast.success('Job queued for retry');
      onJobRetried?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to retry job');
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
      case 'failed': return 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20';
      case 'running': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'queued': return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
      case 'cancelled': return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20';
    }
  };

  const getLogIcon = (status: string) => {
    switch (status) {
      case 'error': return <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />;
      default: return <Terminal className="h-4 w-4 text-slate-400 shrink-0" />;
    }
  };

  return (
    <Dialog open={!!jobId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center gap-3">
                Job Logs
                {jobData?.status && (
                  <Badge variant="secondary" className={getStatusColor(jobData.status)}>
                    {jobData.status}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="mt-1.5">
                {jobData?.universityName ? `University: ${jobData.universityName}` : 'Loading...'}
              </DialogDescription>
            </div>
            
            {jobData?.status === 'failed' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry} 
                disabled={isRetrying}
                className="gap-2"
              >
                <RotateCcw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                Retry Job
              </Button>
            )}

            {(jobData?.status === 'running' || jobData?.status === 'queued') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  if (confirm('Are you sure you want to cancel this ingestion job?')) {
                    try {
                      await ingestionApi.cancelJob(jobId!);
                      toast.success('Cancellation requested');
                      onClose();
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || 'Failed to cancel job');
                    }
                  }
                }} 
                className="gap-2 text-rose-500 border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
              >
                <StopCircle className="h-4 w-4" />
                Cancel Job
              </Button>
            )}
          </div>

          {/* Progress Overview */}
          {jobData?.progress && (
            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">{jobData.progress.stage}</span>
                <span className="text-foreground">{jobData.progress.percent}%</span>
              </div>
              <Progress value={jobData.progress.percent} className="h-2" />
              
              {/* Stats */}
              {(jobData.progress.programsDiscovered !== undefined || jobData.progress.pagesVisited !== undefined) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                  {jobData.progress.pagesVisited !== undefined && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Pages Crawled</div>
                      <div className="text-lg font-semibold">{jobData.progress.pagesVisited}</div>
                    </div>
                  )}
                  {jobData.progress.programsDiscovered !== undefined && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Programs Extracted</div>
                      <div className="text-lg font-semibold">{jobData.progress.programsDiscovered}</div>
                    </div>
                  )}
                  {jobData.progress.programsCreated !== undefined && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Newly Staged</div>
                      <div className="text-lg font-semibold text-emerald-500">{jobData.progress.programsCreated}</div>
                    </div>
                  )}
                  {jobData.progress.programsUpdated !== undefined && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Updates Staged</div>
                      <div className="text-lg font-semibold text-blue-500">{jobData.progress.programsUpdated}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogHeader>

        {/* Logs Area */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 font-mono text-sm">
          {isLoading && !jobData ? (
            <div className="text-slate-500 flex items-center gap-2">
              <Clock className="h-4 w-4 animate-spin" />
              Loading logs...
            </div>
          ) : !jobData?.logs?.length ? (
            <div className="text-slate-500">No logs available for this job yet.</div>
          ) : (
            <div className="space-y-3">
              {jobData.logs.map((log, idx) => (
                <div key={idx} className="flex gap-3 items-start group">
                  <div className="text-slate-500 shrink-0 w-20 pt-0.5 text-xs">
                    {format(new Date(log.timestamp), 'HH:mm:ss')}
                  </div>
                  <div className="shrink-0 pt-0.5">
                    {getLogIcon(log.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`break-words ${log.status === 'error' ? 'text-rose-400' : log.status === 'warning' ? 'text-amber-400' : log.status === 'success' ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {log.message}
                    </div>
                    {log.error && (
                      <div className="mt-1 text-rose-300 text-xs bg-rose-500/10 rounded p-2 overflow-x-auto">
                        {log.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
