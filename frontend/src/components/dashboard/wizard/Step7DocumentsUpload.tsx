'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { documentsApi, DocumentRecord, DocumentType } from '@/lib/api/documents.api';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Trash2,
  Download,
  Loader2,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

interface Step7Props {
  data: any;
  onChange: (fields: Record<string, any>) => void;
}

const DOCUMENT_CATEGORIES: { type: DocumentType; label: string; required: boolean; desc: string }[] = [
  { type: 'passport', label: 'International Passport', required: true, desc: 'Color scan of bio-data page (valid 6+ months)' },
  { type: 'transcript', label: 'Academic Transcript', required: true, desc: 'Official semester/yearly academic transcripts' },
  { type: 'degree_certificate', label: 'Graduation / Degree Certificate', required: false, desc: 'Provisional or original degree certificate' },
  { type: 'english_test', label: 'English Test Scorecard', required: true, desc: 'Official IELTS TRF, PTE score report, or TOEFL cert' },
  { type: 'cv_resume', label: 'Curriculum Vitae (CV / Resume)', required: false, desc: 'Updated academic and professional resume' },
  { type: 'sop', label: 'Statement of Purpose (SOP)', required: false, desc: 'Personal statement or genuine student essay' },
  { type: 'lor', label: 'Letter of Recommendation (LOR)', required: false, desc: 'Academic or employer reference letters' },
  { type: 'financial_proof', label: 'Financial / Funding Proof', required: false, desc: 'Bank statement, loan sanction letter, or scholarship letter' },
];

export function Step7DocumentsUpload({ data, onChange }: Step7Props) {
  const [selectedType, setSelectedType] = useState<DocumentType>('passport');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const existingDocs: any[] = data.documents || [];

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File exceeds 20MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', selectedType);
    formData.append('title', file.name);
    if (data._id) {
      formData.append('applicationId', data._id);
    }

    setIsUploading(true);
    setUploadProgress(40);

    try {
      const res = await documentsApi.uploadDocument(formData);
      const newDoc = res.data.data.document;

      setUploadProgress(100);
      toast.success(`${newDoc.title} encrypted and securely saved! 🔒`);

      const updatedDocs = [...existingDocs, newDoc];
      onChange({ documents: updatedDocs });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDownload = async (docId: string, filename: string) => {
    try {
      const res = await documentsApi.getSignedDownloadUrl(docId);
      const downloadUrl = res.data.data.downloadUrl;
      window.open(downloadUrl, '_blank');
    } catch {
      toast.error('Could not generate signed download link');
    }
  };

  const handleDelete = async (docId: string, index: number) => {
    try {
      await documentsApi.deleteDocument(docId);
      const updated = existingDocs.filter((_: any, i: number) => i !== index);
      onChange({ documents: updated });
      toast.success('Document removed');
    } catch {
      toast.error('Failed to remove document');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Step 7: Secure Document Vault
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Upload certified documents. All files are encrypted using AES-256-GCM and stored in isolated secure object storage.
        </p>
      </div>

      {/* Upload Box */}
      <div className="p-5 rounded-2xl bg-card border-2 border-dashed border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-foreground">Select Document Category</Label>
            <p className="text-[11px] text-muted-foreground">Choose the category before selecting your file</p>
          </div>
          <Select
            value={selectedType}
            onValueChange={(val: string) => setSelectedType(val as DocumentType)}
          >
            <SelectTrigger className="h-9 w-full sm:w-[240px] text-xs bg-background">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.type} value={cat.type} className="text-xs">
                  {cat.label} {cat.required && '*'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative group cursor-pointer border border-border/80 bg-background/50 hover:bg-accent/40 rounded-xl p-6 text-center transition-all">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = '';
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs font-semibold text-foreground">Encrypting and uploading file...</p>
              <span className="text-[10px] text-muted-foreground">AES-256-GCM encryption in progress</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Click or drag and drop to upload <span className="text-primary font-bold">{selectedType}</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Supported formats: PDF, JPEG, PNG, WEBP, DOCX (Max 20MB per file)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-foreground">
            Vault Documents ({existingDocs.length})
          </Label>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
            <Lock className="h-3 w-3 text-emerald-500" />
            <span>End-to-End Encrypted</span>
          </div>
        </div>

        {existingDocs.length === 0 ? (
          <p className="text-xs text-muted-foreground italic p-3 bg-muted/40 rounded-xl text-center">
            No documents uploaded to vault yet. Upload passport and academic transcripts to boost your readiness.
          </p>
        ) : (
          <div className="space-y-2">
            {existingDocs.map((doc: any, index: number) => {
              const docId = doc._id || doc.id;
              const sizeKb = doc.fileSizeBytes ? Math.round(doc.fileSizeBytes / 1024) : 0;
              return (
                <div
                  key={docId || index}
                  className="p-3 rounded-xl bg-card border border-border flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {doc.title || doc.originalFilename}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Badge variant="outline" className="text-[9px] capitalize px-1 py-0 h-4 bg-muted">
                          {doc.documentType || 'Document'}
                        </Badge>
                        {sizeKb > 0 && <span>{sizeKb} KB</span>}
                        {doc.scanStatus && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            {doc.scanStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {docId && (
                      <Button
                        type="button"
                        onClick={() => handleDownload(docId, doc.originalFilename)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Download signed copy"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={() => handleDelete(docId, index)}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      title="Delete document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
