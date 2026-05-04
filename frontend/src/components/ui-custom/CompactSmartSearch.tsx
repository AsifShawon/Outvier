'use client';

import { useState } from 'react';
import { Search, MapPin, GraduationCap, DollarSign, Calendar, Sparkles, X, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const subjects = [
  "Information Technology", 
  "Business & Management", 
  "Engineering", 
  "Health & Medicine", 
  "Arts & Humanities",
  "Data Science",
  "Artificial Intelligence",
  "Cyber Security",
  "Digital Marketing",
  "MBA"
];

const cities = ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra", "Gold Coast", "Hobart"];

const budgets = [
  { label: "Under $20k", value: "under-20k" },
  { label: "$20k - $30k", value: "20k-30k" },
  { label: "$30k - $40k", value: "30k-40k" },
  { label: "Over $40k", value: "over-40k" }
];

const intakes = ["February", "July", "November"];
const scholarships = ["Yes", "No Preference"];

export function CompactSmartSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const handleFilterSelect = (key: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value === "none") {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
      return newFilters;
    });
  };

  const removeFilter = (key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAll = () => {
    setFilters({});
    setSearchQuery('');
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (filters.subject) params.set('field', filters.subject);
    if (filters.city) params.set('city', filters.city);
    if (filters.budget) params.set('budget', filters.budget);
    if (filters.intake) params.set('intake', filters.intake);
    
    // Always include Australia
    params.set('country', 'australia');
    
    router.push(`/programs?${params.toString()}`);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 sm:p-3 overflow-hidden">
      {/* Top Row: Search Input */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            placeholder="Search program, university, subject, or city..."
            className="w-full h-14 pl-12 pr-4 bg-transparent border-none focus-visible:ring-0 text-base sm:text-lg placeholder:text-slate-400 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button 
          onClick={handleSearch}
          className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-base"
        >
          Find Matches
        </Button>
      </div>

      {/* Second Row: Premium Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 mt-2 px-1 sm:px-2 pb-1 overflow-x-auto no-scrollbar">
        <FilterCombobox 
          label="Subject" 
          icon={GraduationCap} 
          options={subjects} 
          value={filters.subject} 
          onSelect={(v) => handleFilterSelect('subject', v)} 
          searchPlaceholder="Search subjects..."
        />
        <FilterCombobox 
          label="City" 
          icon={MapPin} 
          options={cities} 
          value={filters.city} 
          onSelect={(v) => handleFilterSelect('city', v)} 
          searchPlaceholder="Search cities..."
        />
        <FilterSelect 
          label="Budget" 
          icon={DollarSign} 
          options={budgets.map(b => b.label)} 
          value={budgets.find(b => b.value === filters.budget)?.label} 
          onSelect={(v) => handleFilterSelect('budget', budgets.find(b => b.label === v)?.value || v)} 
        />
        <FilterSelect 
          label="Intake" 
          icon={Calendar} 
          options={intakes} 
          value={filters.intake} 
          onSelect={(v) => handleFilterSelect('intake', v)} 
        />
        <FilterSelect 
          label="Scholarship" 
          icon={Sparkles} 
          options={scholarships} 
          value={filters.scholarship} 
          onSelect={(v) => handleFilterSelect('scholarship', v)} 
        />
      </div>

      {/* Selected Chips */}
      {Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3 px-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          {Object.entries(filters).map(([key, value]) => (
            <Badge 
              key={key} 
              variant="secondary" 
              className="pl-3 pr-1 py-1 gap-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100/50 dark:border-blue-500/20 rounded-lg shadow-sm"
            >
              <span className="capitalize opacity-60 text-[10px] mr-1">{key}:</span>
              <span className="font-semibold text-xs tracking-tight">{key === 'budget' ? budgets.find(b => b.value === value)?.label : value}</span>
              <button 
                onClick={() => removeFilter(key)}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded p-0.5 transition-colors ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <button 
            onClick={clearAll}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 ml-2 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

// Custom Premium Filter Select (No search)
interface FilterSelectProps {
  label: string;
  icon: React.ElementType;
  options: string[];
  value: string | undefined;
  onSelect: (value: string) => void;
}

function FilterSelect({ label, icon: Icon, options, value, onSelect }: FilterSelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger 
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 h-10 rounded-xl text-[13px] font-semibold transition-all border shadow-xs group whitespace-nowrap outline-none",
          value 
            ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300" 
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:border-slate-700"
        )}
      >
        <Icon className={cn("w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity", value && "opacity-100")} />
        <span>{value || label}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 opacity-50 transition-transform duration-200", open && "rotate-180")} />
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1 rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
          Select {label}
        </div>
        <div className="space-y-0.5">
          <button
            onClick={() => { onSelect("none"); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 italic transition-colors"
          >
            No {label}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onSelect(opt); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm rounded-xl transition-all flex items-center justify-between",
                value === opt 
                  ? "bg-blue-50 text-blue-700 font-bold dark:bg-blue-900/50 dark:text-blue-300" 
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              )}
            >
              {opt}
              {value === opt && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Custom Premium Combobox Filter (With search)
interface FilterComboboxProps extends FilterSelectProps {
  searchPlaceholder: string;
}

function FilterCombobox({ label, icon: Icon, options, value, onSelect, searchPlaceholder }: FilterComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger 
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 h-10 rounded-xl text-[13px] font-semibold transition-all border shadow-xs group whitespace-nowrap outline-none",
          value 
            ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300" 
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:border-slate-700"
        )}
      >
        <Icon className={cn("w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity", value && "opacity-100")} />
        <span className="truncate max-w-[120px]">{value || label}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 opacity-50 transition-transform duration-200", open && "rotate-180")} />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <Command className="border-none">
          <CommandInput placeholder={searchPlaceholder} className="h-11 border-none focus-visible:ring-0" />
          <CommandList className="max-h-64 p-1">
            <CommandEmpty className="py-4 text-xs text-slate-400">No results found.</CommandEmpty>
            <CommandGroup heading={label} className="text-slate-400">
              <CommandItem
                onSelect={() => { onSelect("none"); setOpen(false); }}
                className="rounded-xl italic opacity-70 cursor-pointer"
              >
                No {label}
              </CommandItem>
              {options.map((opt) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => { onSelect(opt); setOpen(false); }}
                  className={cn(
                    "rounded-xl cursor-pointer py-2.5",
                    value === opt && "bg-blue-50 text-blue-700 font-bold dark:bg-blue-900/50 dark:text-blue-300"
                  )}
                >
                  <Check className={cn("mr-2 h-4 w-4 opacity-0", value === opt && "opacity-100")} />
                  {opt}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
