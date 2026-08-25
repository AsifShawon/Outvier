import { Skeleton } from '@/components/ui/skeleton';

export default function RootLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="h-16 border-b border-border bg-card/50 flex items-center justify-between px-6">
        <Skeleton className="h-7 w-28 rounded-lg" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
      <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="space-y-2 max-w-xl">
          <Skeleton className="h-10 w-3/4 rounded-xl" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-2/3 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
