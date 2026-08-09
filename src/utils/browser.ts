import { chromium, Browser, Page } from 'playwright';
import { env } from '../config/env';
import { ApiError } from '../middleware/errorHandler';

export type BrowserProfile = 'fast' | 'heavy' | 'stealth';

export async function resolveWsEndpoint(profile: BrowserProfile): Promise<string> {
  let baseUrl: string;
  switch (profile) {
    case 'fast':
      baseUrl = env.LIGHTPANDA_URL;
      break;
    case 'heavy':
      baseUrl = env.CHROME_URL;
      break;
    case 'stealth':
      baseUrl = env.STEALTH_URL;
      break;
    default:
      baseUrl = env.LIGHTPANDA_URL;
  }

  let endpointUrl = baseUrl;
  if ((profile === 'heavy' || profile === 'stealth') && env.API_KEY) {
    endpointUrl += `?token=${env.API_KEY}`;
  }

  try {
    const urlObj = new URL(endpointUrl);
    const versionUrl = `${urlObj.origin}/json/version${urlObj.search}`;
    const res = await fetch(versionUrl);
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.webSocketDebuggerUrl) {
        const wsUrl = new URL(data.webSocketDebuggerUrl);
        wsUrl.hostname = urlObj.hostname;
        wsUrl.port = urlObj.port || wsUrl.port;
        if (urlObj.search) {
          wsUrl.search = urlObj.search;
        }
        return wsUrl.toString();
      }
    }
  } catch (err: any) {
    console.warn(`Could not fetch /json/version from ${endpointUrl}: ${err.message}`);
  }

  return endpointUrl;
}

export async function getBrowser(profile: BrowserProfile = 'fast'): Promise<Browser> {
  const wsEndpoint = await resolveWsEndpoint(profile);
  try {
    const browser = await chromium.connectOverCDP(wsEndpoint);
    return browser;
  } catch (error: any) {
    console.error(`Error connecting to browser profile '${profile}' at ${wsEndpoint}:`, error);
    throw new ApiError(500, `Failed to connect to browser profile: ${profile}`);
  }
}

export async function getPageWithFallback(profile: BrowserProfile = 'fast'): Promise<{ page: Page; browser: Browser }> {
  try {
    const browser = await getBrowser(profile);
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    return { page, browser };
  } catch (error) {
    if (profile !== 'heavy') {
      console.warn(`Failed with profile '${profile}', falling back to 'heavy'`);
      return getPageWithFallback('heavy');
    }
    throw error;
  }
}
