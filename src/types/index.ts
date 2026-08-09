import { z } from 'zod';

export const ScrapeSchema = z.object({
  url: z.string().url(),
  formats: z.array(z.enum(['markdown', 'html', 'text', 'links', 'screenshot'])).default(['markdown']),
  waitFor: z.union([z.number(), z.string()]).optional(),
  selector: z.string().optional(),
  mobile: z.boolean().default(false),
  profile: z.enum(['fast', 'heavy', 'stealth']).default('fast'),
  timeout: z.number().default(30000)
});
export type ScrapeRequest = z.infer<typeof ScrapeSchema>;

export const ScreenshotSchema = z.object({
  url: z.string().url(),
  fullPage: z.boolean().default(true),
  width: z.number().default(1280),
  height: z.number().default(800),
  format: z.enum(['png', 'jpeg']).default('png'),
  quality: z.number().min(1).max(100).default(90),
  darkMode: z.boolean().default(false),
  mobile: z.boolean().default(false),
  waitFor: z.union([z.number(), z.string()]).optional(),
  timeout: z.number().default(30000)
});
export type ScreenshotRequest = z.infer<typeof ScreenshotSchema>;

export const CrawlSchema = z.object({
  url: z.string().url(),
  maxPages: z.number().min(1).max(100).default(10),
  formats: z.array(z.enum(['markdown', 'html', 'text'])).default(['markdown']),
  timeout: z.number().default(30000)
});
export type CrawlRequest = z.infer<typeof CrawlSchema>;

export const MapSchema = z.object({
  url: z.string().url(),
  limit: z.number().min(1).max(500).default(50),
  timeout: z.number().default(30000)
});
export type MapRequest = z.infer<typeof MapSchema>;

export const SearchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(50).default(5),
  lang: z.string().default('en'),
  categories: z.array(z.string()).default(['general'])
});
export type SearchRequest = z.infer<typeof SearchSchema>;

export interface CrawlJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  url: string;
  maxPages: number;
  formats: string[];
  pagesScraped: number;
  totalPages: number;
  results: any[];
  error?: string;
  createdAt: number;
  updatedAt: number;
}
