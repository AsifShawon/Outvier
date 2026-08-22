'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DashboardSidebar } from './DashboardSidebar';
import { MobileSidebar } from './MobileSidebar';
import { DashboardTopbar } from './DashboardTopbar';
import { NavGroup } from './navConfig';

interface AppShellProps {
  children: React.ReactNode;
  navGroups: NavGroup[];
  userRole?: 'admin' | 'student';
  brandTitle?: string;
  brandSubtitle?: string;
  className?: string;
}

export function AppShell({
  children,
  navGroups,
  userRole = 'student',
  brandTitle = 'Outvier',
  brandSubtitle,
  className,
}: AppShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('outvier_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('outvier_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:shadow-xl focus:outline-none font-semibold text-sm transition-all"
      >
        Skip to main content
      </a>

      {/* Main Framework Layout */}
      <div className="flex flex-1 min-h-screen">
        {/* Desktop Collapsible Sidebar */}
        <DashboardSidebar
          groups={navGroups}
          brandTitle={brandTitle}
          brandSubtitle={brandSubtitle}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        {/* Mobile Navigation Drawer */}
        <MobileSidebar
          isOpen={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
          groups={navGroups}
          brandTitle={brandTitle}
          brandSubtitle={brandSubtitle}
        />

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* Sticky Topbar */}
          <DashboardTopbar
            onOpenMobileMenu={() => setIsMobileOpen(true)}
            userRole={userRole}
          />

          {/* Main Content Landmark */}
          <main
            id="main-content"
            tabIndex={-1}
            className={cn(
              'flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 outline-none',
              className
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
