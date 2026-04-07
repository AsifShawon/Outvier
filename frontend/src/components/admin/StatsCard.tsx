import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: { value: number; positive: boolean };
  colorClass?: string;
}

export function StatsCard({ title, value, icon: Icon, description, colorClass = 'bg-primary/10 text-primary' }: StatsCardProps) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colorClass)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="text-3xl font-bold font-display mb-1">{value}</div>
        <div className="font-medium text-sm">{title}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        )}
      </CardContent>
    </Card>
  );
}
