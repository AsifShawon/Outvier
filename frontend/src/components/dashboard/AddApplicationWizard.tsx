'use client';

import { useState, useEffect } from 'react';
import { TrackerColumn, applicationTrackerApi } from '@/lib/api/applicationTracker.api';
import { universitiesApi } from '@/lib/api/universities.api';
import { programsApi } from '@/lib/api/programs.api';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  GraduationCap, Award, Plane, Wrench, Plus, Trash2, Check,
  ChevronsUpDown, ChevronLeft, ChevronRight, Calendar, Clock, Link as LinkIcon, X
} from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AddApplicationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  columns: TrackerColumn[];
  defaultColumnId?: string;
  onSave: (data: any) => Promise<void>;
}

const ITEM_TYPES = [
  { id: 'program', label: 'Program', desc: 'Track a specific degree or course', icon: GraduationCap, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { id: 'university', label: 'University', desc: 'General university application', icon: GraduationCap, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'scholarship', label: 'Scholarship', desc: 'Scholarship or funding application', icon: Award, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'visa', label: 'Visa', desc: 'Student visa tasks and documents', icon: Plane, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { id: 'custom', label: 'Custom', desc: 'Any other task or application', icon: Wrench, color: 'text-slate-600 bg-slate-50 border-slate-200' },
] as const;

const DEFAULT_CHECKLISTS: Record<string, string[]> = {
  university: ['Passport (valid 6+ months)', 'Academic Transcript', 'Bachelor Certificate', 'CV / Resume', 'Statement of Purpose (SOP)', 'Recommendation Letter (×2)', 'English Test Result (IELTS/PTE)', 'Application Fee Payment'],
  program: ['Passport (valid 6+ months)', 'Academic Transcript', 'Bachelor Certificate', 'CV / Resume', 'Statement of Purpose (SOP)', 'Recommendation Letter (×2)', 'English Test Result (IELTS/PTE)', 'Application Fee Payment'],
  scholarship: ['Passport', 'Academic Transcript', 'Scholarship Application Form', 'Personal Statement / Essay', 'Recommendation Letter (×2)', 'Bank Statement / Financial Proof', 'English Test Result'],
  visa: ['Valid Passport', 'University Acceptance Letter', 'Visa Application Form', 'Financial Proof (Bank Statement)', 'Health Insurance (OSHC)', 'Biometrics / Medical Exam', 'Passport Photos', 'Visa Fee Payment'],
  custom: ['Application Form', 'Required Documents', 'Submission Confirmation'],
};

export function AddApplicationWizard({ isOpen, onClose, columns, defaultColumnId, onSave }: AddApplicationWizardProps) {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1
  const [itemType, setItemType] = useState<'university' | 'program' | 'scholarship' | 'visa' | 'custom'>('program');

  // Step 2
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [country, setCountry] = useState('');
  const [intake, setIntake] = useState('');
  const [deadline, setDeadline] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [columnId, setColumnId] = useState(defaultColumnId || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [universityId, setUniversityId] = useState('');
  const [programId, setProgramId] = useState('');
  const [customUniversityName, setCustomUniversityName] = useState('');
  const [customProgramName, setCustomProgramName] = useState('');
  const [uniSearch, setUniSearch] = useState('');
  const [progSearch, setProgSearch] = useState('');
  const debouncedUniSearch = useDebounce(uniSearch, 300);
  const debouncedProgSearch = useDebounce(progSearch, 300);
  const [uniResults, setUniResults] = useState<any[]>([]);
  const [progResults, setProgResults] = useState<any[]>([]);

  // Step 3
  const [checklist, setChecklist] = useState<string[]>([]);
  const [newDoc, setNewDoc] = useState('');

  // Step 4
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setItemType('program');
      setTitle(''); setSubtitle(''); setCountry(''); setIntake('');
      setDeadline(''); setApplicationUrl('');
      setColumnId(defaultColumnId || (columns[0]?.id || ''));
      setPriority('medium');
      setUniversityId(''); setProgramId('');
      setCustomUniversityName(''); setCustomProgramName('');
      setChecklist([]); setNotes(''); setTags([]);
    }
  }, [isOpen, defaultColumnId, columns]);

  useEffect(() => {
    if (step === 3 && checklist.length === 0) {
      setChecklist(DEFAULT_CHECKLISTS[itemType] || DEFAULT_CHECKLISTS.custom);
    }
  }, [step, itemType]);

  useEffect(() => {
    if (debouncedUniSearch && itemType === 'university') {
      universitiesApi.getAll({ search: debouncedUniSearch, limit: 8 })
        .then(res => setUniResults(res.data.data || []));
    }
  }, [debouncedUniSearch, itemType]);

  useEffect(() => {
    if (debouncedProgSearch && itemType === 'program') {
      programsApi.getAll({ search: debouncedProgSearch, limit: 8 })
        .then(res => setProgResults(res.data.data || []));
    }
  }, [debouncedProgSearch, itemType]);

  const handleSave = async () => {
    if (!title && itemType !== 'program' && itemType !== 'university') {
      toast.error('Please enter a title'); return;
    }
    if ((itemType === 'program' && !customProgramName) || (itemType === 'university' && !customUniversityName)) {
      toast.error('Please select or enter an application name'); return;
    }
    setIsSaving(true);
    try {
      await onSave({
        itemType,
        title: title || customProgramName || customUniversityName,
        subtitle: subtitle || customUniversityName || '',
        country, intake,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        applicationUrl, columnId, priority,
        universityId: universityId || undefined,
        programId: programId || undefined,
        customUniversityName: customUniversityName || undefined,
        customProgramName: customProgramName || undefined,
        notes, tags,
        documentChecklist: checklist.map((name, i) => ({
          id: `doc_${Date.now()}_${i}`, name, status: 'pending', updatedAt: new Date().toISOString()
        })),
      });
      onClose();
    } catch {
      toast.error('Failed to create application');
    } finally {
      setIsSaving(false);
    }
  };

  const STEPS = ['Type', 'Details', 'Documents', 'Notes'];

  return (
    <Dialog open={isOpen} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 border-none shadow-2xl rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Application</p>
              <h2 className="text-xl font-black text-white mt-0.5">
                {step === 1 ? 'What are you tracking?' : step === 2 ? 'Basic Details' : step === 3 ? 'Documents & Checklist' : 'Notes & Tags'}
              </h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Progress */}
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s} className={cn(
                'h-1 flex-1 rounded-full transition-all',
                i + 1 <= step ? 'bg-primary' : 'bg-white/10'
              )} />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {STEPS.map((s, i) => (
              <span key={s} className={cn(
                'text-[9px] font-bold uppercase tracking-wider',
                i + 1 === step ? 'text-primary' : 'text-slate-500'
              )}>{s}</span>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 bg-white min-h-[280px]">
          {/* Step 1: Type */}
          {step === 1 && (
            <div className="grid grid-cols-1 gap-2">
              {ITEM_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => { setItemType(type.id as any); setStep(2); }}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.01]',
                      itemType === type.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'
                    )}
                  >
                    <div className={cn('p-2.5 rounded-xl border', type.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{type.label}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{type.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 ml-auto" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Program search */}
              {itemType === 'program' && (
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Search Program</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between rounded-xl border-slate-200 h-11 font-medium bg-white">
                        {customProgramName || 'Search programs...'} <ChevronsUpDown className="h-4 w-4 opacity-40" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-slate-200 shadow-xl" align="start">
                      <Command className="rounded-2xl">
                        <CommandInput placeholder="Type program name..." value={progSearch} onValueChange={setProgSearch} />
                        <CommandList>
                          <CommandEmpty>No programs found. Enter manually below.</CommandEmpty>
                          <CommandGroup>
                            {progResults.map(prog => (
                              <CommandItem key={prog._id} onSelect={() => {
                                setProgramId(prog._id);
                                setUniversityId(prog.university?._id || prog.university);
                                setCustomProgramName(prog.name);
                                setCustomUniversityName(prog.universityName);
                                setTitle(prog.name);
                                setSubtitle(prog.universityName);
                                setCountry(prog.country || '');
                              }}>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{prog.name}</span>
                                  <span className="text-[10px] text-slate-400">{prog.universityName}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {!programId && (
                    <Input placeholder="Or type program name manually" value={customProgramName}
                      onChange={e => { setCustomProgramName(e.target.value); setTitle(e.target.value); }}
                      className="rounded-xl border-slate-200 h-11" />
                  )}
                </div>
              )}

              {/* University search */}
              {itemType === 'university' && (
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Search University</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between rounded-xl border-slate-200 h-11 font-medium bg-white">
                        {customUniversityName || 'Search universities...'} <ChevronsUpDown className="h-4 w-4 opacity-40" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-slate-200 shadow-xl" align="start">
                      <Command className="rounded-2xl">
                        <CommandInput placeholder="Type university name..." value={uniSearch} onValueChange={setUniSearch} />
                        <CommandList>
                          <CommandEmpty>No universities found. Enter manually below.</CommandEmpty>
                          <CommandGroup>
                            {uniResults.map(uni => (
                              <CommandItem key={uni._id} onSelect={() => {
                                setUniversityId(uni._id);
                                setCustomUniversityName(uni.name);
                                setTitle(uni.name);
                                setCountry(uni.country || '');
                              }}>
                                {uni.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {!universityId && (
                    <Input placeholder="Or type university name manually" value={customUniversityName}
                      onChange={e => { setCustomUniversityName(e.target.value); setTitle(e.target.value); }}
                      className="rounded-xl border-slate-200 h-11" />
                  )}
                </div>
              )}

              {/* Custom / Scholarship / Visa title */}
              {(itemType === 'custom' || itemType === 'scholarship' || itemType === 'visa') && (
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Title</Label>
                  <Input placeholder={itemType === 'scholarship' ? 'e.g. Australia Awards Scholarship' : itemType === 'visa' ? 'e.g. Student Visa (Subclass 500)' : 'e.g. Language Course Application'}
                    value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl border-slate-200 h-11" />
                </div>
              )}

              {(itemType === 'custom' || itemType === 'scholarship') && (
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">University / Institution (optional)</Label>
                  <Input placeholder="e.g. University of Melbourne" value={subtitle} onChange={e => setSubtitle(e.target.value)} className="rounded-xl border-slate-200 h-11" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Country</Label>
                  <Input placeholder="e.g. Australia" value={country} onChange={e => setCountry(e.target.value)} className="rounded-xl border-slate-200 h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Intake</Label>
                  <Input placeholder="Feb 2026" value={intake} onChange={e => setIntake(e.target.value)} className="rounded-xl border-slate-200 h-11" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Deadline</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="rounded-xl border-slate-200 h-11 pl-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Priority</Label>
                  <Select value={priority} onValueChange={v => setPriority(v as any)}>
                    <SelectTrigger className="rounded-xl border-slate-200 h-11"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="high">🔴 High</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="low">⚪ Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Stage</Label>
                  <Select value={columnId} onValueChange={(v) => v && setColumnId(v)}>
                    <SelectTrigger className="rounded-xl border-slate-200 h-11"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {columns.map(col => <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">App URL (optional)</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input placeholder="https://..." value={applicationUrl} onChange={e => setApplicationUrl(e.target.value)} className="rounded-xl border-slate-200 h-11 pl-9" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Checklist */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-400 font-medium">Review the auto-generated checklist. Add or remove items as needed.</p>
              <div className="flex gap-2">
                <Input placeholder="Add document..." value={newDoc} onChange={e => setNewDoc(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newDoc) { setChecklist([...checklist, newDoc]); setNewDoc(''); } }}
                  className="rounded-xl border-slate-200 h-10 text-sm" />
                <Button onClick={() => { if (newDoc) { setChecklist([...checklist, newDoc]); setNewDoc(''); } }}
                  className="rounded-xl bg-primary h-10 px-4 shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1.5 max-h-[240px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {checklist.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 group">
                    <div className="flex items-center gap-2.5">
                      <div className="h-4 w-4 rounded border-2 border-slate-300 shrink-0" />
                      <span className="text-sm font-medium text-slate-700">{doc}</span>
                    </div>
                    <button onClick={() => setChecklist(checklist.filter((_, idx) => idx !== i))}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all rounded">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Notes & Tags */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Notes (optional)</Label>
                <textarea
                  placeholder="Any additional notes, links, or reminders..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Tags</Label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map(tag => (
                    <Badge key={tag} className="bg-slate-100 text-slate-700 border-none rounded-full px-3 py-1 text-[11px] font-bold gap-1 hover:bg-slate-200">
                      {tag}
                      <button onClick={() => setTags(tags.filter(t => t !== tag))}><X className="h-2.5 w-2.5" /></button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add tag and press Enter..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && tagInput) {
                      e.preventDefault();
                      if (!tags.includes(tagInput)) setTags([...tags, tagInput]);
                      setTagInput('');
                    }
                  }}
                  className="rounded-xl border-slate-200 h-11"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="rounded-xl h-11 font-bold gap-2 text-slate-600">
            <ChevronLeft className="h-4 w-4" />
            {step > 1 ? 'Back' : 'Cancel'}
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 2 && !title && !customProgramName && !customUniversityName}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 h-11 px-8 font-bold text-white gap-2"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={isSaving}
              className="rounded-xl bg-primary hover:bg-primary/90 h-11 px-8 font-bold text-white gap-2 shadow-lg shadow-primary/20">
              {isSaving ? 'Creating...' : '✓ Create Application'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
