import dns from 'dns';
import http from 'http';
import https from 'https';
import { URL } from 'url';

export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SsrfError';
  }
}

/**
 * Checks if an IPv4 address is in private, link-local, or loopback ranges.
 */
export function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return true; // invalid IPv4 is treated as unsafe
  }

  const [p0, p1] = parts;

  // 0.0.0.0/8 (Current network)
  if (p0 === 0) return true;

  // 10.0.0.0/8 (Private)
  if (p0 === 10) return true;

  // 100.64.0.0/10 (Shared address / Carrier-grade NAT)
  if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;

  // 127.0.0.0/8 (Loopback)
  if (p0 === 127) return true;

  // 169.254.0.0/16 (Link-local / AWS metadata 169.254.169.254)
  if (p0 === 169 && p1 === 254) return true;

  // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
  if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (p0 === 192 && p1 === 0 && parts[2] === 0) return true;

  // 192.0.2.0/24 (Documentation / TEST-NET-1)
  if (p0 === 192 && p1 === 0 && parts[2] === 2) return true;

  // 192.168.0.0/16 (Private)
  if (p0 === 192 && p1 === 168) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (p0 === 198 && (p1 === 18 || p1 === 19)) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (p0 === 198 && p1 === 51 && parts[2] === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (p0 === 203 && p1 === 0 && parts[2] === 113) return true;

  // 224.0.0.0/4 (Multicast)
  if (p0 >= 224 && p0 <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future use)
  if (p0 >= 240) return true;

  // 255.255.255.255 (Broadcast)
  if (ip === '255.255.255.255') return true;

  return false;
}

/**
 * Checks if an IPv6 address is in private, link-local, or loopback ranges.
 */
export function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback (::1) and Unspecified (::)
  if (normalized === '::1' || normalized === '::') return true;

  // IPv4-mapped IPv6 address (::ffff:192.0.2.1)
  if (normalized.startsWith('::ffff:')) {
    const ipv4Part = normalized.substring(7);
    return isPrivateIpv4(ipv4Part);
  }

  // Unique local address (fc00::/7 -> fc.. or fd..)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  // Link-local unicast (fe80::/10 -> fe8, fe9, fea, feb)
  if (/^fe[89ab]/i.test(normalized)) return true;

  // Multicast (ff00::/8)
  if (normalized.startsWith('ff')) return true;

  return false;
}

/**
 * Evaluates whether an IP address is private/reserved.
 */
export function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) {
    return isPrivateIpv6(ip);
  }
  return isPrivateIpv4(ip);
}

/**
 * Validates a URL against SSRF rules:
 * - Scheme must be http or https
 * - Hostname cannot be localhost or internal domain names
 * - Resolves DNS and ensures none of the resolved IPs are private/reserved
 */
export async function validateUrl(rawUrl: string): Promise<URL> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new SsrfError('Invalid URL format');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new SsrfError(`Unsupported protocol: ${parsedUrl.protocol}. Only HTTP and HTTPS are permitted.`);
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // Reject obvious local hostnames
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === 'metadata.google.internal' ||
    hostname === 'instance-data'
  ) {
    throw new SsrfError(`Access to internal hostname '${hostname}' is prohibited`);
  }

  // Check if hostname is already a direct IP address
  if (isPrivateIp(hostname)) {
    throw new SsrfError(`Direct access to private/reserved IP address '${hostname}' is prohibited`);
  }

  // Resolve hostname via DNS
  try {
    const addresses = await dns.promises.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      throw new SsrfError(`Could not resolve hostname '${hostname}'`);
    }

    for (const record of addresses) {
      if (isPrivateIp(record.address)) {
        throw new SsrfError(`Hostname '${hostname}' resolves to restricted IP address '${record.address}'`);
      }
    }
  } catch (err: any) {
    if (err instanceof SsrfError) {
      throw err;
    }
    throw new SsrfError(`DNS resolution failed for '${hostname}': ${err.message}`);
  }

  return parsedUrl;
}

export interface SafeFetchOptions {
  maxRedirects?: number;
  timeoutMs?: number;
  maxSizeBytes?: number;
  headers?: Record<string, string>;
}

export interface SafeFetchResult {
  data: string;
  contentType: string;
  finalUrl: string;
  statusCode: number;
}

const DEFAULT_MAX_REDIRECTS = 3;
const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds
const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Performs an HTTP/HTTPS GET request safely with SSRF protection,
 * redirect restrictions, timeout, and response size limits.
 */
export async function safeFetch(
  targetUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;

  let currentUrl = targetUrl;
  let redirectsCount = 0;

  while (redirectsCount <= maxRedirects) {
    const validatedUrl = await validateUrl(currentUrl);
    const isHttps = validatedUrl.protocol === 'https:';
    const requestModule = isHttps ? https : http;

    const result = await new Promise<SafeFetchResult | { redirectUrl: string }>((resolve, reject) => {
      const req = requestModule.get(
        validatedUrl.toString(),
        {
          headers: {
            'User-Agent': 'AICareerCoach/1.0 (JobPostingParser)',
            Accept: 'text/html,text/plain,application/json,*/*',
            ...(options.headers || {}),
          },
          timeout: timeoutMs,
        },
        (res) => {
          const statusCode = res.statusCode || 200;

          // Check redirects (301, 302, 303, 307, 308)
          if ([301, 302, 303, 307, 308].includes(statusCode)) {
            const location = res.headers.location;
            if (!location) {
              return reject(new SsrfError(`Redirect status ${statusCode} with no Location header`));
            }
            const nextUrl = new URL(location, validatedUrl).toString();
            res.resume(); // consume stream to free memory
            return resolve({ redirectUrl: nextUrl });
          }

          if (statusCode >= 400) {
            res.resume();
            return reject(new Error(`HTTP error ${statusCode} fetching URL: ${currentUrl}`));
          }

          const contentLengthHeader = res.headers['content-length'];
          if (contentLengthHeader && parseInt(contentLengthHeader, 10) > maxSizeBytes) {
            res.resume();
            return reject(new SsrfError(`Response exceeds maximum size limit of ${maxSizeBytes} bytes`));
          }

          const contentType = res.headers['content-type'] || 'text/plain';
          let totalBytes = 0;
          const chunks: Buffer[] = [];

          res.on('data', (chunk: Buffer) => {
            totalBytes += chunk.length;
            if (totalBytes > maxSizeBytes) {
              req.destroy(new SsrfError(`Response exceeded maximum allowed size of ${maxSizeBytes} bytes`));
              return;
            }
            chunks.push(chunk);
          });

          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf-8');
            resolve({
              data: body,
              contentType,
              finalUrl: validatedUrl.toString(),
              statusCode,
            });
          });

          res.on('error', (err) => {
            reject(err);
          });
        }
      );

      req.on('timeout', () => {
        req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
      });

      req.on('error', (err) => {
        reject(err);
      });
    });

    if ('redirectUrl' in result) {
      redirectsCount++;
      if (redirectsCount > maxRedirects) {
        throw new SsrfError(`Too many redirects: exceeded limit of ${maxRedirects}`);
      }
      currentUrl = result.redirectUrl;
    } else {
      return result;
    }
  }

  throw new SsrfError(`Exceeded maximum redirect limit of ${maxRedirects}`);
}
