import { search } from '../../src/utils/search';

// Mock the global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Search Utility', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('transforms SearXNG response correctly', async () => {
    const mockSearxngResponse = {
      results: [
        {
          title: 'Test Title 1',
          url: 'https://test1.com',
          content: 'Test snippet 1',
          score: 1.0
        },
        {
          title: 'Test Title 2',
          url: 'https://test2.com',
          content: 'Test snippet 2',
          score: 0.9
        }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearxngResponse
    } as Response);

    const results = await search('test query');
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      title: 'Test Title 1',
      url: 'https://test1.com',
      snippet: 'Test snippet 1',
      description: 'Test snippet 1',
      position: 1
    });
    expect(results[1]).toEqual({
      title: 'Test Title 2',
      url: 'https://test2.com',
      snippet: 'Test snippet 2',
      description: 'Test snippet 2',
      position: 2
    });
  });

  it('handles fetch failures gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    await expect(search('test query')).rejects.toThrow('Network error');
  });

  it('handles HTTP error status codes gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Error content'
    } as Response);
    
    await expect(search('test query')).rejects.toThrow('SearXNG error: 500 Internal Server Error');
  });
});
