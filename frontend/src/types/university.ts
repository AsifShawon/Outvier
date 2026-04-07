export interface University {
  _id: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  state: string;
  website: string;
  logo?: string;
  establishedYear?: number;
  ranking?: number;
  type: 'public' | 'private';
  campuses?: string[];
  internationalStudents?: boolean;
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
  type: 'public' | 'private';
  campuses?: string[];
  internationalStudents?: boolean;
}
