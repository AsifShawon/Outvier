'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useQuery } from '@tanstack/react-query';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  ChevronRight,
  Command,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authApi } from '@/lib/api/auth.api';

interface DashboardTopbarProps {
  onOpenMobileMenu: () => void;
  userRole?: 'admin' | 'student';
}

const emptySubscribe = () => () => {};

export function DashboardTopbar({ onOpenMobileMenu, userRole }: DashboardTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const { data: user } = useQuery({
    queryKey: ['auth-me-topbar'],
    queryFn: async () => {
      const res = await authApi.getMe();
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const userName = user?.name || 'User';
  const userEmail = user?.email || 'user@outvier.com';

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    router.push('/login');
  };

  // Generate dynamic breadcrumb segments
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const formatted = segment
      .replace(/-/g, ' ')
      .replace(/^\[.*\]$/, 'Detail')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { title: formatted, href, isLast: index === pathSegments.length - 1 };
  });

  return (
    <header className="sticky top-0 z-20 h-16 w-full border-b border-border bg-background/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile trigger & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="lg:hidden h-10 w-10 text-muted-foreground hover:text-foreground"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb Landmark */}
        <nav aria-label="Breadcrumbs" className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground truncate">
          <Link href={userRole === 'admin' ? '/admin' : '/dashboard'} className="hover:text-foreground transition-colors font-medium">
            {userRole === 'admin' ? 'Admin' : 'Portal'}
          </Link>
          {breadcrumbs.slice(1).map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-1.5 truncate">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              {crumb.isLast ? (
                <span className="font-semibold text-foreground truncate" aria-current="page">
                  {crumb.title}
                </span>
              ) : (
                <Link href={crumb.href} className="hover:text-foreground transition-colors truncate">
                  {crumb.title}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right: Quick actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Trigger global search or open compare modal
            const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
            if (searchInput) searchInput.focus();
          }}
          className="hidden md:flex items-center gap-2 h-9 px-3 text-xs text-muted-foreground border-border bg-surface hover:text-foreground hover:bg-surface-elevated"
          aria-label="Quick search"
        >
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Search resources...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground relative"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-3 bg-popover border-border text-popover-foreground">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/80">
              <span className="text-xs font-bold text-foreground">Notifications</span>
              <span className="text-[10px] text-primary font-semibold">Mark all read</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-lg bg-surface-elevated border border-border/50">
                <p className="font-semibold text-foreground">CRICOS Sync Completed</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">38 institution records verified and staged.</p>
              </div>
              <div className="p-2 rounded-lg bg-surface-elevated border border-border/50">
                <p className="font-semibold text-foreground">Application Deadline Approaching</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">UNSW Term 3 application closes in 12 days.</p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 gap-2 pl-2 pr-3 rounded-xl border border-border/60 hover:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="User account menu"
            >
              <div className="h-6 w-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-foreground max-w-[120px] truncate">
                {userName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1.5 bg-popover border-border text-popover-foreground shadow-xl rounded-2xl">
            <DropdownMenuLabel className="p-2">
              <p className="text-xs font-bold text-foreground truncate">{userName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild>
              <Link href={userRole === 'admin' ? '/admin' : '/dashboard/profile'} className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded-lg">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Account Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive p-2 rounded-lg"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
