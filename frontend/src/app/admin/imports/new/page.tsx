'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileText, X, CheckCircle2, AlertTriangle, ArrowRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api/admin.api';

interface PreviewRow {
  rowIndex: number;
  data: Record<string, string> | null;
  action: 'create' | 'update' | 'duplicate' | 'invalid';
  errors?: string[];
  existingId?: string;
}

interface Preview {
  jobId: string;
  filename: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  toCreate: number;
  toUpdate: number;
  duplicates: number;
  rows: PreviewRow[];
}

type Step = 'upload' | 'preview' | 'confirming';

const ACTION_COLORS: Record<string, string> = {
  create:    'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
  update:    'border-blue-500/30 text-blue-400 bg-blue-500/5',
  duplicate: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
  invalid:   'border-red-500/30 text-red-400 bg-red-500/5',
};

export default function AdminImportsNewPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>('upload');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await adminApi.uploadSeedCSV(formData);
      const json = res.data;
      if (!json.success) throw new Error(json.message || 'Upload failed');
      setPreview(json.data as Preview);
      setStep('preview');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setStep('confirming');
    try {
      const res = await adminApi.confirmImport(preview.jobId);
      const json = res.data;
      if (!json.success) throw new Error(json.message || 'Confirm failed');
      toast.success(`Import complete — ${json.data.successCount} universities created/updated`);
      router.push('/admin/imports');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Confirm failed');
      setStep('preview');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-display">New Seed Import</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a CSV with static university identity data. Dynamic data (ranking, tuition, etc.) is fetched via connectors.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(['upload', 'preview', 'confirming'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                step === s
                  ? 'border-primary bg-primary text-primary-foreground'
                  : ['upload', 'preview', 'confirming'].indexOf(s) <
                    ['upload', 'preview', 'confirming'].indexOf(step)
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-border text-muted-foreground'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={
                step === s ? 'font-medium capitalize' : 'text-muted-foreground capitalize'
              }
            >
              {s}
            </span>
            {i < 2 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* CSV column hint */}
      <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Required:</strong> universityName, country, state, city, officialWebsite
        <span className="mx-3 text-border">|</span>
        <strong className="text-foreground">Optional:</strong> shortName, campusName, cricosProviderCode, logoUrl, providerType, description, notes
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Upload ── */}
        {step === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/20'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="font-medium mb-1">Drop your CSV here or click to browse</p>
                  <p className="text-sm text-muted-foreground">CSV files only · max 10 MB</p>
                </>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full h-12 rounded-xl gap-2 text-base"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Validating…' : 'Upload & Preview'}
            </Button>
          </motion.div>
        )}

        {/* ── Step 2: Preview ── */}
        {step === 'preview' && preview && (
          <motion.div key="preview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Total Rows',  value: preview.totalRows,  color: '' },
                { label: 'Valid',       value: preview.validRows,  color: 'text-emerald-400' },
                { label: 'Invalid',     value: preview.invalidRows,color: 'text-red-400' },
                { label: 'To Create',   value: preview.toCreate,   color: 'text-blue-400' },
                { label: 'To Update',   value: preview.toUpdate,   color: 'text-amber-400' },
                { label: 'Duplicates',  value: preview.duplicates, color: 'text-orange-400' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border/50 bg-card p-4 text-center">
                  <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Row list */}
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border/40 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Row Preview
              </div>
              <div className="divide-y divide-border/30 max-h-72 overflow-y-auto">
                {preview.rows.map((row) => (
                  <div key={row.rowIndex} className="flex items-start gap-3 px-4 py-3 text-sm">
                    <span className="text-muted-foreground text-xs w-8 flex-shrink-0 pt-0.5">#{row.rowIndex}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{(row.data as any)?.universityName || '—'}</p>
                      {row.errors && (
                        <p className="text-xs text-red-400 mt-0.5">{row.errors.join(' · ')}</p>
                      )}
                      {row.existingId && (
                        <p className="text-xs text-muted-foreground mt-0.5">Will update: {row.existingId}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={`text-xs flex-shrink-0 ${ACTION_COLORS[row.action]}`}>
                      {row.action}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {preview.invalidRows > 0 && (
              <div className="flex gap-2 items-start rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-300">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  {preview.invalidRows} invalid row{preview.invalidRows !== 1 ? 's' : ''} will be skipped. Only valid rows will be imported.
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setStep('upload'); }} className="rounded-xl">
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={preview.toCreate + preview.toUpdate === 0}
                className="flex-1 h-11 rounded-xl gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm Import ({preview.toCreate + preview.toUpdate} rows)
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Confirming ── */}
        {step === 'confirming' && (
          <motion.div key="confirming" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium">Importing universities…</p>
            <p className="text-sm text-muted-foreground">This may take a moment.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
