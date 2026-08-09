import request from 'supertest';
import app from '../../src/index';

jest.mock('../../src/utils/crawlStore', () => ({
  createJob: jest.fn().mockReturnValue('mock-job-id'),
  getJob: jest.fn(),
  updateJob: jest.fn()
}));

jest.mock('../../src/utils/browser', () => ({
  getPage: jest.fn()
}));

import { createJob, getJob } from '../../src/utils/crawlStore';

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

    it('should create a crawl job and return jobId', async () => {
      const response = await request(app)
        .post('/v1/crawl')
        .send({ url: 'https://example.com' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('jobId', 'mock-job-id');
      expect(createJob).toHaveBeenCalledWith('https://example.com');
    });
  });

  describe('GET /v1/crawl/:id', () => {
    it('should return 404 for unknown job ID', async () => {
      (getJob as jest.Mock).mockReturnValueOnce(null);

      const response = await request(app).get('/v1/crawl/unknown-id');
        
      expect(response.status).toBe(404);
    });

    it('should return job status for valid ID', async () => {
      const mockJob = {
        id: 'mock-job-id',
        status: 'completed',
        data: { url: 'https://example.com', links: [] }
      };
      
      (getJob as jest.Mock).mockReturnValueOnce(mockJob);

      const response = await request(app).get('/v1/crawl/mock-job-id');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockJob);
      expect(getJob).toHaveBeenCalledWith('mock-job-id');
    });
  });
});
