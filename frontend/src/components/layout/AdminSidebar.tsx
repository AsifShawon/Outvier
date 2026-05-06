'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  University,
  BookOpen,
  LogOut,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  GitCompare,
  Database,
  BarChart3,
  RefreshCw,
  ExternalLink,
  X,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NavItem {
  href?: string;
  label: string;
  icon: any;
  exact?: boolean;
  external?: boolean;
  divider?: boolean;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  // Core admin
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/universities', label: 'Universities', icon: University },
  { href: '/admin/programs', label: 'Programs', icon: BookOpen },
  { href: '/admin/rankings', label: 'Rankings', icon: GitCompare },
  { href: '/admin/scholarships', label: 'Scholarships', icon: GraduationCap },
  { href: '/admin/outcomes', label: 'Outcomes', icon: BarChart3 },
  
  // ── Data Pipeline ──────────────────────────────────────────────────────
  { divider: true, label: 'Data Pipeline', icon: null as any },
  { 
    label: 'CRICOS Sync', 
    icon: RefreshCw,
    children: [
      { href: '/admin/cricos', label: 'Overview', icon: LayoutDashboard, exact: true },
      { href: '/admin/cricos/provider-sync', label: 'Provider Sync', icon: RefreshCw },
      { href: '/admin/cricos/runs', label: 'Sync Runs', icon: Database },
      { href: '/admin/cricos/raw', label: 'Raw Data', icon: Search },
      { href: '/admin/cricos/inspect', label: 'Field Inspector', icon: Search },
    ]
  },
  { href: '/admin/staged-changes', label: 'Staged Changes', icon: GitCompare },
  
  // ── Insights ──────────────────────────────────────────────────────────
  { divider: true, label: 'Insights', icon: null as any },
  { href: 'http://localhost:3001', label: 'Analytics', icon: BarChart3, external: true },
];

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [openDropdowns, setOpenDropdowns] = useState<string[]>(['CRICOS Sync']);

  const toggleDropdown = (label: string) => {
    setOpenDropdowns(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label) 
        : [...prev, label]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('outvier_token');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <aside className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-sidebar-border flex items-center justify-between">
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
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item, idx) => {
          if (item.divider) {
            return (
              <div key={`divider-${idx}`} className="px-3 pt-4 pb-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                  {item.label}
                </p>
              </div>
            );
          }

          const isDropdown = !!item.children;
          const isExpanded = openDropdowns.includes(item.label);
          const isActive = item.href 
            ? (item.exact ? pathname === item.href : pathname.startsWith(item.href))
            : item.children?.some(child => pathname.startsWith(child.href!));

          const className = cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group w-full',
            isActive && !isDropdown
              ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          );

          const content = (
            <>
              {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
              <span className="flex-1 text-left">{item.label}</span>
              {isDropdown ? (
                isExpanded ? <ChevronDown className="h-3.5 w-3.5 opacity-50" /> : <ChevronRight className="h-3.5 w-3.5 opacity-50" />
              ) : (
                isActive && <ChevronRight className="h-3.5 w-3.5 opacity-70" />
              )}
              {item.external && <ExternalLink className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />}
            </>
          );

          return (
            <div key={idx} className="space-y-1">
              {isDropdown ? (
                <button onClick={() => toggleDropdown(item.label)} className={className}>
                  {content}
                </button>
              ) : item.external ? (
                <a 
                  href={item.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={className}
                >
                  {content}
                </a>
              ) : (
                <Link href={item.href!} className={className}>
                  {content}
                </Link>
              )}

              {isDropdown && isExpanded && (
                <div className="ml-4 pl-3 border-l border-sidebar-border space-y-1 mt-1">
                  {item.children!.map((child, cIdx) => {
                    const isChildActive = child.exact 
                      ? pathname === child.href 
                      : pathname.startsWith(child.href!);
                    
                    return (
                      <Link
                        key={cIdx}
                        href={child.href!}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                          isChildActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                        )}
                      >
                        {child.icon && <child.icon className="h-3.5 w-3.5 shrink-0" />}
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
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

