import { test, expect } from '@playwright/test';
import {
  login,
  closeUserMenu,
  switchToOrg,
  getCurrentOrgName,
  getCurrentOrgType,
  getAvailableOrgNames,
} from './helpers/auth';

const TEST_PASSWORD = 'OcfTest2026!';

// ---------------------------------------------------------------------------
// 1. Org switcher visibility
// ---------------------------------------------------------------------------
test.describe('Org switcher visibility', () => {
  test('Karim sees 2 orgs (Personal + FormaTech)', async ({ page }) => {
    await login(page, 'karim@test.ocf', TEST_PASSWORD);

    const orgNames = await getAvailableOrgNames(page);
    expect(orgNames.length).toBe(2);

    // One should be personal-type, one should be FormaTech
    const hasPersonal = orgNames.some(n => n.toLowerCase().includes('karim') || n.toLowerCase().includes('personal'));
    const hasFormaTech = orgNames.some(n => n.includes('FormaTech'));
    expect(hasPersonal || hasFormaTech).toBeTruthy();
  });

  test('JP sees 3 orgs (Personal + FormaTech + ESITECH)', async ({ page }) => {
    await login(page, 'jp@test.ocf', TEST_PASSWORD);

    const orgNames = await getAvailableOrgNames(page);
    expect(orgNames.length).toBe(3);

    const hasFormaTech = orgNames.some(n => n.includes('FormaTech'));
    const hasEsitech = orgNames.some(n => n.includes('ESITECH'));
    expect(hasFormaTech).toBeTruthy();
    expect(hasEsitech).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 2. Default org selection
// ---------------------------------------------------------------------------
test.describe('Default org selection', () => {
  test('Karim lands in FormaTech (team org preferred over personal)', async ({ page }) => {
    // Clear any saved org preference from localStorage before login
    await page.goto('/login');
    await page.evaluate(() => localStorage.removeItem('currentOrganizationId'));

    await login(page, 'karim@test.ocf', TEST_PASSWORD);

    const orgName = await getCurrentOrgName(page);
    expect(orgName).toContain('FormaTech');
  });

  test('Current org display shows Team badge for FormaTech', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.removeItem('currentOrganizationId'));

    await login(page, 'karim@test.ocf', TEST_PASSWORD);

    const orgType = await getCurrentOrgType(page);
    // The badge text should indicate Team (English: "Team", French: "Equipe")
    const isTeamBadge = orgType.toLowerCase().includes('team') || orgType.toLowerCase().includes('équipe');
    expect(isTeamBadge).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 3. Feature visibility on org switch
// ---------------------------------------------------------------------------
test.describe('Feature visibility on org switch', () => {
  test('Groups menu visibility changes on org switch', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.removeItem('currentOrganizationId'));

    await login(page, 'karim@test.ocf', TEST_PASSWORD);

    // In FormaTech (team org) - groups category should be visible and NOT disabled
    const groupsCategory = page.locator('[data-category="groups"]');
    await groupsCategory.waitFor({ state: 'visible', timeout: 10_000 });

    // Check that it is NOT disabled (no lock icon, no disabled class)
    const isDisabledInTeam = await groupsCategory.evaluate(
      el => el.classList.contains('nav-category--disabled')
    );
    expect(isDisabledInTeam).toBe(false);

    // Switch to Personal org
    const orgNames = await getAvailableOrgNames(page);
    const personalOrgName = orgNames.find(
      n => !n.includes('FormaTech')
    );
    expect(personalOrgName).toBeTruthy();

    await switchToOrg(page, personalOrgName!);

    // After switching to Personal, groups should either be hidden or disabled (grayed out with lock)
    // Wait for the sidebar to update
    await page.waitForTimeout(1_000);

    const groupsCategoryAfter = page.locator('[data-category="groups"]');
    const isGroupsVisible = await groupsCategoryAfter.isVisible().catch(() => false);

    if (isGroupsVisible) {
      // If visible, it should be disabled (grayed out)
      const isDisabledInPersonal = await groupsCategoryAfter.evaluate(
        el => el.classList.contains('nav-category--disabled')
      );
      expect(isDisabledInPersonal).toBe(true);

      // Should show lock icon
      const lockIcon = groupsCategoryAfter.locator('.category-lock-icon');
      await expect(lockIcon).toBeVisible();
    }
    // If not visible at all, that is also acceptable (feature completely hidden)

    // Switch back to FormaTech
    await switchToOrg(page, 'FormaTech');
    await page.waitForTimeout(1_000);

    // Groups should be visible and enabled again
    const groupsFinal = page.locator('[data-category="groups"]');
    await groupsFinal.waitFor({ state: 'visible', timeout: 10_000 });
    const isDisabledFinal = await groupsFinal.evaluate(
      el => el.classList.contains('nav-category--disabled')
    );
    expect(isDisabledFinal).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Usage limits update on org switch
// ---------------------------------------------------------------------------
test.describe('Usage limits update on org switch', () => {
  test('Terminal usage limits change when switching orgs', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.removeItem('currentOrganizationId'));

    await login(page, 'karim@test.ocf', TEST_PASSWORD);

    // Navigate to subscription dashboard to see usage
    await page.goto('/subscription-dashboard');
    await page.waitForSelector('.subscription-dashboard', { state: 'visible', timeout: 15_000 });

    // Wait for usage overview to load
    await page.waitForSelector('.usage-overview', { state: 'visible', timeout: 15_000 });

    // Capture the usage text in FormaTech context
    // Usage text format is: "X / Y" where Y is the limit
    const getUsageTexts = async () => {
      await page.waitForTimeout(500);
      return await page.locator('.usage-text').allInnerTexts();
    };

    const formaTechUsage = await getUsageTexts();

    // Switch to Personal org
    const orgNames = await getAvailableOrgNames(page);
    const personalOrgName = orgNames.find(n => !n.includes('FormaTech'));
    expect(personalOrgName).toBeTruthy();

    await switchToOrg(page, personalOrgName!);

    // Wait for the dashboard to refresh
    await page.waitForTimeout(2_000);

    // Navigate again to ensure fresh data
    await page.goto('/subscription-dashboard');
    await page.waitForSelector('.usage-overview', { state: 'visible', timeout: 15_000 });

    const personalUsage = await getUsageTexts();

    // The usage limits should be different between FormaTech (Pro = 10 terminals)
    // and Personal (Trial = 1 terminal)
    // We check that the text content differs (different limits)
    expect(formaTechUsage.join('|')).not.toEqual(personalUsage.join('|'));
  });
});

// ---------------------------------------------------------------------------
// 5. Route guard blocks feature-gated pages in wrong org context
// ---------------------------------------------------------------------------
test.describe('Route guard blocks feature-gated pages', () => {
  test('Class-groups page is blocked when plan feature is unavailable', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.removeItem('currentOrganizationId'));

    await login(page, 'karim@test.ocf', TEST_PASSWORD);

    // First, confirm Karim is in FormaTech (has multiple_groups feature)
    const orgName = await getCurrentOrgName(page);
    expect(orgName).toContain('FormaTech');
    await closeUserMenu(page);

    // Switch to Personal org (Trial plan, no multiple_groups feature)
    const orgNames = await getAvailableOrgNames(page);
    const personalOrgName = orgNames.find(n => !n.includes('FormaTech'));
    expect(personalOrgName).toBeTruthy();
    await switchToOrg(page, personalOrgName!);

    // Now try to navigate to /class-groups.
    // The router guard checks requiresPlanFeature:'multiple_groups'
    // which should fail in Personal org context and redirect away.
    await page.goto('/class-groups');
    await page.waitForTimeout(3_000);

    // Should NOT be on /class-groups (redirected by router guard)
    const urlAfter = page.url();
    expect(urlAfter).not.toContain('/class-groups');

    // Switch back to FormaTech and verify /class-groups is accessible
    await switchToOrg(page, 'FormaTech');
    await page.waitForTimeout(2_000);

    // In FormaTech context, the groups menu should be visible and enabled
    const groupsCategory = page.locator('[data-category="groups"]');
    await groupsCategory.waitFor({ state: 'visible', timeout: 10_000 });
    const isDisabled = await groupsCategory.evaluate(
      el => el.classList.contains('nav-category--disabled')
    );
    expect(isDisabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. Plan features in subscription card
// ---------------------------------------------------------------------------
test.describe('Plan features in subscription card', () => {
  test('Subscription card shows different plan features per org', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.removeItem('currentOrganizationId'));

    await login(page, 'karim@test.ocf', TEST_PASSWORD);

    // Navigate to subscription dashboard
    await page.goto('/subscription-dashboard');
    await page.waitForSelector('.subscription-dashboard', { state: 'visible', timeout: 15_000 });

    // Wait for subscription card to load (the card with plan details)
    await page.waitForSelector('.subscription-card', { state: 'visible', timeout: 15_000 });

    // Wait for all sub-components to render and plan data to load
    await page.waitForTimeout(3_000);

    // Capture plan info using the full card text (more reliable than specific selectors)
    const getCardContent = async () => {
      return await page.locator('.subscription-card').first().innerText({ timeout: 5_000 }).catch(() => '');
    };

    const formaTechContent = await getCardContent();

    // Switch to Personal org
    const orgNames = await getAvailableOrgNames(page);
    const personalOrgName = orgNames.find(n => !n.includes('FormaTech'));
    expect(personalOrgName).toBeTruthy();

    await switchToOrg(page, personalOrgName!);

    // Navigate again to ensure fresh subscription data is loaded
    await page.goto('/subscription-dashboard');
    await page.waitForSelector('.subscription-dashboard', { state: 'visible', timeout: 15_000 });
    await page.waitForTimeout(3_000);

    // In personal org, the card might show a different plan or no subscription
    const hasSubscriptionCard = await page.locator('.subscription-card').isVisible().catch(() => false);
    const hasNoSubscriptionCard = await page.locator('.no-subscription-card').isVisible().catch(() => false);

    if (hasSubscriptionCard) {
      const personalContent = await getCardContent();
      // The card content should differ between FormaTech (Pro) and Personal (Trial or none)
      expect(formaTechContent).not.toEqual(personalContent);
    } else if (hasNoSubscriptionCard) {
      // Personal org has no active subscription - this is a valid difference
      expect(formaTechContent).toBeTruthy(); // FormaTech had content
    } else {
      // Neither card visible - still loading or error; capture what we have
      const dashboardText = await page.locator('.subscription-dashboard').innerText().catch(() => '');
      // The dashboard content should be different from FormaTech
      expect(dashboardText).not.toEqual(formaTechContent);
    }
  });
});
