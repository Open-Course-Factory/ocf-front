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
  await navigateViaMenuCategory(page, 'scenarios', '/scenarios');
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

  // The retry has to re-run the setup that failed. Reloading the step would
  // re-fetch the description of a level whose environment was never built,
  // leaving the learner on an unsolvable machine with no way out — which in a
  // challenge scenario reads as part of the puzzle.
  test('a failed preparation offers a retry that re-runs the setup', async ({ page }) => {
    test.setTimeout(120_000);
    const steps: MockStep[] = [
      {
        order: 1,
        title: 'Validate me',
        type: 'terminal',
        provisionNextPolls: 1,
        provisionNextFails: true,
        provisionTimeoutSeconds: 30,
      },
      { order: 2, title: 'Heavy step', type: 'info' },
    ];
    const mock = new ScenarioMock(steps);
    await mock.install(page);
    await login(page, E2E_USER, E2E_PASS);
    await launchIntoPlayer(page, mock);

    await page.getByTestId('scenario-verify-btn').click();

    // The wait ends in failure rather than in the next step.
    const failure = page.getByTestId('scenario-step-preparing-error');
    await expect(failure).toBeVisible({ timeout: 30_000 });
    expect(mock.reprovisionCalls).toBe(0);

    await page.getByTestId('scenario-step-preparing-retry').click();

    // The retry hit reprovision-step, not just current-step, and the learner
    // lands on a step whose environment now exists.
    await expect(page.getByTestId('scenario-step-title')).toHaveText('Heavy step', {
      timeout: 30_000,
    });
    expect(mock.reprovisionCalls).toBe(1);
    expect(mock.sessionStatus).toBe('active');
  });

  // The other failure shape, and the one with no safety net: preparation that
  // ran inline and failed leaves the session 'active', so no poll will ever
  // report it. Only next_step_provisioning_failed on the advance response says
  // so, and a client that ignores it walks the learner onto a step whose
  // environment was never built — silently.
  test('a preparation that failed inline surfaces the same retry', async ({ page }) => {
    test.setTimeout(120_000);
    const steps: MockStep[] = [
      { order: 1, title: 'Validate me', type: 'terminal', provisionNextFailsInline: true },
      { order: 2, title: 'Heavy step', type: 'info' },
    ];
    const mock = new ScenarioMock(steps);
    await mock.install(page);
    await login(page, E2E_USER, E2E_PASS);
    await launchIntoPlayer(page, mock);

    await page.getByTestId('scenario-verify-btn').click();

    // No wait to sit through — the failure is known the moment the advance
    // answers — and the step must not load behind it.
    const failure = page.getByTestId('scenario-step-preparing-error');
    await expect(failure).toBeVisible({ timeout: 20_000 });
    // The failure replaces the step, it does not sit beside it: a visible step
    // title here would mean the learner had been walked onto the broken level.
    await expect(page.getByTestId('scenario-step-title')).toBeHidden();
    expect(mock.sessionStatus).toBe('active');

    await page.getByTestId('scenario-step-preparing-retry').click();

    await expect(page.getByTestId('scenario-step-title')).toHaveText('Heavy step', {
      timeout: 30_000,
    });
    expect(mock.reprovisionCalls).toBe(1);
  });
});
