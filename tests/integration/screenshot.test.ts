import request from 'supertest';
import app from '../../src/index';
import { getPageWithFallback } from '../../src/utils/browser';

jest.mock('../../src/utils/browser', () => ({
  getPageWithFallback: jest.fn(),
  getPage: jest.fn()
}));

describe('Screenshot API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 for invalid/missing URL', async () => {
    const response = await request(app)
      .post('/v1/screenshot')
      .send({});
      
    expect(response.status).toBe(400);
  });

  it('should return a valid screenshot image buffer', async () => {
    const mockBuffer = Buffer.from('mock-screenshot-data');
    const mockPage = {
      goto: jest.fn().mockResolvedValue(null),
      screenshot: jest.fn().mockResolvedValue(mockBuffer)
    };
    const mockBrowser = {
      close: jest.fn().mockResolvedValue(null)
    };
    
    (getPageWithFallback as jest.Mock).mockResolvedValue({
      page: mockPage,
      browser: mockBrowser
    });

    const response = await request(app)
      .post('/v1/screenshot')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('image/png');
    expect(response.body).toEqual(mockBuffer);
    
    expect(getPageWithFallback).toHaveBeenCalled();
    expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.any(Object));
  });
});
