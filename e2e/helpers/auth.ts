import { type Page, expect } from '@playwright/test';

/**
 * Log in to OCF via the /login page.
 *
 * The flow:
 *   1. Navigate to /login
 *   2. Fill email + password
 *   3. Submit (triggers window.location.href = landingPage -> full page reload)
 *   4. Wait for the authenticated app shell to appear (TopMenu user-info button)
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login', { waitUntil: 'networkidle' });

  // Wait for the login form to be rendered
  const emailInput = page.locator('#email');
  await emailInput.waitFor({ state: 'visible', timeout: 15_000 });

  // Fill credentials
  await emailInput.fill(email);
  await page.locator('#password').fill(password);

  // Small delay for Vue reactivity to process v-model bindings
  await page.waitForTimeout(300);

  // Click submit (the handler uses window.location.href which triggers a full page load)
  await page.locator('button[type="submit"]').click({ force: true });

  // Wait for the authenticated app shell to load (TopMenu user-info button).
  // The window.location.href redirect causes a full page reload, so we wait
  // generously for the new page to appear.
  await page.waitForSelector('.user-info', { state: 'visible', timeout: 30_000 });

  // Wait for initial API calls to settle (organizations, features, permissions, etc.)
  await page.waitForTimeout(3_000);
}

/**
 * Open the user dropdown menu in TopMenu (if not already open).
 */
export async function openUserMenu(page: Page): Promise<void> {
  // Check if the dropdown is already open
  const dropdown = page.locator('.user-dropdown');
  if (await dropdown.isVisible().catch(() => false)) {
    return;
  }
  await page.locator('.user-info').click({ force: true });
  await dropdown.waitFor({ state: 'visible', timeout: 5_000 });
}

/**
 * Close the user dropdown menu if it is open.
 */
export async function closeUserMenu(page: Page): Promise<void> {
  const dropdown = page.locator('.user-dropdown');
  if (await dropdown.isVisible().catch(() => false)) {
    // Click outside to close — use body at coordinates far from the dropdown
    await page.mouse.click(10, 10);
    await dropdown.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {
      // If it doesn't close, try pressing Escape
    });
    // If still visible, press Escape
    if (await dropdown.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Open the org switcher flyout inside the user dropdown.
 * Opens the user menu first if needed.
 */
export async function openOrgSwitcher(page: Page): Promise<void> {
  await openUserMenu(page);
  // Click the switch button (only visible when multiple orgs)
  const switchBtn = page.locator('.org-switch-btn');
  await switchBtn.waitFor({ state: 'visible', timeout: 5_000 });
  await switchBtn.click({ force: true });
  await page.locator('.org-switcher-flyout').waitFor({ state: 'visible', timeout: 5_000 });
}

/**
 * Switch to a specific organization by its display name.
 * Waits for the org switch to complete (API calls settle).
 */
export async function switchToOrg(page: Page, orgDisplayName: string): Promise<void> {
  await openOrgSwitcher(page);

  // Find and click the org in the switcher list
  const orgItem = page.locator('.org-switcher-item').filter({
    has: page.locator('.org-name', { hasText: orgDisplayName }),
  });
  await orgItem.click({ force: true });

  // Wait for the flyout to close
  await page.locator('.org-switcher-flyout').waitFor({ state: 'hidden', timeout: 5_000 });

  // Give time for the org switch side-effects (subscription refresh, permission refresh, etc.)
  await page.waitForTimeout(2_000);

  // Close the user menu
  await closeUserMenu(page);
}

/**
 * Get the currently displayed organization name from the TopMenu user dropdown.
 */
export async function getCurrentOrgName(page: Page): Promise<string> {
  await openUserMenu(page);
  const orgName = await page.locator('.current-organization-info .org-name').innerText();
  return orgName;
}

/**
 * Get the currently displayed organization type badge text (e.g. "Personal" or "Team"/"Equipe").
 */
export async function getCurrentOrgType(page: Page): Promise<string> {
  await openUserMenu(page);
  const orgType = await page.locator('.current-organization-info .org-type').innerText();
  return orgType;
}

/**
 * Get the list of organization names available in the org switcher.
 */
export async function getAvailableOrgNames(page: Page): Promise<string[]> {
  await openOrgSwitcher(page);
  const names = await page.locator('.org-switcher-item .org-name').allInnerTexts();
  await closeUserMenu(page);
  return names;
}
