'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const errorId = error.digest || `err_${Date.now().toString(36)}`;

  useEffect(() => {
    // Report error to client telemetry / console
    console.error('Unhandled Application Error:', error);
  }, [error]);

  const copyErrorDetails = () => {
    navigator.clipboard.writeText(`Error ID: ${errorId}\nMessage: ${error.message}\nStack: ${error.stack}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border shadow-xl text-center space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black font-display tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            An unexpected error occurred while loading this page. Our team has been notified.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-muted/60 border border-border text-[11px] font-mono text-muted-foreground flex items-center justify-between">
          <span className="truncate max-w-[240px]">Ref: {errorId}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={copyErrorDetails}
            className="h-6 text-[10px] px-2 gap-1"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            type="button"
            onClick={() => reset()}
            className="w-full h-10 text-xs font-bold gap-2 rounded-xl"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>

          <Link href="/" className="w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 text-xs font-semibold gap-2 rounded-xl"
            >
              <Home className="h-4 w-4" />
              <span>Go to Homepage</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
