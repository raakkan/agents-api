import { Page } from 'patchright';

export class HumanizeUtils {
  /**
   * Random delay with jitter
   */
  public static async delay(minMs: number = 500, maxMs: number = 1500): Promise<void> {
    const time = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise(resolve => setTimeout(resolve, time));
  }

  /**
   * Move mouse in human-like trajectory across the page
   */
  public static async moveMouse(page: Page): Promise<void> {
    try {
      const viewport = page.viewportSize() || { width: 1280, height: 800 };
      const startX = Math.floor(Math.random() * (viewport.width / 2));
      const startY = Math.floor(Math.random() * (viewport.height / 2));
      const endX = Math.floor(Math.random() * (viewport.width - 100)) + 50;
      const endY = Math.floor(Math.random() * (viewport.height - 100)) + 50;

      await page.mouse.move(startX, startY);
      await this.delay(100, 300);

      // Multi-step movement to emulate human curve
      const steps = Math.floor(Math.random() * 10) + 15;
      await page.mouse.move(endX, endY, { steps });
    } catch {
      // Non-critical operation if page is closing/closed
    }
  }

  /**
   * Human-like smooth scroll down the page
   */
  public static async scroll(page: Page): Promise<void> {
    try {
      await page.evaluate(async () => {
        await new Promise<void>(resolve => {
          let totalHeight = 0;
          const distance = Math.floor(Math.random() * 200) + 150;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight || totalHeight >= 1200) {
              clearInterval(timer);
              resolve();
            }
          }, Math.floor(Math.random() * 100) + 100);
        });
      });
      await this.delay(300, 800);
    } catch {
      // Ignore if DOM context is unmounted
    }
  }

  /**
   * Human-like typing cadence
   */
  public static async typeText(page: Page, selector: string, text: string): Promise<void> {
    await page.focus(selector);
    for (const char of text) {
      await page.keyboard.type(char, {
        delay: Math.floor(Math.random() * 120) + 50
      });
    }
  }

  /**
   * Apply full human emulation pipeline (mouse move + scroll + delay)
   */
  public static async applyHumanBehavior(page: Page): Promise<void> {
    await this.delay(300, 700);
    await this.moveMouse(page);
    await this.scroll(page);
    await this.delay(400, 1000);
  }
}
