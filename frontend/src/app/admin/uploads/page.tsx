'use client';

import { useQuery } from '@tanstack/react-query';
import { CsvUploader } from '@/components/admin/CsvUploader';
import { adminApi } from '@/lib/api/admin.api';
import { UploadJob } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, FileText } from 'lucide-react';

const statusIcon = {
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  failed: <AlertCircle className="h-4 w-4 text-red-500" />,
  processing: <Clock className="h-4 w-4 text-amber-500 animate-spin" />,
  pending: <Clock className="h-4 w-4 text-muted-foreground" />,
};

export default function AdminUploadsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['upload-history'],
    queryFn: adminApi.getUploadHistory,
    refetchInterval: 5000,
  });

  const jobs: UploadJob[] = data?.data?.data || [];

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display">CSV Bulk Upload</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Import universities and programs in bulk from CSV files.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Universities upload */}
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Universities CSV</h2>
          </div>
          <CsvUploader entity="universities" />
        </div>

        {/* Programs upload */}
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <FileText className="h-5 w-5 text-secondary-500" />
            <h2 className="font-semibold">Programs CSV</h2>
          </div>
          <CsvUploader entity="programs" />
        </div>
      </div>

      {/* CSV format hints */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-6">
        <h2 className="font-semibold mb-4">CSV Format Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <p className="font-medium mb-2 text-muted-foreground uppercase tracking-wide">Universities columns</p>
            <code className="block bg-card border border-border/60 rounded-lg p-3 font-mono text-[10px] leading-relaxed">
              name, description, location, state, website, logo, establishedYear, ranking, type, campuses, internationalStudents
            </code>
          </div>
          <div>
            <p className="font-medium mb-2 text-muted-foreground uppercase tracking-wide">Programs columns</p>
            <code className="block bg-card border border-border/60 rounded-lg p-3 font-mono text-[10px] leading-relaxed">
              name, universityName, level, field, description, duration, tuitionFeeLocal, tuitionFeeInternational, intakeMonths, englishRequirements, academicRequirements, careerPathways, campusMode, website
            </code>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          📌 Use semicolons (;) to separate multiple values in campuses, intakeMonths, and careerPathways columns.
        </p>
      </div>

      {/* Upload history */}
      {jobs.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <h2 className="font-semibold mb-4">Recent Uploads</h2>
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job._id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                {statusIcon[job.status]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{job.filename}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {job.successCount}/{job.totalRows} imported · {new Date(job.createdAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize">{job.entity}</Badge>
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${
                    job.status === 'completed' ? 'text-green-600' : job.status === 'failed' ? 'text-red-600' : ''
                  }`}
                >
                  {job.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
