'use client';

import { useState, useEffect } from 'react';
import { TrackerBoard } from '@/lib/api/applicationTracker.api';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Settings, Eye, Layout, ClipboardList, CheckCircle2, Calendar } from 'lucide-react';

interface BoardSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  board: TrackerBoard | null;
  onSave: (settings: any) => Promise<void>;
}

export function BoardSettingsDialog({ 
  isOpen, 
  onClose, 
  board, 
  onSave 
}: BoardSettingsDialogProps) {
  const [settings, setSettings] = useState(board?.settings || {
    showDeadlines: true,
    showPriority: true,
    showDocuments: true,
    showTasks: true,
    compactMode: false
  });

  useEffect(() => {
    if (isOpen && board) {
      setSettings(board.settings);
    }
  }, [isOpen, board]);

  const handleSave = async () => {
    await onSave(settings);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-3xl p-6 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black font-display flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            Board Settings
          </DialogTitle>
          <DialogDescription>
            Customize your board view and data visibility.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-slate-400" />
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Show Deadlines</Label>
                <p className="text-[10px] text-slate-500 font-medium">Display intake and deadline dates on cards</p>
              </div>
            </div>
            <Checkbox 
              checked={settings.showDeadlines} 
              onCheckedChange={(v) => setSettings({ ...settings, showDeadlines: !!v })} 
              className="h-6 w-6 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-slate-400" />
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Show Priority</Label>
                <p className="text-[10px] text-slate-500 font-medium">Highlight card priority levels (Low/Med/High)</p>
              </div>
            </div>
            <Checkbox 
              checked={settings.showPriority} 
              onCheckedChange={(v) => setSettings({ ...settings, showPriority: !!v })} 
              className="h-6 w-6 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3">
              <Layout className="h-5 w-5 text-slate-400" />
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Compact Mode</Label>
                <p className="text-[10px] text-slate-500 font-medium">Reduce padding and font sizes for high density</p>
              </div>
            </div>
            <Checkbox 
              checked={settings.compactMode} 
              onCheckedChange={(v) => setSettings({ ...settings, compactMode: !!v })} 
              className="h-6 w-6 rounded-lg"
            />
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="ghost" onClick={onClose} className="rounded-xl h-11 font-bold">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className="rounded-xl bg-slate-900 hover:bg-slate-800 h-11 font-bold px-8 text-white"
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
