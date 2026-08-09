import request from 'supertest';
import app from '../../src/index';

jest.mock('../../src/utils/browser', () => ({
  getPage: jest.fn()
}));

import { getPage } from '../../src/utils/browser';

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
      ]),
      close: jest.fn().mockResolvedValue(null)
    };
    
    (getPage as jest.Mock).mockResolvedValue(mockPage);

    const response = await request(app)
      .post('/v1/map')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('links');
    expect(response.body.links).toHaveLength(3);
    expect(response.body.links).toContain('https://example.com/about');
    
    expect(getPage).toHaveBeenCalled();
    expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.any(Object));
  });
});
