import { env } from '../config/env';

export interface PlaywrightProxyConfig {
  server: string;
  username?: string;
  password?: string;
  bypass?: string;
}

export class ProxyManager {
  private static instance: ProxyManager;
  private proxies: string[] = [];
  private currentIndex = 0;
  private stickyMap = new Map<string, string>();

  private constructor() {
    this.reloadProxies();
  }

  public static getInstance(): ProxyManager {
    if (!ProxyManager.instance) {
      ProxyManager.instance = new ProxyManager();
    }
    return ProxyManager.instance;
  }

  public reloadProxies(): void {
    if (env.PROXY_LIST && env.PROXY_LIST.trim().length > 0) {
      this.proxies = env.PROXY_LIST.split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);
    } else {
      this.proxies = [];
    }
    this.currentIndex = 0;
  }

  /**
   * Parse a proxy URL string into Playwright's proxy object structure.
   * e.g. "http://user:pass@host:port" -> { server: "http://host:port", username: "user", password: "pass" }
   */
  public parseProxyString(proxyUrl: string): PlaywrightProxyConfig | undefined {
    if (!proxyUrl || !proxyUrl.trim()) return undefined;

    try {
      const url = new URL(proxyUrl);
      const server = `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}`;
      const username = url.username ? decodeURIComponent(url.username) : undefined;
      const password = url.password ? decodeURIComponent(url.password) : undefined;

      return {
        server,
        ...(username ? { username } : {}),
        ...(password ? { password } : {})
      };
    } catch {
      // Fallback: if it's already server string format
      return { server: proxyUrl };
    }
  }

  /**
   * Get the next proxy in round-robin sequence, or custom override if provided.
   */
  public getNextProxy(overrideProxy?: string): PlaywrightProxyConfig | undefined {
    if (overrideProxy) {
      return this.parseProxyString(overrideProxy);
    }

    if (!env.PROXY_ENABLED || this.proxies.length === 0) {
      return undefined;
    }

    const proxyStr = this.proxies[this.currentIndex % this.proxies.length];
    this.currentIndex++;
    return this.parseProxyString(proxyStr);
  }

  /**
   * Get a sticky proxy bound to a specific session ID (e.g. crawl job).
   */
  public getStickyProxy(sessionId: string, overrideProxy?: string): PlaywrightProxyConfig | undefined {
    if (overrideProxy) {
      return this.parseProxyString(overrideProxy);
    }

    if (!env.PROXY_ENABLED || this.proxies.length === 0) {
      return undefined;
    }

    if (!this.stickyMap.has(sessionId)) {
      const proxyStr = this.proxies[this.currentIndex % this.proxies.length];
      this.currentIndex++;
      this.stickyMap.set(sessionId, proxyStr);
    }

    const assignedProxy = this.stickyMap.get(sessionId)!;
    return this.parseProxyString(assignedProxy);
  }

  /**
   * Clear sticky session proxy binding.
   */
  public clearSticky(sessionId: string): void {
    this.stickyMap.delete(sessionId);
  }
}

export const proxyManager = ProxyManager.getInstance();
