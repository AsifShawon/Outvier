'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plane, ShieldCheck, Globe } from 'lucide-react';

interface Step3Props {
  data: any;
  onChange: (fields: Record<string, any>) => void;
}

export function Step3CitizenshipVisa({ data, onChange }: Step3Props) {
  const identity = data.identity || {};

  const handleUpdate = (field: string, value: any) => {
    onChange({
      identity: {
        ...identity,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Step 3: Citizenship & Visa Context
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Provide your citizenship, passport validity, and current visa status for international admission eligibility.
        </p>
      </div>

      {/* Citizenship & Birth Country */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Country of Citizenship *</Label>
          <Input
            placeholder="e.g. Bangladesh, India, China, Nepal"
            value={identity.citizenshipCountry || ''}
            onChange={(e) => handleUpdate('citizenshipCountry', e.target.value)}
            className="text-xs h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Country of Birth</Label>
          <Input
            placeholder="e.g. Bangladesh"
            value={identity.countryOfBirth || ''}
            onChange={(e) => handleUpdate('countryOfBirth', e.target.value)}
            className="text-xs h-9"
          />
        </div>
      </div>

      {/* Dual Citizenship */}
      <div className="space-y-3 p-3.5 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2">
          <Checkbox
            id="dualCitizen"
            checked={!!identity.dualCitizenship}
            onCheckedChange={(checked) => handleUpdate('dualCitizenship', !!checked)}
          />
          <Label htmlFor="dualCitizen" className="text-xs font-medium cursor-pointer">
            I hold dual or multiple citizenships
          </Label>
        </div>

        {identity.dualCitizenship && (
          <div className="pt-2">
            <Label className="text-xs font-semibold">Second Country of Citizenship</Label>
            <Input
              placeholder="e.g. United Kingdom, Canada"
              value={identity.secondCitizenshipCountry || ''}
              onChange={(e) => handleUpdate('secondCitizenshipCountry', e.target.value)}
              className="text-xs h-9 mt-1"
            />
          </div>
        )}
      </div>

      {/* Passport Information */}
      <div className="space-y-4 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Passport Information
          </Label>
          <span className="text-[11px] text-muted-foreground">Passport must be valid for at least 6 months</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Passport Number *</Label>
            <Input
              placeholder="e.g. A12345678"
              value={identity.passportNumberMasked || ''}
              onChange={(e) => handleUpdate('passportNumberMasked', e.target.value)}
              className="text-xs h-9 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Passport Expiry Date *</Label>
            <Input
              type="date"
              value={identity.passportExpiryDate ? new Date(identity.passportExpiryDate).toISOString().split('T')[0] : ''}
              onChange={(e) => handleUpdate('passportExpiryDate', e.target.value ? new Date(e.target.value) : undefined)}
              className="text-xs h-9 bg-card"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Country of Issue</Label>
            <Input
              placeholder="e.g. Bangladesh"
              value={identity.passportCountryOfIssue || ''}
              onChange={(e) => handleUpdate('passportCountryOfIssue', e.target.value)}
              className="text-xs h-9"
            />
          </div>
        </div>
      </div>

      {/* Current Visa Context */}
      <div className="space-y-4 pt-2 border-t border-border">
        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Plane className="h-4 w-4 text-primary" />
          Current Visa Context (if already in destination country)
        </Label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Current Visa Status</Label>
            <Select
              value={identity.currentVisaStatus || 'none'}
              onValueChange={(val) => handleUpdate('currentVisaStatus', val)}
            >
              <SelectTrigger className="h-9 text-xs bg-card">
                <SelectValue placeholder="Select visa status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">Offshore / No current visa</SelectItem>
                <SelectItem value="student" className="text-xs">Student Visa (Subclass 500)</SelectItem>
                <SelectItem value="tourist" className="text-xs">Visitor / Tourist Visa (Subclass 600)</SelectItem>
                <SelectItem value="work" className="text-xs">Temporary Graduate / Work Visa</SelectItem>
                <SelectItem value="permanent_resident" className="text-xs">Permanent Resident / Citizen</SelectItem>
                <SelectItem value="other" className="text-xs">Other / Bridging Visa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {identity.currentVisaStatus && identity.currentVisaStatus !== 'none' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Visa Expiry Date</Label>
              <Input
                type="date"
                value={identity.visaExpiryDate ? new Date(identity.visaExpiryDate).toISOString().split('T')[0] : ''}
                onChange={(e) => handleUpdate('visaExpiryDate', e.target.value ? new Date(e.target.value) : undefined)}
                className="text-xs h-9 bg-card"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
