import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { validate } from '../middleware/validate';
import { CrawlSchema, CrawlRequest } from '../types';
import { crawlStore } from '../utils/crawlStore';
import { getPageWithFallback } from '../utils/browser';
import { HumanizeUtils } from '../utils/humanize';
import { CaptchaSolver } from '../utils/captcha';
import { validateSafeUrl } from '../utils/ssrf';

const router = Router();

router.post('/', validate(CrawlSchema), async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body as CrawlRequest;
  
  try {
    const startUrl = validateSafeUrl(body.url);
    const jobId = uuidv4();

    crawlStore.create({
      id: jobId,
      status: 'pending',
      url: body.url,
      maxPages: body.maxPages,
      formats: body.formats,
      pagesScraped: 0,
      totalPages: 0,
      results: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    res.status(202).json({ success: true, jobId, message: 'Crawl job started' });

    // Async crawl process
    (async () => {
      let browserInstance;
      try {
        crawlStore.update(jobId, { status: 'running' });
        const { page, browser } = await getPageWithFallback({
          profile: 'heavy',
          proxy: body.proxy,
          sessionId: jobId
        });
        browserInstance = browser;
        
        const visited = new Set<string>();
        const queue = [startUrl];
        const results: any[] = [];
        let pagesScraped = 0;
        
        while (queue.length > 0 && pagesScraped < body.maxPages) {
          const currentUrl = queue.shift()!;
          if (visited.has(currentUrl)) continue;
          visited.add(currentUrl);

          try {
            await page.goto(currentUrl, { timeout: body.timeout, waitUntil: 'domcontentloaded' });
            
            if (body.humanize) {
              await HumanizeUtils.applyHumanBehavior(page);
            }

            if (body.solveCaptcha) {
              await CaptchaSolver.detectAndSolve(page, { solver: body.captchaSolver });
            }

            const result: any = { url: currentUrl };
            
            if (body.formats.includes('html')) result.html = await page.content();
            if (body.formats.includes('text')) result.text = await page.innerText('body');
            
            results.push(result);
            pagesScraped++;
            
            crawlStore.update(jobId, { pagesScraped, totalPages: queue.length + visited.size, results });

            // Find more links
            const links = await page.$$eval('a', anchors => anchors.map(a => a.href));
            for (const link of links) {
              if (link.startsWith(new URL(startUrl).origin) && !visited.has(link)) {
                queue.push(link);
              }
            }
          } catch (e) {
            console.error(`Error crawling ${currentUrl}:`, e);
          }
        }
        
        crawlStore.update(jobId, { status: 'completed', results, pagesScraped });
      } catch (error: any) {
        crawlStore.update(jobId, { status: 'failed', error: error.message });
      } finally {
        if (browserInstance) await browserInstance.close();
      }
    })();
  } catch (error) {
    next(error);
  }
});

router.get('/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = crawlStore.get(jobId);
  
  if (!job) {
    res.status(404).json({ success: false, error: 'Job not found' });
    return;
  }
  
  res.json({ success: true, data: job });
  return;
});

export default router;
