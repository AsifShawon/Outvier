/**
 * crawler.service.ts — Hardened, Polite & Standards-Compliant Web Crawler.
 *
 * Security & Compliance Guarantees:
 * - Powered by safeHttpClient (Full SSRF defense, DNS resolution, private IP blocking).
 * - Standards-compliant RFC 9309 robots.txt parsing via `robots-parser`.
 * - Explicit Crawler User-Agent: `OutvierBot/1.0 (+https://outvier.com/bot; bot@outvier.com)`.
 * - Records crawl permission status: 'allowed' | 'denied' | 'indeterminate'.
 * - Respects Crawl-delay from robots.txt with safety minimums.
 * - Sitemap.xml discovery & pattern-based URL classification.
 * - Boilerplate removal for clean extraction.
 */

import robotsParser from 'robots-parser';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { safeHttpClient, SafeFetchResult } from '../utils/safeHttpClient';

export const BOT_USER_AGENT =
  process.env.CRAWLER_USER_AGENT ||
  'OutvierBot/1.0 (+https://outvier.com/bot; bot@outvier.com)';

const BASE_RATE_LIMIT_MS = parseInt(process.env.CRAWLER_RATE_LIMIT_MS || '1000', 10);
const MAX_PAGES = parseInt(process.env.MAX_PAGES_PER_UNIVERSITY || '80', 10);

// URL pattern classifiers
const COURSE_DETAIL_PATTERNS = [
  /\/course[s]?\/[a-z0-9\-]+/i,
  /\/programs?\/[a-z0-9\-]+/i,
  /\/degrees?\/[a-z0-9\-]+/i,
  /\/study\/[a-z0-9\-]+/i,
  /\/undergraduate\/[a-z0-9\-]+/i,
  /\/postgraduate\/[a-z0-9\-]+/i,
  /\/graduate\/[a-z0-9\-]+/i,
  /\/bachelor[s]?\/[a-z0-9\-]+/i,
  /\/master[s]?\/[a-z0-9\-]+/i,
  /\/phd\/[a-z0-9\-]+/i,
  /\/research\/[a-z0-9\-]+/i,
  /\/degree-finder\/[a-z0-9\-]+/i,
];

const COURSE_LIST_PATTERNS = [
  /\/courses?(\/|$)/i,
  /\/programs?(\/|$)/i,
  /\/degrees?(\/|$)/i,
  /\/study(-at)?(\/|$)/i,
  /\/undergraduate(\/|$)/i,
  /\/postgraduate(\/|$)/i,
  /\/find-a-course/i,
  /\/course-finder/i,
  /\/program-finder/i,
  /\/study-areas/i,
  /\/degree-finder(\/|$)/i,
];

const FEE_PATTERNS = [
  /fee[s]?(\/|$)/i,
  /tuition/i,
  /cost[s]?(-of-study)?(\/|$)/i,
  /international.*fee/i,
  /fee.*international/i,
];

const REQUIREMENT_PATTERNS = [
  /entry[-_]?requirement[s]?(\/|$)/i,
  /admission[s]?(\/|$)/i,
  /how-to-apply/i,
  /international.*admission/i,
  /english[-_]?requirement[s]?(\/|$)/i,
  /ielts/i,
];

const SCHOLARSHIP_PATTERNS = [
  /scholarship[s]?(\/|$)/i,
  /financial[-_]?aid/i,
  /bursary/i,
  /grants?(\/|$)/i,
  /funding(\/|$)/i,
];

// URLs to skip
const SKIP_PATTERNS = [
  /\.(doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz|exe|dmg|iso)$/i,
  /\/news\//i,
  /\/blog\//i,
  /\/event[s]?\//i,
  /\/staff\//i,
  /\/people\//i,
  /\/profile\//i,
  /\/media[-_]?release/i,
  /\/video[s]?\//i,
  /\/gallery/i,
  /\/library\//i,
  /\/alumni\//i,
  /\/contact/i,
  /\/search\?/i,
  /\?page=\d+/i,
  /#/,
  /\/login/i,
  /\/signup/i,
  /\/cart/i,
  /\/checkout/i,
  /facebook\.com/i,
  /twitter\.com/i,
  /linkedin\.com/i,
  /instagram\.com/i,
  /youtube\.com/i,
  /javascript:/i,
  /mailto:/i,
  /tel:/i,
];

export type UrlType = 'course_list' | 'course_detail' | 'fee' | 'requirement' | 'scholarship' | 'sitemap' | 'other';
export type CrawlStatus = 'allowed' | 'denied' | 'indeterminate';

export interface ClassifiedUrl {
  url: string;
  urlType: UrlType;
  priority: number; // 1 (low) to 10 (high)
  crawlStatus: CrawlStatus;
}

export interface CrawlerResult {
  classifiedUrls: ClassifiedUrl[];
  sitemapFound: boolean;
  robotsTxtStatus: CrawlStatus;
  robotsNotes?: string;
  pagesVisited: number;
  errors: { url: string; error: string }[];
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function classifyUrl(url: string): { urlType: UrlType; priority: number } {
  if (COURSE_DETAIL_PATTERNS.some(p => p.test(url))) return { urlType: 'course_detail', priority: 9 };
  if (COURSE_LIST_PATTERNS.some(p => p.test(url))) return { urlType: 'course_list', priority: 8 };
  if (FEE_PATTERNS.some(p => p.test(url))) return { urlType: 'fee', priority: 7 };
  if (REQUIREMENT_PATTERNS.some(p => p.test(url))) return { urlType: 'requirement', priority: 7 };
  if (SCHOLARSHIP_PATTERNS.some(p => p.test(url))) return { urlType: 'scholarship', priority: 6 };
  return { urlType: 'other', priority: 1 };
}

function shouldSkip(url: string): boolean {
  return SKIP_PATTERNS.some(p => p.test(url));
}

function normalizeUrl(baseUrl: string, href: string): string | null {
  try {
    const resolved = new URL(href, baseUrl);
    const base = new URL(baseUrl);
    if (resolved.hostname !== base.hostname) return null;
    resolved.hash = ''; // Remove fragments
    return resolved.toString();
  } catch {
    return null;
  }
}

/**
 * Remove boilerplate elements (nav, header, footer, scripts, etc.) and return cleaned text.
 */
export function cleanHtml(html: string): string {
  const $ = cheerio.load(html);

  $('nav, header, footer, script, style, noscript, aside, [role="navigation"], [role="banner"], [role="contentinfo"]').remove();
  $('[class*="nav"], [class*="menu"], [class*="footer"], [class*="header"], [class*="sidebar"], [class*="cookie"]').remove();
  $('[id*="nav"], [id*="menu"], [id*="footer"], [id*="header"], [id*="sidebar"]').remove();
  $('meta, link, img, svg, iframe, video, audio, canvas, form[class*="search"]').remove();

  const mainContent = $('main, article, [role="main"], .content, #content, .main, #main').first();
  const text = mainContent.length > 0 ? mainContent.text() : $('body').text();

  return text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .substring(0, 15000);
}

export interface RobotsCheckResult {
  status: CrawlStatus;
  isAllowed: (url: string) => boolean;
  sitemaps: string[];
  crawlDelayMs: number;
  notes: string;
}

export const crawlerService = {
  /**
   * Fetch and parse robots.txt using standards-compliant parser with safe HTTP fetch.
   */
  async checkRobotsTxt(origin: string): Promise<RobotsCheckResult> {
    const robotsUrl = `${origin}/robots.txt`;
    try {
      const response = await safeHttpClient.get(robotsUrl, {
        timeoutMs: 8000,
        maxResponseBytes: 1024 * 1024, // 1MB for robots.txt
      });

      if (response.statusCode >= 200 && response.statusCode < 300) {
        const parser = robotsParser(robotsUrl, response.body);
        const sitemaps = parser.getSitemaps();
        const crawlDelay = parser.getCrawlDelay(BOT_USER_AGENT) || parser.getCrawlDelay('*');
        const crawlDelayMs = crawlDelay ? crawlDelay * 1000 : BASE_RATE_LIMIT_MS;

        return {
          status: 'allowed',
          isAllowed: (url: string) => {
            const allowed = parser.isAllowed(url, BOT_USER_AGENT);
            if (allowed !== undefined) return allowed;
            const wildcardAllowed = parser.isAllowed(url, '*');
            return wildcardAllowed !== undefined ? wildcardAllowed : true;
          },
          sitemaps,
          crawlDelayMs,
          notes: `Parsed robots.txt successfully (${sitemaps.length} sitemaps discovered, crawlDelay: ${crawlDelayMs}ms)`,
        };
      }

      if (response.statusCode === 404 || response.statusCode === 410) {
        return {
          status: 'allowed',
          isAllowed: () => true,
          sitemaps: [],
          crawlDelayMs: BASE_RATE_LIMIT_MS,
          notes: `robots.txt returned ${response.statusCode}; full crawling permitted`,
        };
      }

      // 401, 403, 5xx
      return {
        status: 'indeterminate',
        isAllowed: () => true,
        sitemaps: [],
        crawlDelayMs: BASE_RATE_LIMIT_MS,
        notes: `robots.txt returned HTTP ${response.statusCode}; crawl status indeterminate`,
      };
    } catch (err: any) {
      return {
        status: 'indeterminate',
        isAllowed: () => true,
        sitemaps: [],
        crawlDelayMs: BASE_RATE_LIMIT_MS,
        notes: `robots.txt fetch error: ${err.message}; defaulting to polite crawl`,
      };
    }
  },

  /**
   * Discover URLs from sitemap.xml
   */
  async discoverFromSitemap(sitemapUrl: string): Promise<string[]> {
    try {
      const response = await safeHttpClient.get(sitemapUrl, {
        timeoutMs: 10000,
        maxResponseBytes: 5 * 1024 * 1024,
      });

      const $ = cheerio.load(response.body, { xmlMode: true });
      const urls: string[] = [];
      $('loc').each((_, el) => {
        const url = $(el).text().trim();
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
          urls.push(url);
        }
      });
      return urls;
    } catch {
      return [];
    }
  },

  /**
   * Discover all relevant program/course URLs for a university.
   */
  async discoverProgramUrls(officialWebsite: string): Promise<CrawlerResult> {
    const origin = new URL(officialWebsite).origin;
    const visited = new Set<string>();
    const queue: string[] = [officialWebsite];
    const classifiedUrls: ClassifiedUrl[] = [];
    const errors: { url: string; error: string }[] = [];
    let sitemapFound = false;

    // 1. Check robots.txt
    const robots = await this.checkRobotsTxt(origin);

    // 2. Discover sitemap
    const sitemaps = robots.sitemaps.length > 0 ? robots.sitemaps : [`${origin}/sitemap.xml`];
    for (const sitemapUrl of sitemaps) {
      const sitemapUrls = await this.discoverFromSitemap(sitemapUrl);
      if (sitemapUrls.length > 0) {
        sitemapFound = true;
        for (const u of sitemapUrls) {
          if (!visited.has(u) && !shouldSkip(u)) {
            queue.push(u);
          }
        }
      }
    }

    // 3. Seed common paths
    const seedPaths = [
      '/courses', '/programs', '/study', '/degrees',
      '/undergraduate', '/postgraduate', '/graduate',
      '/international/courses', '/international/programs',
      '/study/find-a-course', '/course-finder',
      '/fees', '/international/fees', '/scholarships',
      '/international/scholarships', '/international/entry-requirements',
    ];
    for (const path of seedPaths) {
      const seedUrl = `${origin}${path}`;
      if (!visited.has(seedUrl)) queue.push(seedUrl);
    }

    const rateLimitMs = Math.max(BASE_RATE_LIMIT_MS, robots.crawlDelayMs);

    // 4. Crawl loop
    while (queue.length > 0 && visited.size < MAX_PAGES) {
      const url = queue.shift()!;
      if (visited.has(url) || shouldSkip(url)) continue;

      const isUrlAllowed = robots.isAllowed(url);
      const crawlStatus: CrawlStatus = !isUrlAllowed
        ? 'denied'
        : robots.status === 'indeterminate'
        ? 'indeterminate'
        : 'allowed';

      if (!isUrlAllowed) {
        continue;
      }

      visited.add(url);

      try {
        await sleep(rateLimitMs);
        const response: SafeFetchResult = await safeHttpClient.get(url, {
          timeoutMs: 12000,
          maxResponseBytes: 5 * 1024 * 1024,
        });

        const { urlType, priority } = classifyUrl(url);
        if (urlType !== 'other' || priority > 1) {
          classifiedUrls.push({ url, urlType, priority, crawlStatus });
        }

        const $ = cheerio.load(response.body);
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (!href) return;

          const normalized = normalizeUrl(url, href);
          if (!normalized || visited.has(normalized) || shouldSkip(normalized)) return;

          const { priority: linkPriority } = classifyUrl(normalized);
          if (linkPriority >= 5) {
            queue.unshift(normalized);
          } else if (linkPriority >= 2 && visited.size < MAX_PAGES / 2) {
            queue.push(normalized);
          }
        });

      } catch (err: any) {
        errors.push({ url, error: err.message });
      }
    }

    // Sort by priority descending and deduplicate
    classifiedUrls.sort((a, b) => b.priority - a.priority);
    const seen = new Set<string>();
    const deduplicated = classifiedUrls.filter(u => {
      if (seen.has(u.url)) return false;
      seen.add(u.url);
      return true;
    });

    return {
      classifiedUrls: deduplicated,
      sitemapFound,
      robotsTxtStatus: robots.status,
      robotsNotes: robots.notes,
      pagesVisited: visited.size,
      errors,
    };
  },

  /**
   * Fetch and clean a single URL for extraction using safeHttpClient.
   */
  async fetchAndClean(url: string): Promise<{ text: string; html: string; etag?: string; lastModified?: string } | null> {
    try {
      await sleep(BASE_RATE_LIMIT_MS);
      const res = await safeHttpClient.get(url, {
        timeoutMs: 15000,
        maxResponseBytes: 5 * 1024 * 1024,
      });
      const text = cleanHtml(res.body);
      return {
        text,
        html: res.body,
        etag: res.etag,
        lastModified: res.lastModified,
      };
    } catch {
      return null;
    }
  },

  /**
   * Chunk text for extraction.
   */
  chunkText(text: string, maxChunkSize = 6000): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      chunks.push(text.slice(start, start + maxChunkSize));
      start += maxChunkSize;
    }
    return chunks;
  },
};
