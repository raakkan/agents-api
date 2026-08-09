import request from 'supertest';
import app from '../../src/index';

jest.mock('../../src/utils/search', () => ({
  search: jest.fn()
}));

import { search } from '../../src/utils/search';

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
        snippet: 'Test snippet',
        description: 'Test snippet',
        position: 1
      }
    ];
    
    (search as jest.Mock).mockResolvedValueOnce(mockResults);

    const response = await request(app)
      .post('/v1/search')
      .send({ query: 'test query' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResults);
    expect(search).toHaveBeenCalledWith('test query');
  });
});
