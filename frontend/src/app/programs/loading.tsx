import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonCard } from '@/components/ui-custom/SkeletonCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function ProgramsLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pb-24">
        {/* Hero Skeleton */}
        <div className="bg-muted/30 border-b border-border py-12">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-10 w-96 rounded-xl" />
            <Skeleton className="h-4 w-72 rounded-lg" />
            <Skeleton className="h-12 w-full max-w-3xl rounded-2xl mt-4" />
          </div>
        </div>

        {/* Controls Bar Skeleton */}
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-44 rounded-xl" />
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
