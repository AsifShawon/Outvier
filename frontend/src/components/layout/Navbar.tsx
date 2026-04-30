'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/universities', label: 'Universities' },
  { href: '/programs', label: 'Programs' },
];

import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth.api';
import { User, LogIn, LayoutDashboard } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-all duration-200">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display tracking-tight">
              Out<span className="text-primary">vier</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  pathname.startsWith(link.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {!mounted ? (
              <div className="h-8 w-20 bg-muted/20 animate-pulse rounded-lg" />
            ) : isLoading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded-lg" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link href={user.role === 'admin' ? '/admin' : '/dashboard'}>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-2 rounded-xl border-primary/20 hover:bg-primary/5">
                    {user.role === 'admin' ? (
                      <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-primary" />
                    )}
                    {user?.name?.split(' ')[0] || 'User'}
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm" className="h-8 text-xs gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden py-3 pb-4 border-t border-border/60 mt-0.5 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors',
                  pathname.startsWith(link.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!mounted ? (
              <div className="h-10 w-full bg-muted/20 animate-pulse rounded-xl mt-2" />
            ) : user ? (
              <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setMobileOpen(false)}>
                <Button variant="outline" size="sm" className="w-full mt-2 gap-2 rounded-xl">
                   {user.role === 'admin' ? <LayoutDashboard className="h-4 w-4" /> : <User className="h-4 w-4" />}
                   {user?.name || 'User'}
                </Button>
              </Link>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full mt-2 gap-2 rounded-xl bg-primary text-white">
                  <LogIn className="h-4 w-4" /> Sign In
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
