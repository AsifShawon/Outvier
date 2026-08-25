'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Briefcase, Plus, Trash2 } from 'lucide-react';

interface Step6Props {
  data: any;
  onChange: (fields: Record<string, any>) => void;
}

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-Time Employment' },
  { value: 'part_time', label: 'Part-Time Employment' },
  { value: 'internship', label: 'Internship / Industrial Training' },
  { value: 'contract', label: 'Contract / Freelance' },
];

export function Step6EmploymentHistory({ data, onChange }: Step6Props) {
  const experiences = data.employmentRecords || [];

  const handleAddExperience = () => {
    const newExp = {
      id: `emp_${Date.now()}`,
      employerName: '',
      jobTitle: '',
      employmentType: 'full_time',
      isCurrent: false,
      country: '',
      responsibilities: '',
    };
    onChange({ employmentRecords: [...experiences, newExp] });
  };

  const handleUpdateExperience = (index: number, field: string, value: any) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ employmentRecords: updated });
  };

  const handleRemoveExperience = (index: number) => {
    const updated = experiences.filter((_: any, i: number) => i !== index);
    onChange({ employmentRecords: updated });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Step 6: Employment & Work Experience
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Add relevant professional work experience, internships, or research positions (optional for fresh graduates).
          </p>
        </div>
        <Button
          type="button"
          onClick={handleAddExperience}
          size="sm"
          variant="outline"
          className="text-xs gap-1.5 h-8 bg-card"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Job
        </Button>
      </div>

      {experiences.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl">
          <Briefcase className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">No employment records added</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Work history is optional for undergraduate applicants, but strongly recommended for postgraduate coursework and MBA admissions.
          </p>
          <Button
            type="button"
            onClick={handleAddExperience}
            size="sm"
            className="mt-4 text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Experience Record
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp: any, index: number) => (
            <div
              key={exp.id || index}
              className="p-4 rounded-xl bg-card border border-border space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary">
                  Employment #{index + 1}
                </span>
                <Button
                  type="button"
                  onClick={() => handleRemoveExperience(index)}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Employer / Organization *</Label>
                  <Input
                    placeholder="e.g. Brain Station 23 Ltd."
                    value={exp.employerName || ''}
                    onChange={(e) => handleUpdateExperience(index, 'employerName', e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Job Title / Role *</Label>
                  <Input
                    placeholder="e.g. Associate Software Engineer"
                    value={exp.jobTitle || ''}
                    onChange={(e) => handleUpdateExperience(index, 'jobTitle', e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Type</Label>
                  <Select
                    value={exp.employmentType || 'full_time'}
                    onValueChange={(val) => handleUpdateExperience(index, 'employmentType', val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-xs">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Key Responsibilities / Achievements</Label>
                <Textarea
                  placeholder="Summarize your main responsibilities, technologies used, and achievements..."
                  value={exp.responsibilities || ''}
                  onChange={(e) => handleUpdateExperience(index, 'responsibilities', e.target.value)}
                  className="text-xs min-h-[60px]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id={`isCurrent_${index}`}
                  checked={!!exp.isCurrent}
                  onCheckedChange={(checked) => handleUpdateExperience(index, 'isCurrent', !!checked)}
                />
                <Label htmlFor={`isCurrent_${index}`} className="text-xs font-medium cursor-pointer">
                  I currently work in this role
                </Label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
