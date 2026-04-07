'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('outvier_token');
    if (!token) {
      router.push('/login');
      setIsAuthed(false);
    } else {
      setIsAuthed(true);
    }
  }, [router]);

  if (isAuthed === null) {
    return (
      <div className="flex h-screen">
        <div className="w-64 bg-sidebar border-r border-sidebar-border" />
        <main className="flex-1 p-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-60" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthed) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-8 bg-background">
        {children}
      </main>
    </div>
  );
}
