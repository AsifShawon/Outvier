'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Student Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
      <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border shadow-xl text-center space-y-5">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-foreground">Workspace Error</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We were unable to load your student applications or profile workspace.
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <Button onClick={() => reset()} className="flex-1 h-9 text-xs font-bold gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </Button>
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full h-9 text-xs font-semibold gap-1.5">
              <span>Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
