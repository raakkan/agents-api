import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate';
import { ScrapeSchema, ScrapeRequest } from '../types';
import { getPageWithFallback } from '../utils/browser';
import { HumanizeUtils } from '../utils/humanize';
import { CaptchaSolver } from '../utils/captcha';
import { validateSafeUrl } from '../utils/ssrf';
import TurndownService from 'turndown';

const router = Router();
const turndownService = new TurndownService();

router.post('/', validate(ScrapeSchema), async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body as ScrapeRequest;
  let browserInstance;
  
  try {
    const targetUrl = validateSafeUrl(body.url);
    const { page, browser } = await getPageWithFallback({
      profile: body.profile,
      proxy: body.proxy
    });
    browserInstance = browser;
    
    await page.goto(targetUrl, { timeout: body.timeout, waitUntil: 'domcontentloaded' });
    
    await CaptchaSolver.waitForChallenge(page, body.captchaWaitTimeout);

    if (body.humanize) {
      await HumanizeUtils.applyHumanBehavior(page);
    }

    if (body.solveCaptcha) {
      await CaptchaSolver.detectAndSolve(page, { solver: body.captchaSolver, waitTimeout: body.captchaWaitTimeout });
    }

    if (body.waitFor) {
      if (typeof body.waitFor === 'number') {
        await page.waitForTimeout(body.waitFor);
      } else {
        await page.waitForSelector(body.waitFor, { timeout: body.timeout });
      }
    }

    const targetElement = body.selector ? page.locator(body.selector) : page.locator('body');
    const result: any = {};

    if (body.formats.includes('html')) {
      result.html = await targetElement.innerHTML();
    }
    
    if (body.formats.includes('text')) {
      result.text = await targetElement.innerText();
    }

    if (body.formats.includes('markdown')) {
      const html = await targetElement.innerHTML();
      result.markdown = turndownService.turndown(html);
    }
    
    if (body.formats.includes('links')) {
      result.links = await page.$$eval('a', (anchors) => anchors.map(a => a.href).filter(href => href));
    }
    
    if (body.formats.includes('screenshot')) {
      const buffer = await page.screenshot({ type: 'png', fullPage: true });
      result.screenshot = buffer.toString('base64');
    }

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  } finally {
    if (browserInstance) {
      await browserInstance.close();
    }
  }
});

export default router;
