'use client';

import { X, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ActiveFilterChipsProps {
  filters: Record<string, string | boolean | undefined>;
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

const FILTER_LABELS: Record<string, string> = {
  level: 'Level',
  field: 'Field',
  fieldOfStudy: 'Field',
  campusMode: 'Mode',
  deliveryMode: 'Mode',
  city: 'City',
  state: 'State',
  location: 'Location',
  budget: 'Tuition',
  feeYear: 'Fee Year',
  intake: 'Intake',
  englishMax: 'Max IELTS',
  englishRequirement: 'English Score',
  cricos: 'CRICOS',
  scholarshipAvailable: 'Scholarship',
  provider: 'Provider',
  university: 'University',
};

export function ActiveFilterChips({ filters, onRemove, onClearAll }: ActiveFilterChipsProps) {
  const activeEntries = Object.entries(filters).filter(([key, val]) => {
    if (key === 'page' || key === 'search' || key === 'sort' || key === 'sortBy' || key === 'sortOrder') return false;
    if (val === undefined || val === null || val === '' || val === 'all' || val === false || val === 'false') return false;
    return true;
  });

  if (activeEntries.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap py-2">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        Active Filters ({activeEntries.length}):
      </span>

      {activeEntries.map(([key, val]) => {
        const label = FILTER_LABELS[key] || key;
        let displayVal = String(val);
        if (displayVal === 'true') displayVal = 'Yes';

        return (
          <Badge
            key={key}
            variant="outline"
            className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-xl text-xs font-semibold bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 transition-colors"
          >
            <span>
              {label}: <span className="font-bold capitalize">{displayVal.replace(/_/g, ' ')}</span>
            </span>
            <button
              type="button"
              onClick={() => onRemove(key)}
              className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-primary/20 text-primary cursor-pointer"
              title={`Remove ${label} filter`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground font-semibold px-2"
      >
        <RotateCcw className="h-3 w-3" />
        Clear All
      </Button>
    </div>
  );
}
