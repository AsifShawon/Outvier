'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { programsApi } from '@/lib/api/programs.api';
import { universitiesApi } from '@/lib/api/universities.api';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { GraduationCap, Building2, Calendar, MapPin, Search, Check, Sparkles } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface Step1Props {
  data: any;
  onChange: (fields: Record<string, any>) => void;
}

const INTAKE_TERMS = ['Feb / Term 1', 'Jul / Term 2', 'Sep / Term 3', 'Nov / Summer'];
const STUDY_LEVELS = ['Undergraduate (Bachelor)', 'Postgraduate (Master)', 'Doctorate (PhD)', 'Diploma / Pathway', 'Graduate Certificate'];

export function Step1ProgramIntake({ data, onChange }: Step1Props) {
  const [openUni, setOpenUni] = useState(false);
  const [openProg, setOpenProg] = useState(false);
  const [uniSearch, setUniSearch] = useState('');
  const [progSearch, setProgSearch] = useState('');
  const debouncedUniSearch = useDebounce(uniSearch, 300);
  const debouncedProgSearch = useDebounce(progSearch, 300);

  const { data: uniRes } = useQuery({
    queryKey: ['wizard-uni-search', debouncedUniSearch],
    queryFn: () => universitiesApi.getAll({ q: debouncedUniSearch || undefined, limit: 8 }),
  });

  const { data: progRes } = useQuery({
    queryKey: ['wizard-prog-search', debouncedProgSearch, data.programChoice?.universityId],
    queryFn: () =>
      programsApi.getAll({
        q: debouncedProgSearch || undefined,
        universityId: typeof data.programChoice?.universityId === 'string' ? data.programChoice?.universityId : undefined,
        limit: 8,
      }),
  });

  const universities = uniRes?.data?.data || [];
  const programs = progRes?.data?.data || [];

  const handleSelectUniversity = (uni: any) => {
    onChange({
      title: data.title || `${data.programChoice?.customProgramName || 'Program'} at ${uni.name}`,
      subtitle: uni.name,
      programChoice: {
        ...data.programChoice,
        universityId: uni._id,
        customUniversityName: uni.name,
        campusName: uni.city ? `${uni.city}, ${uni.state || ''}` : uni.state,
      },
    });
    setOpenUni(false);
  };

  const handleSelectProgram = (prog: any) => {
    const uniName = prog.universityName || data.programChoice?.customUniversityName || 'Australian University';
    onChange({
      title: prog.name,
      subtitle: uniName,
      programChoice: {
        ...data.programChoice,
        programId: prog._id,
        customProgramName: prog.name,
        customUniversityName: uniName,
        studyLevel: prog.level,
        fieldOfStudy: prog.fieldOfStudy,
        estimatedTuitionAud: prog.primaryFeeAnnualAud,
        universityId: prog.university || data.programChoice?.universityId,
      },
    });
    setOpenProg(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Step 1: Program & Target Intake
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Select your target institution and program from the Outvier verified catalog, or enter custom details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* University Selector */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Target University / Provider *</Label>
          <Popover open={openUni} onOpenChange={setOpenUni}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between text-left font-normal bg-card hover:bg-accent/40"
              >
                <span className="truncate">
                  {data.programChoice?.customUniversityName || 'Search or select university...'}
                </span>
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Type university name (e.g. UNSW, Melbourne)..."
                  value={uniSearch}
                  onValueChange={setUniSearch}
                />
                <CommandList>
                  <CommandEmpty className="p-3 text-xs text-muted-foreground text-center">
                    No university found. Enter custom below.
                  </CommandEmpty>
                  <CommandGroup heading="Verified Institutions">
                    {universities.map((uni: any) => (
                      <CommandItem
                        key={uni._id}
                        onSelect={() => handleSelectUniversity(uni)}
                        className="text-xs cursor-pointer"
                      >
                        <Building2 className="mr-2 h-3.5 w-3.5 text-primary" />
                        <span className="truncate">{uni.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Input
            placeholder="Or type custom institution name..."
            value={data.programChoice?.customUniversityName || ''}
            onChange={(e) =>
              onChange({
                subtitle: e.target.value,
                programChoice: { ...data.programChoice, customUniversityName: e.target.value },
              })
            }
            className="text-xs h-8 text-muted-foreground"
          />
        </div>

        {/* Program Selector */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Degree / Program Name *</Label>
          <Popover open={openProg} onOpenChange={setOpenProg}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between text-left font-normal bg-card hover:bg-accent/40"
              >
                <span className="truncate">
                  {data.programChoice?.customProgramName || 'Search course or degree...'}
                </span>
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Type program name (e.g. Master of Data Science)..."
                  value={progSearch}
                  onValueChange={setProgSearch}
                />
                <CommandList>
                  <CommandEmpty className="p-3 text-xs text-muted-foreground text-center">
                    No program found in catalog. Enter custom name below.
                  </CommandEmpty>
                  <CommandGroup heading="Catalog Courses">
                    {programs.map((prog: any) => (
                      <CommandItem
                        key={prog._id}
                        onSelect={() => handleSelectProgram(prog)}
                        className="text-xs cursor-pointer"
                      >
                        <GraduationCap className="mr-2 h-3.5 w-3.5 text-primary" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{prog.name}</p>
                          <p className="text-[10px] text-muted-foreground">{prog.level} · {prog.universityName}</p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Input
            placeholder="Or type custom program name..."
            value={data.programChoice?.customProgramName || ''}
            onChange={(e) =>
              onChange({
                title: e.target.value,
                programChoice: { ...data.programChoice, customProgramName: e.target.value },
              })
            }
            className="text-xs h-8 text-muted-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        {/* Study Level */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Study Level</Label>
          <Select
            value={data.programChoice?.studyLevel || 'Postgraduate (Master)'}
            onValueChange={(val) =>
              onChange({ programChoice: { ...data.programChoice, studyLevel: val } })
            }
          >
            <SelectTrigger className="h-9 text-xs bg-card">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {STUDY_LEVELS.map((lvl) => (
                <SelectItem key={lvl} value={lvl} className="text-xs">
                  {lvl}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Intake Term */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Intake Term *</Label>
          <Select
            value={data.programChoice?.intakeTerm || 'Feb / Term 1'}
            onValueChange={(val) =>
              onChange({ programChoice: { ...data.programChoice, intakeTerm: val } })
            }
          >
            <SelectTrigger className="h-9 text-xs bg-card">
              <SelectValue placeholder="Select intake" />
            </SelectTrigger>
            <SelectContent>
              {INTAKE_TERMS.map((term) => (
                <SelectItem key={term} value={term} className="text-xs">
                  {term}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Intake Year */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Intake Year *</Label>
          <Select
            value={String(data.programChoice?.intakeYear || new Date().getFullYear() + 1)}
            onValueChange={(val) =>
              onChange({ programChoice: { ...data.programChoice, intakeYear: parseInt(val, 10) } })
            }
          >
            <SelectTrigger className="h-9 text-xs bg-card">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[2025, 2026, 2027, 2028].map((yr) => (
                <SelectItem key={yr} value={String(yr)} className="text-xs">
                  {yr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Program Summary Alert */}
      {data.programChoice?.customProgramName && (
        <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                {data.programChoice.customProgramName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {data.programChoice.customUniversityName || 'University'} · {data.programChoice.intakeTerm} {data.programChoice.intakeYear}
              </p>
            </div>
          </div>
          {data.programChoice.estimatedTuitionAud && (
            <Badge variant="outline" className="font-mono text-[11px] bg-card text-foreground">
              AUD ${data.programChoice.estimatedTuitionAud.toLocaleString()}/yr
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
