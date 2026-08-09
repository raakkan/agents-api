import { z } from 'zod';
import { scrapeSchema, screenshotSchema, crawlSchema, mapSchema, searchSchema } from '../../src/validation';

describe('Validation Schemas', () => {
  describe('scrapeSchema', () => {
    it('should parse valid payload', () => {
      const payload = { url: 'https://example.com' };
      const result = scrapeSchema.parse(payload);
      expect(result.url).toBe('https://example.com');
      // Check defaults
      expect(result.formats).toEqual(['markdown']);
    });

    it('should throw on missing url', () => {
      expect(() => scrapeSchema.parse({})).toThrow(z.ZodError);
    });

    it('should throw on invalid url format', () => {
      expect(() => scrapeSchema.parse({ url: 'not-a-url' })).toThrow(z.ZodError);
    });
  });

  describe('screenshotSchema', () => {
    it('should parse valid payload', () => {
      const payload = { url: 'https://example.com' };
      const result = screenshotSchema.parse(payload);
      expect(result.url).toBe('https://example.com');
    });

    it('should throw on missing url', () => {
      expect(() => screenshotSchema.parse({})).toThrow(z.ZodError);
    });
  });

  describe('crawlSchema', () => {
    it('should parse valid payload', () => {
      const payload = { url: 'https://example.com' };
      const result = crawlSchema.parse(payload);
      expect(result.url).toBe('https://example.com');
      expect(result.limit).toBe(5);
    });
  });

  describe('mapSchema', () => {
    it('should parse valid payload', () => {
      const payload = { url: 'https://example.com' };
      const result = mapSchema.parse(payload);
      expect(result.url).toBe('https://example.com');
    });
  });

  describe('searchSchema', () => {
    it('should parse valid payload', () => {
      const payload = { query: 'test query' };
      const result = searchSchema.parse(payload);
      expect(result.query).toBe('test query');
    });

    it('should throw on missing query', () => {
      expect(() => searchSchema.parse({})).toThrow(z.ZodError);
    });
  });
});
