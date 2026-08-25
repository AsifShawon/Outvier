'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  Loader2,
  Check,
  FileCheck,
} from 'lucide-react';
import { Step1ProgramIntake } from './Step1ProgramIntake';
import { Step2PersonalIdentity } from './Step2PersonalIdentity';
import { Step3CitizenshipVisa } from './Step3CitizenshipVisa';
import { Step4AcademicHistory } from './Step4AcademicHistory';
import { Step5EnglishProficiency } from './Step5EnglishProficiency';
import { Step6EmploymentHistory } from './Step6EmploymentHistory';
import { Step7DocumentsUpload } from './Step7DocumentsUpload';
import { Step8References } from './Step8References';
import { Step9StatementsConsent } from './Step9StatementsConsent';
import { Step10ReviewReadiness } from './Step10ReviewReadiness';
import { applicationWorkspaceApi } from '@/lib/api/applicationWorkspace.api';
import { toast } from 'sonner';

interface ApplicationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  onComplete?: (application: any) => void;
}

const STEP_TITLES = [
  'Program & Intake',
  'Personal Identity',
  'Citizenship & Visa',
  'Academic History',
  'English Proficiency',
  'Employment',
  'Documents Vault',
  'References',
  'Statements & Consent',
  'Review & Readiness',
];

export function ApplicationWizardModal({
  isOpen,
  onClose,
  initialData,
  onComplete,
}: ApplicationWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData(
        initialData || {
          title: '',
          subtitle: '',
          priority: 'medium',
          programChoice: {
            intakeTerm: 'Feb / Term 1',
            intakeYear: new Date().getFullYear() + 1,
            studyLevel: 'Postgraduate (Master)',
          },
          identity: {
            title: 'Mr',
            firstName: '',
            lastName: '',
            email: '',
            gender: 'prefer-not-to-say',
            currentVisaStatus: 'none',
          },
          academicRecords: [],
          englishTestRecords: [],
          employmentRecords: [],
          references: [],
          documents: [],
          consents: [],
          statementOfPurpose: '',
        }
      );
    }
  }, [isOpen, initialData]);

  const handleUpdate = (fields: Record<string, any>) => {
    setFormData((prev: any) => ({
      ...prev,
      ...fields,
    }));
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      let savedApp;
      if (formData._id) {
        const res = await applicationWorkspaceApi.updateApplication(formData._id, formData);
        savedApp = res.data.data.application;
      } else {
        const res = await applicationWorkspaceApi.createApplication(formData);
        savedApp = res.data.data;
      }
      toast.success('Application draft saved! 💾');
      if (onComplete) onComplete(savedApp);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save application');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    setIsSaving(true);
    try {
      let app = formData;
      if (!app._id) {
        const createRes = await applicationWorkspaceApi.createApplication(formData);
        app = createRes.data.data;
      }

      await applicationWorkspaceApi.updateStage(app._id, {
        stage: 'ready_for_review',
        statusSource: 'student-reported',
        reason: 'Submitted for staff review and verification',
      });

      toast.success('Application submitted for staff review! 🚀');
      if (onComplete) onComplete(app);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogExternalSubmission = async () => {
    setIsSaving(true);
    try {
      let app = formData;
      if (!app._id) {
        const createRes = await applicationWorkspaceApi.createApplication(formData);
        app = createRes.data.data;
      }

      await applicationWorkspaceApi.updateStage(app._id, {
        stage: 'submitted_externally',
        statusSource: 'student-reported',
        reason: 'Student logged external manual university portal submission',
      });

      toast.success('External submission logged (student-reported)! 🎉');
      if (onComplete) onComplete(app);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to log submission');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1ProgramIntake data={formData} onChange={handleUpdate} />;
      case 2:
        return <Step2PersonalIdentity data={formData} onChange={handleUpdate} />;
      case 3:
        return <Step3CitizenshipVisa data={formData} onChange={handleUpdate} />;
      case 4:
        return <Step4AcademicHistory data={formData} onChange={handleUpdate} />;
      case 5:
        return <Step5EnglishProficiency data={formData} onChange={handleUpdate} />;
      case 6:
        return <Step6EmploymentHistory data={formData} onChange={handleUpdate} />;
      case 7:
        return <Step7DocumentsUpload data={formData} onChange={handleUpdate} />;
      case 8:
        return <Step8References data={formData} onChange={handleUpdate} />;
      case 9:
        return <Step9StatementsConsent data={formData} onChange={handleUpdate} />;
      case 10:
        return <Step10ReviewReadiness data={formData} onChange={handleUpdate} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        {/* Header with Step Progress */}
        <DialogHeader className="p-5 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Step {currentStep} of 10
              </span>
              <DialogTitle className="text-base font-bold text-foreground">
                {STEP_TITLES[currentStep - 1]}
              </DialogTitle>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono bg-background">
              {Math.round((currentStep / 10) * 100)}% Complete
            </Badge>
          </div>
          <Progress value={(currentStep / 10) * 100} className="h-1.5 mt-3 bg-muted" />
        </DialogHeader>

        {/* Scrollable Step Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStepContent()}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1 || isSaving}
            className="text-xs gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Draft
            </Button>

            {currentStep < 10 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.min(10, prev + 1))}
                className="text-xs gap-1"
              >
                Next Step
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLogExternalSubmission}
                  disabled={isSaving}
                  className="text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Send className="h-3.5 w-3.5" />
                  Log External Submission
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubmitForReview}
                  disabled={isSaving}
                  className="text-xs gap-1.5"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Submit for Staff Review
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
