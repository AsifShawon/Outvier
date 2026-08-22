/**
 * Outvier TanStack Query Key Factories & Intentional Stale Times
 */

export const STALE_TIMES = {
  // Static/Catalog data changes rarely -> 5 minutes
  CATALOG_LIST: 5 * 60 * 1000,
  CATALOG_DETAIL: 5 * 60 * 1000,

  // Student mutable state -> 30 seconds
  TRACKER_BOARD: 30 * 1000,
  TRACKER_ITEMS: 30 * 1000,
  STUDENT_PROFILE: 30 * 1000,
  BUDGET_PLANS: 30 * 1000,

  // Admin dynamic operational metrics -> 15 seconds
  ADMIN_STATS: 15 * 1000,
  ADMIN_STAGED: 15 * 1000,
  ADMIN_SYNC: 15 * 1000,

  // User session state -> 5 minutes
  AUTH_ME: 5 * 60 * 1000,
} as const;

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },

  universities: {
    all: ['universities'] as const,
    lists: () => [...queryKeys.universities.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.universities.lists(), { filters }] as const,
    details: () => [...queryKeys.universities.all, 'detail'] as const,
    detail: (idOrSlug: string) => [...queryKeys.universities.details(), idOrSlug] as const,
    states: () => [...queryKeys.universities.all, 'states'] as const,
  },

  programs: {
    all: ['programs'] as const,
    lists: () => [...queryKeys.programs.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.programs.lists(), { filters }] as const,
    details: () => [...queryKeys.programs.all, 'detail'] as const,
    detail: (idOrSlug: string) => [...queryKeys.programs.details(), idOrSlug] as const,
    fields: () => [...queryKeys.programs.all, 'fields'] as const,
    byUniversity: (uniSlug: string) => [...queryKeys.programs.all, 'by-uni', uniSlug] as const,
  },

  scholarships: {
    all: ['scholarships'] as const,
    lists: () => [...queryKeys.scholarships.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.scholarships.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.scholarships.all, 'detail', id] as const,
  },

  tracker: {
    all: ['tracker'] as const,
    board: () => [...queryKeys.tracker.all, 'board'] as const,
    items: (filters?: Record<string, unknown>) => [...queryKeys.tracker.all, 'items', { filters }] as const,
    item: (id: string) => [...queryKeys.tracker.all, 'item', id] as const,
  },

  profile: {
    all: ['profile'] as const,
    current: () => [...queryKeys.profile.all, 'current'] as const,
    fit: (programId: string) => [...queryKeys.profile.all, 'fit', programId] as const,
  },

  budget: {
    all: ['budget'] as const,
    plans: () => [...queryKeys.budget.all, 'plans'] as const,
  },

  admin: {
    all: ['admin'] as const,
    stats: () => [...queryKeys.admin.all, 'stats'] as const,
    activities: () => [...queryKeys.admin.all, 'activities'] as const,
    staged: (filters?: Record<string, unknown>) => [...queryKeys.admin.all, 'staged', { filters }] as const,
    cricos: (filters?: Record<string, unknown>) => [...queryKeys.admin.all, 'cricos', { filters }] as const,
    rankings: (filters?: Record<string, unknown>) => [...queryKeys.admin.all, 'rankings', { filters }] as const,
  },
};
