import { ProxyManager } from '../../src/utils/proxy';
import { HumanizeUtils } from '../../src/utils/humanize';
import { CaptchaSolver } from '../../src/utils/captcha';

describe('ProxyManager', () => {
  let proxyManager: ProxyManager;

  beforeEach(() => {
    proxyManager = ProxyManager.getInstance();
  });

  it('parses custom proxy URL string correctly', () => {
    const parsed = proxyManager.parseProxyString('http://admin:pass123@proxy.example.com:8080');
    expect(parsed).toBeDefined();
    expect(parsed?.server).toBe('http://proxy.example.com:8080');
    expect(parsed?.username).toBe('admin');
    expect(parsed?.password).toBe('pass123');
  });

  it('returns override proxy if supplied', () => {
    const override = 'http://custom:1234@override.com:9000';
    const result = proxyManager.getNextProxy(override);
    expect(result?.server).toBe('http://override.com:9000');
    expect(result?.username).toBe('custom');
    expect(result?.password).toBe('1234');
  });

  it('handles empty proxy configuration gracefully', () => {
    const result = proxyManager.getNextProxy();
    // Default env has PROXY_ENABLED=false
    expect(result).toBeUndefined();
  });
});

describe('HumanizeUtils', () => {
  it('delays execution within given bounds', async () => {
    const start = Date.now();
    await HumanizeUtils.delay(50, 100);
    const duration = Date.now() - start;
    expect(duration).toBeGreaterThanOrEqual(40);
  });
});

describe('CaptchaSolver', () => {
  it('returns error when API key is missing', async () => {
    const mockPage: any = {};
    const result = await CaptchaSolver.detectAndSolve(mockPage, { apiKey: '' });
    expect(result.solved).toBe(false);
    expect(result.error).toContain('API key is not configured');
  });
});
