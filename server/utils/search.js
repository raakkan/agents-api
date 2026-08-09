const SEARXNG_URL = process.env.SEARXNG_URL || 'http://searxng:8080';

async function search({ query, limit = 5, lang = 'en', categories = ['general'] }) {
  if (!query) {
    throw new Error('Search query is required');
  }
  
  const searchUrl = new URL(`${SEARXNG_URL}/search`);
  searchUrl.searchParams.append('q', query);
  searchUrl.searchParams.append('format', 'json');
  searchUrl.searchParams.append('language', lang);
  searchUrl.searchParams.append('categories', categories.join(','));
  
  try {
    const response = await fetch(searchUrl.toString());
    if (!response.ok) {
      throw new Error(`SearXNG returned ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.results.slice(0, limit).map(res => ({
      title: res.title,
      url: res.url,
      snippet: res.content || '',
      description: res.content || '',
      position: res.position || 0
    }));
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

module.exports = { search };
