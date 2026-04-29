'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  University,
  BookOpen,
  Upload,
  LogOut,
  GraduationCap,
  ChevronRight,
  FileInput,
  GitCompare,
  Database,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const navItems = [
  // Core admin
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/universities', label: 'Universities', icon: University },
  { href: '/admin/programs', label: 'Programs', icon: BookOpen },
  // ── Data Pipeline ──────────────────────────────────────────────────────
  { divider: true, label: 'Data Pipeline' },
  { href: '/admin/imports', label: 'Seed Imports', icon: FileInput },
  { href: '/admin/data-sources', label: 'Data Sources', icon: Database },
  { href: '/admin/sync', label: 'Sync Jobs', icon: RefreshCw },
  { href: '/admin/staged-changes', label: 'Staged Changes', icon: GitCompare },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('outvier_token');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary shadow-lg shadow-sidebar-primary/25">
            <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-bold font-display">
              Out<span className="text-sidebar-primary">vier</span>
            </div>
            <div className="text-[10px] text-sidebar-foreground/50 font-medium">Admin Panel</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {(navItems as any[]).map((item, idx) => {
          if (item.divider) {
            return (
              <div key={`divider-${idx}`} className="px-3 pt-4 pb-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                  {item.label}
                </p>
              </div>
            );
          }
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-sidebar-border">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors mb-1"
        >
          <GraduationCap className="h-4 w-4 shrink-0" />
          View Site
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
