import { ApiError } from '../middleware/errorHandler';

// Private and reserved IP ranges (IPv4 & IPv6) + Docker internal service names
const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'searxng',
  'lightpanda',
  'chrome',
  'chrome-stealth',
  '169.254.169.254', // AWS / GCP / Azure metadata service
  'metadata.google.internal'
]);

export function validateSafeUrl(urlStr: string): string {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlStr);
  } catch {
    throw new ApiError(400, 'Invalid URL format');
  }

  // Only allow HTTP and HTTPS protocols
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new ApiError(400, 'Invalid URL protocol. Only HTTP and HTTPS are permitted');
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // Block internal service names and localhost
  if (BLOCKED_HOSTS.has(hostname)) {
    throw new ApiError(400, 'Security Error: Access to local or internal services is forbidden (SSRF Protection)');
  }

  // Block private IPv4 ranges:
  // 10.0.0.0 - 10.255.255.255
  // 172.16.0.0 - 172.31.255.255
  // 192.168.0.0 - 192.168.255.255
  // 127.0.0.0 - 127.255.255.255
  // 169.254.0.0 - 169.254.255.255 (link-local)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);
  if (match) {
    const [, p1, p2] = match.map(Number);
    if (
      p1 === 127 ||
      p1 === 10 ||
      p1 === 0 ||
      (p1 === 172 && p2 >= 16 && p2 <= 31) ||
      (p1 === 192 && p2 === 168) ||
      (p1 === 169 && p2 === 254)
    ) {
      throw new ApiError(400, 'Security Error: Access to private IP addresses is forbidden (SSRF Protection)');
    }
  }

  return urlStr;
}
