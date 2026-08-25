'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Plus, Trash2, Award } from 'lucide-react';

interface Step4Props {
  data: any;
  onChange: (fields: Record<string, any>) => void;
}

const QUALIFICATION_LEVELS = [
  { value: 'bachelor', label: 'Bachelor Degree' },
  { value: 'master', label: 'Master Degree' },
  { value: 'high_school', label: 'High School / Year 12' },
  { value: 'diploma', label: 'Diploma / Advanced Diploma' },
  { value: 'doctorate', label: 'Doctorate (PhD)' },
  { value: 'certificate', label: 'Graduate Certificate' },
  { value: 'other', label: 'Other Qualification' },
];

export function Step4AcademicHistory({ data, onChange }: Step4Props) {
  const records = data.academicRecords || [];

  const handleAddRecord = () => {
    const newRecord = {
      id: `acad_${Date.now()}`,
      qualificationLevel: 'bachelor',
      institutionName: '',
      country: '',
      fieldOfStudy: '',
      gradingScale: '4.0',
      gpaAchieved: '',
      isCompleted: true,
    };
    onChange({ academicRecords: [...records, newRecord] });
  };

  const handleUpdateRecord = (index: number, field: string, value: any) => {
    const updated = [...records];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ academicRecords: updated });
  };

  const handleRemoveRecord = (index: number) => {
    const updated = records.filter((_: any, i: number) => i !== index);
    onChange({ academicRecords: updated });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Step 4: Academic History
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Add all prior secondary and post-secondary educational qualifications.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleAddRecord}
          size="sm"
          variant="outline"
          className="text-xs gap-1.5 h-8 bg-card"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Degree
        </Button>
      </div>

      {records.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl">
          <Award className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">No qualifications added yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Click &quot;Add Degree&quot; to log your Bachelor, Master, or secondary education records.
          </p>
          <Button
            type="button"
            onClick={handleAddRecord}
            size="sm"
            className="mt-4 text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Academic Record
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record: any, index: number) => (
            <div
              key={record.id || index}
              className="p-4 rounded-xl bg-card border border-border space-y-4 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  Qualification #{index + 1}
                </span>
                <Button
                  type="button"
                  onClick={() => handleRemoveRecord(index)}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Degree / Level *</Label>
                  <Select
                    value={record.qualificationLevel || 'bachelor'}
                    onValueChange={(val) => handleUpdateRecord(index, 'qualificationLevel', val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUALIFICATION_LEVELS.map((q) => (
                        <SelectItem key={q.value} value={q.value} className="text-xs">
                          {q.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Institution Name *</Label>
                  <Input
                    placeholder="e.g. University of Dhaka"
                    value={record.institutionName || ''}
                    onChange={(e) => handleUpdateRecord(index, 'institutionName', e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Country *</Label>
                  <Input
                    placeholder="e.g. Bangladesh"
                    value={record.country || ''}
                    onChange={(e) => handleUpdateRecord(index, 'country', e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold">Field / Major *</Label>
                  <Input
                    placeholder="e.g. Computer Science and Engineering"
                    value={record.fieldOfStudy || ''}
                    onChange={(e) => handleUpdateRecord(index, 'fieldOfStudy', e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Grading Scale</Label>
                  <Input
                    placeholder="e.g. 4.0 or 100%"
                    value={record.gradingScale || '4.0'}
                    onChange={(e) => handleUpdateRecord(index, 'gradingScale', e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">GPA / Score Achieved</Label>
                  <Input
                    placeholder="e.g. 3.75"
                    value={record.gpaAchieved || ''}
                    onChange={(e) => handleUpdateRecord(index, 'gpaAchieved', e.target.value)}
                    className="text-xs h-8 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id={`completed_${index}`}
                  checked={record.isCompleted !== false}
                  onCheckedChange={(checked) => handleUpdateRecord(index, 'isCompleted', !!checked)}
                />
                <Label htmlFor={`completed_${index}`} className="text-xs font-medium cursor-pointer">
                  Graduated / Qualification Completed
                </Label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
