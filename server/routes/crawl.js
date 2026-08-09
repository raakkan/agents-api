const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getPage } = require('../utils/browser');
const TurndownService = require('turndown');

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

const jobs = new Map();

async function processCrawl(jobId, startUrl, maxPages, formats, timeout) {
  const job = jobs.get(jobId);
  const queue = [startUrl];
  const visited = new Set([startUrl]);
  const results = [];
  const domain = new URL(startUrl).hostname;

  try {
    while (queue.length > 0 && results.length < maxPages) {
      const currentUrl = queue.shift();
      let context;
      
      try {
        const browserData = await getPage('fast');
        context = browserData.context;
        const page = browserData.page;
        
        await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout });
        
        const html = await page.content();
        const data = { url: currentUrl, title: await page.title() };
        
        if (formats.includes('html')) data.html = html;
        if (formats.includes('markdown')) data.markdown = turndownService.turndown(html);
        if (formats.includes('text')) data.text = await page.evaluate(() => document.body.innerText);
        
        results.push(data);
        
        job.progress.crawled = results.length;
        
        // Find links
        const links = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a[href]')).map(a => a.href);
        });
        
        for (const link of links) {
          try {
            const urlObj = new URL(link);
            urlObj.hash = ''; // Remove fragments
            const cleanUrl = urlObj.toString();
            
            if (urlObj.hostname === domain && !visited.has(cleanUrl)) {
              // Exclude binary extensions
              const ext = cleanUrl.split('.').pop().toLowerCase();
              if (!['pdf', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'mp3', 'mp4'].includes(ext)) {
                visited.add(cleanUrl);
                queue.push(cleanUrl);
              }
            }
          } catch (e) {
            // Invalid URL, ignore
          }
        }
      } catch (err) {
        console.error(`Error crawling ${currentUrl}:`, err);
      } finally {
        if (context) await context.close().catch(console.error);
      }
    }
    
    job.status = 'completed';
    job.data = results;
    job.completedAt = new Date().toISOString();
  } catch (error) {
    job.status = 'failed';
    job.error = error.message;
    job.completedAt = new Date().toISOString();
  }
}

router.post('/', (req, res) => {
  const { url, maxPages = 10, formats = ['markdown'], timeout = 30000 } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'url is required' });
  }

  const id = uuidv4();
  
  jobs.set(id, {
    id,
    status: 'running',
    progress: { crawled: 0, total: maxPages },
    createdAt: new Date().toISOString(),
    completedAt: null,
    data: null,
    error: null
  });

  // Start background processing
  processCrawl(id, url, maxPages, formats, timeout);

  res.json({ success: true, id });
});

router.get('/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }
  res.json({ success: true, ...job });
});

module.exports = router;
