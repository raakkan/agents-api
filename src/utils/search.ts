import { env } from '../config/env';
import { ApiError } from '../middleware/errorHandler';

export interface SearchResult {
  title: string;
  url: string;
  content?: string;
  engine?: string;
  parsed_url?: string[];
  template?: string;
  engines?: string[];
  positions?: number[];
  score?: number;
  category?: string;
}

export async function searchSearXNG(
  query: string,
  limit: number = 5,
  lang: string = 'en',
  categories: string[] = ['general']
): Promise<SearchResult[]> {
  try {
    const searchUrl = new URL(`${env.SEARXNG_URL}/search`);
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('format', 'json');
    searchUrl.searchParams.append('language', lang);
    searchUrl.searchParams.append('categories', categories.join(','));

    const response = await fetch(searchUrl.toString());
    if (!response.ok) {
      throw new Error(`SearXNG returned ${response.status}`);
    }

    const data = await response.json();
    return data.results ? data.results.slice(0, limit) : [];
  } catch (error: any) {
    throw new ApiError(500, 'Search failed', { error: error.message });
  }
}

export const search = searchSearXNG;

