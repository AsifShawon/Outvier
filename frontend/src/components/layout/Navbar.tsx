'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Globe, BarChart2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { useComparison } from '@/context/ComparisonContext';
import { authApi } from '@/lib/api/auth.api';
import { User, LogIn, LayoutDashboard } from 'lucide-react';

const navLinks = [
  { href: '/universities', label: 'Universities' },
  { href: '/programs', label: 'Programs' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Add safe fallback for comparison context
  let compareCount = 0;
  try {
    const comparisonContext = useComparison();
    compareCount = comparisonContext?.selectedIds?.length || 0;
  } catch {
    // Context might not be available everywhere, fail gracefully
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: userData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe().then((r) => r.data.data),
    retry: false,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('outvier_token'),
  });

  const user = userData;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 group-hover:shadow-blue-600/40 transition-all duration-300">
              <Globe className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
              Out<span className="text-blue-600 dark:text-blue-400">vier</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200',
                  pathname.startsWith(link.href)
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/compare" className="relative group">
               <Button variant="outline" className="h-10 rounded-full border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 gap-2 hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400">
                 <BarChart2 className="w-4 h-4" /> Compare
               </Button>
               {mounted && compareCount > 0 && (
                 <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                   {compareCount}
                 </span>
               )}
            </Link>

            <Link href="/programs">
              <Button className="h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 hidden lg:flex shadow-md shadow-blue-600/20">
                Explore Programs
              </Button>
            </Link>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 hidden lg:block" />

            {!mounted ? (
              <div className="h-10 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full" />
            ) : isLoading ? (
              <div className="h-10 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full" />
            ) : user ? (
              <Link href={user.role === 'admin' ? '/admin' : '/dashboard'}>
                <Button variant="ghost" className="h-10 px-4 gap-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                     {user?.name?.charAt(0)}
                  </div>
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                     {user?.name?.split(' ')[0] || 'User'}
                  </span>
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="ghost" className="h-10 rounded-full gap-2 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden py-6 border-t border-slate-100 dark:border-slate-800 animate-fade-in space-y-4">
            <div className="flex flex-col gap-2 px-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center px-4 py-3 rounded-xl text-base font-semibold transition-colors',
                    pathname.startsWith(link.href)
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />
            
            <div className="px-4 space-y-3">
               <Link href="/compare" onClick={() => setMobileOpen(false)} className="block">
                 <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 justify-start px-4">
                   <BarChart2 className="w-5 h-5 mr-3 text-slate-400" /> Compare
                   {mounted && compareCount > 0 && (
                     <Badge className="ml-auto bg-blue-600">{compareCount}</Badge>
                   )}
                 </Button>
               </Link>

              {!mounted ? (
                <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
              ) : user ? (
                <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setMobileOpen(false)} className="block">
                  <Button variant="secondary" className="w-full h-12 rounded-xl justify-start px-4">
                     {user.role === 'admin' ? <LayoutDashboard className="h-5 w-5 mr-3 text-slate-400" /> : <User className="h-5 w-5 mr-3 text-slate-400" />}
                     {user?.name || 'Dashboard'}
                  </Button>
                </Link>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="block">
                  <Button className="w-full h-12 rounded-xl bg-blue-600 text-white justify-start px-4">
                    <LogIn className="h-5 w-5 mr-3" /> Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
