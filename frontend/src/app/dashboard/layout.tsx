'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { authApi } from '@/lib/api/auth.api';
import Link from 'next/link';
import { GraduationCap, User, Bookmark, BarChart2, LogOut, DollarSign } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
        if (res.data.data.role === 'user') {
          setIsAuthed(true);
        } else if (res.data.data.role === 'admin') {
          setIsAuthed(false);
          router.push('/admin');
        } else {
          setIsAuthed(false);
          router.push('/login');
        }
      } catch (err) {
        setIsAuthed(false);
        localStorage.removeItem('outvier_token');
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('outvier_token');
    router.push('/login');
  };

  if (isAuthed === null) {
    return (
      <div className="flex h-screen bg-slate-50">
        <div className="w-64 bg-white border-r p-6 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <main className="flex-1 p-8">
          <Skeleton className="h-8 w-60 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthed) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 text-blue-900">
            <GraduationCap className="h-6 w-6" />
            <span className="font-display font-bold text-xl tracking-tight">Outvier</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">Overview</span>
          </Link>
          <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">My Profile</span>
          </Link>
          <Link href="/dashboard/student-fit" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <BarChart2 className="h-4 w-4" />
            <span className="text-sm font-medium">Fit Score</span>
          </Link>
          <Link href="/dashboard/saved" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <Bookmark className="h-4 w-4" />
            <span className="text-sm font-medium">Saved Items</span>
          </Link>
          <Link href="/dashboard/tracker" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <BarChart2 className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Application Tracker</span>
          </Link>
          <Link href="/dashboard/budget" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium">Budget Calculator</span>
          </Link>
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Log out</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
