import { z } from 'zod';
import { ScrapeSchema, ScreenshotSchema, CrawlSchema, MapSchema, SearchSchema } from '../../src/types';

describe('Validation Schemas', () => {
  describe('ScrapeSchema', () => {
    it('should parse valid payload with anti-bot options', () => {
      const payload = {
        url: 'https://example.com',
        humanize: true,
        solveCaptcha: true,
        captchaSolver: 'capsolver',
        proxy: 'http://usr:pwd@host:8080'
      };
      const result = ScrapeSchema.parse(payload);
      expect(result.url).toBe('https://example.com');
      expect(result.humanize).toBe(true);
      expect(result.solveCaptcha).toBe(true);
      expect(result.captchaSolver).toBe('capsolver');
      expect(result.proxy).toBe('http://usr:pwd@host:8080');
      // Check defaults
      expect(result.formats).toEqual(['markdown']);
    });

    it('should throw on missing url', () => {
      expect(() => ScrapeSchema.parse({})).toThrow(z.ZodError);
    });

    it('should throw on invalid url format', () => {
      expect(() => ScrapeSchema.parse({ url: 'not-a-url' })).toThrow(z.ZodError);
    });
  });

  describe('ScreenshotSchema', () => {
    it('should parse valid payload with anti-bot options', () => {
      const payload = { url: 'https://example.com', humanize: true };
      const result = ScreenshotSchema.parse(payload);
      expect(result.url).toBe('https://example.com');
      expect(result.humanize).toBe(true);
    });

    it('should throw on missing url', () => {
      expect(() => ScreenshotSchema.parse({})).toThrow(z.ZodError);
    });
  });

  describe('CrawlSchema', () => {
    it('should parse valid payload', () => {
      const payload = { url: 'https://example.com' };
      const result = CrawlSchema.parse(payload);
      expect(result.url).toBe('https://example.com');
      expect(result.maxPages).toBe(10);
    });
  });

  describe('MapSchema', () => {
    it('should parse valid payload', () => {
      const payload = { url: 'https://example.com' };
      const result = MapSchema.parse(payload);
      expect(result.url).toBe('https://example.com');
    });
  });

  describe('SearchSchema', () => {
    it('should parse valid payload', () => {
      const payload = { query: 'test query' };
      const result = SearchSchema.parse(payload);
      expect(result.query).toBe('test query');
    });

    it('should throw on missing query', () => {
      expect(() => SearchSchema.parse({})).toThrow(z.ZodError);
    });
  });
});
