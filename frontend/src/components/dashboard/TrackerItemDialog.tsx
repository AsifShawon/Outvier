'use client';

import { useState, useEffect } from 'react';
import { 
  ApplicationTrackerItem, 
  TrackerDocument, 
  TrackerTask,
  applicationTrackerApi 
} from '@/lib/api/applicationTracker.api';
import { universitiesApi } from '@/lib/api/universities.api';
import { programsApi } from '@/lib/api/programs.api';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Check, 
  ChevronsUpDown, 
  Search, 
  Link as LinkIcon,
  Calendar,
  Tag,
  Clock,
  ClipboardList,
  MessageSquare,
  History,
  Archive,
  ArrowRight,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TrackerItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: Partial<ApplicationTrackerItem> | null;
  columns: { id: string, title: string }[];
  onSave: (data: any) => Promise<void>;
  onArchive?: (id: string, archived: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function TrackerItemDialog({ 
  isOpen, 
  onClose, 
  item, 
  columns, 
  onSave,
  onArchive,
  onDelete 
}: TrackerItemDialogProps) {
  const isEditing = !!item?._id;
  
  // Basic Info
  const [itemType, setItemType] = useState<'university' | 'program' | 'custom'>(item?.itemType || 'program');
  const [title, setTitle] = useState(item?.title || '');
  const [subtitle, setSubtitle] = useState(item?.subtitle || '');
  const [columnId, setColumnId] = useState(item?.columnId || (columns.length > 0 ? columns[0].id : ''));
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(item?.priority || 'medium');
  const [intake, setIntake] = useState(item?.intake || '');
  const [deadline, setDeadline] = useState(item?.deadline ? item.deadline.split('T')[0] : '');
  const [applicationUrl, setApplicationUrl] = useState(item?.applicationUrl || '');
  const [notes, setNotes] = useState(item?.notes || '');
  const [tags, setTags] = useState<string[]>(item?.tags || []);
  const [tagInput, setTagInput] = useState('');

  // IDs
  const [universityId, setUniversityId] = useState<string>(item?.universityId?._id || item?.universityId || '');
  const [programId, setProgramId] = useState<string>(item?.programId?._id || item?.programId || '');
  const [customUniversityName, setCustomUniversityName] = useState(item?.customUniversityName || '');
  const [customProgramName, setCustomProgramName] = useState(item?.customProgramName || '');

  // Search
  const [uniSearch, setUniSearch] = useState('');
  const [progSearch, setProgSearch] = useState('');
  const debouncedUniSearch = useDebounce(uniSearch, 300);
  const debouncedProgSearch = useDebounce(progSearch, 300);
  const [uniResults, setUniResults] = useState<any[]>([]);
  const [progResults, setProgResults] = useState<any[]>([]);
  const [isSearchingUnis, setIsSearchingUnis] = useState(false);
  const [isSearchingProgs, setIsSearchingProgs] = useState(false);

  // Checklists & Tasks
  const [checklist, setChecklist] = useState<TrackerDocument[]>(item?.documentChecklist || []);
  const [tasks, setTasks] = useState<TrackerTask[]>(item?.tasks || []);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newTaskItem, setNewTaskItem] = useState('');

  // UI Tabs
  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'tasks' | 'history'>('details');

  useEffect(() => {
    if (isOpen) {
      setItemType(item?.itemType || 'program');
      setTitle(item?.title || '');
      setSubtitle(item?.subtitle || '');
      setColumnId(item?.columnId || (columns.length > 0 ? columns[0].id : ''));
      setPriority(item?.priority || 'medium');
      setIntake(item?.intake || '');
      setDeadline(item?.deadline ? item.deadline.split('T')[0] : '');
      setApplicationUrl(item?.applicationUrl || '');
      setNotes(item?.notes || '');
      setTags(item?.tags || []);
      setChecklist(item?.documentChecklist || []);
      setTasks(item?.tasks || []);
      setUniversityId(item?.universityId?._id || item?.universityId || '');
      setProgramId(item?.programId?._id || item?.programId || '');
      setCustomUniversityName(item?.customUniversityName || '');
      setCustomProgramName(item?.customProgramName || '');
      setActiveTab('details');
    }
  }, [isOpen, item, columns]);

  useEffect(() => {
    if (debouncedUniSearch && itemType === 'university') {
      setIsSearchingUnis(true);
      universitiesApi.getAll({ search: debouncedUniSearch, limit: 10 })
        .then(res => setUniResults(res.data.data))
        .finally(() => setIsSearchingUnis(false));
    }
  }, [debouncedUniSearch, itemType]);

  useEffect(() => {
    if (debouncedProgSearch && itemType === 'program') {
      setIsSearchingProgs(true);
      programsApi.getAll({ search: debouncedProgSearch, limit: 10 })
        .then(res => setProgResults(res.data.data))
        .finally(() => setIsSearchingProgs(false));
    }
  }, [debouncedProgSearch, itemType]);

  const handleSave = async () => {
    if (!title && itemType === 'custom') {
      toast.error('Please enter a title');
      return;
    }

    const payload = {
      itemType,
      title: title || (itemType === 'program' ? customProgramName : customUniversityName),
      subtitle: subtitle || (itemType === 'program' ? customUniversityName : ''),
      columnId,
      priority,
      intake,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      applicationUrl,
      notes,
      tags,
      universityId: universityId || undefined,
      programId: programId || undefined,
      customUniversityName: customUniversityName || undefined,
      customProgramName: customProgramName || undefined,
      documentChecklist: checklist,
      tasks
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      toast.error('Failed to save tracker item');
    }
  };

  const addChecklistItem = () => {
    if (!newChecklistItem) return;
    setChecklist([...checklist, {
      id: `doc_${Date.now()}`,
      name: newChecklistItem,
      status: 'pending',
      updatedAt: new Date().toISOString()
    }]);
    setNewChecklistItem('');
  };

  const addTaskItem = () => {
    if (!newTaskItem) return;
    setTasks([...tasks, {
      id: `task_${Date.now()}`,
      title: newTaskItem,
      completed: false,
      createdAt: new Date().toISOString()
    }]);
    setNewTaskItem('');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput) {
      e.preventDefault();
      if (!tags.includes(tagInput)) {
        setTags([...tags, tagInput]);
      }
      setTagInput('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-3xl">
        <div className="bg-slate-900 text-white p-6 md:p-8 shrink-0">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <Badge className="bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-wider mb-2">
                {isEditing ? 'Edit Application' : 'New Application'}
              </Badge>
              <h2 className="text-3xl font-black font-display leading-tight">
                {isEditing ? (title || 'Application Details') : 'Add to Tracker'}
              </h2>
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white/40 hover:text-white hover:bg-white/10 rounded-xl h-9"
                  onClick={() => onArchive?.(item._id!, !item.archived)}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {item.archived ? 'Unarchive' : 'Archive'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white/40 hover:text-destructive hover:bg-destructive/10 rounded-xl h-9"
                  onClick={() => onDelete?.(item._id!)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-1 bg-white/5 p-1 rounded-2xl w-fit">
            {[
              { id: 'details', label: 'Details', icon: ClipboardList },
              { id: 'checklist', label: 'Documents', icon: FileText },
              { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
              { id: 'history', label: 'History', icon: History },
            ].map(tab => (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-xl h-9 px-4 text-xs font-bold transition-all",
                  activeTab === tab.id 
                    ? "bg-white text-slate-900 shadow-lg" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <tab.icon className="h-3.5 w-3.5 mr-2" />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white custom-scrollbar">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Application Type</Label>
                  <Select 
                    value={itemType} 
                    onValueChange={(v: any) => setItemType(v)}
                    disabled={isEditing}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="program" className="text-sm font-medium">Specific Program</SelectItem>
                      <SelectItem value="university" className="text-sm font-medium">General University</SelectItem>
                      <SelectItem value="custom" className="text-sm font-medium">Manual / Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {itemType === 'program' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Select Program</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between rounded-xl border-slate-200 h-11 font-medium bg-white"
                        >
                          {customProgramName || "Search programs..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-slate-200 shadow-xl" align="start">
                        <Command className="rounded-2xl">
                          <CommandInput 
                            placeholder="Type program name..." 
                            value={progSearch}
                            onValueChange={setProgSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No programs found.</CommandEmpty>
                            <CommandGroup>
                              {progResults.map((prog) => (
                                <CommandItem
                                  key={prog._id}
                                  onSelect={() => {
                                    setProgramId(prog._id);
                                    setUniversityId(prog.university?._id || prog.university);
                                    setCustomProgramName(prog.name);
                                    setCustomUniversityName(prog.universityName);
                                    setTitle(prog.name);
                                    setSubtitle(prog.universityName);
                                  }}
                                  className="text-sm font-medium"
                                >
                                  <div className="flex flex-col">
                                    <span>{prog.name}</span>
                                    <span className="text-[10px] text-slate-400">{prog.universityName}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {itemType === 'university' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Select University</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between rounded-xl border-slate-200 h-11 font-medium bg-white"
                        >
                          {customUniversityName || "Search universities..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-slate-200 shadow-xl" align="start">
                        <Command className="rounded-2xl">
                          <CommandInput 
                            placeholder="Type university name..." 
                            value={uniSearch}
                            onValueChange={setUniSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No universities found.</CommandEmpty>
                            <CommandGroup>
                              {uniResults.map((uni) => (
                                <CommandItem
                                  key={uni._id}
                                  onSelect={() => {
                                    setUniversityId(uni._id);
                                    setCustomUniversityName(uni.name);
                                    setTitle(uni.name);
                                    setSubtitle('General Application');
                                  }}
                                  className="text-sm font-medium"
                                >
                                  {uni.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {itemType === 'custom' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Application Title</Label>
                      <Input 
                        placeholder="e.g. Masters in AI" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="rounded-xl border-slate-200 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">University / Institution</Label>
                      <Input 
                        placeholder="e.g. Uni of Melbourne" 
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        className="rounded-xl border-slate-200 h-11"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Stage / Column</Label>
                    <Select value={columnId} onValueChange={setColumnId}>
                      <SelectTrigger className="rounded-xl border-slate-200 h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        {columns.map(col => (
                          <SelectItem key={col.id} value={col.id} className="text-sm font-medium">{col.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Priority</Label>
                    <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                      <SelectTrigger className="rounded-xl border-slate-200 h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        <SelectItem value="low" className="text-sm font-medium">Low</SelectItem>
                        <SelectItem value="medium" className="text-sm font-medium">Medium</SelectItem>
                        <SelectItem value="high" className="text-sm font-medium">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Intake</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Feb 2026" 
                        value={intake}
                        onChange={(e) => setIntake(e.target.value)}
                        className="rounded-xl border-slate-200 h-11 pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Deadline</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input 
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="rounded-xl border-slate-200 h-11 pl-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Application URL</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="https://university.portal/apply" 
                      value={applicationUrl}
                      onChange={(e) => setApplicationUrl(e.target.value)}
                      className="rounded-xl border-slate-200 h-11 pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(tag => (
                      <Badge key={tag} className="bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-full border-none px-3 py-1 text-[10px] font-bold gap-1">
                        {tag}
                        <Trash2 
                          className="h-3 w-3 cursor-pointer hover:text-destructive" 
                          onClick={() => setTags(tags.filter(t => t !== tag))} 
                        />
                      </Badge>
                    ))}
                  </div>
                  <Input 
                    placeholder="Add tag and press Enter..." 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="rounded-xl border-slate-200 h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Notes</Label>
                  <Textarea 
                    placeholder="Enter any additional details or notes..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-xl border-slate-200 min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. Statement of Purpose" 
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  className="rounded-xl border-slate-200 h-11"
                  onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                />
                <Button onClick={addChecklistItem} className="rounded-xl bg-slate-900 h-11 px-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {checklist.map((doc, idx) => (
                  <div key={doc.id || idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group">
                    <div className="flex items-center gap-4">
                      <Checkbox 
                        checked={doc.status === 'completed' || doc.status === 'verified'}
                        onCheckedChange={(checked) => {
                          const newChecklist = [...checklist];
                          newChecklist[idx].status = checked ? 'completed' : 'pending';
                          newChecklist[idx].updatedAt = new Date().toISOString();
                          setChecklist(newChecklist);
                        }}
                        className="rounded-md h-5 w-5 border-slate-300"
                      />
                      <span className={cn(
                        "text-sm font-bold",
                        (doc.status === 'completed' || doc.status === 'verified') ? "text-slate-400 line-through" : "text-slate-700"
                      )}>{doc.name}</span>
                    </div>
                    <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Select 
                        value={doc.status} 
                        onValueChange={(v: any) => {
                          const newChecklist = [...checklist];
                          newChecklist[idx].status = v;
                          newChecklist[idx].updatedAt = new Date().toISOString();
                          setChecklist(newChecklist);
                        }}
                      >
                        <SelectTrigger className="h-8 rounded-lg border-none bg-white/50 text-[10px] font-bold uppercase tracking-wider px-3 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          <SelectItem value="pending" className="text-xs font-bold uppercase">Pending</SelectItem>
                          <SelectItem value="uploaded" className="text-xs font-bold uppercase text-blue-600">Uploaded</SelectItem>
                          <SelectItem value="verified" className="text-xs font-bold uppercase text-green-600">Verified</SelectItem>
                          <SelectItem value="not_required" className="text-xs font-bold uppercase text-slate-400">Not Required</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setChecklist(checklist.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {checklist.length === 0 && (
                  <div className="py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                    <FileText className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400">No documents in checklist</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. Schedule entrance exam" 
                  value={newTaskItem}
                  onChange={(e) => setNewTaskItem(e.target.value)}
                  className="rounded-xl border-slate-200 h-11"
                  onKeyDown={(e) => e.key === 'Enter' && addTaskItem()}
                />
                <Button onClick={addTaskItem} className="rounded-xl bg-slate-900 h-11 px-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {tasks.map((task, idx) => (
                  <div key={task.id || idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group">
                    <div className="flex items-center gap-4">
                      <Checkbox 
                        checked={task.completed}
                        onCheckedChange={(checked) => {
                          const newTasks = [...tasks];
                          newTasks[idx].completed = !!checked;
                          setTasks(newTasks);
                        }}
                        className="rounded-md h-5 w-5 border-slate-300"
                      />
                      <span className={cn(
                        "text-sm font-bold",
                        task.completed ? "text-slate-400 line-through" : "text-slate-700"
                      )}>{task.title}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg text-slate-400 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setTasks(tasks.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                    <CheckCircle2 className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400">No tasks added yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="max-w-2xl mx-auto py-4">
              {item?.history && item.history.length > 0 ? (
                <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                  {item.history.slice().reverse().map((h, i) => (
                    <div key={i} className="relative pl-10">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-primary flex items-center justify-center z-10">
                        <History className="h-3 w-3 text-primary" />
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <div className="flex justify-between items-center mb-1">
                          <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary">
                            {h.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {format(new Date(h.updatedAt), 'MMM d, yyyy · HH:mm')}
                          </span>
                        </div>
                        {h.note && <p className="text-xs text-slate-600 font-medium">{h.note}</p>}
                        {(h.fromColumnId || h.toColumnId) && (
                          <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-400">
                            {columns.find(c => c.id === h.fromColumnId)?.title || 'Start'} 
                            <ArrowRight className="h-3 w-3" /> 
                            {columns.find(c => c.id === h.toColumnId)?.title}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                  <History className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm font-bold text-slate-400">No history available</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 shrink-0 rounded-b-3xl">
          <div className="flex justify-between w-full items-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden md:block">
              {isEditing ? `Created ${format(new Date(item.createdAt!), 'PPP')}` : 'Defining new board item'}
            </p>
            <div className="flex gap-3 w-full md:w-auto">
              <Button variant="ghost" onClick={onClose} className="flex-1 md:flex-none rounded-xl h-12 font-bold px-8">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1 md:flex-none rounded-xl bg-slate-900 hover:bg-slate-800 h-12 font-bold px-12 text-white shadow-xl shadow-slate-900/10">
                {isEditing ? 'Save Changes' : 'Create Item'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
