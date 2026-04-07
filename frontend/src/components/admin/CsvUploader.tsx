'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { universitiesApi } from '@/lib/api/universities.api';
import { programsApi } from '@/lib/api/programs.api';
import { UploadJob } from '@/types/api';

interface CsvUploaderProps {
  entity: 'universities' | 'programs';
}

export function CsvUploader({ entity }: CsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadJob | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (f: File) =>
      entity === 'universities'
        ? universitiesApi.bulkUpload(f)
        : programsApi.bulkUpload(f),
    onSuccess: (res) => {
      const job = res.data.data as UploadJob;
      setResult(job);
      qc.invalidateQueries({ queryKey: ['admin-universities'] });
      qc.invalidateQueries({ queryKey: ['admin-programs'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (job.errorCount === 0) {
        toast.success(`✅ ${job.successCount} ${entity} imported successfully`);
      } else {
        toast.warning(`⚠️ ${job.successCount} imported, ${job.errorCount} errors`);
      }
    },
    onError: () => toast.error('Upload failed'),
  });

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) {
      toast.error('Only CSV files are accepted');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium mb-1">
          Drop your CSV here, or <span className="text-primary">browse</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Upload {entity} data in CSV format (max 10MB)
        </p>
      </div>

      {/* Selected file */}
      {file && (
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload button */}
      {file && (
        <Button
          onClick={() => mutation.mutate(file)}
          disabled={mutation.isPending}
          className="w-full"
        >
          {mutation.isPending ? 'Uploading...' : `Upload ${entity}`}
        </Button>
      )}

      {/* Result summary */}
      {result && (
        <Card className={`border-2 ${result.errorCount === 0 ? 'border-green-500/30' : 'border-amber-500/30'}`}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              {result.errorCount === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
              )}
              <span className="font-medium text-sm">Upload {result.status}</span>
              <Badge
                variant="outline"
                className={`ml-auto text-xs ${result.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}
              >
                {result.status}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold">{result.totalRows}</div>
                <div className="text-[10px] text-muted-foreground">Total Rows</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{result.successCount}</div>
                <div className="text-[10px] text-muted-foreground">Imported</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-500">{result.errorCount}</div>
                <div className="text-[10px] text-muted-foreground">Errors</div>
              </div>
            </div>
            {result.rowErrors && result.rowErrors.length > 0 && (
              <div className="bg-destructive/5 rounded-lg p-3 space-y-1">
                {result.rowErrors.slice(0, 5).map((err, i) => (
                  <p key={i} className="text-xs text-destructive">
                    Row {err.row}: {err.message}
                  </p>
                ))}
                {result.rowErrors.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{result.rowErrors.length - 5} more errors
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
