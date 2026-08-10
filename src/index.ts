import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { auth } from './middleware/auth';

import scrapeRoute from './routes/scrape';
import screenshotRoute from './routes/screenshot';
import crawlRoute from './routes/crawl';
import mapRoute from './routes/map';
import searchRoute from './routes/search';

const app = express();

// Security and middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Auth middleware for all v1 API routes
app.use('/v1', auth);

// Routes
app.use('/v1/scrape', scrapeRoute);
app.use('/v1/screenshot', screenshotRoute);
app.use('/v1/crawl', crawlRoute);
app.use('/v1/map', mapRoute);
app.use('/v1/search', searchRoute);

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', version: '1.0.0', uptime: process.uptime() });
});

// Serve static docs at root
app.use(express.static(path.join(__dirname, '../docs')));

// Central error handler
app.use(errorHandler);

if (env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
}

export default app;

