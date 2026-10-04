import { test, expect, type Page } from '@playwright/test';
import { login } from './helpers/auth';
import { dismissVerificationBanner } from './helpers/ui';

// Real-browser coverage for the `requiresScenarioManager` router guard (#215):
// tests/router/guardScenarioEditor.test.ts pins the guard's logic in vitest,
// this spec pins what a person sees.
//
// The deep link is exercised through the login page's own `redirect` query:
// signing in lands on the requested page with a full page load, which is
// exactly the direct-navigation case the guard exists for. Nothing here
// navigates inside the product by URL.

// A user who owns and manages nothing, not even a personal organization: the
// seeded student. The class learners (karim, jp) do NOT qualify, because each
// owns their personal organization and the access rule counts any owner role.
const LEARNER_EMAIL = process.env.E2E_STUDENT_EMAIL || '1.student@test.com';
const LEARNER_PASSWORD = process.env.E2E_STUDENT_PASSWORD || 'test';
// An organization manager: the scenario editor is theirs to use.
const ORG_MANAGER_EMAIL = process.env.E2E_ORG_MANAGER_EMAIL || 'nadia@test.ocf';
const ORG_MANAGER_PASSWORD = process.env.E2E_PASS || 'OcfTest2026!';

const EDITOR_ROUTE = '/scenario-editor';

/** The scenario-editor links offered by the sidebar's scenarios category, expanded. */
async function editorMenuLinks(page: Page) {
  const category = page.locator('.main-menu [data-category="scenarios"]');
  if (!(await category.isVisible().catch(() => false))) {
    await page.locator('.menu-bottom-toggle').click();
  }
  await expect(category).toBeVisible();
  const items = category.locator('.category-items');
  if (!(await items.evaluate((el) => el.classList.contains('expanded')).catch(() => false))) {
    await category.locator('.category-header').click();
    await expect(items).toHaveClass(/expanded/);
  }
  return category.locator(`a[href="${EDITOR_ROUTE}"]`);
}

test.describe('Scenario editor access', () => {
  test('a learner deep-linking to the editor is sent to their sessions and sees no menu entry', async ({ page }) => {
    await login(page, LEARNER_EMAIL, LEARNER_PASSWORD, { redirect: EDITOR_ROUTE });
    await dismissVerificationBanner(page);

    await expect(page).toHaveURL(/\/terminal-sessions\?error=insufficient_permissions/, { timeout: 20_000 });
    await expect(page.getByTestId('scenario-picker')).toHaveCount(0);

    await expect(await editorMenuLinks(page)).toHaveCount(0);
  });

  test('an organization manager reaches the editor and finds it in the menu', async ({ page }) => {
    await login(page, ORG_MANAGER_EMAIL, ORG_MANAGER_PASSWORD, { redirect: EDITOR_ROUTE });
    await dismissVerificationBanner(page);

    await expect(page).toHaveURL(/\/scenario-editor$/, { timeout: 20_000 });
    await expect(page.getByTestId('scenario-picker')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('editor-empty-state')).toBeVisible();

    await expect(await editorMenuLinks(page)).toHaveCount(1);
  });

  // A reload is a cold load: the guard runs while the login bootstrap is still
  // loading the memberships, and used to decide on empty lists now and then —
  // sending the manager to their sessions.
  // The real failure: one failed memberships load was persisted as "loaded,
  // no memberships" and replayed on every refresh, so the guard refused a
  // manager without asking the server. Each reload starts from that copy.
  test('an organization manager stays on the editor across cold reloads', async ({ page }) => {
    test.setTimeout(240_000);
    await login(page, ORG_MANAGER_EMAIL, ORG_MANAGER_PASSWORD, { redirect: EDITOR_ROUTE });
    await dismissVerificationBanner(page);
    await expect(page.getByTestId('scenario-picker')).toBeVisible({ timeout: 15_000 });

    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => localStorage.setItem('pinia_state_userMemberships', JSON.stringify({
        orgMemberships: [], groupMemberships: [], isLoaded: true, isLoading: false, error: '',
      })));
      await page.reload();
      await expect(page.getByTestId('scenario-picker'), `reload ${i + 1}`).toBeVisible({ timeout: 15_000 });
      await expect(page).toHaveURL(/\/scenario-editor/);
    }
  });
});
