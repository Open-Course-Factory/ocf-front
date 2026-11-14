import { test, expect, type Browser, type Page } from '@playwright/test';
import { loginFresh, switchToOrg } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import {
  apiLogin,
  findOwnedTeamOrg,
  findTeacherGroup,
  importScenario,
  deleteScenario,
  createGroupAssignment,
  deleteAssignment,
  launchScenarioSession,
  cleanupScenarioSession,
  ensureOrgMembership,
  removeOrgMembership,
  getUserId,
  getTerminalSession,
  setClassSessionBlock,
  type ApiSession,
} from './helpers/scenarioApi';

// ---------------------------------------------------------------------------
// Tier B — a trainer acts on a learner from the class members list (#384).
//
// marc teaches a class karim belongs to; karim is at work on the class's
// scenario. From the members list, marc stops karim's session, then blocks
// karim in the class with a reason: karim's catalogue no longer lists the
// scenario assigned through that class (the product rule for a class-blocked
// learner; the refusal message of a direct launch is unit-tested). marc
// unblocks karim: the chip goes away and the card is back in the catalogue.
//
// Needs a core serving ocf-core #580 (participant controls) and #579 (blocks).
// Fixture setup mirrors supervisor-session-page.spec.ts; setup and teardown go
// through the API, the behavior under test stays in the UI. Teardown always
// lifts the block so a failed run never leaves karim blocked.
// ---------------------------------------------------------------------------

const TRAINER_EMAIL = process.env.E2E_TRAINER_EMAIL || 'marc@test.ocf';
const LEARNER_EMAIL = process.env.E2E_USER || 'karim@test.ocf';
const PASSWORD = process.env.E2E_PASS || 'OcfTest2026!';

const RUN_STAMP = Date.now().toString(36);
const FIXTURE_TITLE = `E2E participant controls ${RUN_STAMP}`;
const BLOCK_REASON = `Exam in progress ${RUN_STAMP}`;

let trainer: ApiSession;
let learner: ApiSession;
let learnerId = '';
let orgId: string | null = null;
let orgDisplayName = '';
let groupId: string | null = null;
let scenarioId: string | null = null;
let assignmentId: string | null = null;
let learnerTerminalId: string | null = null;
let grantedMembership: string | null = null;

/** The class's members list, reached through the class console and the class banner. */
async function openMembersList(page: Page): Promise<void> {
  await loginFresh(page, TRAINER_EMAIL, PASSWORD);
  await dismissVerificationBanner(page);
  await switchToOrg(page, orgDisplayName);
  await page.locator('.main-menu .my-classes-header').click();
  const classRow = page.locator('[data-test="class-row"]').filter({ hasText: FIXTURE_TITLE });
  await expect(classRow).toBeVisible({ timeout: 20_000 });
  await classRow.click();
  await page.getByRole('link', { name: /apprenants|learners/i }).click();
  await expect(page).toHaveURL(new RegExp(`/classes/${groupId}/members`), { timeout: 20_000 });
}

/** The learner's row, found by their name in the participants group. */
function learnerRow(page: Page, name: string) {
  return page
    .getByTestId('members-group-participants')
    .getByTestId('member-row')
    .filter({ has: page.locator('.ocf-member-row__name', { hasText: name }) });
}

async function openRowMenu(page: Page, name: string): Promise<void> {
  await learnerRow(page, name).locator('.ocf-dropdown .dropdown-trigger').click();
  await expect(learnerRow(page, name).locator('.ocf-dropdown-menu')).toBeVisible();
}

/**
 * Whether karim's catalogue lists the class scenario, read in a fresh learner
 * login once the catalogue has loaded (so an absent card is a real absence,
 * not a page still loading).
 */
async function learnerCatalogueListsFixture(browser: Browser): Promise<boolean> {
  const learnerContext = await browser.newContext();
  const learnerPage = await learnerContext.newPage();
  try {
    await loginFresh(learnerPage, LEARNER_EMAIL, PASSWORD);
    await dismissVerificationBanner(learnerPage);
    await switchToOrg(learnerPage, orgDisplayName);
    await navigateViaMenuCategory(learnerPage, 'scenarios', '/scenarios');
    await expect(learnerPage.locator('.loading-section')).toHaveCount(0, { timeout: 20_000 });
    await expect(learnerPage.locator('.error-section')).toHaveCount(0);
    await expect(learnerPage.locator('.scenario-grid, .empty-section').first()).toBeVisible({ timeout: 20_000 });
    return (await learnerPage.getByTestId('scenario-card').filter({ hasText: FIXTURE_TITLE }).count()) > 0;
  } finally {
    await learnerContext.close();
  }
}

test.beforeAll(async () => {
  trainer = await apiLogin(TRAINER_EMAIL, PASSWORD);
  learner = await apiLogin(LEARNER_EMAIL, PASSWORD);
  learnerId = await getUserId(learner);

  const org = await findOwnedTeamOrg(trainer);
  const group = await findTeacherGroup(trainer, /docker fondamentaux/i, 2);
  if (!org || !group) return;
  orgId = org.id;
  orgDisplayName = org.displayName;
  groupId = group.group_id;

  grantedMembership = await ensureOrgMembership(trainer, orgId, learnerId);

  const scenario = await importScenario(trainer, orgId, {
    title: FIXTURE_TITLE,
    description: 'Auto-generated by participant-controls.spec.ts — safe to delete.',
    is_public: false,
    steps: [{ title: 'Read the briefing', step_type: 'info', text_content: 'Nothing to do.' }],
  });
  scenarioId = scenario.id;
  assignmentId = (await createGroupAssignment(trainer, scenarioId, groupId)).id;

  const launched = await launchScenarioSession(learner, scenarioId, orgId);
  learnerTerminalId = launched?.terminal_session_id ?? null;
});

test.afterAll(async () => {
  if (groupId && learnerId) await setClassSessionBlock(trainer, groupId, learnerId, { blocked: false });
  if (scenarioId) await cleanupScenarioSession(learner, scenarioId).catch(() => {});
  if (assignmentId) await deleteAssignment(trainer, assignmentId);
  if (orgId && scenarioId) await deleteScenario(trainer, orgId, scenarioId);
  if (grantedMembership) await removeOrgMembership(trainer, grantedMembership);
  await trainer?.api.dispose();
  await learner?.api.dispose();
});

test('a trainer stops and blocks a learner from the members list; the class scenario leaves and returns to their catalogue', async ({ page, browser }) => {
  test.skip(!groupId, `${TRAINER_EMAIL} teaches no class with learners — seed the dev personas first`);
  test.skip(!learnerTerminalId, 'the learner run could not be provisioned — likely host capacity');
  test.setTimeout(300_000);

  await openMembersList(page);
  const row = learnerRow(page, 'Karim');
  await expect(row).toBeVisible({ timeout: 20_000 });
  const learnerName = (await row.locator('.ocf-member-row__name').innerText()).trim();

  // 1. Stop karim's session: the menu asks first, then the session is stopped.
  await openRowMenu(page, learnerName);
  await page.getByTestId('participant-action-stop').click();
  await page.getByTestId('participant-confirm').click();
  await expect(page.locator('.toast-success')).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(async () => (await getTerminalSession(learner, learnerTerminalId!))?.state, { timeout: 60_000 })
    .toBe('stopped');
  // The list read again: no session left to stop.
  await openRowMenu(page, learnerName);
  await expect(page.getByTestId('participant-action-stop')).toHaveCount(0);

  // 2. Block karim in the class, with a reason. Nothing of karim's runs any
  //    more, so the dialog offers no "also stop" option.
  await page.getByTestId('participant-action-block-class').click();
  await expect(page.getByTestId('participant-block-stop-running')).toHaveCount(0);
  await page.getByTestId('participant-block-reason').fill(BLOCK_REASON);
  await page.getByTestId('participant-confirm').click();
  await expect(row.getByTestId('participant-chip-blocked-class')).toBeVisible({ timeout: 30_000 });

  // 3. Blocked in the class, karim no longer sees the class's scenario.
  expect(await learnerCatalogueListsFixture(browser), 'the class scenario is gone from the blocked learner’s catalogue').toBe(false);

  // 4. marc unblocks karim; the chip goes away and the card is back.
  await openRowMenu(page, learnerName);
  await page.getByTestId('participant-action-unblock-class').click();
  await expect(row.getByTestId('participant-chip-blocked-class')).toHaveCount(0, { timeout: 30_000 });
  expect(await learnerCatalogueListsFixture(browser), 'the class scenario is back once the block is lifted').toBe(true);
});
