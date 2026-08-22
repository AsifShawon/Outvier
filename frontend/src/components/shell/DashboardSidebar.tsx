'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NavGroup, NavItem } from './navConfig';

interface DashboardSidebarProps {
  groups: NavGroup[];
  brandTitle?: string;
  brandSubtitle?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export function DashboardSidebar({
  groups,
  brandTitle = 'Outvier',
  brandSubtitle = 'Higher Ed Matrix',
  isCollapsed,
  onToggleCollapse,
  className,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  // Auto-expand parent menus if a child is active
  useEffect(() => {
    groups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.items && item.items.some((sub) => sub.href === pathname)) {
          setOpenSubMenus((prev) => ({ ...prev, [item.title]: true }));
        }
      });
    });
  }, [pathname, groups]);

  const toggleSubMenu = (title: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isItemActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    if (item.href && pathname.startsWith(item.href) && item.href !== '/admin' && item.href !== '/dashboard') {
      return true;
    }
    if (item.items) {
      return item.items.some((sub) => sub.exact ? pathname === sub.href : pathname.startsWith(sub.href));
    }
    return pathname === item.href;
  };

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        aria-label="Dashboard Sidebar"
        className={cn(
          'hidden lg:flex flex-col flex-shrink-0 z-30 border-r border-border bg-sidebar transition-all duration-300 select-none relative',
          isCollapsed ? 'w-[72px]' : 'w-[248px]',
          className
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/80">
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1"
            aria-label="Go to Outvier Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
              <Globe className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold font-display tracking-tight text-foreground truncate">
                  {brandTitle}
                </span>
                <span className="text-[10px] text-muted-foreground truncate uppercase tracking-widest font-semibold">
                  {brandSubtitle}
                </span>
              </div>
            )}
          </Link>

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation Content */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6 scrollbar-none" aria-label="Main Navigation">
          {groups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              {!isCollapsed && group.label && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                  {group.label}
                </p>
              )}

              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                const active = isItemActive(item);
                const hasChildren = item.items && item.items.length > 0;
                const isOpen = openSubMenus[item.title];

                if (isCollapsed) {
                  return (
                    <Tooltip key={iIdx}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href || (item.items ? item.items[0].href : '#')}
                          className={cn(
                            'flex h-10 w-10 mx-auto items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary',
                            active
                              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                          aria-label={item.title}
                        >
                          <Icon className="h-5 w-5" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-popover text-popover-foreground border-border text-xs font-medium">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <div key={iIdx} className="space-y-1">
                    {hasChildren ? (
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleSubMenu(item.title)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group focus-visible:ring-2 focus-visible:ring-primary',
                            active
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                          )}
                          aria-expanded={isOpen}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                            <span>{item.title}</span>
                          </div>
                          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200 text-muted-foreground', isOpen && 'rotate-180')} />
                        </button>

                        {isOpen && (
                          <div className="pl-9 pr-2 py-1 space-y-1">
                            {item.items!.map((sub, sIdx) => {
                              const subActive = sub.exact ? pathname === sub.href : pathname.startsWith(sub.href);
                              return (
                                <Link
                                  key={sIdx}
                                  href={sub.href}
                                  className={cn(
                                    'block px-2.5 py-1.5 rounded-lg text-xs transition-colors focus-visible:ring-2 focus-visible:ring-primary',
                                    subActive
                                      ? 'bg-primary/15 text-primary font-semibold'
                                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                  )}
                                >
                                  {sub.title}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href || '#'}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group focus-visible:ring-2 focus-visible:ring-primary',
                          active
                            ? 'bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/30'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn('h-4 w-4', active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                          <span>{item.title}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                            active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
