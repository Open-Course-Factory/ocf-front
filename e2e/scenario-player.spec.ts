import { test, expect, type Page } from '@playwright/test';
import { login } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import { ScenarioMock, standardSteps, type MockStep } from './helpers/scenarioMock';

// ---------------------------------------------------------------------------
// Tier A player suite — the scenario player driven end to end against a
// stateful HTTP mock (no tt-backend / Incus needed, runs in CI).
//
// Real UI navigation throughout: login -> sidebar Terminals -> Scénarios ->
// launch -> player. Only /login uses page.goto (house rule).
//
// The real-container counterpart lives in scenario-run.spec.ts (Tier B,
// local-only). See scenarios-e2e-test-plan.md at the monorepo root.
// ---------------------------------------------------------------------------

const E2E_USER = process.env.E2E_USER || 'karim@test.ocf';
const E2E_PASS = process.env.E2E_PASS || 'OcfTest2026!';

async function openLauncher(page: Page) {
  await dismissVerificationBanner(page);
  await navigateViaMenuCategory(page, 'scenarios', '/scenarios');
  await expect(page.getByTestId('scenario-card')).toBeVisible({ timeout: 15_000 });
}

async function launchIntoPlayer(page: Page, mock: ScenarioMock) {
  await openLauncher(page);
  await page.getByTestId('scenario-launch-btn').click();
  await expect(page).toHaveURL(/\/terminal-session\//, { timeout: 30_000 });
  // The panel shows the first step once current-step resolves
  await expect(page.getByTestId('scenario-step-title')).toBeVisible({ timeout: 20_000 });
  expect(mock.sessionStatus).toBe('active');
}

test.describe('Scenario player (mocked backend)', () => {
  test('full walkthrough: info, terminal with hints, flag, quiz, completion', async ({ page }) => {
    test.setTimeout(120_000);
    const mock = new ScenarioMock(standardSteps());
    await mock.install(page);
    await login(page, E2E_USER, E2E_PASS);
    await launchIntoPlayer(page, mock);

    // Step 1 — info: type chip + acknowledge
    await expect(page.getByTestId('scenario-step-title')).toHaveText('Read the briefing');
    await expect(page.getByTestId('scenario-step-type-chip')).toBeVisible();
    await page.getByTestId('scenario-info-ack').click();

    // Step 2 — terminal: hints reveal sequentially, then verify passes
    await expect(page.getByTestId('scenario-step-title')).toHaveText('Create the marker file', {
      timeout: 15_000,
    });
    await page.getByTestId('hint-reveal-next').click();
    await expect(page.getByTestId('hint-item')).toHaveCount(1);
    await expect(page.getByTestId('hint-item').first()).toContainText('Look in /tmp.');
    await page.getByTestId('hint-reveal-next').click();
    await expect(page.getByTestId('hint-item')).toHaveCount(2);
    await page.getByTestId('scenario-verify-btn').click();

    // Step 3 — flag: wrong first (exact-match semantics), then right
    await expect(page.getByTestId('scenario-step-title')).toHaveText('Find the flag', {
      timeout: 15_000,
    });
    await page.getByTestId('scenario-flag-input').fill('FLAG{wrong}');
    await page.getByTestId('scenario-flag-submit').click();
    await expect(page.getByTestId('scenario-flag-result')).toHaveClass(/incorrect/);
    await page.getByTestId('scenario-flag-input').fill('FLAG{deadbeefdeadbeef}');
    await page.getByTestId('scenario-flag-submit').click();

    // Step 4 — quiz: both answers right, breakdown all-correct, finish
    await expect(page.getByTestId('scenario-step-title')).toHaveText('Final quiz', {
      timeout: 15_000,
    });
    await page.getByTestId('quiz-option').nth(1).click(); // "ls"
    await page.getByTestId('quiz-next').click();
    await page.getByTestId('quiz-option').filter({ hasText: /vrai|true/i }).first().click();
    await page.getByTestId('quiz-validate').click();
    await page.getByTestId('quiz-confirm-submit').click();
    await expect(page.getByTestId('quiz-results-score')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('quiz-breakdown-item')).toHaveCount(2);
    await expect(page.getByTestId('quiz-breakdown-item').first()).toHaveClass(/is-correct/);
    await page.getByTestId('quiz-finish').click();

    // Completed panel + backend-visible outcome
    await expect(page.getByTestId('scenario-completed')).toBeVisible({ timeout: 15_000 });
    expect(mock.sessionStatus).toBe('completed');
    expect(mock.grade).toBe(100);
  });

  test('failed verify shows output and does not advance; fixing passes', async ({ page }) => {
    const steps: MockStep[] = [
      {
        order: 1,
        title: 'Fix the config',
        type: 'terminal',
        verifyOutcomes: [false, true],
        verifyFailOutput: 'nginx.conf: syntax error on line 3',
      },
    ];
    const mock = new ScenarioMock(steps);
    await mock.install(page);
    await login(page, E2E_USER, E2E_PASS);
    await launchIntoPlayer(page, mock);

    await page.getByTestId('scenario-verify-btn').click();
    const result = page.getByTestId('scenario-verify-result');
    await expect(result).toHaveClass(/failed/);
    await expect(result).toContainText('nginx.conf: syntax error on line 3');
    expect(mock.sessionStatus).toBe('active');

    await page.getByTestId('scenario-verify-btn').click();
    await expect(page.getByTestId('scenario-completed')).toBeVisible({ timeout: 15_000 });
    expect(mock.sessionStatus).toBe('completed');
  });

  test('a step reached with Verify has usable Copy and Paste buttons on its code blocks', async ({ page }) => {
    const steps: MockStep[] = [
      { order: 1, title: 'First', type: 'terminal' },
      {
        order: 2,
        title: 'Second',
        type: 'terminal',
        text: 'Run these:\n\n1. List\n\n   ```\n   ls -l\n   ```{{exec}}\n\n2. Where\n\n   ```\n   pwd\n   ```{{exec}}\n\n3. Done',
      },
    ];
    const mock = new ScenarioMock(steps);
    await mock.install(page);
    await login(page, E2E_USER, E2E_PASS);
    await launchIntoPlayer(page, mock);

    await page.getByTestId('scenario-verify-btn').click();
    await expect(page.getByTestId('scenario-step-title')).toContainText('Second', { timeout: 15_000 });

    const blocks = page.locator('.step-content .code-block-wrapper');
    await expect(blocks).toHaveCount(2);
    await expect(page.locator('.step-content .step-text ol')).toHaveCount(1);

    // A real click: Playwright refuses it if anything covers the button.
    await blocks.first().hover();
    await blocks.first().locator('.paste-terminal-btn').click({ timeout: 5_000 });
    await blocks.first().locator('.copy-code-btn').click({ timeout: 5_000 });
  });

  test('flag lockout after 20 failed attempts', async ({ page }) => {
    test.setTimeout(120_000);
    const mock = new ScenarioMock([
      { order: 1, title: 'Locked flag', type: 'flag', flag: 'FLAG{0000000000000000}' },
    ]);
    await mock.install(page);
    await login(page, E2E_USER, E2E_PASS);
    await launchIntoPlayer(page, mock);

    const input = page.getByTestId('scenario-flag-input');
    const submit = page.getByTestId('scenario-flag-submit');
    const result = page.getByTestId('scenario-flag-result');
    for (let i = 1; i <= 20; i++) {
      await input.fill(`FLAG{wrong${i}}`);
      await submit.click();
      await expect(result).toHaveClass(/incorrect/);
    }
    // 21st attempt: backend answers 200 + correct:false + lockout message
    await input.fill('FLAG{0000000000000000}');
    await submit.click();
    await expect(result).toHaveClass(/incorrect/);
    expect(mock.sessionStatus).toBe('active');
  });

  test('quiz at 0% still advances the session (pinned backend behavior)', async ({ page }) => {
    const steps: MockStep[] = [
      {
        order: 1,
        title: 'Exam quiz',
        type: 'quiz',
        show_immediate_feedback: true,
        questions: [
          {
            id: 'q1',
            order: 1,
            question_text: 'Free answer',
            question_type: 'free_text',
            correct: 'the-right-answer',
          },
        ],
      },
      { order: 2, title: 'After the quiz', type: 'info' },
    ];
    const mock = new ScenarioMock(steps);
    await mock.install(page);
    await login(page, E2E_USER, E2E_PASS);
    await launchIntoPlayer(page, mock);

    await page.getByTestId('quiz-free-input').fill('completely wrong');
    await page.getByTestId('quiz-validate').click();
    await page.getByTestId('quiz-confirm-submit').click();
    await expect(page.getByTestId('quiz-results-score')).toBeVisible();
    await expect(page.getByTestId('quiz-breakdown-item').first()).toHaveClass(/is-incorrect/);

    // Advancing is offered even at 0% — a debatable product behavior this
    // spec pins on purpose (see plan §7).
    await page.getByTestId('quiz-advance').click();
    await expect(page.getByTestId('scenario-step-title')).toHaveText('After the quiz', {
      timeout: 15_000,
    });
  });

  test('exam quiz: free navigation, confirmation lists unanswered, no grade shown', async ({ page }) => {
    const mcq = (id: string, order: number) => ({
      id,
      order,
      question_text: `Exam question ${order}`,
      question_type: 'multi_answer' as const,
      options: ['alpha', 'beta', 'gamma'],
      correct: '[0]',
    });
    const steps: MockStep[] = [
      {
        order: 1,
        title: 'Exam quiz',
        type: 'quiz',
        show_immediate_feedback: false,
        quiz_scoring_mode: 'partial',
        questions: [mcq('q1', 1), mcq('q2', 2), mcq('q3', 3)],
      },
      { order: 2, title: 'After the exam', type: 'info' },
    ];
    const mock = new ScenarioMock(steps);
    await mock.install(page);
    await login(page, E2E_USER, E2E_PASS);
    await launchIntoPlayer(page, mock);

    await expect(page.getByTestId('quiz-scoring-rule')).toBeVisible();
    const navItems = page.getByTestId('quiz-nav-item');
    await expect(navItems).toHaveCount(3);

    // Jump straight to the last question and answer it, skipping 1 and 2.
    await navItems.nth(2).click();
    await expect(page.getByText('Exam question 3')).toBeVisible();
    await page.getByTestId('quiz-option').filter({ hasText: 'alpha' }).click();
    await expect(navItems.nth(2)).toHaveClass(/answered/);

    // Validating asks first and names the unanswered questions.
    await page.getByTestId('quiz-validate').click();
    const gotos = page.getByTestId('quiz-confirm-goto');
    await expect(gotos).toHaveText(['1', '2']);

    // Going back to question 1 from the confirmation.
    await gotos.first().click();
    await expect(page.getByTestId('quiz-confirm')).toBeHidden();
    await expect(page.getByText('Exam question 1')).toBeVisible();
    await page.getByTestId('quiz-option').filter({ hasText: 'alpha' }).click();

    await page.getByTestId('quiz-validate').click();
    await expect(page.getByTestId('quiz-confirm-goto')).toHaveText(['2']);
    await page.getByTestId('quiz-confirm-submit').click();

    // Recorded, never graded, then the run moves on by itself.
    await expect(page.getByTestId('quiz-recorded')).toBeVisible();
    await expect(page.getByTestId('quiz-results-score')).toHaveCount(0);
    await expect(page.getByTestId('quiz-breakdown-item')).toHaveCount(0);
    await expect(page.getByTestId('scenario-step-title')).toHaveText('After the exam', {
      timeout: 15_000,
    });
  });

  // A failed check used to open the first hint by itself. Revealing a hint is
  // recorded server-side, so doing it for the learner both takes the decision
  // away and scores them as having asked for help they never asked for.
  test('a failed check does not reveal a hint; only the learner does', async ({ page }) => {
    test.setTimeout(120_000);
    const mock = new ScenarioMock([
      {
        order: 1,
        title: 'Create the marker file',
        type: 'terminal',
        hints: ['Look in /tmp.', 'Use the touch command.'],
        verifyOutcomes: [false, true],
      },
      { order: 2, title: 'Done', type: 'info' },
    ]);
    await mock.install(page);
    await login(page, E2E_USER, E2E_PASS);
    await launchIntoPlayer(page, mock);

    await page.getByTestId('scenario-verify-btn').click();

    // The check reports failure...
    await expect(page.getByTestId('scenario-verify-result')).toBeVisible({ timeout: 15_000 });
    // ...and nothing opened on its own.
    await expect(page.getByTestId('hint-item')).toHaveCount(0);

    // The learner asks, and only then does a hint appear.
    await page.getByTestId('hint-reveal-next').click();
    await expect(page.getByTestId('hint-item')).toHaveCount(1);
    await expect(page.getByTestId('hint-item').first()).toContainText('Look in /tmp.');
  });

  test('completed session opens in review mode from the launcher', async ({ page }) => {
    const mock = new ScenarioMock(standardSteps(), { startCompleted: true });
    await mock.install(page);
    await login(page, E2E_USER, E2E_PASS);
    await openLauncher(page);

    // The card shows Review (completed session) instead of Launch
    await page.getByTestId('scenario-review-btn').click();
    await expect(page).toHaveURL(/\/terminal-session\//, { timeout: 30_000 });

    // Review-mode banner announces the completed session
    await expect(page.locator('.review-mode-banner')).toBeVisible({ timeout: 20_000 });
  });
});
