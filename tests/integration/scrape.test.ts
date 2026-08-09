import request from 'supertest';
import app from '../../src/index';

jest.mock('../../src/utils/browser', () => ({
  getPage: jest.fn()
}));

import { getPage } from '../../src/utils/browser';

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
    const mockPage = {
      goto: jest.fn().mockResolvedValue(null),
      content: jest.fn().mockResolvedValue('<html><body>Test</body></html>'),
      title: jest.fn().mockResolvedValue('Test Title'),
      $$eval: jest.fn().mockResolvedValue(['https://link1.com']),
      close: jest.fn().mockResolvedValue(null)
    };
    
    (getPage as jest.Mock).mockResolvedValue(mockPage);

    const response = await request(app)
      .post('/v1/scrape')
      .send({ url: 'https://example.com', formats: ['markdown', 'html'] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('markdown');
    expect(response.body).toHaveProperty('html');
    expect(response.body).toHaveProperty('links');
    expect(response.body).toHaveProperty('metadata');
    
    expect(getPage).toHaveBeenCalled();
    expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.any(Object));
  });
});
