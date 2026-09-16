import { test, expect, type Page } from '@playwright/test';
import { login } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import { apiLogin, type ApiSession } from './helpers/platformApi';
import { typeInTerminal, waitForLiveTerminal } from './helpers/xterm';

// ---------------------------------------------------------------------------
// Exposed ports — a learner publishes a port of a live session at a public
// URL, reaches it from outside, then stops exposing it.
//
// Tier B: needs ocf-core with EXPOSE_DOMAIN + TRAEFIK_PROVIDER_SECRET set, the
// reference Traefik polling it, a wildcard for that domain resolving to Traefik
// from this machine, a live tt-backend + Incus, and the learner's plan with
// port_exposure_enabled. The spec SELF-SKIPS unless E2E_EXPOSE_DOMAIN is set,
// and again if the panel is absent (plan without the feature) — that second
// case is asserted by the companion test, which expects the panel to be gone.
//
//   E2E_EXPOSE_DOMAIN=expose.local npx playwright test exposed-ports
// ---------------------------------------------------------------------------

const LEARNER_EMAIL = process.env.E2E_USER || 'karim@test.ocf';
const PASSWORD = process.env.E2E_PASS || 'OcfTest2026!';
const EXPOSE_DOMAIN = process.env.E2E_EXPOSE_DOMAIN || '';
const API_BASE = process.env.OCF_API_URL || 'http://localhost:8080/api/v1';

let learner: ApiSession;
let sessionId: string | null = null;

test.beforeAll(async () => {
  learner = await apiLogin(LEARNER_EMAIL, PASSWORD);
});

test.afterAll(async () => {
  if (sessionId) {
    await learner.api
      .delete(`${API_BASE}/terminals/${sessionId}`, { headers: { Authorization: `Bearer ${learner.token}` } })
      .catch(() => {});
  }
  await learner?.api.dispose();
});

/** Launch a plain session from the composer and land in the session view. */
async function startPlainSession(page: Page): Promise<string> {
  await navigateViaMenuCategory(page, 'terminals', '/terminal-creation');
  await page.waitForSelector('.distribution-card', { timeout: 20_000 });
  await page.waitForTimeout(1_500);
  await expect(page.locator('.skeleton-grid')).toHaveCount(0);

  await page.locator('.distribution-card').first().click({ force: true });
  await page.locator('.size-strip').waitFor({ state: 'visible', timeout: 20_000 });
  const launch = page.locator('.launch-button');
  if (!(await launch.isEnabled())) {
    await page.locator('.size-pill').first().click({ force: true });
  }
  await expect(launch).toBeEnabled({ timeout: 10_000 });
  await launch.click();

  const errorToast = page.locator('.el-notification');
  await Promise.race([
    page.waitForURL(/\/terminal-session\//, { timeout: 240_000 }),
    errorToast.waitFor({ state: 'visible', timeout: 240_000 }),
  ]);
  if (!/\/terminal-session\//.test(page.url())) {
    const toastText = (await errorToast.innerText().catch(() => '')) || 'launch refused';
    test.skip(true, `launch refused by the backend (likely host capacity): ${toastText.slice(0, 120)}`);
  }
  await waitForLiveTerminal(page);
  return page.url().split('/terminal-session/')[1].split(/[?#]/)[0];
}

test('learner exposes a port, reaches it publicly, then stops exposing it', async ({ page, request }) => {
  test.skip(!EXPOSE_DOMAIN, 'set E2E_EXPOSE_DOMAIN to run against a Traefik-backed stack');
  test.setTimeout(360_000);

  await login(page, LEARNER_EMAIL, PASSWORD);
  await dismissVerificationBanner(page);
  sessionId = await startPlainSession(page);

  const panel = page.locator('.exposed-ports');
  test.skip(
    !(await panel.isVisible().catch(() => false)),
    `no exposed-ports panel: ${LEARNER_EMAIL}'s plan lacks port_exposure_enabled or the operator config is absent`
  );

  await typeInTerminal(page, 'python3 -m http.server 8000 --bind 0.0.0.0 &');

  await panel.locator('.port-input').fill('8000');
  await panel.locator('button[type="submit"]').click();
  const entry = panel.locator('.exposed-port-entry').filter({ hasText: '8000' });
  await expect(entry).toBeVisible({ timeout: 15_000 });

  const url = await entry.locator('.exposed-port-url').getAttribute('href');
  expect(url, 'the entry carries the public URL').toMatch(new RegExp(`^https?://[a-z0-9]+\\.${EXPOSE_DOMAIN.replace(/\./g, '\\.')}$`));

  // Traefik polls every 5 s; the directory listing is what http.server
  // serves at /.
  await expect
    .poll(
      async () => {
        const res = await request.get(url!, { failOnStatusCode: false, timeout: 5_000 }).catch(() => null);
        return res ? res.status() : 0;
      },
      { timeout: 30_000, intervals: [2_000] }
    )
    .toBe(200);
  const body = await (await request.get(url!)).text();
  expect(body).toContain('Directory listing');

  await entry.locator('.stop-btn').click();
  await expect(entry).toHaveCount(0, { timeout: 15_000 });
});

test('a learner whose plan lacks the feature sees no exposed-ports panel', async ({ page }) => {
  test.skip(!EXPOSE_DOMAIN, 'set E2E_EXPOSE_DOMAIN to run against a Traefik-backed stack');
  test.skip(!process.env.E2E_NO_EXPOSURE_USER, 'set E2E_NO_EXPOSURE_USER to a learner on a plan without port_exposure_enabled');
  test.setTimeout(360_000);

  await login(page, process.env.E2E_NO_EXPOSURE_USER!, PASSWORD);
  await dismissVerificationBanner(page);
  const learnerWithout = await apiLogin(process.env.E2E_NO_EXPOSURE_USER!, PASSWORD);
  const id = await startPlainSession(page);
  try {
    // The panel mounts, asks the list, gets a 403 and renders nothing.
    await page.waitForTimeout(3_000);
    await expect(page.locator('.exposed-ports')).toHaveCount(0);
  } finally {
    await learnerWithout.api
      .delete(`${API_BASE}/terminals/${id}`, { headers: { Authorization: `Bearer ${learnerWithout.token}` } })
      .catch(() => {});
    await learnerWithout.api.dispose();
  }
});
