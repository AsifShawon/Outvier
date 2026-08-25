'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FileEdit, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Step9Props {
  data: any;
  onChange: (fields: Record<string, any>) => void;
}

export function Step9StatementsConsent({ data, onChange }: Step9Props) {
  const consents: any[] = data.consents || [];

  const isConsentAgreed = (type: string) => {
    return consents.some((c) => c.consentType === type && c.agreed);
  };

  const handleConsentToggle = (type: string, checked: boolean) => {
    const filtered = consents.filter((c) => c.consentType !== type);
    const updated = [
      ...filtered,
      {
        consentType: type,
        agreed: checked,
        agreedAt: new Date().toISOString(),
      },
    ];
    onChange({ consents: updated });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FileEdit className="h-5 w-5 text-primary" />
          Step 9: Statement of Purpose & Declarations
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Draft your personal statement and confirm the mandatory applicant declarations and data processing consents.
        </p>
      </div>

      {/* Statement of Purpose */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-foreground">
            Statement of Purpose / Genuine Student (GS) Essay
          </Label>
          <span className="text-[11px] text-muted-foreground font-mono">
            {data.statementOfPurpose?.length || 0} characters
          </span>
        </div>
        <Textarea
          placeholder="Explain your academic background, your reasons for choosing this specific program and university in Australia, and how it aligns with your future career goals in your home country..."
          value={data.statementOfPurpose || ''}
          onChange={(e) => onChange({ statementOfPurpose: e.target.value })}
          className="text-xs min-h-[160px] leading-relaxed"
        />
        <p className="text-[11px] text-muted-foreground">
          Tip: Australian genuine student assessments look for specific course structure alignment and clear post-graduation career return value.
        </p>
      </div>

      {/* Mandatory Declarations & Consents */}
      <div className="space-y-3 pt-2 border-t border-border">
        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          Mandatory Applicant Declarations
        </Label>

        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="consent_accuracy"
              checked={isConsentAgreed('declarations_accuracy')}
              onCheckedChange={(checked) =>
                handleConsentToggle('declarations_accuracy', !!checked)
              }
              className="mt-0.5"
            />
            <Label htmlFor="consent_accuracy" className="text-xs text-foreground leading-snug cursor-pointer">
              <span className="font-semibold">Declaration of Accuracy:</span> I declare that all information and uploaded educational records provided in this application are authentic, complete, and correct to the best of my knowledge.
            </Label>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="consent_data"
              checked={isConsentAgreed('data_processing')}
              onCheckedChange={(checked) =>
                handleConsentToggle('data_processing', !!checked)
              }
              className="mt-0.5"
            />
            <Label htmlFor="consent_data" className="text-xs text-foreground leading-snug cursor-pointer">
              <span className="font-semibold">Data Processing & Verification Consent:</span> I authorize Outvier to store, encrypt, and process my personal data and share it with authorized educational partners and verification authorities.
            </Label>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="consent_terms"
              checked={isConsentAgreed('terms_of_service')}
              onCheckedChange={(checked) =>
                handleConsentToggle('terms_of_service', !!checked)
              }
              className="mt-0.5"
            />
            <Label htmlFor="consent_terms" className="text-xs text-foreground leading-snug cursor-pointer">
              <span className="font-semibold">Terms of Service Agreement:</span> I acknowledge and agree to Outvier&apos;s Terms of Service and understanding that admissions decisions are made solely by target universities.
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
