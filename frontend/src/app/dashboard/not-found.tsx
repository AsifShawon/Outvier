import Link from 'next/link';
import { Layers, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
      <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border shadow-xl text-center space-y-5">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Layers className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-foreground">Application Not Found</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The application workspace draft or record could not be found or has been deleted.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/dashboard/tracker">
            <Button className="h-9 text-xs font-bold gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Application Tracker</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
