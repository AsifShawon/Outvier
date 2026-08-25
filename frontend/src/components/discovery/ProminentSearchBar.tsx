'use client';

import { useState } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProminentSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  'UNSW Computer Science',
  'Melbourne Master of IT',
  'Sydney MBA',
  'Nursing Melbourne',
  'Data Science Monash',
  'Cybersecurity QUT',
];

export function ProminentSearchBar({
  value,
  onChange,
  placeholder = 'Search by degree, university, field, or keyword (e.g. UNSW Computer Science, Master of IT)...',
  className,
  suggestions = DEFAULT_SUGGESTIONS,
}: ProminentSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={cn('space-y-2.5', className)}>
      <div
        className={cn(
          'relative flex items-center rounded-2xl border bg-card transition-all duration-200 shadow-sm',
          isFocused
            ? 'border-primary ring-2 ring-primary/20 shadow-md'
            : 'border-border hover:border-border/80'
        )}
      >
        <div className="pl-4.5 pr-2 flex items-center justify-center text-muted-foreground">
          <Search className="h-5 w-5 text-primary" />
        </div>

        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className="h-12 border-0 bg-transparent text-sm sm:text-base font-medium placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
        />

        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            className="h-8 w-8 p-0 mr-2 text-muted-foreground hover:text-foreground rounded-full"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Suggestion Chips */}
      {suggestions.length > 0 && !value && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" />
            Popular:
          </span>
          {suggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(sug)}
              className="px-2.5 py-1 rounded-full bg-muted/60 hover:bg-primary/10 hover:text-primary text-[11px] font-medium text-muted-foreground transition-colors cursor-pointer"
            >
              {sug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
