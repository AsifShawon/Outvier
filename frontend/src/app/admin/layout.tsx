'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { authApi } from '@/lib/api/auth.api';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Sidebar Container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <AdminSidebar onClose={() => setIsMobileOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Topbar */}
        <header className="lg:hidden flex h-16 items-center gap-4 px-4 border-b border-border bg-card shrink-0">
          <button 
            className="p-2 -ml-2 text-foreground/70 hover:text-primary"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="font-display font-semibold text-lg text-foreground">Admin Panel</div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
