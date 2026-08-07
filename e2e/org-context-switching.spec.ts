import { test, expect, type Page } from '@playwright/test';
import {
  closeUserMenu,
  getAvailableOrgNames,
  getCurrentOrgName,
  getCurrentOrgType,
  login,
  loginFresh,
  switchToOrg,
} from './helpers/auth';
import {
  apiLogin,
  canRunClassrooms,
  getEffectivePlanName,
  getOrganizations,
  getTerminalUsage,
  orgDisplayName,
  type ApiOrganization,
  type ApiSession,
} from './helpers/platformApi';

/**
 * Organization context switching against the live dev stack.
 *
 * Every expectation is resolved from the API for the user under test — org
 * roster, per-org plan features and per-org terminal budgets all change
 * whenever a campaign touches the dev database, and the previous version of
 * this spec failed for that reason rather than for a regression. Tests that
 * need a specific data shape (two orgs whose plans differ) look for it and
 * skip with an explanation when the environment can't provide it.
 */

const TEST_PASSWORD = 'OcfTest2026!';

/** Users whose org roster is asserted. Their memberships may change freely. */
const USERS = ['karim@test.ocf', 'jp@test.ocf', 'marc@test.ocf'];

/** The user driving the plan-dependent tests. */
const PRIMARY_USER = 'marc@test.ocf';

async function withApiSession<T>(
  email: string,
  body: (session: ApiSession) => Promise<T>
): Promise<T> {
  const session = await apiLogin(email, TEST_PASSWORD);
  try {
    return await body(session);
  } finally {
    await session.api.dispose();
  }
}

/**
 * Two orgs of the user that disagree on the classroom entitlement, or null when
 * the environment offers no such pair.
 */
async function findClassroomContrast(
  session: ApiSession
): Promise<{ granted: ApiOrganization; denied: ApiOrganization } | null> {
  const granted: ApiOrganization[] = [];
  const denied: ApiOrganization[] = [];
  for (const org of await getOrganizations(session)) {
    ((await canRunClassrooms(session, org.id)) ? granted : denied).push(org);
  }
  if (granted.length === 0 || denied.length === 0) return null;
  return { granted: granted[0], denied: denied[0] };
}

/** Reads the CPU + RAM limit lines of the terminal usage panel. */
async function readUsageLimits(page: Page): Promise<string> {
  await page.waitForSelector('[data-testid="terminal-usage-panel"]', {
    state: 'visible',
    timeout: 20_000,
  });
  if (!(await page.locator('[data-testid="usage-limits"]').isVisible().catch(() => false))) {
    await page.locator('[data-testid="terminal-usage-panel"] .collapsible-header').click();
  }
  await page.waitForSelector('[data-testid="usage-limits"]', { state: 'visible', timeout: 20_000 });
  const lines = await page.locator('[data-testid="usage-limits"] .bar-meta').allInnerTexts();
  return lines.map((line) => line.trim()).join(' | ');
}

async function isGroupsCategoryDisabled(page: Page): Promise<boolean> {
  return page
    .locator('[data-category="groups"]')
    .evaluate((el) => el.classList.contains('nav-category--disabled'));
}

// ---------------------------------------------------------------------------
// 1. The switcher mirrors the user's memberships
// ---------------------------------------------------------------------------
test.describe('Org switcher contents', () => {
  for (const email of USERS) {
    test(`the switcher lists exactly the organizations ${email} belongs to`, async ({ page }) => {
      const expected = await withApiSession(email, async (session) =>
        (await getOrganizations(session)).map(orgDisplayName).sort()
      );
      test.skip(
        expected.length < 2,
        `${email} belongs to a single organization — the switcher is not offered`
      );

      await login(page, email, TEST_PASSWORD);

      expect((await getAvailableOrgNames(page)).map((n) => n.trim()).sort()).toEqual(expected);
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Default org selection rule: a team org wins over the personal one
// ---------------------------------------------------------------------------
test.describe('Default org selection', () => {
  for (const email of USERS) {
    test(`${email} lands in a team organization after a fresh login`, async ({ page }) => {
      const teamNames = await withApiSession(email, async (session) =>
        (await getOrganizations(session))
          .filter((o) => o.organization_type === 'team')
          .map(orgDisplayName)
      );
      test.skip(teamNames.length === 0, `${email} belongs to no team organization`);

      await loginFresh(page, email, TEST_PASSWORD);

      expect(teamNames).toContain((await getCurrentOrgName(page)).trim());
    });
  }

  test('the active organization is labelled as a team', async ({ page }) => {
    await loginFresh(page, PRIMARY_USER, TEST_PASSWORD);

    const badge = (await getCurrentOrgType(page)).toLowerCase();
    expect(badge).toMatch(/team|équipe|equipe/);
  });
});

// ---------------------------------------------------------------------------
// 3. The classroom entitlement gates the navigation per org context
// ---------------------------------------------------------------------------
test.describe('Feature visibility on org switch', () => {
  test('the groups category is enabled only where classrooms can be run', async ({ page }) => {
    const contrast = await withApiSession(PRIMARY_USER, findClassroomContrast);
    test.skip(
      !contrast,
      `${PRIMARY_USER} has no pair of orgs disagreeing on the classroom entitlement`
    );

    await loginFresh(page, PRIMARY_USER, TEST_PASSWORD);

    await switchToOrg(page, orgDisplayName(contrast!.granted));
    await page.locator('[data-category="groups"]').waitFor({ state: 'visible', timeout: 15_000 });
    expect(await isGroupsCategoryDisabled(page)).toBe(false);

    await switchToOrg(page, orgDisplayName(contrast!.denied));
    await page.waitForTimeout(1_000);

    const groups = page.locator('[data-category="groups"]');
    if (await groups.isVisible().catch(() => false)) {
      // Kept visible but locked, so the user can see the feature exists
      // elsewhere; the lock icon carries the explanation.
      expect(await isGroupsCategoryDisabled(page)).toBe(true);
      await expect(groups.locator('.category-lock-icon')).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Losing the entitlement kicks the user off the page it protects
// ---------------------------------------------------------------------------
test.describe('Class page follows the org context', () => {
  test('switching to an org without the classroom entitlement leaves /class-groups', async ({ page }) => {
    const contrast = await withApiSession(PRIMARY_USER, findClassroomContrast);
    test.skip(
      !contrast,
      `${PRIMARY_USER} has no pair of orgs disagreeing on the classroom entitlement`
    );

    await loginFresh(page, PRIMARY_USER, TEST_PASSWORD);

    await switchToOrg(page, orgDisplayName(contrast!.granted));
    await page.goto('/class-groups');
    await page.waitForTimeout(2_000);
    expect(page.url()).toContain('/class-groups');

    // The redirect is owned by the org store's switch handler, so it only fires
    // on an in-app switch — not on a reload. Switch from the page itself.
    await switchToOrg(page, orgDisplayName(contrast!.denied));
    await page.waitForTimeout(3_000);
    expect(page.url()).not.toContain('/class-groups');
  });
});

// ---------------------------------------------------------------------------
// 5. Terminal budget follows the org context
// ---------------------------------------------------------------------------
test.describe('Usage limits update on org switch', () => {
  test('the usage panel shows the budget of the active organization', async ({ page }) => {
    const budgets = await withApiSession(PRIMARY_USER, async (session) => {
      const orgs = await getOrganizations(session);
      const resolved = [];
      for (const org of orgs) {
        const usage = await getTerminalUsage(session, org.id);
        if (usage) resolved.push({ org, usage });
      }
      return resolved;
    });

    const capped = budgets.find((b) => b.usage.max_cpu > 0);
    const uncapped = budgets.find((b) => b.usage.max_cpu === 0);
    test.skip(
      !capped || !uncapped,
      `${PRIMARY_USER} has no pair of orgs with different terminal budgets`
    );

    await loginFresh(page, PRIMARY_USER, TEST_PASSWORD);

    await switchToOrg(page, orgDisplayName(capped!.org));
    await page.goto('/terminal-creation');
    const cappedLimits = await readUsageLimits(page);
    expect(cappedLimits).toContain('vCPU');
    await expect(page.locator('[data-test="cpu-bar-fill"]')).toBeVisible();

    await switchToOrg(page, orgDisplayName(uncapped!.org));
    await page.goto('/terminal-creation');
    const uncappedLimits = await readUsageLimits(page);

    // An uncapped budget has no bar to fill — it reads as "unlimited" instead.
    expect(uncappedLimits).not.toEqual(cappedLimits);
    await expect(page.locator('[data-test="cpu-bar-fill"]')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 6. The subscription dashboard names the plan of the active org
// ---------------------------------------------------------------------------
test.describe('Plan identity in the subscription dashboard', () => {
  test('the subscription card names the plan effective in the active organization', async ({ page }) => {
    const named = await withApiSession(PRIMARY_USER, async (session) => {
      const orgs = await getOrganizations(session);
      const withPlan = [];
      for (const org of orgs) {
        const planName = await getEffectivePlanName(session, org.id);
        if (planName) withPlan.push({ org, planName });
      }
      return withPlan;
    });
    test.skip(
      named.length === 0,
      `no organization of ${PRIMARY_USER} resolves to an active plan`
    );

    await loginFresh(page, PRIMARY_USER, TEST_PASSWORD);

    const target = named[0];
    await switchToOrg(page, orgDisplayName(target.org));
    await page.goto('/subscription-dashboard');
    await page.waitForSelector('.subscription-dashboard', { state: 'visible', timeout: 20_000 });

    await expect(page.locator('.subscription-card .plan-name').first()).toHaveText(
      target.planName,
      { timeout: 20_000 }
    );
    await closeUserMenu(page);
  });
});
