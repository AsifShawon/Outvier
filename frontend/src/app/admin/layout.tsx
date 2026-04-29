'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { authApi } from '@/lib/api/auth.api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('outvier_token');
      if (!token) {
        setIsAuthed(false);
        router.push('/login');
        return;
      }
      try {
        const res = await authApi.getMe();
        if (res.data.data.role === 'admin') {
          setIsAuthed(true);
        } else {
          setIsAuthed(false);
          router.push('/dashboard');
        }
      } catch (err) {
        setIsAuthed(false);
        localStorage.removeItem('outvier_token');
        router.push('/login');
      }
    };
    checkAuth();
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
