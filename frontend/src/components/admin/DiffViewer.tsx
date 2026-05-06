'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DiffValue {
  old: any;
  new: any;
}

interface DiffViewerProps {
  diff?: Record<string, DiffValue>;
  oldValue?: Record<string, any>;
  newValue: Record<string, any>;
}

export function DiffViewer({ diff, oldValue, newValue }: DiffViewerProps) {
  // If we have a structured diff, show it field-by-field
  if (diff && Object.keys(diff).length > 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Field Changes</h4>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(diff).map(([field, { old, new: n }]) => (
            <div key={field} className="group flex flex-col border border-border/40 rounded-xl overflow-hidden bg-card/50">
              <div className="bg-muted/30 px-3 py-1.5 border-b border-border/30 flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-muted-foreground capitalize">
                  {field.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
                <Badge variant="outline" className="text-[9px] h-4 bg-amber-500/5 text-amber-500 border-amber-500/20">Changed</Badge>
              </div>
              <div className="grid grid-cols-2 divide-x divide-border/30">
                <div className="p-3 bg-red-500/[0.02]">
                  <span className="text-[9px] font-bold text-red-400 uppercase tracking-tight block mb-1">Old</span>
                  <div className="text-xs text-red-300 line-through opacity-70 break-all font-mono">
                    {formatValue(old)}
                  </div>
                </div>
                <div className="p-3 bg-emerald-500/[0.02]">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tight block mb-1">New</span>
                  <div className="text-xs text-emerald-300 font-bold break-all font-mono">
                    {formatValue(n)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If it's a create (no diff), just show new value in a nice way
  if (!oldValue || Object.keys(oldValue).length === 0) {
     return (
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">New Record Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(newValue).map(([field, val]) => (
            <div key={field} className="flex flex-col border border-border/40 rounded-xl p-3 bg-emerald-500/[0.02]">
              <span className="text-[10px] font-mono text-muted-foreground capitalize mb-1">
                {field.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </span>
              <div className="text-xs text-emerald-300 font-bold break-all font-mono">
                {formatValue(val)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback to raw JSON comparison if no structured diff provided
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Original Record</span>
        <pre className="text-[10px] bg-red-500/5 border border-red-500/20 rounded-xl p-4 overflow-auto max-h-80 text-red-300 font-mono">
          {JSON.stringify(oldValue, null, 2)}
        </pre>
      </div>
      <div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Proposed Record</span>
        <pre className="text-[10px] bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 overflow-auto max-h-80 text-emerald-300 font-mono">
          {JSON.stringify(newValue, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}
