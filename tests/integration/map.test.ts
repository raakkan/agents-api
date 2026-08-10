import request from 'supertest';
import app from '../../src/index';
import { getPageWithFallback } from '../../src/utils/browser';

jest.mock('../../src/utils/browser', () => ({
  getPageWithFallback: jest.fn(),
  getPage: jest.fn()
}));

describe('Map API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 for invalid/missing URL', async () => {
    const response = await request(app)
      .post('/v1/map')
      .send({});
      
    expect(response.status).toBe(400);
  });

  it('should map website and return sitemap links', async () => {
    const mockPage = {
      goto: jest.fn().mockResolvedValue(null),
      $$eval: jest.fn().mockResolvedValue([
        'https://example.com/',
        'https://example.com/about',
        'https://example.com/contact'
      ])
    };
    const mockBrowser = {
      close: jest.fn().mockResolvedValue(null)
    };
    
    (getPageWithFallback as jest.Mock).mockResolvedValue({
      page: mockPage,
      browser: mockBrowser
    });

    const response = await request(app)
      .post('/v1/map')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('links');
    expect(response.body.data.links).toHaveLength(3);
    expect(response.body.data.links).toContain('https://example.com/about');
    
    expect(getPageWithFallback).toHaveBeenCalled();
    expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.any(Object));
  });
});
