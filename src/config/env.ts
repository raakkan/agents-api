import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_KEY: z.string().optional().default(''),
  SEARXNG_URL: z.string().default('http://searxng:8080'),
  LIGHTPANDA_URL: z.string().default('http://lightpanda:9222'),
  CHROME_URL: z.string().default('http://chrome:3000'),
  STEALTH_URL: z.string().default('http://chrome-stealth:3000'),
  PROXY_ENABLED: z.string().transform(v => v === 'true').default('false'),
  PROXY_LIST: z.string().optional().default(''),
  PROXY_STICKY_SESSIONS: z.string().transform(v => v === 'true').default('false'),
  CAPTCHA_SOLVER: z.enum(['capsolver', '2captcha', 'anticaptcha']).default('capsolver'),
  CAPTCHA_API_KEY: z.string().optional().default(''),
});

export const env = envSchema.parse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  API_KEY: process.env.API_KEY,
  SEARXNG_URL: process.env.SEARXNG_URL,
  LIGHTPANDA_URL: process.env.LIGHTPANDA_URL,
  CHROME_URL: process.env.CHROME_URL,
  STEALTH_URL: process.env.STEALTH_URL,
  PROXY_ENABLED: process.env.PROXY_ENABLED,
  PROXY_LIST: process.env.PROXY_LIST,
  PROXY_STICKY_SESSIONS: process.env.PROXY_STICKY_SESSIONS,
  CAPTCHA_SOLVER: process.env.CAPTCHA_SOLVER,
  CAPTCHA_API_KEY: process.env.CAPTCHA_API_KEY,
});
