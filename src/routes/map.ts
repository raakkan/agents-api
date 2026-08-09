import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate';
import { MapSchema, MapRequest } from '../types';
import { getPageWithFallback } from '../utils/browser';

import { validateSafeUrl } from '../utils/ssrf';

const router = Router();

router.post('/', validate(MapSchema), async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body as MapRequest;
  let browserInstance;

  try {
    const targetUrl = validateSafeUrl(body.url);
    const { page, browser } = await getPageWithFallback('fast');
    browserInstance = browser;
    
    await page.goto(targetUrl, { timeout: body.timeout, waitUntil: 'domcontentloaded' });
    
    const links = await page.$$eval('a', (anchors) => {
      return Array.from(new Set(anchors.map(a => a.href).filter(h => h.startsWith('http'))));
    });

    const origin = new URL(body.url).origin;
    const internalLinks = links.filter(link => link.startsWith(origin)).slice(0, body.limit);
    
    res.json({ success: true, data: { links: internalLinks, count: internalLinks.length } });
  } catch (error) {
    next(error);
  } finally {
    if (browserInstance) {
      await browserInstance.close();
    }
  }
});

export default router;
