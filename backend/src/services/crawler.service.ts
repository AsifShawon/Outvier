/**
 * crawler.service.ts
 * Polite web crawler for discovering official program/course URLs from university websites.
 *
 * Features:
 * - robots.txt compliance
 * - Rate limiting (CRAWLER_RATE_LIMIT_MS env var)
 * - Sitemap.xml discovery
 * - URL classification (course list, course detail, fee, requirement, scholarship)
 * - Boilerplate cleaning
 * - Max-pages limit (MAX_PAGES_PER_UNIVERSITY env var)
 * - Per-URL error handling (never crashes the pipeline)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

const USER_AGENT = process.env.CRAWLER_USER_AGENT ||
  'OutvierBot/1.0 (Australian University Data Platform; +https://outvier.com.au/bot)';
const RATE_LIMIT_MS = parseInt(process.env.CRAWLER_RATE_LIMIT_MS || '1500', 10);
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

// URLs we should skip
const SKIP_PATTERNS = [
  /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz)$/i, // files (handled separately)
  /\/news\//i,
  /\/blog\//i,
  /\/event[s]?\//i,
  /\/staff\//i,
  /\/people\//i,
  /\/profile\//i,
  /\/media[-_]?release/i,
  /\/media\/\d/i,
  /\/video[s]?\//i,
  /\/gallery/i,
  /\/library\//i,
  /\/alumni\//i,
  /\/about\/history/i,
  /\/contact/i,
  /\/sitemap/i,
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

export interface ClassifiedUrl {
  url: string;
  urlType: UrlType;
  priority: number; // 1 (low) to 10 (high)
}

export interface CrawlerResult {
  classifiedUrls: ClassifiedUrl[];
  sitemapFound: boolean;
  robotsTxtRespected: boolean;
  pagesVisited: number;
  errors: { url: string; error: string }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    // Only follow same-origin URLs
    const base = new URL(baseUrl);
    if (resolved.hostname !== base.hostname) return null;
    resolved.hash = ''; // remove fragments
    return resolved.toString();
  } catch {
    return null;
  }
}

async function fetchPage(url: string): Promise<string> {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-AU,en;q=0.9',
    },
    timeout: 12000,
    maxRedirects: 5,
    validateStatus: (status) => status < 400,
  });
  return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
}

/**
 * Check robots.txt for the given origin and path.
 * Returns true if the given path is allowed for our bot.
 */
async function checkRobotsTxt(origin: string): Promise<{
  allowed: (path: string) => boolean;
  sitemap?: string;
}> {
  try {
    const robotsUrl = `${origin}/robots.txt`;
    const response = await axios.get(robotsUrl, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 5000,
      validateStatus: (s) => s < 500,
    });

    const text: string = response.data;
    const lines = text.split('\n').map((l: string) => l.trim());
    const disallowed: string[] = [];
    let sitemapUrl: string | undefined;
    let inRelevantSection = false;

    for (const line of lines) {
      if (line.toLowerCase().startsWith('user-agent:')) {
        const agent = line.split(':')[1]?.trim().toLowerCase();
        inRelevantSection = agent === '*' || agent === 'outviertbot' || agent === 'outvier';
      }
      if (inRelevantSection && line.toLowerCase().startsWith('disallow:')) {
        const path = line.split(':')[1]?.trim();
        if (path) disallowed.push(path);
      }
      if (line.toLowerCase().startsWith('sitemap:')) {
        sitemapUrl = line.split(':').slice(1).join(':').trim();
      }
    }

    return {
      allowed: (path: string) => !disallowed.some(d => d && path.startsWith(d)),
      sitemap: sitemapUrl,
    };
  } catch {
    // robots.txt not found or not parseable — assume all allowed
    return { allowed: () => true };
  }
}

/**
 * Discover URLs from sitemap.xml
 */
async function discoverFromSitemap(sitemapUrl: string): Promise<string[]> {
  try {
    const html = await fetchPage(sitemapUrl);
    const $ = cheerio.load(html, { xmlMode: true });
    const urls: string[] = [];
    $('loc').each((_, el) => {
      const url = $(el).text().trim();
      if (url) urls.push(url);
    });
    return urls;
  } catch {
    return [];
  }
}

/**
 * Remove navigation/header/footer boilerplate from HTML.
 * Returns cleaned plain text.
 */
export function cleanHtml(html: string): string {
  const $ = cheerio.load(html);

  // Remove boilerplate elements
  $('nav, header, footer, script, style, noscript, aside, [role="navigation"], [role="banner"], [role="contentinfo"]').remove();
  $('[class*="nav"], [class*="menu"], [class*="footer"], [class*="header"], [class*="sidebar"], [class*="cookie"]').remove();
  $('[id*="nav"], [id*="menu"], [id*="footer"], [id*="header"], [id*="sidebar"]').remove();
  $('meta, link, img, svg, iframe, video, audio, canvas, form[class*="search"]').remove();

  // Get main content area first
  const mainContent = $('main, article, [role="main"], .content, #content, .main, #main').first();
  const text = mainContent.length > 0 ? mainContent.text() : $('body').text();

  return text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .substring(0, 15000); // cap at 15k chars per page
}

// ---------------------------------------------------------------------------
// Main crawler
// ---------------------------------------------------------------------------

export const crawlerService = {
  /**
   * Discover all relevant program/course URLs for a university.
   * Starts at the official website, checks sitemap, crawls intelligently.
   */
  async discoverProgramUrls(officialWebsite: string): Promise<CrawlerResult> {
    const origin = new URL(officialWebsite).origin;
    const visited = new Set<string>();
    const queue: string[] = [officialWebsite];
    const classifiedUrls: ClassifiedUrl[] = [];
    const errors: { url: string; error: string }[] = [];
    let sitemapFound = false;
    let robotsTxtRespected = true;

    // 1. Check robots.txt
    const robots = await checkRobotsTxt(origin);

    // 2. Discover sitemap
    const sitemapUrl = robots.sitemap || `${origin}/sitemap.xml`;
    const sitemapUrls = await discoverFromSitemap(sitemapUrl);
    if (sitemapUrls.length > 0) {
      sitemapFound = true;
      // Seed queue with sitemap URLs
      for (const u of sitemapUrls) {
        if (!visited.has(u) && !shouldSkip(u)) {
          queue.push(u);
        }
      }
    }

    // 3. Add seed URLs using common patterns for Australian universities
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

    // 4. Crawl
    while (queue.length > 0 && visited.size < MAX_PAGES) {
      const url = queue.shift()!;
      if (visited.has(url) || shouldSkip(url)) continue;

      // Check robots.txt
      const parsedUrl = new URL(url);
      if (!robots.allowed(parsedUrl.pathname)) {
        robotsTxtRespected = true;
        continue;
      }

      visited.add(url);

      try {
        await sleep(RATE_LIMIT_MS);
        const html = await fetchPage(url);
        const $ = cheerio.load(html);

        // Classify this URL
        const { urlType, priority } = classifyUrl(url);
        if (urlType !== 'other' || priority > 1) {
          classifiedUrls.push({ url, urlType, priority });
        }

        // Extract links for further crawling
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (!href) return;

          const normalized = normalizeUrl(url, href);
          if (!normalized || visited.has(normalized) || shouldSkip(normalized)) return;

          const { priority: linkPriority } = classifyUrl(normalized);
          // Only follow links that are likely to lead to course pages
          if (linkPriority >= 5) {
            queue.unshift(normalized); // High-priority links go to front of queue
          } else if (linkPriority >= 2 && visited.size < MAX_PAGES / 2) {
            queue.push(normalized);
          }
        });

      } catch (err: any) {
        errors.push({ url, error: err.message });
      }
    }

    // Sort by priority descending
    classifiedUrls.sort((a, b) => b.priority - a.priority);

    // Deduplicate
    const seen = new Set<string>();
    const deduplicated = classifiedUrls.filter(u => {
      if (seen.has(u.url)) return false;
      seen.add(u.url);
      return true;
    });

    return {
      classifiedUrls: deduplicated,
      sitemapFound,
      robotsTxtRespected,
      pagesVisited: visited.size,
      errors,
    };
  },

  /**
   * Fetch and clean a single URL for AI extraction.
   */
  async fetchAndClean(url: string): Promise<{ text: string; html: string } | null> {
    try {
      await sleep(RATE_LIMIT_MS);
      const html = await fetchPage(url);
      const text = cleanHtml(html);
      return { text, html };
    } catch {
      return null;
    }
  },

  /**
   * Chunk text for AI processing (max tokens per chunk).
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
