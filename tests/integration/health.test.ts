import request from 'supertest';
import app from '../../src/index';

describe('Health Endpoint', () => {
  it('should return 200 and health status', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        status: 'ok',
        version: expect.any(String)
      })
    );
  });
});
