import { type Page, expect } from '@playwright/test';
import { demoPause } from './demo';

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

/**
 * Navigate to a page of the sidebar's "Subscription & Licenses" category the
 * way a real user does — specs never page.goto() inside the product, so a
 * viewer (or a demo recording) always sees WHERE the user went.
 *
 * The category lives in the sidebar's bottom "More" section, collapsed by
 * default, so the path is: "More" toggle → category header → menu item.
 * Steps already open (e.g. after an earlier navigation) are skipped.
 */
/**
 * Navigate to a page of any sidebar category the way a real user does —
 * specs never page.goto() inside the product. Handles both the top section
 * and the collapsed bottom "More" section, plus the accordion `expanded`
 * class (a collapsed list still reports its items visible while the header
 * swallows their clicks).
 */
export async function navigateViaMenuCategory(page: Page, categoryKey: string, route: string): Promise<void> {
  const category = page.locator(`.main-menu [data-category="${categoryKey}"]`);

  if (!(await category.isVisible().catch(() => false))) {
    await demoPause(page);
    await page.locator('.menu-bottom-toggle').click();
    await expect(category).toBeVisible();
  }

  const itemList = category.locator('.category-items');
  const isExpanded = await itemList
    .evaluate((el) => el.classList.contains('expanded'))
    .catch(() => false);
  if (!isExpanded) {
    await demoPause(page);
    await category.locator('.category-header').click();
    await expect(itemList).toHaveClass(/expanded/);
  }

  await demoPause(page);
  await category.locator(`a[href="${route}"]`).click();
}

export async function navigateViaSubscriptionMenu(page: Page, route: string): Promise<void> {
  await navigateViaMenuCategory(page, 'subscription', route);
}
