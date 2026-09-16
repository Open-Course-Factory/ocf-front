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
  // E2E_KEEP_SESSION=1 leaves the session up for a post-mortem.
  if (sessionId && !process.env.E2E_KEEP_SESSION) {
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

  // Not every distribution supports the network feature (alpine-xs does not),
  // and the ocf-base profile is NIC-less: only a session started with network
  // has an address a public route can reach. Walk the cards until one offers it.
  // Plain distributions first: a scenario image such as Gameshell runs its
  // own shell, and the liveness probe needs a real one. Debian/Ubuntu before
  // Alpine: they ship an interpreter the test server can run on.
  const cards = page.locator('.distribution-card');
  const names = (await cards.locator('strong').allInnerTexts()).map((n) => n.trim().toLowerCase());
  const order = names
    .map((name, i) => ({ i, rank: /debian|ubuntu/.test(name) ? 0 : /alpine/.test(name) ? 1 : 2 }))
    .sort((x, y) => x.rank - y.rank)
    .map((x) => x.i);
  const launch = page.locator('.launch-button');
  const networkOn = page.getByTestId('network-on');
  let networkAllowed = false;
  for (const i of order) {
    if (networkAllowed) break;
    await cards.nth(i).click({ force: true });
    await page.locator('.size-strip').waitFor({ state: 'visible', timeout: 20_000 });
    if (!(await launch.isEnabled())) {
      await page.locator('.size-pill').first().click({ force: true });
    }
    const advanced = page.locator('button.collapsible-header', { hasText: /Advanced Options|Options Avanc/i });
    if (!(await networkOn.isVisible().catch(() => false))) await advanced.click();
    networkAllowed = await expect(networkOn).toBeEnabled({ timeout: 5_000 }).then(() => true).catch(() => false);
  }
  test.skip(!networkAllowed, `no distribution offers the network feature to ${LEARNER_EMAIL}, which exposure needs`);
  await networkOn.check({ force: true });
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

  const chip = page.getByTestId('exposed-ports-chip');
  test.skip(
    !(await chip.isVisible().catch(() => false)),
    `no exposed-ports chip: ${LEARNER_EMAIL}'s plan lacks port_exposure_enabled or the operator config is absent`
  );

  // A server the image can run: python3 on ubuntu, a perl one-liner on debian
  // (its base image ships neither python3 nor nc); alpine's busybox lacks the
  // httpd applet, so it installs busybox-extras — the session has network.
  const perlServer =
    "perl -MIO::Socket::INET -e '$s=IO::Socket::INET->new(LocalPort=>8000,Listen=>5,ReuseAddr=>1);while($c=$s->accept){<$c>;print $c qq(HTTP/1.0 200 OK\\r\\nContent-Type: text/plain\\r\\n\\r\\nocf-expose-ok\\n);close $c}'";
  await typeInTerminal(
    page,
    `mkdir -p /tmp/www && echo ocf-expose-ok > /tmp/www/index.html && cd /tmp/www && ((python3 -m http.server 8000 --bind 0.0.0.0 || ${perlServer} || (apk add --no-cache busybox-extras && busybox-extras httpd -f -p 8000)) >/tmp/srv.log 2>&1 &)`
  );

  await chip.click();
  const panel = page.getByTestId('exposed-ports-popover');
  await expect(panel).toBeVisible();
  await panel.locator('.port-input').fill('8000');
  await panel.locator('button[type="submit"]').click();
  const entry = panel.locator('.exposed-port-entry').filter({ hasText: '8000' });
  await expect(entry).toBeVisible({ timeout: 15_000 });

  const url = await entry.locator('.exposed-port-url').getAttribute('href');
  expect(url, 'the entry carries the public URL').toMatch(new RegExp(`^https?://[a-z0-9]+\\.${EXPOSE_DOMAIN.replace(/\./g, '\\.')}$`));

  // Traefik polls every 5 s.
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
  expect(body).toContain('ocf-expose-ok');

  await expect(chip.locator('.ports-chip-count')).toHaveText('1');
  await entry.locator('.stop-btn').click();
  await expect(entry).toHaveCount(0, { timeout: 15_000 });
  await expect(chip.locator('.ports-chip-count')).toHaveCount(0);
});

test('a learner whose plan lacks the feature sees no exposed-ports chip', async ({ page }) => {
  test.skip(!EXPOSE_DOMAIN, 'set E2E_EXPOSE_DOMAIN to run against a Traefik-backed stack');
  test.skip(!process.env.E2E_NO_EXPOSURE_USER, 'set E2E_NO_EXPOSURE_USER to a learner on a plan without port_exposure_enabled');
  test.setTimeout(360_000);

  await login(page, process.env.E2E_NO_EXPOSURE_USER!, PASSWORD);
  await dismissVerificationBanner(page);
  const learnerWithout = await apiLogin(process.env.E2E_NO_EXPOSURE_USER!, PASSWORD);
  const id = await startPlainSession(page);
  try {
    // The chip mounts, asks the list, gets a 403 and renders nothing.
    await page.waitForTimeout(3_000);
    await expect(page.getByTestId('exposed-ports-chip')).toHaveCount(0);
  } finally {
    await learnerWithout.api
      .delete(`${API_BASE}/terminals/${id}`, { headers: { Authorization: `Bearer ${learnerWithout.token}` } })
      .catch(() => {});
    await learnerWithout.api.dispose();
  }
});
