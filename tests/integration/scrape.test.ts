import request from 'supertest';
import app from '../../src/index';
import { getPageWithFallback } from '../../src/utils/browser';

jest.mock('../../src/utils/browser', () => ({
  getPageWithFallback: jest.fn(),
  getPage: jest.fn()
}));

describe('Scrape API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 for invalid/missing URL', async () => {
    const response = await request(app)
      .post('/v1/scrape')
      .send({});
      
    expect(response.status).toBe(400);
  });

  it('should scrape successfully and return expected JSON structure', async () => {
    const mockLocator = {
      innerHTML: jest.fn().mockResolvedValue('<h1>Test</h1>'),
      innerText: jest.fn().mockResolvedValue('Test')
    };

    const mockPage = {
      goto: jest.fn().mockResolvedValue(null),
      locator: jest.fn().mockReturnValue(mockLocator),
      $$eval: jest.fn().mockResolvedValue(['https://link1.com']),
      screenshot: jest.fn().mockResolvedValue(Buffer.from('base64img')),
      waitForTimeout: jest.fn(),
      waitForSelector: jest.fn()
    };

    const mockBrowser = {
      close: jest.fn().mockResolvedValue(null)
    };
    
    (getPageWithFallback as jest.Mock).mockResolvedValue({
      page: mockPage,
      browser: mockBrowser
    });

    const response = await request(app)
      .post('/v1/scrape')
      .send({ url: 'https://example.com', formats: ['markdown', 'html', 'links'] });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('markdown');
    expect(response.body.data).toHaveProperty('html');
    expect(response.body.data).toHaveProperty('links');
    
    expect(getPageWithFallback).toHaveBeenCalled();
    expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.any(Object));
  });
});
