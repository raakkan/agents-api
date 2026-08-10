import request from 'supertest';
import app from '../../src/index';
import { searchSearXNG } from '../../src/utils/search';

jest.mock('../../src/utils/search', () => ({
  searchSearXNG: jest.fn(),
  search: jest.fn()
}));

describe('Search API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 for empty query', async () => {
    const response = await request(app)
      .post('/v1/search')
      .send({});
      
    expect(response.status).toBe(400);
  });

  it('should return 200 with search result array for valid query', async () => {
    const mockResults = [
      {
        title: 'Test',
        url: 'https://test.com',
        content: 'Test snippet'
      }
    ];
    
    (searchSearXNG as jest.Mock).mockResolvedValueOnce(mockResults);

    const response = await request(app)
      .post('/v1/search')
      .send({ query: 'test query' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(mockResults);
  });
});
