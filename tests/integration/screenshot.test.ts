import request from 'supertest';
import app from '../../src/index';

jest.mock('../../src/utils/browser', () => ({
  getPage: jest.fn()
}));

import { getPage } from '../../src/utils/browser';

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

  it('should return a valid base64 screenshot', async () => {
    const mockBuffer = Buffer.from('mock-screenshot-data');
    const mockPage = {
      goto: jest.fn().mockResolvedValue(null),
      screenshot: jest.fn().mockResolvedValue(mockBuffer),
      close: jest.fn().mockResolvedValue(null)
    };
    
    (getPage as jest.Mock).mockResolvedValue(mockPage);

    const response = await request(app)
      .post('/v1/screenshot')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('screenshot', mockBuffer.toString('base64'));
    expect(response.body).toHaveProperty('mimeType', 'image/png');
    
    expect(getPage).toHaveBeenCalledWith('stealth');
    expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.any(Object));
  });
});
