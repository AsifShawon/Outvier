'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { authApi } from '@/lib/api/auth.api';
import Link from 'next/link';
import { GraduationCap, User, Bookmark, BarChart2, LogOut, DollarSign, Menu, X, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isTabletCollapsed, setIsTabletCollapsed] = useState(false);

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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('outvier_token');
    router.push('/login');
  };

  if (isAuthed === null) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-64 bg-card border-r border-border p-6 space-y-4 hidden md:block">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <main className="flex-1 p-4 md:p-8">
          <Skeleton className="h-8 w-60 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthed) return null;

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/profile', label: 'My Profile', icon: User },
    // { href: '/dashboard/student-fit', label: 'Fit Score', icon: BarChart2 },
    { href: '/dashboard/saved', label: 'Saved Items', icon: Bookmark },
    { href: '/dashboard/tracker', label: 'Application Tracker', icon: BarChart2 },
    { href: '/dashboard/budget', label: 'Budget Calculator', icon: DollarSign },
  ];

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-muted/30">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out lg:static lg:translate-x-0",
        isMobileOpen ? "translate-x-0 w-[280px]" : "-translate-x-full w-[280px]",
        "lg:translate-x-0",
        isTabletCollapsed ? "lg:w-[80px]" : "lg:w-[280px]"
      )}>
        <div className="flex h-16 items-center justify-between px-4 md:px-6 border-b border-border/50">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <GraduationCap className="h-6 w-6 flex-shrink-0" />
            <span className={cn(
              "font-display font-bold text-xl tracking-tight transition-opacity duration-300",
              isTabletCollapsed ? "lg:opacity-0 lg:w-0 lg:hidden" : "opacity-100"
            )}>Outvier</span>
          </Link>
          <button 
            className="lg:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  title={isTabletCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                    isActive 
                      ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20" 
                      : "text-foreground/70 hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-primary-foreground" : "text-foreground/50 group-hover:text-primary"
                  )} />
                  <span className={cn(
                    "text-sm whitespace-nowrap transition-all duration-300",
                    isTabletCollapsed ? "lg:opacity-0 lg:w-0 lg:hidden" : "opacity-100"
                  )}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-border/50">
          {/* Toggle Button for Tablet/Desktop */}
          <button 
            onClick={() => setIsTabletCollapsed(!isTabletCollapsed)} 
            className="hidden lg:flex w-full items-center justify-center py-2 mb-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button 
            onClick={handleLogout} 
            title={isTabletCollapsed ? "Log out" : undefined}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-foreground/70 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors group"
          >
            <LogOut className="h-5 w-5 flex-shrink-0 text-foreground/50 group-hover:text-destructive" />
            <span className={cn(
              "text-sm font-medium whitespace-nowrap transition-all duration-300",
              isTabletCollapsed ? "lg:opacity-0 lg:w-0 lg:hidden" : "opacity-100"
            )}>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Topbar */}
        <header className="lg:hidden flex h-16 items-center gap-4 px-4 border-b border-border bg-card shrink-0">
          <button 
            className="p-2 -ml-2 text-foreground/70 hover:text-primary"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="font-display font-semibold text-lg text-foreground">Dashboard</div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
