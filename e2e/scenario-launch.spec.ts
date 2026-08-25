import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import { ScenarioMock, standardSteps } from './helpers/scenarioMock';

// ---------------------------------------------------------------------------
// Tier A launch-gating suite — how the launcher renders blocked scenarios and
// how the provisioning overlay behaves, against the stateful HTTP mock.
//
// The backend only ever emits block_reason 'no_distribution' and
// 'budget_exhausted' (scenarioLaunchController). The UI currently also
// handles 'plan'/'offline' which the backend never sends, and lets
// 'budget_exhausted' fall through to the "server offline" copy — a known
// front/back drift (plan §7). These specs assert what a user must always
// get: a visible, non-launchable card with an explanation — and will gain
// copy-level assertions once the drift is fixed.
// ---------------------------------------------------------------------------

const E2E_USER = process.env.E2E_USER || 'karim@test.ocf';
const E2E_PASS = process.env.E2E_PASS || 'OcfTest2026!';

test.describe('Scenario launch gating (mocked backend)', () => {
  test('no_distribution block renders an explanation and no launch button', async ({ page }) => {
    const mock = new ScenarioMock(standardSteps(), {
      launchable: false,
      block_reason: 'no_distribution',
    });
    await mock.install(page);
    await login(page, E2E_USER, E2E_PASS);
    await dismissVerificationBanner(page);
    await navigateViaMenuCategory(page, 'scenarios', '/scenarios');

    const card = page.getByTestId('scenario-card');
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('scenario-unavailable-notice')).toBeVisible();
    await expect(page.getByTestId('scenario-launch-btn')).toHaveCount(0);
  });

  test('budget_exhausted block renders an explanation and no launch button', async ({ page }) => {
    const mock = new ScenarioMock(standardSteps(), {
      launchable: false,
      block_reason: 'budget_exhausted',
    });
    await mock.install(page);
    await login(page, E2E_USER, E2E_PASS);
    await dismissVerificationBanner(page);
    await navigateViaMenuCategory(page, 'scenarios', '/scenarios');

    await expect(page.getByTestId('scenario-card')).toBeVisible({ timeout: 15_000 });
    const notice = page.getByTestId('scenario-unavailable-notice');
    await expect(notice).toBeVisible();
    await expect(page.getByTestId('scenario-launch-btn')).toHaveCount(0);
    // NOTE: today this renders the "server offline" copy because the UI has
    // no budget_exhausted branch (known drift, plan §7). When the fix lands,
    // tighten this to assert budget-specific copy.
  });

  test('provisioning overlay shows, then failure is surfaced and overlay clears', async ({ page }) => {
    test.setTimeout(120_000);
    const mock = new ScenarioMock(standardSteps(), {
      launch: 'provision-then-failed',
      provisioningPolls: 1,
    });
    await mock.install(page);
    await login(page, E2E_USER, E2E_PASS);
    await dismissVerificationBanner(page);
    await navigateViaMenuCategory(page, 'scenarios', '/scenarios');

    await page.getByTestId('scenario-launch-btn').click();
    await expect(page.getByTestId('scenario-provisioning-overlay')).toBeVisible({ timeout: 10_000 });

    // pollProvisioningStatus polls every 3s; after the configured polls the
    // mock flips to setup_failed and the launcher clears the overlay.
    await expect(page.getByTestId('scenario-provisioning-overlay')).toBeHidden({ timeout: 30_000 });
    // We stay on the launcher — no navigation to a broken session
    await expect(page).toHaveURL(/\/scenarios/);
    expect(mock.sessionStatus).toBe('setup_failed');
  });

  test('provisioning resolves to active and lands in the player', async ({ page }) => {
    test.setTimeout(120_000);
    const mock = new ScenarioMock(standardSteps(), {
      launch: 'provision-then-active',
      provisioningPolls: 1,
    });
    await mock.install(page);
    await login(page, E2E_USER, E2E_PASS);
    await dismissVerificationBanner(page);
    await navigateViaMenuCategory(page, 'scenarios', '/scenarios');

    await page.getByTestId('scenario-launch-btn').click();
    await expect(page.getByTestId('scenario-provisioning-overlay')).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/terminal-session\//, { timeout: 30_000 });
    await expect(page.getByTestId('scenario-step-title')).toBeVisible({ timeout: 20_000 });
    expect(mock.sessionStatus).toBe('active');
  });
});
