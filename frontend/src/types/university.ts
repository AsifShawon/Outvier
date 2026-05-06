export interface University {
  _id: string;
  name: string;
  slug: string;
  shortName?: string;
  description?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  officialWebsite?: string;
  logo?: string;
  establishedYear?: number;
  ranking?: number;
  rankingBand?: string;
  type?: 'public' | 'private'; // @deprecated
  campuses?: string[];
  internationalStudents?: boolean;
  cricosProviderCode?: string;
  institutionType?: string;
  institutionCapacity?: number;
  cricosSyncStatus?: string;
  lastSyncError?: string;
  lastSyncRunId?: string;
  lastCricosSyncedAt?: string;
  programCount?: number;
  averageEstimatedTotalCostAud?: number;
  sourceMetadata?: {
    sourceName?: string;
    fetchedAt?: string;
  };

  createdAt: string;
  updatedAt: string;
}

export interface CreateUniversityPayload {
  name: string;
  description: string;
  location: string;
  state: string;
  website: string;
  logo?: string;
  establishedYear?: number;
  ranking?: number;
  type?: 'public' | 'private';
  campuses?: string[];
  internationalStudents?: boolean;
  cricosProviderCode?: string;
  officialWebsite?: string;
}
