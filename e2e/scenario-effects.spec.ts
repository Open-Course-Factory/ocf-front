import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';
import { login } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import { ScenarioMock, type MockStep } from './helpers/scenarioMock';

// ---------------------------------------------------------------------------
// Tier A — TTE step effects + per-step provisioning interstitial, driven end
// to end against the stateful HTTP mock (no tt-backend / Incus needed).
//
// Real UI navigation throughout: login -> sidebar Terminals -> Scénarios ->
// launch -> player. Only /login uses page.goto (house rule).
//
// The effect fixture is authored at 20x5 so it replays whatever size the
// panel layout gives the live terminal (recordings larger than the terminal
// are skipped by design).
// ---------------------------------------------------------------------------

const E2E_USER = process.env.E2E_USER || 'karim@test.ocf';
const E2E_PASS = process.env.E2E_PASS || 'OcfTest2026!';

const CAST_FIXTURE = readFileSync(
  fileURLToPath(new URL('./fixtures/mini.cast', import.meta.url)),
  'utf-8'
);

const INTRO_URL = '/project-files/e2e-effect-intro/content';
const OUTRO_URL = '/project-files/e2e-effect-outro/content';

async function installEffectAssets(page: Page) {
  await page.route('**/api/v1/project-files/*/content', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/x-asciicast',
      body: CAST_FIXTURE,
    })
  );
}

async function launchIntoPlayer(page: Page, mock: ScenarioMock) {
  await dismissVerificationBanner(page);
  await navigateViaMenuCategory(page, 'terminals', '/scenarios');
  await expect(page.getByTestId('scenario-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('scenario-launch-btn').click();
  await expect(page).toHaveURL(/\/terminal-session\//, { timeout: 30_000 });
  await expect(page.getByTestId('scenario-step-title')).toBeVisible({ timeout: 20_000 });
  expect(mock.sessionStatus).toBe('active');
}

function effectSteps(): MockStep[] {
  return [
    {
      order: 1,
      title: 'Step with effects',
      type: 'terminal',
      introEffectUrl: INTRO_URL,
      outroEffectUrl: OUTRO_URL,
    },
    { order: 2, title: 'After the effects', type: 'info' },
  ];
}

test.describe('Scenario step effects (mocked backend)', () => {
  test('intro replays with skip hint, click skips, outro plays on validation', async ({ page }) => {
    test.setTimeout(120_000);
    const mock = new ScenarioMock(effectSteps());
    await mock.install(page);
    await installEffectAssets(page);
    await login(page, E2E_USER, E2E_PASS);
    await launchIntoPlayer(page, mock);

    // Intro effect: the skip hint overlays the terminal without touching the
    // panel (step content stays visible and actionable)
    const skipHint = page.getByTestId('tte-skip-hint');
    await expect(skipHint).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('scenario-verify-btn')).toBeVisible();

    // Clicking the terminal skips the replay and restores the shell view
    await page.locator('.xterm').first().click();
    await expect(skipHint).toBeHidden({ timeout: 5_000 });

    // Validation: the outro effect plays during the validated interstitial —
    // and never blocks advancement to the next step
    await page.getByTestId('scenario-verify-btn').click();
    await expect(skipHint).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('scenario-step-title')).toHaveText('After the effects', {
      timeout: 15_000,
    });
  });

  test('async next-step provisioning shows the preparing interstitial without layout shift', async ({ page }) => {
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

  test('reduced motion: effects never play, steps advance normally', async ({ page }) => {
    const mock = new ScenarioMock(effectSteps());
    await mock.install(page);
    await installEffectAssets(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await login(page, E2E_USER, E2E_PASS);
    await launchIntoPlayer(page, mock);

    // Give the intro path ample time to (wrongly) start before asserting
    await page.waitForTimeout(3_000);
    await expect(page.getByTestId('tte-skip-hint')).toHaveCount(0);

    await page.getByTestId('scenario-verify-btn').click();
    await expect(page.getByTestId('scenario-step-title')).toHaveText('After the effects', {
      timeout: 15_000,
    });
    await expect(page.getByTestId('tte-skip-hint')).toHaveCount(0);
  });
});
