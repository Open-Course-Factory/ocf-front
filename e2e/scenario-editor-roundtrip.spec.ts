import { test, expect, type Page } from '@playwright/test';
import { login, loginFresh } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import { dropStepNode, fillStepModalAndSave, saveStepModal } from './helpers/scenarioEditor';
import {
  apiLogin,
  findTeacherGroup,
  getAvailableScenario,
  getMyScenarioSessions,
  deleteScenarioById,
  cleanupScenarioSession,
  type ApiSession,
} from './helpers/scenarioApi';

// ---------------------------------------------------------------------------
// Tier B — everything a scenario goes through between being drawn and being
// played: nadia authors one on the canvas, karim runs it to the end, in the
// real UI on both sides and with a real container in between.
//
// How the scenario reaches karim, since the editor has no "assign" button:
// the create-scope picker offers GROUPS as well as orgs, and a group-scoped
// creation posts to /groups/:groupId/scenarios, which creates the group's
// ScenarioAssignment for you. Authoring it into the class karim is in is
// therefore the whole distribution step — no is_public, no API call. (The
// class must be one whose org karim also belongs to; the launcher scopes
// assignments by org context.)
//
// The smoke spec covers authoring alone, without containers; this one is the
// pair of it.
// ---------------------------------------------------------------------------

const AUTHOR_EMAIL = process.env.E2E_ORG_MANAGER_EMAIL || 'nadia@test.ocf';
const LEARNER_EMAIL = process.env.E2E_USER || 'karim@test.ocf';
const PASSWORD = process.env.E2E_PASS || 'OcfTest2026!';

const RUN_STAMP = Date.now().toString(36);
const SCENARIO_NAME = `e2e-roundtrip-${RUN_STAMP}`;
const SCENARIO_TITLE = `E2E roundtrip ${RUN_STAMP}`;
const INFO_STEP = 'Read the briefing';
const QUIZ_STEP = 'Answer the question';
const QUIZ_QUESTION = 'Which command lists files?';
const RIGHT_ANSWER = 'ls';
const WRONG_ANSWER = 'rm';

let author: ApiSession;
let learner: ApiSession;
let groupId: string | null = null;
let orgId = '';
let scenarioId: string | null = null;

test.describe.configure({ mode: 'serial' });

/** Add one multiple-choice question to the quiz step modal, then save it. */
async function addQuizQuestion(page: Page): Promise<void> {
  await page.locator('#tab-questions').click();
  await page.locator('.add-question-btn').click();
  await page.locator('#q-0-text').fill(QUIZ_QUESTION);

  const options = page.locator('.option-row__input');
  await options.nth(0).fill(WRONG_ANSWER);
  await options.nth(1).fill(RIGHT_ANSWER);

  // The right answer is deliberately NOT the first option. A fresh question has
  // correct_answer = '', and the editor's `isCorrect` test is
  // `Number(correct_answer) === index`, so `Number('') === 0` renders option 1's
  // radio as already selected. Checking it is then a no-op, no change event
  // fires, and the question saves with no correct answer at all — worth knowing
  // about, and worth not building this test on top of.
  // Click the label, which is what a user aims at — the radio itself sits under
  // the check-mark glyph and never receives the pointer.
  const rightAnswerRow = page.locator('.option-row').nth(1);
  await rightAnswerRow.locator('label.option-row__correct').click();
  await expect(rightAnswerRow.locator('input[type="radio"]')).toBeChecked();

  await saveStepModal(page);
}

test.beforeAll(async () => {
  author = await apiLogin(AUTHOR_EMAIL, PASSWORD);
  learner = await apiLogin(LEARNER_EMAIL, PASSWORD);
  const group = await findTeacherGroup(author, /test class/i, 1);
  groupId = group?.group_id ?? null;
  orgId = group?.organization_id ?? '';
});

test.afterAll(async () => {
  if (scenarioId) {
    await cleanupScenarioSession(learner, scenarioId).catch(() => {});
    await deleteScenarioById(author, scenarioId);
  }
  await author?.api.dispose();
  await learner?.api.dispose();
});

test('an author draws a scenario onto the canvas and hands it to their class', async ({ page }) => {
  test.skip(!groupId, `${AUTHOR_EMAIL} teaches no populated class — seed the dev personas first`);
  test.setTimeout(180_000);

  await loginFresh(page, AUTHOR_EMAIL, PASSWORD);
  await dismissVerificationBanner(page);
  await navigateViaMenuCategory(page, 'terminals', '/scenario-editor');
  await page.waitForSelector('.flow-canvas', { timeout: 20_000 });

  await page.locator('.btn-icon.btn-create').click();
  await page.locator('#scenario-name').fill(SCENARIO_NAME);
  await page.locator('#scenario-title').fill(SCENARIO_TITLE);
  await page.locator('#scenario-description').fill('Authored by scenario-editor-roundtrip.spec.ts.');

  // Group scope: this is what makes the scenario reach the class.
  await page.locator('#create-scope').selectOption(`group:${groupId}`);

  await page.locator('.base-modal-footer .btn.btn-primary').first().click();
  await page.waitForSelector('.scenario-node', { state: 'attached', timeout: 20_000 });

  // The image the learner will get is chosen on a second pass: the create modal
  // deliberately shows only General + Content, and the Setup / Options tabs
  // appear once the scenario exists. A direct DOM click because VueFlow's pan
  // handler swallows the event before the button sees it.
  await page.evaluate(() => {
    const button = document.querySelector(
      '.scenario-node .action-btn:not(.select-tree-btn):not(.delete-btn)'
    ) as HTMLButtonElement | null;
    if (!button) throw new Error('scenario edit button not found');
    button.click();
  });
  await page.locator('#tab-options').click();
  await page.locator('#scenario-instance-type').selectOption('xs');
  await page.locator('#scenario-os-type').selectOption('apk');
  await page.locator('.base-modal-footer .btn.btn-primary').first().click();
  await expect(page.locator('#scenario-instance-type')).toBeHidden({ timeout: 15_000 });

  await dropStepNode(page, 'info', 250, 250);
  await fillStepModalAndSave(page, INFO_STEP);
  await page.waitForSelector('.info-step-node', { state: 'attached', timeout: 10_000 });

  await dropStepNode(page, 'quiz', 450, 250);
  await page.locator('#step-title').fill(QUIZ_STEP);
  await addQuizQuestion(page);
  await page.waitForSelector('.quiz-step-node', { state: 'attached', timeout: 10_000 });

  await page.locator('.btn-save').click({ force: true });

  // Authoring it into the class IS the handover: the learner is now offered it.
  await expect
    .poll(async () => (await getAvailableScenario(learner, SCENARIO_TITLE, orgId))?.id ?? null, {
      timeout: 60_000,
    })
    .not.toBeNull();
  scenarioId = (await getAvailableScenario(learner, SCENARIO_TITLE, orgId)).id;
});

test('the learner plays the authored scenario through to completion', async ({ page }) => {
  test.skip(!scenarioId, 'the scenario was not authored, so there is nothing to play');
  test.setTimeout(360_000);

  await login(page, LEARNER_EMAIL, PASSWORD);
  await dismissVerificationBanner(page);
  await navigateViaMenuCategory(page, 'terminals', '/scenarios');

  const card = page.getByTestId('scenario-card').filter({ hasText: SCENARIO_TITLE });
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.getByTestId('scenario-launch-btn').click();

  const errorToast = page.locator('.el-notification');
  await Promise.race([
    page.waitForURL(/\/terminal-session\//, { timeout: 240_000 }),
    errorToast.waitFor({ state: 'visible', timeout: 240_000 }),
  ]);
  if (!/\/terminal-session\//.test(page.url())) {
    test.skip(true, 'launch refused by the backend (likely host capacity)');
  }

  await expect(page.getByTestId('scenario-step-title')).toHaveText(INFO_STEP, { timeout: 60_000 });
  await page.getByTestId('scenario-info-ack').click();

  await expect(page.getByTestId('scenario-step-title')).toHaveText(QUIZ_STEP, { timeout: 30_000 });
  await page.getByTestId('quiz-option').filter({ hasText: RIGHT_ANSWER }).first().click();
  await page.getByTestId('quiz-submit').click();
  await expect(page.getByTestId('quiz-results-score')).toBeVisible({ timeout: 15_000 });

  // Exam mode: the author left "show immediate feedback" off, so the panel
  // shows the score and moves on by itself — there is no Finish button to press.
  // (The recipe spec covers the learning-mode counterpart.)
  await expect(page.getByTestId('scenario-completed')).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(
      async () => {
        const sessions = await getMyScenarioSessions(learner);
        const session = sessions.find((s: any) => s.scenario_id === scenarioId);
        return session && { status: session.status, grade: session.grade };
      },
      { timeout: 30_000 }
    )
    .toEqual({ status: 'completed', grade: 100 });
});
