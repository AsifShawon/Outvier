'use client';

import { useState } from 'react';
import { ApplicationWorkspaceItem, WorkspaceTask, applicationWorkspaceApi } from '@/lib/api/applicationWorkspace.api';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  ListTodo,
  Loader2,
} from 'lucide-react';
import { format, isBefore, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TaskTimelineSectionProps {
  application: ApplicationWorkspaceItem;
  onUpdate?: () => void;
}

export function TaskTimelineSection({ application, onUpdate }: TaskTimelineSectionProps) {
  const [tasks, setTasks] = useState<WorkspaceTask[]>(application.tasks || []);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'document' | 'form' | 'fee' | 'interview' | 'visa' | 'general'>('general');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    const updated = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            completed: !currentCompleted,
            completedAt: !currentCompleted ? new Date().toISOString() : undefined,
          }
        : t
    );
    setTasks(updated);

    try {
      await applicationWorkspaceApi.updateTasks(application._id, updated);
      toast.success(!currentCompleted ? 'Task completed! 🎉' : 'Task reopened');
      if (onUpdate) onUpdate();
    } catch {
      toast.error('Failed to update task');
      setTasks(tasks);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: WorkspaceTask = {
      id: `task_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      dueDate: newDueDate || undefined,
      completed: false,
      assignedToRole: 'student',
      order: tasks.length,
      createdAt: new Date().toISOString(),
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    setIsSaving(true);

    try {
      await applicationWorkspaceApi.updateTasks(application._id, updated);
      toast.success('Task added! 📋');
      setNewTitle('');
      setNewDueDate('');
      setIsAdding(false);
      if (onUpdate) onUpdate();
    } catch {
      toast.error('Failed to save task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);

    try {
      await applicationWorkspaceApi.updateTasks(application._id, updated);
      toast.success('Task removed');
      if (onUpdate) onUpdate();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-primary" />
            Task Timeline & Milestones
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedCount} of {tasks.length} tasks completed ({tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium transition-all',
                filter === 'all' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium transition-all',
                filter === 'pending' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Pending ({tasks.length - completedCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium transition-all',
                filter === 'completed' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Done ({completedCount})
            </button>
          </div>

          <Button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            size="sm"
            variant="outline"
            className="text-xs gap-1.5 h-8 bg-background"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <form onSubmit={handleAddTask} className="p-4 rounded-xl bg-background border border-border space-y-3 animate-in fade-in duration-200">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Task Description *</Label>
            <Input
              placeholder="e.g. Schedule biometrics appointment or pay university deposit"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="text-xs h-8"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Category</Label>
              <Select
                value={newCategory}
                onValueChange={(val: any) => setNewCategory(val)}
              >
                <SelectTrigger className="h-8 text-xs bg-card">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document" className="text-xs">Document</SelectItem>
                  <SelectItem value="form" className="text-xs">Form / Application</SelectItem>
                  <SelectItem value="fee" className="text-xs">Payment / Deposit</SelectItem>
                  <SelectItem value="interview" className="text-xs">Interview</SelectItem>
                  <SelectItem value="visa" className="text-xs">Visa Milestone</SelectItem>
                  <SelectItem value="general" className="text-xs">General Task</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Priority</Label>
              <Select
                value={newPriority}
                onValueChange={(val: any) => setNewPriority(val)}
              >
                <SelectTrigger className="h-8 text-xs bg-card">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="text-xs">Low</SelectItem>
                  <SelectItem value="medium" className="text-xs">Medium</SelectItem>
                  <SelectItem value="high" className="text-xs">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Due Date</Label>
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="text-xs h-8 bg-card"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(false)}
              className="text-xs h-7"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving || !newTitle.trim()}
              className="text-xs h-7 gap-1"
            >
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Save Task
            </Button>
          </div>
        </form>
      )}

      {/* Task Items List */}
      {filteredTasks.length === 0 ? (
        <p className="text-xs text-muted-foreground italic p-4 bg-muted/20 rounded-xl text-center">
          No tasks found for this view.
        </p>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const isOverdue = task.dueDate && !task.completed && isBefore(new Date(task.dueDate), new Date());
            return (
              <div
                key={task.id}
                className={cn(
                  'p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all',
                  task.completed
                    ? 'bg-muted/30 border-border/60 opacity-70'
                    : 'bg-background border-border hover:border-primary/30'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Checkbox
                    id={`task_${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => handleToggleTask(task.id, task.completed)}
                    className="h-4 w-4"
                  />
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'font-semibold text-foreground truncate',
                        task.completed && 'line-through text-muted-foreground'
                      )}
                    >
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <Badge variant="outline" className="text-[9px] capitalize px-1 py-0 h-4 bg-muted">
                        {task.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px] uppercase px-1 py-0 h-4 font-semibold',
                          task.priority === 'high' ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                        )}
                      >
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <span className={cn('flex items-center gap-1 font-mono', isOverdue && 'text-red-500 font-bold')}>
                          <Calendar className="h-2.5 w-2.5" />
                          {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => handleDeleteTask(task.id)}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
