import { Skeleton } from '@/components/ui/skeleton';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function CompareLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-9 w-72 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>

        {/* Chart Skeleton */}
        <Skeleton className="h-72 w-full rounded-2xl" />

        {/* Matrix Table Skeleton */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
