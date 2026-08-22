import * as React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PermissionStateProps {
  title?: string;
  description?: string;
  returnHref?: string;
  returnLabel?: string;
  className?: string;
}

export function PermissionState({
  title = 'Access Restricted',
  description = 'You do not have the required permissions to view this resource. Contact an administrator for assistance.',
  returnHref = '/dashboard',
  returnLabel = 'Return to Dashboard',
  className,
}: PermissionStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-amber-500/20 bg-amber-500/5 min-h-[320px]', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold font-display text-foreground mb-1.5">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-6">
        {description}
      </p>
      <Button asChild size="sm" variant="outline" className="gap-2 border-amber-500/30 hover:bg-amber-500/10 text-foreground">
        <Link href={returnHref}>
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{returnLabel}</span>
        </Link>
      </Button>
    </div>
  );
}
