import request from 'supertest';
import app from '../../src/index';
import { crawlStore } from '../../src/utils/crawlStore';

jest.mock('../../src/utils/browser', () => ({
  getPageWithFallback: jest.fn().mockResolvedValue({
    page: {
      goto: jest.fn().mockResolvedValue(null),
      content: jest.fn().mockResolvedValue('<html><body>Test</body></html>'),
      innerText: jest.fn().mockResolvedValue('Test'),
      $$eval: jest.fn().mockResolvedValue([])
    },
    browser: {
      close: jest.fn().mockResolvedValue(null)
    }
  }),
  getPage: jest.fn()
}));

describe('Crawl API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /v1/crawl', () => {
    it('should return 400 for invalid/missing URL', async () => {
      const response = await request(app)
        .post('/v1/crawl')
        .send({});
        
      expect(response.status).toBe(400);
    });

    it('should create a crawl job and return 202 with jobId', async () => {
      const response = await request(app)
        .post('/v1/crawl')
        .send({ url: 'https://example.com' });

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('jobId');
    });
  });

  describe('GET /v1/crawl/:id', () => {
    it('should return 404 for unknown job ID', async () => {
      const response = await request(app).get('/v1/crawl/unknown-id');
        
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return job status for valid ID', async () => {
      const jobId = 'test-job-123';
      crawlStore.create({
        id: jobId,
        status: 'pending',
        url: 'https://example.com',
        maxPages: 10,
        formats: ['markdown'],
        pagesScraped: 0,
        totalPages: 0,
        results: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      const response = await request(app).get(`/v1/crawl/${jobId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(jobId);
    });
  });
});
