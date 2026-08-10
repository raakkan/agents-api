import { Page } from 'patchright';
import { env } from '../config/env';

export interface CaptchaSolveResult {
  solved: boolean;
  type?: 'turnstile' | 'recaptcha' | 'hcaptcha' | 'unknown';
  token?: string;
  error?: string;
}

export class CaptchaSolver {
  /**
   * Main method to detect and auto-solve any CAPTCHA challenge present on the page.
   */
  public static async detectAndSolve(
    page: Page,
    options?: { solver?: 'capsolver' | '2captcha' | 'anticaptcha'; apiKey?: string }
  ): Promise<CaptchaSolveResult> {
    const solverType = options?.solver || env.CAPTCHA_SOLVER;
    const apiKey = options?.apiKey || env.CAPTCHA_API_KEY;

    if (!apiKey) {
      return { solved: false, error: 'CAPTCHA API key is not configured' };
    }

    try {
      // 1. Detect CAPTCHA type & parameters
      const captchaData = await page.evaluate(() => {
        // Cloudflare Turnstile
        const turnstileEl = document.querySelector('[data-sitekey], iframe[src*="challenges.cloudflare.com"], .cf-turnstile');
        if (turnstileEl) {
          const sitekey = turnstileEl.getAttribute('data-sitekey') ||
            (turnstileEl.getAttribute('src') ? new URL((turnstileEl as HTMLIFrameElement).src).searchParams.get('k') : null);
          if (sitekey) return { type: 'turnstile' as const, sitekey, pageUrl: window.location.href };
        }

        // reCAPTCHA
        const recaptchaEl = document.querySelector('.g-recaptcha, iframe[src*="recaptcha/api2"], iframe[src*="recaptcha/enterprise"]');
        if (recaptchaEl) {
          const sitekey = recaptchaEl.getAttribute('data-sitekey') ||
            (recaptchaEl.getAttribute('src') ? new URL((recaptchaEl as HTMLIFrameElement).src).searchParams.get('k') : null);
          if (sitekey) return { type: 'recaptcha' as const, sitekey, pageUrl: window.location.href };
        }

        // hCaptcha
        const hcaptchaEl = document.querySelector('.h-captcha, iframe[src*="hcaptcha"]');
        if (hcaptchaEl) {
          const sitekey = hcaptchaEl.getAttribute('data-sitekey') ||
            (hcaptchaEl.getAttribute('src') ? new URL((hcaptchaEl as HTMLIFrameElement).src).searchParams.get('sitekey') : null);
          if (sitekey) return { type: 'hcaptcha' as const, sitekey, pageUrl: window.location.href };
        }

        return null;
      });

      if (!captchaData) {
        return { solved: false, error: 'No supported CAPTCHA challenge detected on page' };
      }

      // 2. Solve using configured service (CapSolver default)
      let token: string | undefined;

      if (solverType === 'capsolver') {
        token = await this.solveWithCapSolver(apiKey, captchaData.type, captchaData.sitekey, captchaData.pageUrl);
      } else if (solverType === '2captcha') {
        token = await this.solveWith2Captcha(apiKey, captchaData.type, captchaData.sitekey, captchaData.pageUrl);
      } else {
        return { solved: false, error: `Solver type '${solverType}' is not currently implemented` };
      }

      if (!token) {
        return { solved: false, type: captchaData.type, error: 'Failed to receive solution token from solver service' };
      }

      // 3. Inject token into browser DOM context
      await page.evaluate(({ type, token }) => {
        if (type === 'turnstile') {
          const input = document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement;
          if (input) {
            input.value = token;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } else if (type === 'recaptcha') {
          const input = document.querySelector('[name="g-recaptcha-response"]') as HTMLTextAreaElement;
          if (input) {
            input.value = token;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } else if (type === 'hcaptcha') {
          const input = document.querySelector('[name="h-captcha-response"], [name="g-recaptcha-response"]') as HTMLTextAreaElement;
          if (input) {
            input.value = token;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }, { type: captchaData.type, token });

      return { solved: true, type: captchaData.type, token };
    } catch (err: any) {
      return { solved: false, error: err.message || 'Error occurred during CAPTCHA solving' };
    }
  }

  /**
   * CapSolver API integration
   */
  private static async solveWithCapSolver(
    apiKey: string,
    type: string,
    websiteKey: string,
    websiteURL: string
  ): Promise<string | undefined> {
    const taskTypeMap: Record<string, string> = {
      turnstile: 'AntiTurnstileTaskProxyLess',
      recaptcha: 'ReCaptchaV2TaskProxyLess',
      hcaptcha: 'HCaptchaTaskProxyLess'
    };

    const taskType = taskTypeMap[type] || 'AntiTurnstileTaskProxyLess';

    const createRes = await fetch('https://api.capsolver.com/createTask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientKey: apiKey,
        task: {
          type: taskType,
          websiteURL,
          websiteKey
        }
      })
    });

    const createData: any = await createRes.json();
    if (createData.errorId !== 0 || !createData.taskId) {
      throw new Error(`CapSolver createTask error: ${createData.errorDescription || 'Unknown error'}`);
    }

    const taskId = createData.taskId;

    // Poll for result
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const resultRes = await fetch('https://api.capsolver.com/getTaskResult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientKey: apiKey,
          taskId
        })
      });

      const resultData: any = await resultRes.json();
      if (resultData.status === 'ready') {
        return resultData.solution?.token || resultData.solution?.gRecaptchaResponse;
      }
      if (resultData.status === 'failed') {
        throw new Error(`CapSolver task failed: ${resultData.errorDescription || 'Task failed'}`);
      }
    }

    throw new Error('CapSolver timed out waiting for token solution');
  }

  /**
   * 2Captcha API integration
   */
  private static async solveWith2Captcha(
    apiKey: string,
    type: string,
    sitekey: string,
    pageurl: string
  ): Promise<string | undefined> {
    let method = 'userrecaptcha';
    if (type === 'turnstile') method = 'turnstile';
    if (type === 'hcaptcha') method = 'hcaptcha';

    const inUrl = `https://2captcha.com/in.php?key=${apiKey}&method=${method}&sitekey=${sitekey}&pageurl=${encodeURIComponent(pageurl)}&json=1`;
    const inRes = await fetch(inUrl);
    const inData: any = await inRes.json();

    if (inData.status !== 1) {
      throw new Error(`2Captcha in.php error: ${inData.request || 'Unknown error'}`);
    }

    const reqId = inData.request;

    // Poll for result
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const resUrl = `https://2captcha.com/res.php?key=${apiKey}&action=get&id=${reqId}&json=1`;
      const resRes = await fetch(resUrl);
      const resData: any = await resRes.json();

      if (resData.status === 1) {
        return resData.request;
      }
      if (resData.request !== 'CAPCHA_NOT_READY') {
        throw new Error(`2Captcha res.php error: ${resData.request}`);
      }
    }

    throw new Error('2Captcha timed out waiting for token solution');
  }
}
