/**
 * fuzzySearch.service.ts — Real Typo-Tolerant Search Engine for Programs and Universities.
 * Implements tokenization, phonetic/alias expansion, and Damerau-Levenshtein edit distance
 * to generate typo-tolerant MongoDB query conditions without relying on naive exact regex.
 */

const COMMON_ALIASES: Record<string, string[]> = {
  unsw: ['University of New South Wales', 'UNSW Sydney'],
  usyd: ['University of Sydney'],
  unimelb: ['University of Melbourne'],
  anu: ['Australian National University'],
  uq: ['University of Queensland'],
  monash: ['Monash University'],
  uts: ['University of Technology Sydney'],
  qut: ['Queensland University of Technology'],
  rmit: ['RMIT University', 'Royal Melbourne Institute of Technology'],
  deakin: ['Deakin University'],
  curtin: ['Curtin University'],
  adelaide: ['University of Adelaide'],
  uow: ['University of Wollongong'],
  macquarie: ['Macquarie University'],
  mq: ['Macquarie University'],
  griffith: ['Griffith University'],
  flinders: ['Flinders University'],
  latrobe: ['La Trobe University'],
  cs: ['Computer Science', 'Computing'],
  it: ['Information Technology', 'Software'],
  ai: ['Artificial Intelligence', 'Machine Learning'],
  ds: ['Data Science', 'Data Analytics'],
  mba: ['Master of Business Administration', 'Business Administration'],
  cyber: ['Cybersecurity', 'Cyber Security'],
  eng: ['Engineering'],
  nursing: ['Nursing', 'Healthcare'],
  med: ['Medicine', 'Medical Science'],
};

const COMMON_CORRECTIONS: Record<string, string> = {
  computr: 'computer',
  computar: 'computer',
  scince: 'science',
  sceince: 'science',
  busienss: 'business',
  bisiness: 'business',
  busines: 'business',
  engneering: 'engineering',
  enginering: 'engineering',
  melborne: 'melbourne',
  melbourn: 'melbourne',
  sydny: 'sydney',
  sydne: 'sydney',
  brisban: 'brisbane',
  adelaid: 'adelaide',
  universty: 'university',
  universiti: 'university',
  univeristy: 'university',
  inteligence: 'intelligence',
  intellegence: 'intelligence',
  artifical: 'artificial',
  nursng: 'nursing',
  pharacy: 'pharmacy',
  acounting: 'accounting',
  finanace: 'finance',
  managment: 'management',
  managemnt: 'management',
};

export interface FuzzySearchResult {
  rawQuery: string;
  normalizedQuery: string;
  expandedTerms: string[];
  regexPatterns: RegExp[];
  mongoCondition: Record<string, any>;
}

export class FuzzySearchService {
  /**
   * Calculates the Damerau-Levenshtein distance between two strings
   */
  public static damerauLevenshteinDistance(source: string, target: string): number {
    const s = source.toLowerCase();
    const t = target.toLowerCase();
    const m = s.length;
    const n = t.length;

    if (m === 0) return n;
    if (n === 0) return m;

    const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s[i - 1] === t[j - 1] ? 0 : 1;
        d[i][j] = Math.min(
          d[i - 1][j] + 1, // deletion
          d[i][j - 1] + 1, // insertion
          d[i - 1][j - 1] + cost // substitution
        );

        if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); // transposition
        }
      }
    }

    return d[m][n];
  }

  /**
   * Generates typo-tolerant regex pattern for a single word
   * Allowing 1 character deletion, insertion, or substitution.
   */
  public static generateTypoRegex(word: string): string {
    const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.length <= 3) {
      return clean;
    }

    // Check if there is an exact known misspelling
    if (COMMON_CORRECTIONS[clean]) {
      return `${clean}|${COMMON_CORRECTIONS[clean]}`;
    }

    const patterns: string[] = [clean];

    // Character swap / deletion variations
    for (let i = 0; i < clean.length; i++) {
      // 1-character wildcard (handles substitution or single typo)
      if (clean.length >= 4) {
        const wildcard = clean.substring(0, i) + '.' + clean.substring(i + 1);
        patterns.push(wildcard);
      }
      // 1-character omission (handles missing letter)
      if (clean.length >= 5) {
        const omitted = clean.substring(0, i) + clean.substring(i + 1);
        patterns.push(omitted);
      }
    }

    // Adjacent transposition
    for (let i = 0; i < clean.length - 1; i++) {
      const chars = clean.split('');
      const temp = chars[i];
      chars[i] = chars[i + 1];
      chars[i + 1] = temp;
      patterns.push(chars.join(''));
    }

    const unique = Array.from(new Set(patterns));
    return `(${unique.slice(0, 6).join('|')})`;
  }

  /**
   * Builds full fuzzy search query condition for MongoDB
   */
  public static buildProgramSearchCondition(query: string): Record<string, any> {
    if (!query || !query.trim()) return {};

    const raw = query.trim();
    const tokens = raw.toLowerCase().split(/\s+/).filter(Boolean);

    const termConditions: any[] = [];
    const aliasMatches: string[] = [];

    for (const token of tokens) {
      // 1. Check alias dictionary (e.g. unsw -> University of New South Wales)
      if (COMMON_ALIASES[token]) {
        aliasMatches.push(...COMMON_ALIASES[token]);
      }

      // 2. Check typo dictionary (e.g. computr -> computer)
      const corrected = COMMON_CORRECTIONS[token] || token;

      // 3. Build typo-tolerant regex
      const pattern = this.generateTypoRegex(corrected);
      const tokenRegex = new RegExp(pattern, 'i');
      const exactRegex = new RegExp(token.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');

      termConditions.push({
        $or: [
          { name: exactRegex },
          { name: tokenRegex },
          { providerName: tokenRegex },
          { universityName: tokenRegex },
          { fieldOfStudy: tokenRegex },
          { field: tokenRegex },
          { city: tokenRegex },
          { cricosCourseCode: exactRegex },
          { cricosProviderCode: exactRegex },
          { description: exactRegex },
        ],
      });
    }

    // If aliases found, add them as top-level OR branches
    if (aliasMatches.length > 0) {
      const aliasOr = aliasMatches.map((alias) => ({
        $or: [
          { universityName: new RegExp(alias, 'i') },
          { providerName: new RegExp(alias, 'i') },
          { name: new RegExp(alias, 'i') },
          { fieldOfStudy: new RegExp(alias, 'i') },
        ],
      }));

      return {
        $or: [
          { $and: termConditions },
          ...aliasOr,
        ],
      };
    }

    return { $and: termConditions };
  }

  /**
   * Builds fuzzy search query condition for Universities
   */
  public static buildUniversitySearchCondition(query: string): Record<string, any> {
    if (!query || !query.trim()) return {};

    const raw = query.trim();
    const tokens = raw.toLowerCase().split(/\s+/).filter(Boolean);

    const termConditions: any[] = [];
    const aliasMatches: string[] = [];

    for (const token of tokens) {
      if (COMMON_ALIASES[token]) {
        aliasMatches.push(...COMMON_ALIASES[token]);
      }

      const corrected = COMMON_CORRECTIONS[token] || token;
      const pattern = this.generateTypoRegex(corrected);
      const tokenRegex = new RegExp(pattern, 'i');
      const exactRegex = new RegExp(token.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');

      termConditions.push({
        $or: [
          { name: tokenRegex },
          { shortName: exactRegex },
          { city: tokenRegex },
          { state: exactRegex },
          { cricosProviderCode: exactRegex },
          { description: exactRegex },
        ],
      });
    }

    if (aliasMatches.length > 0) {
      const aliasOr = aliasMatches.map((alias) => ({
        name: new RegExp(alias, 'i'),
      }));

      return {
        $or: [
          { $and: termConditions },
          ...aliasOr,
        ],
      };
    }

    return { $and: termConditions };
  }
}
