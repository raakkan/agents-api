const { chromium } = require('playwright');

// connectOverCDP() takes the HTTP debug endpoint — Playwright fetches /json/version
// to discover the WebSocket URL automatically. Do NOT use ws:// here.
const LIGHTPANDA_URL = process.env.LIGHTPANDA_URL || 'http://lightpanda:9222';
const CHROME_URL     = process.env.CHROME_URL     || 'http://chrome:3000';
const STEALTH_URL    = process.env.STEALTH_URL    || 'http://chrome-stealth:3000';

const BROWSER_URLS = {
  fast: LIGHTPANDA_URL,
  heavy: CHROME_URL,
  stealth: STEALTH_URL,
};

async function resolveWsEndpoint(endpointUrl) {
  try {
    const urlObj = new URL(endpointUrl);
    const versionUrl = `${urlObj.origin}/json/version${urlObj.search}`;
    const res = await fetch(versionUrl);
    if (res.ok) {
      const data = await res.json();
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
  } catch (err) {
    console.warn(`Could not fetch /json/version from ${endpointUrl}, using direct endpoint: ${err.message}`);
  }
  return endpointUrl;
}

async function getPage(profile = 'fast') {
  const wsEndpoint = BROWSER_URLS[profile] || LIGHTPANDA_URL;
  let endpointUrl = wsEndpoint;
  
  if ((profile === 'heavy' || profile === 'stealth') && process.env.API_KEY) {
    endpointUrl += `?token=${process.env.API_KEY}`;
  }
  
  try {
    const resolvedUrl = await resolveWsEndpoint(endpointUrl);
    const browser = await chromium.connectOverCDP(resolvedUrl);
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    return { browser, context, page };
  } catch (error) {
    console.error(`Error connecting to CDP profile '${profile}' at ${endpointUrl}:`, error);
    throw new Error(`Failed to connect to browser profile '${profile}': ${error.message}`);
  }
}

async function getPageWithFallback() {
  try {
    return await getPage('fast');
  } catch (error) {
    console.log('Fallback from fast to heavy profile');
    return await getPage('heavy');
  }
}

module.exports = {
  getPage,
  getPageWithFallback
};
