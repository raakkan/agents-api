const express = require('express');
const router = express.Router();
const { getPage } = require('../utils/browser');

router.post('/', async (req, res) => {
  const { url, fullPage = true, width = 1280, height = 800, format = 'png', quality = 90, darkMode = false, mobile = false, waitFor, timeout = 30000 } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'url is required' });
  }

  let context;
  try {
    const browserData = await getPage('stealth');
    context = browserData.context;
    const page = browserData.page;

    const viewportWidth = mobile ? 375 : width;
    const viewportHeight = mobile ? 812 : height;
    
    await page.setViewportSize({ width: viewportWidth, height: viewportHeight });
    await page.emulateMedia({ colorScheme: darkMode ? 'dark' : 'light' });

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout });
    } catch (e) {
      console.log('networkidle timeout, falling back to domcontentloaded');
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 });
      } catch (err) {
        // Continue anyway if we have some content
      }
    }

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

    const screenshotOptions = { fullPage, type: format === 'jpeg' ? 'jpeg' : 'png' };
    if (format === 'jpeg') screenshotOptions.quality = quality;

    const buffer = await page.screenshot(screenshotOptions);

    res.json({
      success: true,
      data: {
        screenshot: buffer.toString('base64'),
        mimeType: `image/${screenshotOptions.type}`,
        width: viewportWidth,
        height: viewportHeight,
        fullPage,
        url: page.url(),
        title: await page.title()
      }
    });
  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (context) {
      await context.close().catch(console.error);
    }
  }
});

module.exports = router;
