import {
  LayoutDashboard,
  Building2,
  BookOpen,
  GraduationCap,
  Trophy,
  BarChart3,
  RefreshCw,
  Database,
  Upload,
  GitCompare,
  FileText,
  Users,
  Bot,
  Settings,
  Compass,
  Bookmark,
  Scale,
  Sparkles,
  Calculator,
  Kanban,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';

export interface NavSubItem {
  title: string;
  href: string;
  badge?: string | number;
  exact?: boolean;
}

export interface NavItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeVariant?: 'default' | 'purple' | 'teal' | 'amber' | 'rose';
  exact?: boolean;
  external?: boolean;
  items?: NavSubItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { title: 'Universities', href: '/admin/universities', icon: Building2 },
      { title: 'Programs', href: '/admin/programs', icon: BookOpen },
      { title: 'Scholarships', href: '/admin/scholarships', icon: GraduationCap },
      { title: 'Rankings', href: '/admin/rankings', icon: Trophy },
      { title: 'Outcomes', href: '/admin/outcomes', icon: BarChart3 },
    ],
  },
  {
    label: 'Data Operations',
    items: [
      {
        title: 'CRICOS',
        icon: RefreshCw,
        items: [
          { title: 'Overview', href: '/admin/cricos', exact: true },
          { title: 'Provider Sync', href: '/admin/cricos/provider-sync' },
          { title: 'Raw Datasets', href: '/admin/cricos/raw' },
        ],
      },
      { title: 'Data Sources', href: '/admin/cricos/raw', icon: Database },
      { title: 'Sync Jobs', href: '/admin/cricos/runs', icon: RefreshCw },
      { title: 'Uploads', href: '/admin/uploads', icon: Upload },
      { title: 'Staged Changes', href: '/admin/staged-changes', icon: GitCompare },
    ],
  },
  {
    label: 'Applications',
    items: [
      { title: 'Applications', href: '/admin/applications', icon: FileText },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [
      { title: 'Users', href: '/admin/users', icon: Users },
      { title: 'AI Providers', href: '/admin/settings/ai-providers', icon: Bot },
      { title: 'Settings', href: '/admin/settings/ai-providers', icon: Settings },
    ],
  },
];

export const STUDENT_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Discovery & Fit',
    items: [
      {
        title: 'Discover',
        icon: Compass,
        items: [
          { title: 'Browse Programs', href: '/programs' },
          { title: 'Explore Universities', href: '/universities' },
          { title: 'Find Scholarships', href: '/scholarships' },
        ],
      },
      { title: 'Saved Items', href: '/dashboard/saved', icon: Bookmark },
      { title: 'Compare', href: '/compare', icon: Scale },
      { title: 'Student Fit', href: '/dashboard/student-fit', icon: Sparkles },
      { title: 'Budget Planner', href: '/dashboard', icon: Calculator },
    ],
  },
  {
    label: 'Application Workspace',
    items: [
      { title: 'Application Tracker', href: '/dashboard/tracker', icon: Kanban },
    ],
  },
  {
    label: 'Account',
    items: [
      { title: 'Profile', href: '/dashboard/profile', icon: UserCheck },
      { title: 'Settings', href: '/dashboard/profile', icon: Settings },
    ],
  },
];
