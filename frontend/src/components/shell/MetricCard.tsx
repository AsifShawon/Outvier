import * as React from 'react';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string | number;
    isPositive: boolean;
    label?: string;
  };
  variant?: 'default' | 'purple' | 'teal' | 'amber';
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: MetricCardProps) {
  const variantStyles = {
    default: 'bg-surface border-border hover:border-border/80',
    purple: 'bg-primary/5 border-primary/20 hover:border-primary/40',
    teal: 'bg-secondary/5 border-secondary/20 hover:border-secondary/40',
    amber: 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40',
  };

  const iconStyles = {
    default: 'bg-surface-elevated text-primary',
    purple: 'bg-primary text-primary-foreground shadow-md shadow-primary/20',
    teal: 'bg-secondary text-secondary-foreground shadow-md shadow-secondary/20',
    amber: 'bg-amber-500 text-black shadow-md shadow-amber-500/20',
  };

  return (
    <Card className={cn('relative overflow-hidden transition-all duration-200 shadow-sm rounded-2xl', variantStyles[variant], className)}>
      <CardContent className="p-5 flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
              {value}
            </span>
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-md',
                  trend.isPositive
                    ? 'bg-teal-500/10 text-teal-400'
                    : 'bg-rose-500/10 text-rose-400'
                )}
                aria-label={`${trend.isPositive ? 'Increased by' : 'Decreased by'} ${trend.value}`}
              >
                {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
