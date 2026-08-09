const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('./middleware/auth');
const path = require('path');

const scrapeRoute = require('./routes/scrape');
const screenshotRoute = require('./routes/screenshot');
const crawlRoute = require('./routes/crawl');
const mapRoute = require('./routes/map');
const searchRoute = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 3000;
const START_TIME = Date.now();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Static files (docs)
app.use(express.static(path.join(__dirname, '../docs')));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  message: { success: false, error: 'Too many requests' }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    version: '1.0.0',
    uptime: (Date.now() - START_TIME) / 1000,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/v1/', limiter, authMiddleware);
app.use('/v1/scrape', scrapeRoute);
app.use('/v1/screenshot', screenshotRoute);
app.use('/v1/crawl', crawlRoute);
app.use('/v1/map', mapRoute);
app.use('/v1/search', searchRoute);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 agent-api running on port ${PORT}`);
  if (process.env.API_KEY) {
    console.log(`🔒 Authentication enabled`);
  } else {
    console.log(`🔓 Running in self-hosted mode (no auth)`);
  }
});
