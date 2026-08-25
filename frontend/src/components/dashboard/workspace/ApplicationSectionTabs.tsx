'use client';

import { useState } from 'react';
import { ApplicationWorkspaceItem } from '@/lib/api/applicationWorkspace.api';
import { documentsApi } from '@/lib/api/documents.api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Globe,
  BookOpen,
  Award,
  Briefcase,
  FileText,
  Users,
  FileEdit,
  Download,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ApplicationSectionTabsProps {
  application: ApplicationWorkspaceItem;
  onRefresh?: () => void;
}

const TABS = [
  { id: 'identity', label: 'Identity & Visa', icon: User },
  { id: 'academic', label: 'Academics', icon: BookOpen },
  { id: 'english', label: 'English Test', icon: Award },
  { id: 'employment', label: 'Employment', icon: Briefcase },
  { id: 'documents', label: 'Document Vault', icon: FileText },
  { id: 'references', label: 'References', icon: Users },
  { id: 'statements', label: 'SOP & Consents', icon: FileEdit },
];

export function ApplicationSectionTabs({ application, onRefresh }: ApplicationSectionTabsProps) {
  const [activeTab, setActiveTab] = useState('identity');

  const idn = application.identity || ({} as any);
  const academics = application.academicRecords || [];
  const english = application.englishTestRecords || [];
  const employment = application.employmentRecords || [];
  const documents = (application.documents || []) as any[];
  const references = application.references || [];
  const consents = application.consents || [];

  const handleDownloadDoc = async (docId: string) => {
    try {
      const res = await documentsApi.getSignedDownloadUrl(docId);
      window.open(res.data.data.downloadUrl, '_blank');
    } catch {
      toast.error('Could not generate secure download URL');
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-border p-2 bg-muted/40 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                isActive
                  ? 'bg-card text-primary shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Body */}
      <div className="p-6">
        {/* 1. Identity & Visa */}
        {activeTab === 'identity' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Personal Identity & Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Full Legal Name</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {idn.title ? `${idn.title} ` : ''}{idn.firstName || 'Not provided'} {idn.middleName ? `${idn.middleName} ` : ''}{idn.lastName || ''}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Date of Birth</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {idn.dateOfBirth ? format(new Date(idn.dateOfBirth), 'MMM d, yyyy') : 'Not provided'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Gender</span>
                  <p className="font-semibold text-foreground capitalize mt-0.5">
                    {idn.gender || 'Not specified'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email Address
                  </span>
                  <p className="font-semibold text-foreground mt-0.5 truncate">{idn.email || '-'}</p>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Contact Phone
                  </span>
                  <p className="font-semibold text-foreground mt-0.5">{idn.phone || '-'}</p>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Current Location
                  </span>
                  <p className="font-semibold text-foreground mt-0.5 truncate">
                    {idn.currentAddress?.city ? `${idn.currentAddress.city}, ` : ''}{idn.currentAddress?.country || 'International'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Citizenship, Passport & Visa Context
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Primary Citizenship</span>
                  <p className="font-semibold text-foreground mt-0.5">{idn.citizenshipCountry || 'Not provided'}</p>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Passport (Masked)</span>
                  <p className="font-mono font-bold text-foreground mt-0.5">{idn.passportNumberMasked || 'Pending upload'}</p>
                  {idn.passportExpiryDate && (
                    <span className="text-[10px] text-muted-foreground">
                      Exp: {format(new Date(idn.passportExpiryDate), 'MMM yyyy')}
                    </span>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Visa Status</span>
                  <p className="font-semibold text-foreground capitalize mt-0.5">
                    {idn.currentVisaStatus || 'Offshore / None'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Academic History */}
        {activeTab === 'academic' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Academic History ({academics.length})
              </h3>
            </div>

            {academics.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-4 bg-muted/30 rounded-xl text-center">
                No academic qualification records found for this application.
              </p>
            ) : (
              <div className="space-y-3">
                {academics.map((acad: any, i: number) => (
                  <div key={acad.id || i} className="p-4 rounded-xl bg-background border border-border text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize bg-primary/5 text-primary text-[10px]">
                          {acad.qualificationLevel}
                        </Badge>
                        <span className="font-bold text-foreground text-sm">{acad.fieldOfStudy}</span>
                      </div>
                      {acad.gpaAchieved && (
                        <Badge variant="secondary" className="font-mono font-bold text-xs">
                          GPA: {acad.gpaAchieved}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">{acad.institutionName}</span> · {acad.country}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. English Proficiency */}
        {activeTab === 'english' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Standardized English Language Testing
            </h3>

            {english.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-4 bg-muted/30 rounded-xl text-center">
                No English test scores attached. IELTS / PTE / TOEFL scorecards are recommended.
              </p>
            ) : (
              <div className="space-y-3">
                {english.map((eng: any, i: number) => (
                  <div key={eng.id || i} className="p-4 rounded-xl bg-background border border-border text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-foreground">{eng.testType}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Overall:</span>
                        <span className="text-base font-black font-mono text-primary">{eng.overallScore}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-1 border-t border-border/80 text-center font-mono">
                      <div className="p-2 rounded-lg bg-card border border-border/60">
                        <span className="text-[9px] uppercase text-muted-foreground block">Listening</span>
                        <span className="font-bold">{eng.listeningScore ?? '-'}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-card border border-border/60">
                        <span className="text-[9px] uppercase text-muted-foreground block">Reading</span>
                        <span className="font-bold">{eng.readingScore ?? '-'}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-card border border-border/60">
                        <span className="text-[9px] uppercase text-muted-foreground block">Writing</span>
                        <span className="font-bold">{eng.writingScore ?? '-'}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-card border border-border/60">
                        <span className="text-[9px] uppercase text-muted-foreground block">Speaking</span>
                        <span className="font-bold">{eng.speakingScore ?? '-'}</span>
                      </div>
                    </div>

                    {eng.trfOrRegistrationNumber && (
                      <p className="text-[11px] text-muted-foreground font-mono">
                        TRF / Candidate ID: <span className="text-foreground font-semibold">{eng.trfOrRegistrationNumber}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Employment */}
        {activeTab === 'employment' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Work History & Experience ({employment.length})
            </h3>

            {employment.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-4 bg-muted/30 rounded-xl text-center">
                No employment records logged.
              </p>
            ) : (
              <div className="space-y-3">
                {employment.map((emp: any, i: number) => (
                  <div key={emp.id || i} className="p-4 rounded-xl bg-background border border-border text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-sm">{emp.jobTitle}</span>
                      <Badge variant="outline" className="text-[10px] capitalize bg-muted">
                        {emp.employmentType?.replace('_', ' ') || 'Full Time'}
                      </Badge>
                    </div>
                    <p className="font-semibold text-primary">{emp.employerName}</p>
                    {emp.responsibilities && (
                      <p className="text-muted-foreground leading-relaxed pt-1">{emp.responsibilities}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. Document Vault */}
        {activeTab === 'documents' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Encrypted Document Vault ({documents.length})
              </h3>
              <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                <Lock className="h-3 w-3 text-emerald-500" />
                AES-256-GCM
              </span>
            </div>

            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-4 bg-muted/30 rounded-xl text-center">
                No files uploaded to this application yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {documents.map((doc: any, i: number) => {
                  const docId = doc._id || doc.id;
                  const sizeKb = doc.fileSizeBytes ? Math.round(doc.fileSizeBytes / 1024) : 0;
                  return (
                    <div
                      key={docId || i}
                      className="p-3.5 rounded-xl bg-background border border-border flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">
                            {doc.title || doc.originalFilename || 'Document'}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
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

                      {docId && (
                        <Button
                          type="button"
                          onClick={() => handleDownloadDoc(docId)}
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5 shrink-0 bg-card hover:bg-accent/40"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 6. References */}
        {activeTab === 'references' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Recommendation Referees ({references.length})
            </h3>

            {references.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-4 bg-muted/30 rounded-xl text-center">
                No referees attached to this application.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {references.map((refItem: any, i: number) => (
                  <div key={refItem.id || i} className="p-4 rounded-xl bg-background border border-border text-xs space-y-2">
                    <p className="font-bold text-foreground text-sm">{refItem.refereeName}</p>
                    <p className="text-muted-foreground">
                      {refItem.designation} · <span className="font-medium text-foreground">{refItem.organization}</span>
                    </p>
                    <div className="pt-2 border-t border-border/80 flex flex-col gap-1 text-[11px]">
                      <span className="flex items-center gap-1 text-primary">
                        <Mail className="h-3 w-3" /> {refItem.email}
                      </span>
                      {refItem.phone && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" /> {refItem.phone}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. Statements & Consents */}
        {activeTab === 'statements' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <FileEdit className="h-4 w-4 text-primary" />
                Statement of Purpose / Personal Essay
              </h3>
              {application.statementOfPurpose ? (
                <div className="p-4 rounded-xl bg-background border border-border text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {application.statementOfPurpose}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic p-4 bg-muted/30 rounded-xl text-center">
                  No statement of purpose written yet.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Applicant Declarations & Consent Records
              </h3>
              <div className="space-y-2">
                {consents.map((con: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-background border border-border flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-foreground capitalize">
                        {con.consentType?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {con.agreedAt && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Agreed on {format(new Date(con.agreedAt), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
