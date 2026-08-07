import { test, expect, type Page } from '@playwright/test';
import { login, getCurrentOrgName, closeUserMenu } from './helpers/auth';
import {
  apiLogin,
  chipFeatures,
  expectedPreselectedSize,
  getDistributions,
  getOrganizations,
  getSessionOptions,
  isLaunchable,
  orgDisplayName,
  visibleSizes,
  type ApiSession,
  type ApiSessionOptions,
} from './helpers/platformApi';

/**
 * SessionComposer (the /terminal-creation picker) against the live dev stack.
 *
 * Expectations come from `GET /terminals/session-options` for the org context
 * the UI actually resolved, never from a hardcoded plan roster: which sizes are
 * plan-locked and which features exist change with every pricing campaign, and
 * a spec that pins them fails for the wrong reason. Where a behavior needs data
 * the environment doesn't currently have (a locked size, a second distribution),
 * the test skips with an explanation instead of failing.
 */

const TEST_PASSWORD = 'OcfTest2026!';
const TRAINER_EMAIL = 'marc@test.ocf';

let session: ApiSession;

test.beforeAll(async () => {
  session = await apiLogin(TRAINER_EMAIL, TEST_PASSWORD);
});

test.afterAll(async () => {
  await session.api.dispose();
});

// ---------------------------------------------------------------------------
// Page helpers
// ---------------------------------------------------------------------------

/** The email verification banner can overlay the distribution cards. */
async function dismissVerificationBanner(page: Page) {
  const dismissBtn = page.locator('.verification-banner .btn-dismiss');
  if (await dismissBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await dismissBtn.click({ force: true });
    await page.waitForTimeout(500);
  }
}

async function gotoTerminalCreation(page: Page) {
  await page.goto('/terminal-creation');
  await dismissVerificationBanner(page);
  await page.waitForSelector('.distribution-card', { timeout: 20_000 });
  // The org context and the backend list resolve after mount, and each one
  // makes TerminalStarter reload the distributions — which swaps the cards back
  // to skeletons for a moment. Let that second load land before touching them.
  await page.waitForTimeout(1_500);
  await expect(page.locator('.skeleton-grid')).toHaveCount(0);
}

/**
 * Id of the organization the app is currently working in. Plan limits are
 * org-scoped, so the API expectations must be fetched for this exact org —
 * reading it from the UI keeps the spec independent of the store's
 * default-org rule.
 */
async function activeOrgId(page: Page): Promise<string> {
  const displayName = (await getCurrentOrgName(page)).trim();
  await closeUserMenu(page);
  const orgs = await getOrganizations(session);
  const match = orgs.find((o) => orgDisplayName(o).trim() === displayName);
  expect(match, `active org "${displayName}" should exist in GET /organizations`).toBeTruthy();
  return match!.id;
}

/**
 * Click a distribution card, wait for its size strip, and return the options
 * the backend resolved for it.
 */
async function selectDistribution(
  page: Page,
  orgId: string,
  index = 0
): Promise<{ name: string; options: ApiSessionOptions }> {
  const card = page.locator('.distribution-card').nth(index);
  const name = (await card.locator('strong').innerText()).trim();
  await card.click({ force: true });
  await page.locator('.size-strip').waitFor({ state: 'visible', timeout: 20_000 });
  const options = await getSessionOptions(session, name, orgId);
  return { name, options };
}

/** Size keys as rendered on the pills, in DOM order (largest first). */
async function renderedSizeKeys(page: Page): Promise<string[]> {
  const texts = await page.locator('.size-pill').allInnerTexts();
  return texts.map((t) => t.trim().split(/\s+/)[0].toUpperCase());
}

async function pillFor(page: Page, key: string) {
  const keys = await renderedSizeKeys(page);
  const index = keys.indexOf(key.toUpperCase());
  expect(index, `a "${key}" size pill should be rendered (got ${keys.join(', ')})`).toBeGreaterThanOrEqual(0);
  return page.locator('.size-pill').nth(index);
}

async function selectedSizeKey(page: Page): Promise<string> {
  const text = await page.locator('.size-pill.selected').innerText();
  return text.trim().split(/\s+/)[0].toUpperCase();
}

// ---------------------------------------------------------------------------
// 1. Rendering
// ---------------------------------------------------------------------------
test.describe('Session Composer — rendering', () => {
  test('renders one card per distribution the backend offers', async ({ page }) => {
    await login(page, TRAINER_EMAIL, TEST_PASSWORD);
    await gotoTerminalCreation(page);

    const expected = (await getDistributions(session)).map((d) => d.name).sort();

    await expect
      .poll(
        async () =>
          (await page.locator('.distribution-card strong').allInnerTexts())
            .map((n) => n.trim())
            .sort(),
        { timeout: 15_000 }
      )
      .toEqual(expected);
  });

  test('shows skeleton placeholders while the distributions are loading', async ({ page }) => {
    await login(page, TRAINER_EMAIL, TEST_PASSWORD);

    await page.route('**/terminals/distributions*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      // A request still held here when the page navigates away is already
      // resolved by the browser — continuing it then is not an error worth
      // failing the test on.
      await route.continue().catch(() => undefined);
    });

    await page.goto('/terminal-creation');
    await expect(page.locator('.skeleton-card').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.distribution-card').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.skeleton-card')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Distribution selection
// ---------------------------------------------------------------------------
test.describe('Session Composer — distribution selection', () => {
  test('clicking a distribution reveals its size pills, largest first', async ({ page }) => {
    await login(page, TRAINER_EMAIL, TEST_PASSWORD);
    await gotoTerminalCreation(page);
    const orgId = await activeOrgId(page);

    await expect(page.locator('.size-strip')).not.toBeVisible();

    const { options } = await selectDistribution(page, orgId);

    const expectedKeys = visibleSizes(options).map((s) => s.key.toUpperCase());
    expect(await renderedSizeKeys(page)).toEqual(expectedKeys);
  });

  test('clicking a distribution preselects the largest launchable size', async ({ page }) => {
    await login(page, TRAINER_EMAIL, TEST_PASSWORD);
    await gotoTerminalCreation(page);
    const orgId = await activeOrgId(page);

    const { name, options } = await selectDistribution(page, orgId);

    const expectedSize = expectedPreselectedSize(options);
    test.skip(!expectedSize, `no launchable size for "${name}" in this org — nothing to preselect`);

    await expect(page.locator('.size-pill.selected')).toHaveCount(1);
    expect(await selectedSizeKey(page)).toBe(expectedSize!.key.toUpperCase());
  });

  test('the clicked distribution card is the only one marked selected', async ({ page }) => {
    await login(page, TRAINER_EMAIL, TEST_PASSWORD);
    await gotoTerminalCreation(page);
    const orgId = await activeOrgId(page);

    const { name } = await selectDistribution(page, orgId);

    await expect(page.locator('.distribution-card.selected')).toHaveCount(1);
    await expect(page.locator('.distribution-card.selected strong')).toHaveText(name);
  });
});

// ---------------------------------------------------------------------------
// 3. Size selection
// ---------------------------------------------------------------------------
test.describe('Session Composer — size selection', () => {
  test('selecting a size shows that size\'s specs', async ({ page }) => {
    await login(page, TRAINER_EMAIL, TEST_PASSWORD);
    await gotoTerminalCreation(page);
    const orgId = await activeOrgId(page);

    const { name, options } = await selectDistribution(page, orgId);
    const sizes = visibleSizes(options);
    test.skip(sizes.length === 0, `"${name}" exposes no size in this org`);

    const target = sizes[sizes.length - 1];
    await (await pillFor(page, target.key)).click({ force: true });

    expect(await selectedSizeKey(page)).toBe(target.key.toUpperCase());
    await expect(page.locator('.size-detail')).toContainText(target.memory);
  });

  test('each size pill carries its remaining-capacity badge', async ({ page }) => {
    await login(page, TRAINER_EMAIL, TEST_PASSWORD);
    await gotoTerminalCreation(page);
    const orgId = await activeOrgId(page);

    const { options } = await selectDistribution(page, orgId);
    const unlimited = options.quota?.scope === 'unlimited';

    for (const size of visibleSizes(options)) {
      const badge = (await pillFor(page, size.key)).locator('.pill-badge');
      await expect(badge, `badge of the ${size.key} pill`).toHaveText(
        unlimited ? '×∞' : `×${size.remaining_count}`
      );
    }
  });

  test('a plan-locked size is shown as locked, inspectable, and not launchable', async ({ page }) => {
    await login(page, TRAINER_EMAIL, TEST_PASSWORD);
    await gotoTerminalCreation(page);
    const orgId = await activeOrgId(page);

    const { name, options } = await selectDistribution(page, orgId);
    const locked = visibleSizes(options).find((s) => !s.allowed);
    test.skip(
      !locked,
      `every size of "${name}" is allowed by the active plan — no gating to exercise`
    );

    const pill = await pillFor(page, locked!.key);
    await expect(pill).toHaveClass(/disabled/);
    await expect(pill.locator('.pill-lock')).toBeVisible();

    // Locked sizes stay clickable so the learner can read their specs, but the
    // launcher must refuse them.
    await pill.click({ force: true });
    expect(await selectedSizeKey(page)).toBe(locked!.key.toUpperCase());
    await expect(page.locator('[data-test="size-unavailable-hint"]')).toBeVisible();
    await expect(page.locator('.launch-button')).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// 4. Features
// ---------------------------------------------------------------------------
test.describe('Session Composer — features', () => {
  test('feature chips list the plan features the launcher does not own', async ({ page }) => {
    await login(page, TRAINER_EMAIL, TEST_PASSWORD);
    await gotoTerminalCreation(page);
    const orgId = await activeOrgId(page);

    const { options } = await selectDistribution(page, orgId);
    const expected = chipFeatures(options);

    if (expected.length === 0) {
      // `persistence` and `network` are rendered by TerminalAdvancedOptions as
      // dedicated toggles — the composer must never duplicate them as chips.
      await expect(page.locator('.feature-strip')).not.toBeVisible();
      return;
    }

    await expect(page.locator('.feature-chip')).toHaveCount(expected.length);
    for (const feature of expected) {
      await expect(page.locator('.feature-chip', { hasText: feature.name })).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Changing distribution resets the size choice
// ---------------------------------------------------------------------------
test.describe('Session Composer — reset on distribution change', () => {
  test('changing distribution drops the manual size choice for the new default', async ({ page }) => {
    await login(page, TRAINER_EMAIL, TEST_PASSWORD);
    await gotoTerminalCreation(page);
    const orgId = await activeOrgId(page);

    const cardCount = await page.locator('.distribution-card').count();
    test.skip(cardCount < 2, 'only one distribution available — nothing to switch to');

    const first = await selectDistribution(page, orgId, 0);
    const firstSizes = visibleSizes(first.options);
    const smallest = firstSizes[firstSizes.length - 1];
    const preselected = expectedPreselectedSize(first.options);
    test.skip(
      !preselected || !smallest || smallest.key === preselected.key,
      `"${first.name}" has no size other than the preselected one to pick manually`
    );

    await (await pillFor(page, smallest.key)).click({ force: true });
    expect(await selectedSizeKey(page)).toBe(smallest.key.toUpperCase());

    const second = await selectDistribution(page, orgId, 1);
    const secondPreselected = expectedPreselectedSize(second.options);
    test.skip(!secondPreselected, `no launchable size for "${second.name}" in this org`);

    await expect(page.locator('.distribution-card.selected strong')).toHaveText(second.name);
    expect(await selectedSizeKey(page)).toBe(secondPreselected!.key.toUpperCase());
  });
});

// ---------------------------------------------------------------------------
// 6. Launch button state
// ---------------------------------------------------------------------------
test.describe('Session Composer — launch button', () => {
  test('launch is disabled while no distribution is chosen', async ({ page }) => {
    await login(page, TRAINER_EMAIL, TEST_PASSWORD);
    await gotoTerminalCreation(page);

    await expect(page.locator('.launch-button')).toBeDisabled();
  });

  test('launch is enabled once a launchable size is selected', async ({ page }) => {
    await login(page, TRAINER_EMAIL, TEST_PASSWORD);
    await gotoTerminalCreation(page);
    const orgId = await activeOrgId(page);

    const { name, options } = await selectDistribution(page, orgId);
    const launchable = visibleSizes(options).find((s) => isLaunchable(options, s));
    test.skip(
      !launchable,
      `no launchable size for "${name}" in this org — the launcher is correctly blocked`
    );

    await (await pillFor(page, launchable!.key)).click({ force: true });
    await expect(page.locator('.launch-button')).toBeEnabled({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// 7. Hostname pre-fill
// ---------------------------------------------------------------------------
test.describe('Session Composer — hostname pre-fill', () => {
  test('selecting a distribution pre-fills the hostname field', async ({ page }) => {
    await login(page, TRAINER_EMAIL, TEST_PASSWORD);
    await gotoTerminalCreation(page);
    const orgId = await activeOrgId(page);

    const { name } = await selectDistribution(page, orgId);

    await page.locator('button.collapsible-header', { hasText: /Advanced Options|Options Avanc/i })
      .first()
      .click({ force: true });

    const hostnameInput = page.locator('input#hostname');
    await hostnameInput.waitFor({ state: 'visible', timeout: 10_000 });

    const expectedHostname = name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 63);
    await expect(hostnameInput).toHaveValue(expectedHostname);
  });
});
