'use client';

import { useState, useEffect } from 'react';
import { TrackerColumn } from '@/lib/api/applicationTracker.api';
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

interface TrackerColumnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  column: Partial<TrackerColumn> | null;
  onSave: (data: { title: string, color?: string }) => Promise<void>;
}

const PRESET_COLORS = [
  '#64748b', // Slate
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#71717a', // Zinc
];

export function TrackerColumnDialog({ 
  isOpen, 
  onClose, 
  column, 
  onSave 
}: TrackerColumnDialogProps) {
  const [title, setTitle] = useState(column?.title || '');
  const [color, setColor] = useState(column?.color || PRESET_COLORS[0]);

  useEffect(() => {
    if (isOpen) {
      setTitle(column?.title || '');
      setColor(column?.color || PRESET_COLORS[0]);
    }
  }, [isOpen, column]);

  const handleSave = async () => {
    if (!title) return;
    await onSave({ title, color });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-3xl p-6 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black font-display">
            {column?.id ? 'Edit Column' : 'New Column'}
          </DialogTitle>
          <DialogDescription>
            Customize your application stage title and color.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Column Title</Label>
            <Input 
              placeholder="e.g. Interviewing" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border-slate-200 h-12 font-bold"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Color Label</Label>
            <div className="flex flex-wrap gap-3">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-slate-900 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="ghost" onClick={onClose} className="rounded-xl h-11 font-bold">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className="rounded-xl bg-slate-900 hover:bg-slate-800 h-11 font-bold px-8 text-white"
            disabled={!title}
          >
            {column?.id ? 'Save Changes' : 'Create Column'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
