import { test, expect, type Page } from '@playwright/test';
import { login } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import { ScenarioMock, type MockStep } from './helpers/scenarioMock';

// ---------------------------------------------------------------------------
// Per-step provisioning interstitial, driven end to end against the stateful
// HTTP mock (no tt-backend / Incus needed).
//
// This is the UI half of ocf-core's async per-step provisioning: when a step's
// preparation is left running in the background, the success response carries
// next_step_provisioning and the player must wait on session info rather than
// loading a step that isn't ready.
//
// Real UI navigation throughout: login -> sidebar Terminals -> Scénarios ->
// launch -> player. Only /login uses page.goto (house rule).
// ---------------------------------------------------------------------------

const E2E_USER = process.env.E2E_USER || 'karim@test.ocf';
const E2E_PASS = process.env.E2E_PASS || 'OcfTest2026!';

async function launchIntoPlayer(page: Page, mock: ScenarioMock) {
  await dismissVerificationBanner(page);
  await navigateViaMenuCategory(page, 'terminals', '/scenarios');
  await expect(page.getByTestId('scenario-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('scenario-launch-btn').click();
  await expect(page).toHaveURL(/\/terminal-session\//, { timeout: 30_000 });
  await expect(page.getByTestId('scenario-step-title')).toBeVisible({ timeout: 20_000 });
  expect(mock.sessionStatus).toBe('active');
}

test.describe('Scenario per-step provisioning', () => {
  test('async next-step provisioning shows the preparing interstitial without layout shift', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const steps: MockStep[] = [
      {
        order: 1,
        title: 'Validate me',
        type: 'terminal',
        provisionNextPolls: 2,
        provisionTimeoutSeconds: 30,
      },
      { order: 2, title: 'Heavy step', type: 'info' },
    ];
    const mock = new ScenarioMock(steps);
    await mock.install(page);
    await login(page, E2E_USER, E2E_PASS);
    await launchIntoPlayer(page, mock);

    const terminalArea = page.locator('.terminal-main-area');
    const panel = page.locator('.scenario-panel');

    await page.getByTestId('scenario-verify-btn').click();

    // Validated check first…
    await expect(page.locator('.transition-validated')).toBeVisible({ timeout: 10_000 });
    const panelValidated = await panel.boundingBox();
    const terminalValidated = await terminalArea.boundingBox();

    // …then the preparing state with its phase list
    const preparing = page.getByTestId('scenario-step-preparing');
    await expect(preparing).toBeVisible({ timeout: 15_000 });
    await expect(preparing).toContainText(/Préparation|Preparing/);

    // Entering the preparing state must not displace the scenario layout:
    // the panel keeps its exact box, the terminal keeps its vertical
    // geometry. (The terminal's x wobbles ±3px with the nav sidebar's
    // content-driven width — outside the scenario layout, not asserted.)
    expect(await panel.boundingBox()).toEqual(panelValidated);
    const terminalDuring = await terminalArea.boundingBox();
    expect(terminalDuring!.y).toBe(terminalValidated!.y);
    expect(terminalDuring!.height).toBe(terminalValidated!.height);

    // Provisioning resolves (2 mock polls) and the next step loads
    await expect(page.getByTestId('scenario-step-title')).toHaveText('Heavy step', {
      timeout: 30_000,
    });
    expect(mock.sessionStatus).toBe('active');
  });
});
