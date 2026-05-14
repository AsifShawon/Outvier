'use client';

import { useState, useEffect } from 'react';
import { ApplicationTrackerItem, TrackerDocument, TrackerTask, TrackerColumn } from '@/lib/api/applicationTracker.api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Archive, Trash2, ExternalLink, Calendar, Clock, MapPin, Tag,
  FileText, CheckCircle2, MessageSquare, History, Plus, X,
  ArrowRight, GraduationCap, Award, Plane, Wrench, ChevronDown, ChevronUp,
  Edit2, Check
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ApplicationDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: ApplicationTrackerItem | null;
  columns: TrackerColumn[];
  onSave: (data: any) => Promise<void>;
  onArchive: (id: string, archived: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMove: (id: string, columnId: string) => Promise<void>;
}

const TYPE_ICONS: Record<string, any> = {
  university: GraduationCap, program: GraduationCap, scholarship: Award, visa: Plane, custom: Wrench
};

const DOC_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-500' },
  preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-600' },
  uploaded: { label: 'Uploaded', color: 'bg-violet-100 text-violet-600' },
  submitted: { label: 'Submitted', color: 'bg-amber-100 text-amber-600' },
  verified: { label: 'Verified', color: 'bg-green-100 text-green-600' },
  completed: { label: 'Done', color: 'bg-green-100 text-green-600' },
  not_required: { label: 'N/A', color: 'bg-slate-100 text-slate-400' },
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: GraduationCap },
  { id: 'checklist', label: 'Checklist', icon: FileText },
  { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
  { id: 'notes', label: 'Notes', icon: MessageSquare },
  { id: 'timeline', label: 'Timeline', icon: History },
];

export function ApplicationDetailsDrawer({
  isOpen, onClose, item, columns, onSave, onArchive, onDelete, onMove
}: ApplicationDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);

  // Editable state
  const [checklist, setChecklist] = useState<TrackerDocument[]>([]);
  const [tasks, setTasks] = useState<TrackerTask[]>([]);
  const [notes, setNotes] = useState('');
  const [newDoc, setNewDoc] = useState('');
  const [newTask, setNewTask] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (item) {
      setChecklist(item.documentChecklist || []);
      setTasks(item.tasks || []);
      setNotes(item.notes || '');
      setActiveTab('overview');
      setEditingNotes(false);
    }
  }, [item?._id, isOpen]);

  if (!item) return null;

  const TypeIcon = TYPE_ICONS[item.itemType] || Wrench;
  const currentColumn = columns.find(c => c.id === item.columnId);
  const nextColumnIndex = columns.findIndex(c => c.id === item.columnId) + 1;
  const nextColumn = columns[nextColumnIndex];

  const completedDocs = checklist.filter(d => ['completed', 'verified', 'uploaded', 'submitted'].includes(d.status)).length;
  const completedTasks = tasks.filter(t => t.completed).length;

  const handleSaveChecklist = async () => {
    if (!item) return;
    setIsSaving(true);
    try { await onSave({ documentChecklist: checklist }); toast.success('Checklist saved'); }
    catch { toast.error('Failed to save checklist'); }
    finally { setIsSaving(false); }
  };

  const handleSaveTasks = async () => {
    if (!item) return;
    setIsSaving(true);
    try { await onSave({ tasks }); toast.success('Tasks saved'); }
    catch { toast.error('Failed to save tasks'); }
    finally { setIsSaving(false); }
  };

  const handleSaveNotes = async () => {
    if (!item) return;
    setIsSaving(true);
    try { await onSave({ notes }); toast.success('Notes saved'); setEditingNotes(false); }
    catch { toast.error('Failed to save notes'); }
    finally { setIsSaving(false); }
  };

  const handleMoveNext = async () => {
    if (!nextColumn || !item) return;
    setIsMoving(true);
    try { await onMove(item._id, nextColumn.id); toast.success(`Moved to ${nextColumn.title}`); }
    catch { toast.error('Failed to move'); }
    finally { setIsMoving(false); }
  };

  const deadlineDate = item.deadline ? new Date(item.deadline) : null;
  const isOverdue = deadlineDate && deadlineDate < new Date() && !item.archived;

  return (
    <Sheet open={isOpen} onOpenChange={o => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 overflow-hidden flex flex-col border-l border-slate-200"
      >
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-5 pt-5 pb-0 shrink-0">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className={cn(
                'p-2 rounded-xl shrink-0',
                item.itemType === 'scholarship' ? 'bg-amber-50 text-amber-600' :
                item.itemType === 'visa' ? 'bg-sky-50 text-sky-600' :
                item.itemType === 'program' ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600'
              )}>
                <TypeIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-black text-lg text-slate-900 leading-tight line-clamp-2">{item.title}</h2>
                {item.subtitle && <p className="text-sm text-slate-400 font-medium mt-0.5 truncate">{item.subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {item.applicationUrl && (
                <a href={item.applicationUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              )}
              <Button variant="ghost" size="icon"
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-amber-600"
                onClick={() => onArchive(item._id, !item.archived)}>
                <Archive className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon"
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500"
                onClick={() => { if (confirm('Delete this application?')) onDelete(item._id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {item.country && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                <MapPin className="h-3 w-3" /> {item.country}
              </span>
            )}
            {item.intake && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                <Clock className="h-3 w-3" /> {item.intake}
              </span>
            )}
            {deadlineDate && (
              <span className={cn(
                'flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full',
                isOverdue ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'
              )}>
                <Calendar className="h-3 w-3" />
                {format(deadlineDate, 'MMM d, yyyy')}
                {isOverdue && ' · Overdue'}
              </span>
            )}
            <span className={cn(
              'text-[11px] font-bold px-2 py-0.5 rounded-full',
              item.priority === 'high' ? 'bg-red-50 text-red-600' :
              item.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
            )}>
              {item.priority} priority
            </span>
          </div>

          {/* Move to next stage */}
          {nextColumn && !item.archived && (
            <div className="flex items-center gap-2 pb-3">
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                <span className="font-bold text-slate-600">{currentColumn?.title || 'Current'}</span>
                <ArrowRight className="h-3 w-3" />
                <span>{nextColumn.title}</span>
              </div>
              <Button
                onClick={handleMoveNext}
                disabled={isMoving}
                size="sm"
                className="ml-auto rounded-xl bg-primary hover:bg-primary/90 h-8 px-4 text-[11px] font-bold text-white"
              >
                Move to {nextColumn.title}
              </Button>
            </div>
          )}

          {/* Move to any stage */}
          {!item.archived && (
            <div className="flex items-center gap-2 pb-3">
              <Select value={item.columnId} onValueChange={async (v) => {
                if (!v) return;
                await onMove(item._id, v);
                toast.success(`Moved to ${columns.find(c => c.id === v)?.title}`);
              }}>
                <SelectTrigger className="h-8 rounded-xl border-slate-200 text-[11px] font-bold text-slate-500 w-full">
                  <span className="text-slate-400 mr-1">Stage:</span> <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {columns.map(col => <SelectItem key={col.id} value={col.id} className="text-sm">{col.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-slate-100 -mx-5 px-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-bold whitespace-nowrap border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth: 'thin' }}>
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Type', value: item.itemType },
                  { label: 'Stage', value: currentColumn?.title || item.columnId },
                  { label: 'Country', value: item.country || '—' },
                  { label: 'Intake', value: item.intake || '—' },
                  { label: 'Deadline', value: deadlineDate ? format(deadlineDate, 'MMM d, yyyy') : '—' },
                  { label: 'Priority', value: item.priority },
                ].map(field => (
                  <div key={field.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{field.label}</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5 capitalize">{field.value}</p>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Progress</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-600">Documents</span>
                    <span className="font-bold text-slate-900">{completedDocs}/{checklist.length}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full">
                    <div className="h-full bg-primary rounded-full" style={{ width: checklist.length > 0 ? `${(completedDocs / checklist.length) * 100}%` : '0%' }} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-600">Tasks</span>
                    <span className="font-bold text-slate-900">{completedTasks}/{tasks.length}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: tasks.length > 0 ? `${(completedTasks / tasks.length) * 100}%` : '0%' }} />
                  </div>
                </div>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map(tag => (
                    <Badge key={tag} className="bg-slate-100 text-slate-600 border-none rounded-full text-[11px]">{tag}</Badge>
                  ))}
                </div>
              )}

              {item.archived && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2">
                  <Archive className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-sm font-medium text-amber-700">This application is archived</p>
                  <Button size="sm" variant="ghost" onClick={() => onArchive(item._id, false)}
                    className="ml-auto text-[11px] font-bold text-amber-700 hover:bg-amber-100 rounded-lg h-7">
                    Restore
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Checklist */}
          {activeTab === 'checklist' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Add document..." value={newDoc}
                  onChange={e => setNewDoc(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newDoc) {
                      setChecklist([...checklist, { id: `doc_${Date.now()}`, name: newDoc, status: 'pending', updatedAt: new Date().toISOString() }]);
                      setNewDoc('');
                    }
                  }}
                  className="rounded-xl border-slate-200 h-10 text-sm" />
                <Button onClick={() => {
                  if (newDoc) {
                    setChecklist([...checklist, { id: `doc_${Date.now()}`, name: newDoc, status: 'pending', updatedAt: new Date().toISOString() }]);
                    setNewDoc('');
                  }
                }} className="rounded-xl h-10 bg-primary px-3 shrink-0"><Plus className="h-4 w-4" /></Button>
              </div>

              <div className="space-y-1.5">
                {checklist.map((doc, i) => {
                  const statusConfig = DOC_STATUS_CONFIG[doc.status] || DOC_STATUS_CONFIG.pending;
                  return (
                    <div key={doc.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group">
                      <Checkbox
                        checked={['completed', 'verified', 'uploaded', 'submitted'].includes(doc.status)}
                        onCheckedChange={checked => {
                          const updated = [...checklist];
                          updated[i] = { ...updated[i], status: checked ? 'completed' : 'pending', updatedAt: new Date().toISOString() };
                          setChecklist(updated);
                        }}
                        className="rounded h-4 w-4"
                      />
                      <span className={cn('flex-1 text-sm font-medium', ['completed', 'verified'].includes(doc.status) && 'line-through text-slate-400')}>
                        {doc.name}
                      </span>
                      <Select value={doc.status} onValueChange={v => {
                        const updated = [...checklist];
                        updated[i] = { ...updated[i], status: v as any, updatedAt: new Date().toISOString() };
                        setChecklist(updated);
                      }}>
                        <SelectTrigger className={cn('h-6 w-24 rounded-lg border-none text-[10px] font-bold px-2', statusConfig.color)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {Object.entries(DOC_STATUS_CONFIG).map(([val, cfg]) => (
                            <SelectItem key={val} value={val} className="text-xs">{cfg.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button onClick={() => setChecklist(checklist.filter((_, idx) => idx !== i))}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <Button onClick={handleSaveChecklist} disabled={isSaving} className="w-full rounded-xl bg-primary h-10 font-bold">
                {isSaving ? 'Saving...' : '✓ Save Checklist'}
              </Button>
            </div>
          )}

          {/* Tasks */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Add task..." value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newTask) {
                      setTasks([...tasks, { id: `task_${Date.now()}`, title: newTask, completed: false, createdAt: new Date().toISOString() }]);
                      setNewTask('');
                    }
                  }}
                  className="rounded-xl border-slate-200 h-10 text-sm" />
                <Button onClick={() => {
                  if (newTask) {
                    setTasks([...tasks, { id: `task_${Date.now()}`, title: newTask, completed: false, createdAt: new Date().toISOString() }]);
                    setNewTask('');
                  }
                }} className="rounded-xl h-10 bg-primary px-3 shrink-0"><Plus className="h-4 w-4" /></Button>
              </div>

              <div className="space-y-1.5">
                {tasks.map((task, i) => (
                  <div key={task.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={checked => {
                        const updated = [...tasks];
                        updated[i] = { ...updated[i], completed: !!checked };
                        setTasks(updated);
                      }}
                      className="rounded h-4 w-4"
                    />
                    <span className={cn('flex-1 text-sm font-medium', task.completed && 'line-through text-slate-400')}>
                      {task.title}
                    </span>
                    <button onClick={() => setTasks(tasks.filter((_, idx) => idx !== i))}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="py-10 text-center text-slate-300">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">No tasks yet</p>
                  </div>
                )}
              </div>

              <Button onClick={handleSaveTasks} disabled={isSaving} className="w-full rounded-xl bg-primary h-10 font-bold">
                {isSaving ? 'Saving...' : '✓ Save Tasks'}
              </Button>
            </div>
          )}

          {/* Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              {editingNotes ? (
                <>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={10}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Write notes, links, important info..."
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveNotes} disabled={isSaving} className="flex-1 rounded-xl bg-primary h-10 font-bold">
                      {isSaving ? 'Saving...' : '✓ Save Notes'}
                    </Button>
                    <Button variant="ghost" onClick={() => { setNotes(item.notes || ''); setEditingNotes(false); }}
                      className="rounded-xl h-10 font-bold">Cancel</Button>
                  </div>
                </>
              ) : (
                <div
                  onClick={() => setEditingNotes(true)}
                  className="min-h-[200px] p-4 rounded-xl border border-dashed border-slate-200 text-sm text-slate-600 leading-relaxed cursor-text hover:border-primary/30 hover:bg-slate-50/50 transition-colors whitespace-pre-wrap"
                >
                  {notes || <span className="text-slate-300">Click to add notes...</span>}
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              {item.history && item.history.length > 0 ? (
                <div className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                  {[...item.history].reverse().map((event, i) => (
                    <div key={i} className="relative pl-10">
                      <div className="absolute left-0 top-1 w-[30px] h-[30px] rounded-full bg-white border-2 border-slate-100 flex items-center justify-center z-10">
                        {event.type === 'moved' ? <ArrowRight className="h-3 w-3 text-primary" /> :
                         event.type === 'created' ? <Check className="h-3 w-3 text-green-500" /> :
                         event.type === 'archived' ? <Archive className="h-3 w-3 text-amber-500" /> :
                         <History className="h-3 w-3 text-slate-400" />}
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200 text-slate-500">
                            {event.type.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                            {formatDistanceToNow(new Date(event.updatedAt), { addSuffix: true })}
                          </span>
                        </div>
                        {event.note && <p className="text-xs text-slate-600 font-medium">{event.note}</p>}
                        {(event.fromColumnId || event.toColumnId) && (
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] font-bold text-slate-400">
                            <span>{columns.find(c => c.id === event.fromColumnId)?.title || 'Previous stage'}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="text-slate-600">{columns.find(c => c.id === event.toColumnId)?.title || event.toColumnId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-300">
                  <History className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">No history yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
