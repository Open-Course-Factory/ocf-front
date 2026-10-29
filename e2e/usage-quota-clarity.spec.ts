import { test, expect, type Page } from '@playwright/test';
import { login } from './helpers/auth';
import { dismissVerificationBanner, navigateViaSubscriptionMenu } from './helpers/ui';

/**
 * What uses the plan's quota, as the user sees it.
 *
 * Rule (owned by ocf-core, sent as `counts_toward_quota` on every machine): a
 * machine takes CPU and RAM from the quota only while it runs; a paused one
 * keeps its disk and takes nothing, so resuming it needs free quota. The front
 * only reads the flag — these specs feed it through route stubs so the two
 * states are on screen together, which a live stack cannot guarantee.
 */

const TEST_PASSWORD = 'OcfTest2026!';
const TRAINER_EMAIL = 'marc@test.ocf';

const RUNNING_ID = 'e2e-quota-running';
const PAUSED_ID = 'e2e-quota-paused';
const future = new Date(Date.now() + 3_600_000).toISOString();

const sessions = [
  {
    id: RUNNING_ID, session_id: RUNNING_ID, user_id: 'u', name: 'lab-web', machine_size: 'm',
    state: 'running', persistence_mode: 'persistent', expires_at: future, counts_toward_quota: true,
  },
  {
    id: PAUSED_ID, session_id: PAUSED_ID, user_id: 'u', name: 'lab-db', machine_size: 's',
    state: 'stopped', persistence_mode: 'persistent', expires_at: future, idle_until: future,
    counts_toward_quota: false,
  },
];

const usage = {
  plan_name: 'Solo', plan_source: 'personal', plan_source_name: '',
  max_cpu: 2000, max_memory_mb: 1024, max_session_duration_minutes: 120,
  used_cpu: 2000, used_memory_mb: 1024,
  active_sessions: [
    {
      session_id: RUNNING_ID, name: 'lab-web', size_key: 'm', size_cpu: 2000, size_memory_mb: 1024,
      state: 'running', persistence_mode: 'persistent', last_started_at: new Date().toISOString(),
      expires_at: future, counts_toward_quota: true,
    },
    {
      session_id: PAUSED_ID, name: 'lab-db', size_key: 's', size_cpu: 1000, size_memory_mb: 512,
      state: 'stopped', persistence_mode: 'persistent', last_started_at: new Date().toISOString(),
      expires_at: future, counts_toward_quota: false,
    },
  ],
};

async function stubQuotaState(page: Page) {
  await page.route('**/api/v1/terminals/user-sessions*', (route) => route.fulfill({ json: sessions }));
  await page.route('**/api/v1/terminals/my-usage*', (route) => route.fulfill({ json: usage }));
  await page.route(`**/api/v1/terminals/${PAUSED_ID}/start`, (route) => route.fulfill({
    status: 403,
    json: {
      error_code: 403, error_message: 'budget exceeded', source: 'budget', reason: 'budget_exhausted',
      remaining: { cpu: 0, memory_mb: 0 },
    },
  }));
}

test.describe('Quota clarity', () => {
  test.beforeEach(async ({ page }) => {
    await stubQuotaState(page);
    await login(page, TRAINER_EMAIL, TEST_PASSWORD);
    await dismissVerificationBanner(page);
  });

  test('a paused session says it is not using the quota, a running one does not', async ({ page }) => {
    const pausedCard = page.locator('.session-card', { hasText: 'lab-db' });
    const runningCard = page.locator('.session-card', { hasText: 'lab-web' });

    await expect(pausedCard.getByTestId('session-quota-free')).toHaveText(/Not using quota|Hors quota/, { timeout: 20_000 });
    await expect(runningCard.getByTestId('session-quota-free')).toHaveCount(0);
  });

  test('resuming with a full quota names the running machines to stop', async ({ page }) => {
    await page.getByTestId(`btn-start-${PAUSED_ID}`).click();

    const toast = page.locator('.el-notification').filter({ hasText: 'lab-web' });
    await expect(toast).toBeVisible({ timeout: 10_000 });
    await expect(toast).not.toContainText('lab-db');
  });

  test('the usage panel labels each machine and explains the rule', async ({ page }) => {
    await navigateViaSubscriptionMenu(page, '/subscription-dashboard');
    const panel = page.getByTestId('terminal-usage-panel');
    await panel.locator('.collapsible-header').click();

    await expect(panel.getByTestId('quota-rule')).toBeVisible();
    const running = panel.locator('[data-test="session-row"]', { hasText: 'lab-web' });
    const paused = panel.locator('[data-test="session-row"]', { hasText: 'lab-db' });
    await expect(running.getByTestId('quota-badge')).toHaveText(/Uses quota|Compte dans le quota/);
    await expect(paused.getByTestId('quota-badge')).toHaveText(/not using quota|hors quota/);
  });
});
