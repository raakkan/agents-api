const express = require('express');
const router = express.Router();
const { getPage } = require('../utils/browser');
const TurndownService = require('turndown');

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

router.post('/', async (req, res) => {
  const { url, formats = ['markdown'], waitFor, selector, mobile = false, profile = 'fast', timeout = 30000 } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'url is required' });
  }

  let context;
  try {
    const browserData = await getPage(profile);
    context = browserData.context;
    const page = browserData.page;

    // Set mobile viewport if requested
    if (mobile) {
      await page.setViewportSize({ width: 375, height: 812 });
    }

    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

    if (waitFor) {
      if (typeof waitFor === 'number') {
        await page.waitForTimeout(waitFor);
      } else if (typeof waitFor === 'string') {
        try {
          await page.waitForSelector(waitFor, { timeout: 5000 });
        } catch (e) {
          console.warn(`waitForSelector ${waitFor} timed out`);
        }
      }
    }

    const data = {};
    let htmlContent = '';

    if (formats.includes('html') || formats.includes('markdown')) {
      if (selector) {
        try {
          htmlContent = await page.$eval(selector, el => el.outerHTML);
        } catch (e) {
          htmlContent = '';
        }
      } else {
        htmlContent = await page.content();
      }
    }

    if (formats.includes('html')) data.html = htmlContent;
    if (formats.includes('markdown')) data.markdown = turndownService.turndown(htmlContent);
    if (formats.includes('text')) {
      data.text = await page.evaluate(() => document.body.innerText);
    }
    
    if (formats.includes('links')) {
      data.links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href^="http"]')).map(a => ({
          text: a.innerText.trim(),
          href: a.href
        }));
      });
    }

    if (formats.includes('screenshot')) {
      const buffer = await page.screenshot({ fullPage: true });
      data.screenshot = buffer.toString('base64');
      data.screenshotMimeType = 'image/png';
    }

    data.metadata = {
      title: await page.title(),
      url: page.url(),
      statusCode: response ? response.status() : 200
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Scrape error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (context) {
      await context.close().catch(console.error);
    }
  }
});

module.exports = router;
