import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate';
import { ScreenshotSchema, ScreenshotRequest } from '../types';
import { getPageWithFallback } from '../utils/browser';
import { HumanizeUtils } from '../utils/humanize';
import { CaptchaSolver } from '../utils/captcha';
import { validateSafeUrl } from '../utils/ssrf';

const router = Router();

router.post('/', validate(ScreenshotSchema), async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body as ScreenshotRequest;
  let browserInstance;

  try {
    const targetUrl = validateSafeUrl(body.url);
    const { page, browser } = await getPageWithFallback({
      profile: body.profile || 'heavy',
      proxy: body.proxy,
      viewport: { width: body.width, height: body.height }
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

    const buffer = await page.screenshot({
      fullPage: body.fullPage,
      type: body.format,
      quality: body.format === 'jpeg' ? body.quality : undefined,
    });

    res.setHeader('Content-Type', `image/${body.format}`);
    res.send(buffer);
  } catch (error) {
    next(error);
  } finally {
    if (browserInstance) {
      await browserInstance.close();
    }
  }
});

export default router;
