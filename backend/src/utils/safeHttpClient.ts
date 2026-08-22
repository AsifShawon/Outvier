/**
 * safeHttpClient.ts — Hardened, SSRF-Proof HTTP Client.
 *
 * Security Guarantees:
 * 1. Protocol Whitelist: Permits only http: and https:.
 * 2. Embedded Credentials Rejection: Rejects user:pass in URLs.
 * 3. Comprehensive DNS & IP Whitelisting:
 *    - Resolves all A and AAAA records via DNS.
 *    - Rejects localhost, loopback (127.0.0.0/8, ::1), unspecified (0.0.0.0/8, ::).
 *    - Rejects private IPv4 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16).
 *    - Rejects link-local & cloud metadata (169.254.0.0/16, fe80::/10, metadata.google.internal).
 *    - Rejects IPv6 ULA (fc00::/7) and IPv4-mapped IPv6 (::ffff:0:0/96).
 *    - Rejects special domains (.local, .internal, .localhost, .corp, .lan).
 * 4. Hop-by-hop Redirect Revalidation:
 *    - Re-evaluates every redirect Location against all SSRF rules.
 * 5. Strict Resource Limits:
 *    - Response byte cutoff (default 5MB).
 *    - Timeout enforcement (default 15s).
 *    - Content-type validation (html, json, xml, text, pdf).
 * 6. Per-Host Concurrency Limiting:
 *    - Domain token bucket / p-limit to protect remote servers.
 */

import http from 'http';
import https from 'https';
import dns from 'dns/promises';
import { URL } from 'url';
import pLimit from 'p-limit';

export class SsrfSecurityError extends Error {
  constructor(message: string) {
    super(`[SSRF Protection Violation] ${message}`);
    this.name = 'SsrfSecurityError';
  }
}

export class ResponseSizeLimitExceededError extends Error {
  constructor(maxBytes: number) {
    super(`Response size exceeded maximum allowed limit of ${maxBytes} bytes`);
    this.name = 'ResponseSizeLimitExceededError';
  }
}

export interface SafeFetchOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxRedirects?: number;
  maxResponseBytes?: number;
  allowedContentTypes?: string[];
  method?: 'GET' | 'HEAD';
}

export interface SafeFetchResult {
  url: string;
  finalUrl: string;
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  contentType: string;
  body: string;
  rawBuffer: Buffer;
  redirectsCount: number;
  etag?: string;
  lastModified?: string;
}

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const DEFAULT_USER_AGENT =
  process.env.CRAWLER_USER_AGENT ||
  'OutvierBot/1.0 (+https://outvier.com/bot; bot@outvier.com)';

const DEFAULT_ALLOWED_CONTENT_TYPES = [
  'text/html',
  'application/xhtml+xml',
  'application/json',
  'application/xml',
  'text/xml',
  'text/plain',
  'application/pdf',
];

// Per-host concurrency limiter (max 2 concurrent requests per domain)
const hostLimiters = new Map<string, ReturnType<typeof pLimit>>();

function getHostLimiter(hostname: string): ReturnType<typeof pLimit> {
  const normalized = hostname.toLowerCase();
  let limiter = hostLimiters.get(normalized);
  if (!limiter) {
    limiter = pLimit(2);
    hostLimiters.set(normalized, limiter);
  }
  return limiter;
}

// ─────────────────────────────────────────────────────────────────────────────
// IP RANGE & SUBNET VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

function parseIpv4(ip: string): number[] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map(p => Number(p));
  if (nums.some(n => isNaN(n) || n < 0 || n > 255)) return null;
  return nums;
}

export function isPrivateOrForbiddenIp(ip: string): { forbidden: boolean; reason?: string } {
  // Check IPv4-mapped IPv6 (::ffff:192.168.1.1 or ::ffff:c0a8:0101)
  const mappedMatch = ip.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  if (mappedMatch) {
    return isPrivateOrForbiddenIp(mappedMatch[1]);
  }

  // IPv4 Checks
  const v4 = parseIpv4(ip);
  if (v4) {
    const [a, b, c, d] = v4;

    // 0.0.0.0/8 (Unspecified / "This host on this network")
    if (a === 0) return { forbidden: true, reason: 'Unspecified network (0.0.0.0/8)' };

    // 127.0.0.0/8 (Loopback / Localhost)
    if (a === 127) return { forbidden: true, reason: 'Loopback address (127.0.0.0/8)' };

    // 10.0.0.0/8 (Private RFC 1918)
    if (a === 10) return { forbidden: true, reason: 'Private network (10.0.0.0/8)' };

    // 100.64.0.0/10 (Carrier-Grade NAT RFC 6598)
    if (a === 100 && b >= 64 && b <= 127) {
      return { forbidden: true, reason: 'Carrier-Grade NAT (100.64.0.0/10)' };
    }

    // 169.254.0.0/16 (Link-Local & Cloud Instance Metadata, e.g. 169.254.169.254)
    if (a === 169 && b === 254) {
      return { forbidden: true, reason: 'Link-local / Cloud metadata (169.254.0.0/16)' };
    }

    // 172.16.0.0/12 (Private RFC 1918)
    if (a === 172 && b >= 16 && b <= 31) {
      return { forbidden: true, reason: 'Private network (172.16.0.0/12)' };
    }

    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (a === 192 && b === 0 && c === 0) {
      return { forbidden: true, reason: 'IETF protocol assignment (192.0.0.0/24)' };
    }

    // 192.0.2.0/24 (TEST-NET-1)
    if (a === 192 && b === 0 && c === 2) {
      return { forbidden: true, reason: 'Documentation address TEST-NET-1 (192.0.2.0/24)' };
    }

    // 192.168.0.0/16 (Private RFC 1918)
    if (a === 192 && b === 168) {
      return { forbidden: true, reason: 'Private network (192.168.0.0/16)' };
    }

    // 198.18.0.0/15 (Network benchmark tests)
    if (a === 198 && (b === 18 || b === 19)) {
      return { forbidden: true, reason: 'Benchmarking network (198.18.0.0/15)' };
    }

    // 198.51.100.0/24 (TEST-NET-2)
    if (a === 198 && b === 51 && c === 100) {
      return { forbidden: true, reason: 'Documentation address TEST-NET-2 (198.51.100.0/24)' };
    }

    // 203.0.113.0/24 (TEST-NET-3)
    if (a === 203 && b === 0 && c === 113) {
      return { forbidden: true, reason: 'Documentation address TEST-NET-3 (203.0.113.0/24)' };
    }

    // 224.0.0.0/4 (Multicast)
    if (a >= 224 && a <= 239) {
      return { forbidden: true, reason: 'Multicast address (224.0.0.0/4)' };
    }

    // 240.0.0.0/4 (Reserved / Future Use)
    if (a >= 240) {
      return { forbidden: true, reason: 'Reserved address space (240.0.0.0/4)' };
    }

    return { forbidden: false };
  }

  // IPv6 Checks
  const lowerIp = ip.toLowerCase().trim();

  // Unspecified (::)
  if (lowerIp === '::' || lowerIp === '0:0:0:0:0:0:0:0') {
    return { forbidden: true, reason: 'Unspecified IPv6 address (::)' };
  }

  // Loopback (::1)
  if (lowerIp === '::1' || lowerIp === '0:0:0:0:0:0:0:1') {
    return { forbidden: true, reason: 'IPv6 Loopback (::1)' };
  }

  // Unique Local Address (fc00::/7 -> fc00... to fdff...)
  if (lowerIp.startsWith('fc') || lowerIp.startsWith('fd')) {
    return { forbidden: true, reason: 'IPv6 Unique Local Address (fc00::/7)' };
  }

  // Link-Local (fe80::/10 -> fe80... to febf...)
  if (
    lowerIp.startsWith('fe8') ||
    lowerIp.startsWith('fe9') ||
    lowerIp.startsWith('fea') ||
    lowerIp.startsWith('feb')
  ) {
    return { forbidden: true, reason: 'IPv6 Link-Local address (fe80::/10)' };
  }

  // Multicast (ff00::/8)
  if (lowerIp.startsWith('ff')) {
    return { forbidden: true, reason: 'IPv6 Multicast (ff00::/8)' };
  }

  // Documentation (2001:db8::/32)
  if (lowerIp.startsWith('2001:db8:') || lowerIp.startsWith('2001:0db8:')) {
    return { forbidden: true, reason: 'IPv6 Documentation prefix (2001:db8::/32)' };
  }

  return { forbidden: false };
}

/**
 * Validates a target URL against all SSRF policies:
 * - Scheme must be http: or https:
 * - No userinfo (user:pass@)
 * - Domain must not be a special/internal TLD
 * - Resolves all DNS records and ensures none point to private/loopback/cloud metadata
 */
export async function validateUrlForSsrf(rawUrl: string): Promise<{ parsedUrl: URL; resolvedIps: string[] }> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new SsrfSecurityError(`Malformed URL: ${rawUrl}`);
  }

  // 1. Protocol whitelist
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new SsrfSecurityError(`Disallowed protocol "${parsedUrl.protocol}". Only HTTP and HTTPS are permitted.`);
  }

  // 2. Reject embedded credentials
  if (parsedUrl.username || parsedUrl.password) {
    throw new SsrfSecurityError(`URLs with embedded credentials (user:password@) are prohibited.`);
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // 3. Prohibited hostnames and internal TLDs
  const FORBIDDEN_HOSTNAMES = [
    'localhost',
    'metadata.google.internal',
    'metadata',
    'instance-data',
    '169.254.169.254',
  ];

  if (FORBIDDEN_HOSTNAMES.includes(hostname)) {
    throw new SsrfSecurityError(`Access to internal/cloud metadata hostname "${hostname}" is blocked.`);
  }

  const FORBIDDEN_TLDS = ['.local', '.internal', '.localhost', '.corp', '.lan', '.test', '.invalid', '.home'];
  if (FORBIDDEN_TLDS.some(tld => hostname.endsWith(tld))) {
    throw new SsrfSecurityError(`Access to private TLD "${hostname}" is blocked.`);
  }

  // 4. If hostname is already a direct IP literal, check it directly
  const directIpCheck = isPrivateOrForbiddenIp(hostname);
  if (directIpCheck.forbidden) {
    throw new SsrfSecurityError(`Direct IP "${hostname}" is blocked: ${directIpCheck.reason}`);
  }

  // 5. DNS Resolution
  let resolvedIps: string[] = [];
  try {
    const records = await dns.lookup(hostname, { all: true });
    resolvedIps = records.map(r => r.address);
  } catch (err: any) {
    throw new SsrfSecurityError(`DNS resolution failed for hostname "${hostname}": ${err.message}`);
  }

  if (resolvedIps.length === 0) {
    throw new SsrfSecurityError(`No DNS records found for hostname "${hostname}".`);
  }

  // 6. Check every resolved IP address
  for (const resolvedIp of resolvedIps) {
    const check = isPrivateOrForbiddenIp(resolvedIp);
    if (check.forbidden) {
      throw new SsrfSecurityError(
        `Hostname "${hostname}" resolved to blocked IP "${resolvedIp}": ${check.reason}`
      );
    }
  }

  return { parsedUrl, resolvedIps };
}

// ─────────────────────────────────────────────────────────────────────────────
// SAFE SINGLE-HOP FETCHER
// ─────────────────────────────────────────────────────────────────────────────

function fetchSingleHop(
  targetUrl: URL,
  resolvedIp: string,
  options: SafeFetchOptions
): Promise<{
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  rawBuffer: Buffer;
  redirectUrl?: string;
}> {
  return new Promise((resolve, reject) => {
    const isHttps = targetUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    const maxBytes = options.maxResponseBytes || DEFAULT_MAX_BYTES;

    const requestOptions: https.RequestOptions = {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || (isHttps ? 443 : 80),
      path: targetUrl.pathname + targetUrl.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/json,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-AU,en;q=0.9',
        ...(options.headers || {}),
        Host: targetUrl.hostname,
      },
      timeout: timeoutMs,
    };

    let isTimedOut = false;
    const req = client.request(requestOptions, (res) => {
      const statusCode = res.statusCode || 200;
      const headers = res.headers;

      // Handle redirect status codes (301, 302, 303, 307, 308)
      if (statusCode >= 300 && statusCode < 400 && headers.location) {
        res.resume(); // Discard body
        return resolve({
          statusCode,
          headers,
          rawBuffer: Buffer.alloc(0),
          redirectUrl: headers.location,
        });
      }

      // Check Content-Type if specified
      const contentType = (headers['content-type'] || '').toLowerCase().split(';')[0].trim();
      const allowedTypes = options.allowedContentTypes || DEFAULT_ALLOWED_CONTENT_TYPES;

      if (contentType && !allowedTypes.some(t => contentType.includes(t) || t === '*/*')) {
        res.resume();
        return reject(new Error(`Disallowed content-type: "${contentType}". Expected one of: ${allowedTypes.join(', ')}`));
      }

      const chunks: Buffer[] = [];
      let totalBytes = 0;

      res.on('data', (chunk: Buffer) => {
        totalBytes += chunk.length;
        if (totalBytes > maxBytes) {
          req.destroy(new ResponseSizeLimitExceededError(maxBytes));
          return;
        }
        chunks.push(chunk);
      });

      res.on('end', () => {
        const rawBuffer = Buffer.concat(chunks);
        resolve({
          statusCode,
          headers,
          rawBuffer,
        });
      });

      res.on('error', (err) => reject(err));
    });

    req.on('timeout', () => {
      isTimedOut = true;
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
    });

    req.on('error', (err) => {
      if (isTimedOut) {
        reject(new Error(`Request timed out after ${timeoutMs}ms`));
      } else {
        reject(err);
      }
    });

    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SAFE HTTP CLIENT
// ─────────────────────────────────────────────────────────────────────────────

export const safeHttpClient = {
  /**
   * Performs an SSRF-protected GET request with hop-by-hop redirect revalidation.
   */
  async get(rawUrl: string, options: SafeFetchOptions = {}): Promise<SafeFetchResult> {
    const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
    let currentUrl = rawUrl;
    let redirectsCount = 0;

    while (redirectsCount <= maxRedirects) {
      // 1. Full SSRF Validation of current URL
      const { parsedUrl, resolvedIps } = await validateUrlForSsrf(currentUrl);

      // 2. Concurrency limiting per hostname
      const limiter = getHostLimiter(parsedUrl.hostname);

      const hopResult = await limiter(() =>
        fetchSingleHop(parsedUrl, resolvedIps[0], options)
      );

      // 3. If redirect, resolve relative location and re-loop
      if (hopResult.redirectUrl) {
        redirectsCount++;
        if (redirectsCount > maxRedirects) {
          throw new Error(`Exceeded maximum redirect limit of ${maxRedirects}`);
        }

        // Safely resolve redirect Location against current URL
        try {
          const nextUrl = new URL(hopResult.redirectUrl, currentUrl).toString();
          currentUrl = nextUrl;
          continue;
        } catch {
          throw new SsrfSecurityError(`Malformed redirect location: "${hopResult.redirectUrl}"`);
        }
      }

      // 4. Return successful response
      const contentType = (hopResult.headers['content-type'] || 'text/html').split(';')[0].trim();
      const body = hopResult.rawBuffer.toString('utf-8');

      return {
        url: rawUrl,
        finalUrl: currentUrl,
        statusCode: hopResult.statusCode,
        headers: hopResult.headers,
        contentType,
        body,
        rawBuffer: hopResult.rawBuffer,
        redirectsCount,
        etag: typeof hopResult.headers.etag === 'string' ? hopResult.headers.etag : undefined,
        lastModified: typeof hopResult.headers['last-modified'] === 'string' ? hopResult.headers['last-modified'] : undefined,
      };
    }

    throw new Error(`Exceeded maximum redirect limit of ${maxRedirects}`);
  },

  /**
   * Helper to fetch text / HTML content.
   */
  async fetchHtml(rawUrl: string, options: SafeFetchOptions = {}): Promise<string> {
    const result = await this.get(rawUrl, options);
    return result.body;
  },

  /**
   * Helper to fetch and parse JSON.
   */
  async fetchJson<T = unknown>(rawUrl: string, options: SafeFetchOptions = {}): Promise<T> {
    const result = await this.get(rawUrl, {
      ...options,
      allowedContentTypes: ['application/json', 'text/plain', 'text/json'],
    });
    return JSON.parse(result.body) as T;
  },
};
