import { type Page } from '@playwright/test';

/**
 * Dismiss the email-verification banner if it is showing. It overlays the top
 * of authenticated pages and can intercept clicks on elements underneath.
 * (session-composer.spec.ts and org-context-switching.spec.ts carry local
 * copies of this — new specs should import this one.)
 */
export async function dismissVerificationBanner(page: Page): Promise<void> {
  const dismissBtn = page.locator('.verification-banner .btn-dismiss');
  if (await dismissBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await dismissBtn.click({ force: true });
  }
}
