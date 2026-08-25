import Link from 'next/link';
import { Search, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RootNotFound() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border shadow-xl text-center space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Search className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
            404 Error
          </span>
          <h1 className="text-2xl font-black font-display tracking-tight text-foreground">
            Page Not Found
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The page, degree course, or university record you are looking for may have been moved, renamed, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link href="/programs" className="w-full">
            <Button className="w-full h-10 text-xs font-bold gap-2 rounded-xl">
              <Search className="h-4 w-4" />
              <span>Explore Courses</span>
            </Button>
          </Link>

          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full h-10 text-xs font-semibold gap-2 rounded-xl">
              <Home className="h-4 w-4" />
              <span>Homepage</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
