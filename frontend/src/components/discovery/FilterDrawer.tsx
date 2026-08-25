'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  SlidersHorizontal,
  Filter,
  GraduationCap,
  BookOpen,
  MapPin,
  Building,
  DollarSign,
  Calendar,
  Languages,
  Award,
  Bookmark,
  Trash2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useSavedSearches } from '@/hooks/useSavedSearches';

export interface FilterState {
  level?: string;
  field?: string;
  campusMode?: string;
  city?: string;
  state?: string;
  budget?: string;
  feeYear?: string;
  intake?: string;
  englishMax?: string;
  cricos?: boolean | string;
  scholarshipAvailable?: boolean | string;
  [key: string]: any;
}

interface FilterDrawerProps {
  filters: FilterState;
  onChange: (key: string, value: any) => void;
  onClearAll: () => void;
  cities?: string[];
  fields?: string[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const LEVELS = [
  { value: 'all', label: 'All Levels' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'phd', label: 'PhD / Doctorate' },
  { value: 'graduate_certificate', label: 'Grad. Certificate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'certificate', label: 'Certificate' },
];

const MODES = [
  { value: 'all', label: 'All Modes' },
  { value: 'on-campus', label: 'On Campus' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Hybrid' },
];

const BUDGETS = [
  { value: 'all', label: 'Any Tuition' },
  { value: 'under-10k', label: 'Under $10,000 AUD' },
  { value: '10k-20k', label: '$10,000 - $20,000 AUD' },
  { value: '20k-30k', label: '$20,000 - $30,000 AUD' },
  { value: '30k-40k', label: '$30,000 - $40,000 AUD' },
  { value: '40k-50k', label: '$40,000 - $50,000 AUD' },
  { value: 'over-50k', label: 'Over $50,000 AUD' },
];

const INTAKES = [
  { value: 'all', label: 'Any Intake' },
  { value: 'February', label: 'February / Semester 1' },
  { value: 'July', label: 'July / Semester 2' },
  { value: 'September', label: 'September / Term 3' },
  { value: 'November', label: 'November / Summer' },
];

const IELTS_BENCHMARKS = [
  { value: 'all', label: 'Any Score' },
  { value: '6.0', label: 'IELTS 6.0 or lower' },
  { value: '6.5', label: 'IELTS 6.5 or lower' },
  { value: '7.0', label: 'IELTS 7.0 or lower' },
  { value: '7.5', label: 'IELTS 7.5 or lower' },
];

const FEE_YEARS = ['all', '2024', '2025', '2026', '2027'];
const STATES = ['all', 'NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

export function FilterDrawer({
  filters,
  onChange,
  onClearAll,
  cities = [],
  fields = [],
  isOpen,
  onOpenChange,
}: FilterDrawerProps) {
  const { savedSearches, saveSearch, removeSearch } = useSavedSearches('programs');
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const handleSavePreset = () => {
    if (!saveName.trim()) return;
    saveSearch(saveName.trim(), filters);
    setSaveName('');
    setShowSaveInput(false);
  };

  const handleApplySaved = (params: Record<string, string>) => {
    onClearAll();
    Object.entries(params).forEach(([k, v]) => onChange(k, v));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs font-semibold h-9 rounded-xl">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>All Filters</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-card overflow-hidden">
        {/* Header */}
        <SheetHeader className="p-5 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              Program Discovery Filters
            </SheetTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          </div>
        </SheetHeader>

        {/* Scrollable Filter Options */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {/* Saved Search Presets */}
          <div className="space-y-2.5 p-3.5 rounded-xl bg-background border border-border">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Bookmark className="h-3.5 w-3.5 text-primary" />
                Saved Search Presets
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSaveInput(!showSaveInput)}
                className="h-6 text-[10px] px-2 text-primary"
              >
                + Save Current
              </Button>
            </div>

            {showSaveInput && (
              <div className="flex items-center gap-2 pt-1">
                <Input
                  placeholder="e.g. Master IT in Sydney"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="h-7 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSavePreset}
                  className="h-7 text-xs px-2.5"
                >
                  Save
                </Button>
              </div>
            )}

            {savedSearches.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {savedSearches.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-lg text-[11px]"
                  >
                    <button
                      onClick={() => handleApplySaved(s.params)}
                      className="font-medium hover:text-primary cursor-pointer truncate max-w-[120px]"
                    >
                      {s.name}
                    </button>
                    <button
                      onClick={() => removeSearch(s.id)}
                      className="text-muted-foreground hover:text-destructive ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground italic">
                No saved searches yet. Save your favorite filter combination for 1-click access.
              </p>
            )}
          </div>

          {/* 1. Degree Level */}
          <div className="space-y-1.5">
            <Label className="font-bold flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              Degree Level
            </Label>
            <Select
              value={filters.level || 'all'}
              onValueChange={(val) => onChange('level', val === 'all' ? '' : val)}
            >
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((lvl) => (
                  <SelectItem key={lvl.value} value={lvl.value} className="text-xs">
                    {lvl.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Field of Study */}
          <div className="space-y-1.5">
            <Label className="font-bold flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              Field of Study / Discipline
            </Label>
            <Select
              value={filters.field || 'all'}
              onValueChange={(val) => onChange('field', val === 'all' ? '' : val)}
            >
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="All Fields" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Fields</SelectItem>
                {fields.map((f) => (
                  <SelectItem key={f} value={f} className="text-xs">
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Delivery Mode */}
          <div className="space-y-1.5">
            <Label className="font-bold flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-primary" />
              Delivery Mode
            </Label>
            <Select
              value={filters.campusMode || 'all'}
              onValueChange={(val) => onChange('campusMode', val === 'all' ? '' : val)}
            >
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="All Modes" />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. State & City Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-bold flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                State
              </Label>
              <Select
                value={filters.state || 'all'}
                onValueChange={(val) => onChange('state', val === 'all' ? '' : val)}
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  {STATES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s === 'all' ? 'All States' : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                City
              </Label>
              <Select
                value={filters.city || 'all'}
                onValueChange={(val) => onChange('city', val === 'all' ? '' : val)}
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Cities</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 5. Tuition Budget & Fee Year */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-bold flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                Tuition Budget
              </Label>
              <Select
                value={filters.budget || 'all'}
                onValueChange={(val) => onChange('budget', val === 'all' ? '' : val)}
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="Any Tuition" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGETS.map((b) => (
                    <SelectItem key={b.value} value={b.value} className="text-xs">
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Fee Year
              </Label>
              <Select
                value={filters.feeYear || 'all'}
                onValueChange={(val) => onChange('feeYear', val === 'all' ? '' : val)}
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="Any Year" />
                </SelectTrigger>
                <SelectContent>
                  {FEE_YEARS.map((y) => (
                    <SelectItem key={y} value={y} className="text-xs">
                      {y === 'all' ? 'All Years' : `${y} Fees`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 6. Next Intake Month */}
          <div className="space-y-1.5">
            <Label className="font-bold flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Next Intake
            </Label>
            <Select
              value={filters.intake || 'all'}
              onValueChange={(val) => onChange('intake', val === 'all' ? '' : val)}
            >
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="Any Intake" />
              </SelectTrigger>
              <SelectContent>
                {INTAKES.map((it) => (
                  <SelectItem key={it.value} value={it.value} className="text-xs">
                    {it.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 7. English Language Requirement */}
          <div className="space-y-1.5">
            <Label className="font-bold flex items-center gap-1.5">
              <Languages className="h-3.5 w-3.5 text-primary" />
              English Proficiency Benchmark
            </Label>
            <Select
              value={filters.englishMax || 'all'}
              onValueChange={(val) => onChange('englishMax', val === 'all' ? '' : val)}
            >
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="Any Score" />
              </SelectTrigger>
              <SelectContent>
                {IELTS_BENCHMARKS.map((eng) => (
                  <SelectItem key={eng.value} value={eng.value} className="text-xs">
                    {eng.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 8. Toggles: CRICOS Only & Scholarship Availability */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
              <div className="space-y-0.5">
                <Label htmlFor="cricos_toggle" className="font-bold cursor-pointer">
                  CRICOS Registered Only
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Required for onshore international student visa (Subclass 500)
                </p>
              </div>
              <Switch
                id="cricos_toggle"
                checked={filters.cricos === true || filters.cricos === 'true'}
                onCheckedChange={(checked: boolean) => onChange('cricos', checked ? 'true' : '')}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
              <div className="space-y-0.5">
                <Label htmlFor="scholarship_toggle" className="font-bold cursor-pointer flex items-center gap-1">
                  <Award className="h-3 w-3 text-emerald-500" />
                  Scholarships Available
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Programs with international student merit or tuition bursaries
                </p>
              </div>
              <Switch
                id="scholarship_toggle"
                checked={filters.scholarshipAvailable === true || filters.scholarshipAvailable === 'true'}
                onCheckedChange={(checked: boolean) => onChange('scholarshipAvailable', checked ? 'true' : '')}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="text-xs"
          >
            Clear Filters
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange?.(false)}
            className="text-xs font-bold px-5"
          >
            View Results
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
