'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Award, Plus, Trash2 } from 'lucide-react';

interface Step5Props {
  data: any;
  onChange: (fields: Record<string, any>) => void;
}

const TEST_TYPES = [
  { value: 'IELTS', label: 'IELTS Academic' },
  { value: 'PTE', label: 'PTE Academic' },
  { value: 'TOEFL_IBT', label: 'TOEFL iBT' },
  { value: 'DUOLINGO', label: 'Duolingo English Test (DET)' },
  { value: 'CAMBRIDGE', label: 'Cambridge C1 / C2' },
  { value: 'MOI_EXEMPT', label: 'Medium of Instruction (MOI) Exemption' },
  { value: 'OTHER', label: 'Other English Test' },
];

export function Step5EnglishProficiency({ data, onChange }: Step5Props) {
  const tests = data.englishTestRecords || [];

  const handleAddTest = () => {
    const newTest = {
      id: `eng_${Date.now()}`,
      testType: 'IELTS',
      overallScore: 7.0,
      listeningScore: 7.0,
      readingScore: 7.0,
      writingScore: 6.5,
      speakingScore: 6.5,
    };
    onChange({ englishTestRecords: [...tests, newTest] });
  };

  const handleUpdateTest = (index: number, field: string, value: any) => {
    const updated = [...tests];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ englishTestRecords: updated });
  };

  const handleRemoveTest = (index: number) => {
    const updated = tests.filter((_: any, i: number) => i !== index);
    onChange({ englishTestRecords: updated });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Step 5: English Language Proficiency
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Provide your standardized English language testing results (e.g. IELTS Academic, PTE, TOEFL).
          </p>
        </div>
        <Button
          type="button"
          onClick={handleAddTest}
          size="sm"
          variant="outline"
          className="text-xs gap-1.5 h-8 bg-card"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Test
        </Button>
      </div>

      {tests.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl">
          <Award className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">No English test records added</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Most Australian universities require an IELTS, PTE, or TOEFL score report for visa and admission.
          </p>
          <Button
            type="button"
            onClick={handleAddTest}
            size="sm"
            className="mt-4 text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add English Test Result
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((testItem: any, index: number) => (
            <div
              key={testItem.id || index}
              className="p-4 rounded-xl bg-card border border-border space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary">
                  Test Record #{index + 1}
                </span>
                <Button
                  type="button"
                  onClick={() => handleRemoveTest(index)}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Test Provider *</Label>
                  <Select
                    value={testItem.testType || 'IELTS'}
                    onValueChange={(val) => handleUpdateTest(index, 'testType', val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Test Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEST_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-xs">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Overall Score *</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 7.5 or 68"
                    value={testItem.overallScore ?? ''}
                    onChange={(e) =>
                      handleUpdateTest(index, 'overallScore', parseFloat(e.target.value) || 0)
                    }
                    className="text-xs h-8 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Test Date</Label>
                  <Input
                    type="date"
                    value={
                      testItem.testDate
                        ? new Date(testItem.testDate).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      handleUpdateTest(
                        index,
                        'testDate',
                        e.target.value ? new Date(e.target.value) : undefined
                      )
                    }
                    className="text-xs h-8 bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Listening</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 8.0"
                    value={testItem.listeningScore ?? ''}
                    onChange={(e) =>
                      handleUpdateTest(index, 'listeningScore', parseFloat(e.target.value) || 0)
                    }
                    className="text-xs h-8 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Reading</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 7.5"
                    value={testItem.readingScore ?? ''}
                    onChange={(e) =>
                      handleUpdateTest(index, 'readingScore', parseFloat(e.target.value) || 0)
                    }
                    className="text-xs h-8 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Writing</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 6.5"
                    value={testItem.writingScore ?? ''}
                    onChange={(e) =>
                      handleUpdateTest(index, 'writingScore', parseFloat(e.target.value) || 0)
                    }
                    className="text-xs h-8 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Speaking</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 7.0"
                    value={testItem.speakingScore ?? ''}
                    onChange={(e) =>
                      handleUpdateTest(index, 'speakingScore', parseFloat(e.target.value) || 0)
                    }
                    className="text-xs h-8 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <Label className="text-xs font-semibold">
                  TRF / Registration Number / Candidate ID
                </Label>
                <Input
                  placeholder="e.g. 24AU012345DOEJ001A"
                  value={testItem.trfOrRegistrationNumber || ''}
                  onChange={(e) =>
                    handleUpdateTest(index, 'trfOrRegistrationNumber', e.target.value)
                  }
                  className="text-xs h-8 font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
