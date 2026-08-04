import { type Page } from '@playwright/test';

/**
 * Pacing for watchable demo runs. Inactive (zero delay) in normal and CI runs;
 * activate it when presenting:
 *
 *   DEMO=1 npx playwright test payment-purchase --headed        # 1.8s pauses
 *   DEMO_PACE=3000 npx playwright test payment-purchase --headed # custom pace
 *
 * Specs call demoPause(page) before meaningful clicks so the audience can read
 * the screen, and demoPause(page, 2) on result screens worth dwelling on.
 */
const basePaceMs = process.env.DEMO_PACE
  ? Number(process.env.DEMO_PACE)
  : process.env.DEMO
    ? 1_800
    : 0;

export async function demoPause(page: Page, multiplier = 1): Promise<void> {
  if (basePaceMs > 0) {
    await page.waitForTimeout(basePaceMs * multiplier);
  }
}
