const express = require('express');
const router = express.Router();
const { getPage } = require('../utils/browser');

router.post('/', async (req, res) => {
  const { url, limit = 50, timeout = 30000 } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'url is required' });
  }

  let context;
  try {
    const browserData = await getPage('fast');
    context = browserData.context;
    const page = browserData.page;

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    
    const domain = new URL(page.url()).hostname; // Use actual final url
    
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]')).map(a => a.href);
    });
    
    const uniqueLinks = new Set();
    
    for (const link of links) {
      try {
        const urlObj = new URL(link);
        urlObj.hash = ''; // Remove fragments
        const cleanUrl = urlObj.toString();
        
        if (urlObj.hostname === domain) {
          const ext = cleanUrl.split('.').pop().toLowerCase();
          if (!['pdf', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'mp3', 'mp4'].includes(ext)) {
            uniqueLinks.add(cleanUrl);
          }
        }
      } catch (e) {
        // Ignore invalid URLs
      }
    }
    
    const urls = Array.from(uniqueLinks).slice(0, limit);
    
    res.json({
      success: true,
      data: {
        urls,
        count: urls.length,
        startUrl: page.url()
      }
    });
  } catch (error) {
    console.error('Map error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (context) {
      await context.close().catch(console.error);
    }
  }
});

module.exports = router;
