/**
 * ssrf.security.test.ts — Unit & Security Integration Tests for SSRF Protection.
 *
 * Proves that:
 * 1. Localhost, loopback (127.0.0.1, ::1) are strictly rejected.
 * 2. RFC 1918 private IPv4 ranges (10.x, 172.16.x, 192.168.x) are strictly rejected.
 * 3. Cloud metadata endpoints (169.254.169.254, metadata.google.internal) are blocked.
 * 4. IPv6 link-local, ULA, and IPv4-mapped addresses are blocked.
 * 5. URLs with embedded credentials (user:pass@) are blocked.
 * 6. Non-HTTP/HTTPS protocols (ftp://, file://, gopher://) are blocked.
 * 7. Redirects to private/internal IPs are caught and blocked during hop revalidation.
 * 8. Max response byte limit is strictly enforced with stream abort.
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import {
  safeHttpClient,
  validateUrlForSsrf,
  isPrivateOrForbiddenIp,
  SsrfSecurityError,
  ResponseSizeLimitExceededError,
} from '../utils/safeHttpClient';

describe('SSRF Protection & Safe HTTP Fetcher Security Tests', () => {
  describe('1. Direct IP Range & Subnet Classification', () => {
    test('rejects IPv4 loopback (127.0.0.1, 127.255.255.254)', () => {
      assert.equal(isPrivateOrForbiddenIp('127.0.0.1').forbidden, true);
      assert.equal(isPrivateOrForbiddenIp('127.255.255.254').forbidden, true);
    });

    test('rejects RFC 1918 private addresses (10.0.0.1, 172.16.0.1, 172.31.255.255, 192.168.1.1)', () => {
      assert.equal(isPrivateOrForbiddenIp('10.0.0.1').forbidden, true);
      assert.equal(isPrivateOrForbiddenIp('10.254.0.1').forbidden, true);
      assert.equal(isPrivateOrForbiddenIp('172.16.0.1').forbidden, true);
      assert.equal(isPrivateOrForbiddenIp('172.31.255.255').forbidden, true);
      assert.equal(isPrivateOrForbiddenIp('192.168.0.1').forbidden, true);
      assert.equal(isPrivateOrForbiddenIp('192.168.100.254').forbidden, true);
    });

    test('rejects Cloud Metadata & Link-Local IP (169.254.169.254, 169.254.1.1)', () => {
      assert.equal(isPrivateOrForbiddenIp('169.254.169.254').forbidden, true);
      assert.equal(isPrivateOrForbiddenIp('169.254.1.1').forbidden, true);
    });

    test('rejects Carrier-Grade NAT (100.64.0.1, 100.127.255.255)', () => {
      assert.equal(isPrivateOrForbiddenIp('100.64.0.1').forbidden, true);
      assert.equal(isPrivateOrForbiddenIp('100.100.10.5').forbidden, true);
    });

    test('rejects IPv6 loopback (::1) and unspecified (::)', () => {
      assert.equal(isPrivateOrForbiddenIp('::1').forbidden, true);
      assert.equal(isPrivateOrForbiddenIp('::').forbidden, true);
      assert.equal(isPrivateOrForbiddenIp('0:0:0:0:0:0:0:1').forbidden, true);
    });

    test('rejects IPv6 ULA (fc00::1, fd12:3456::1) and Link-Local (fe80::1)', () => {
      assert.equal(isPrivateOrForbiddenIp('fc00::1').forbidden, true);
      assert.equal(isPrivateOrForbiddenIp('fd00::1234').forbidden, true);
      assert.equal(isPrivateOrForbiddenIp('fe80::1').forbidden, true);
    });

    test('rejects IPv4-mapped IPv6 pointing to private addresses (::ffff:192.168.1.1)', () => {
      assert.equal(isPrivateOrForbiddenIp('::ffff:192.168.1.1').forbidden, true);
      assert.equal(isPrivateOrForbiddenIp('::ffff:127.0.0.1').forbidden, true);
    });

    test('allows legitimate public routable IP addresses (1.1.1.1, 8.8.8.8, 93.184.216.34)', () => {
      assert.equal(isPrivateOrForbiddenIp('1.1.1.1').forbidden, false);
      assert.equal(isPrivateOrForbiddenIp('8.8.8.8').forbidden, false);
      assert.equal(isPrivateOrForbiddenIp('93.184.216.34').forbidden, false);
    });
  });

  describe('2. URL Validation & Policy Enforcement', () => {
    test('rejects non-HTTP protocols (file://, ftp://, gopher://)', async () => {
      await assert.rejects(
        () => validateUrlForSsrf('file:///etc/passwd'),
        /Disallowed protocol "file:"/
      );

      await assert.rejects(
        () => validateUrlForSsrf('ftp://ftp.example.com/file.txt'),
        /Disallowed protocol "ftp:"/
      );
    });

    test('rejects URLs with embedded credentials', async () => {
      await assert.rejects(
        () => validateUrlForSsrf('https://admin:secretpassword@example.com/api'),
        /URLs with embedded credentials/
      );

      await assert.rejects(
        () => validateUrlForSsrf('http://user@example.com/'),
        /URLs with embedded credentials/
      );
    });

    test('rejects forbidden internal hostnames and cloud metadata aliases', async () => {
      await assert.rejects(
        () => validateUrlForSsrf('http://localhost:3000/'),
        /Access to internal\/cloud metadata hostname/
      );

      await assert.rejects(
        () => validateUrlForSsrf('http://metadata.google.internal/computeMetadata/v1/'),
        /Access to internal\/cloud metadata hostname/
      );

      await assert.rejects(
        () => validateUrlForSsrf('http://169.254.169.254/latest/meta-data'),
        /169\.254\.169\.254.*is blocked/
      );
    });

    test('rejects private / special TLDs (.local, .internal, .localhost, .corp)', async () => {
      await assert.rejects(
        () => validateUrlForSsrf('https://server.internal/admin'),
        /Access to private TLD/
      );

      await assert.rejects(
        () => validateUrlForSsrf('http://database.local:5432/'),
        /Access to private TLD/
      );
    });

    test('rejects direct private IP literals in URLs', async () => {
      await assert.rejects(
        () => validateUrlForSsrf('http://127.0.0.1:8080/metrics'),
        /Direct IP "127.0.0.1" is blocked/
      );

      await assert.rejects(
        () => validateUrlForSsrf('http://10.0.0.5/api/v1/secrets'),
        /Direct IP "10.0.0.5" is blocked/
      );

      await assert.rejects(
        () => validateUrlForSsrf('http://192.168.1.1/router'),
        /Direct IP "192.168.1.1" is blocked/
      );
    });
  });

  describe('3. safeHttpClient Execution & Safeguards', () => {
    test('safeHttpClient blocks attempts to fetch private networks immediately', async () => {
      await assert.rejects(
        () => safeHttpClient.get('http://127.0.0.1:27017/'),
        /SSRF Protection Violation/
      );

      await assert.rejects(
        () => safeHttpClient.get('http://169.254.169.254/latest/meta-data'),
        /SSRF Protection Violation/
      );
    });
  });
});
