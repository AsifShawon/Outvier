'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NavGroup, NavItem } from './navConfig';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  groups: NavGroup[];
  brandTitle?: string;
  brandSubtitle?: string;
}

export function MobileSidebar({
  isOpen,
  onClose,
  groups,
  brandTitle = 'Outvier',
  brandSubtitle = 'Higher Ed Matrix',
}: MobileSidebarProps) {
  const pathname = usePathname();
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="relative flex flex-col w-[280px] max-w-[85vw] h-full bg-sidebar border-r border-border shadow-2xl z-50"
        aria-label="Mobile Navigation Drawer"
      >
        {/* Drawer Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/80">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
            aria-label="Go to Outvier Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Globe className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold font-display tracking-tight text-foreground truncate">
                {brandTitle}
              </span>
              <span className="text-[10px] text-muted-foreground truncate uppercase tracking-widest font-semibold">
                {brandSubtitle}
              </span>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 text-muted-foreground hover:text-foreground"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Drawer Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6" aria-label="Mobile Links">
          {groups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              {group.label && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                  {group.label}
                </p>
              )}

              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                const active = isItemActive(item);
                const hasChildren = item.items && item.items.length > 0;
                const isOpen = openSubMenus[item.title];

                return (
                  <div key={iIdx} className="space-y-1">
                    {hasChildren ? (
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleSubMenu(item.title)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 min-h-[44px] rounded-xl text-sm font-semibold transition-all group focus-visible:ring-2 focus-visible:ring-primary',
                            active
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                          )}
                          aria-expanded={isOpen}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={cn('h-5 w-5', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                            <span>{item.title}</span>
                          </div>
                          <ChevronDown className={cn('h-4 w-4 transition-transform duration-200 text-muted-foreground', isOpen && 'rotate-180')} />
                        </button>

                        {isOpen && (
                          <div className="pl-9 pr-2 py-1 space-y-1">
                            {item.items!.map((sub, sIdx) => {
                              const subActive = sub.exact ? pathname === sub.href : pathname.startsWith(sub.href);
                              return (
                                <Link
                                  key={sIdx}
                                  href={sub.href}
                                  onClick={onClose}
                                  className={cn(
                                    'block px-3 min-h-[40px] flex items-center rounded-lg text-xs transition-colors focus-visible:ring-2 focus-visible:ring-primary',
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
                        onClick={onClose}
                        className={cn(
                          'flex items-center justify-between px-3 min-h-[44px] rounded-xl text-sm font-semibold transition-all group focus-visible:ring-2 focus-visible:ring-primary',
                          active
                            ? 'bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/30'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn('h-5 w-5', active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                          <span>{item.title}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-bold',
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
    </div>
  );
}
