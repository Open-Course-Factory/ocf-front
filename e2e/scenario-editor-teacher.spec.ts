import { test, expect, type Page } from '@playwright/test';
import { login } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import { addStep, fillStepAndSave, openStep, outlineTitles, saveStep } from './helpers/scenarioEditor';
import {
  apiLogin,
  deleteScenarioById,
  findTeacherGroup,
  getUserId,
  importScenario,
  removeOrgMembership,
  type ApiSession,
} from './helpers/scenarioApi';
import {
  adminSession,
  deleteOrganization,
  deleteUsersByEmail,
  freshUser,
  registerViaUi,
  verifyEmailViaToken,
} from './helpers/freshUsers';

// ---------------------------------------------------------------------------
// An organization's TEACHER in the scenario editor (role below manager):
//  - writes and edits their own scenario in the organization;
//  - opens a colleague's lab read only, with its steps shown as the learner
//    reads them, and may duplicate it into the organization — the copy is
//    theirs to edit;
//  - may not archive or delete the colleague's lab;
//  - reads a public platform scenario's steps without editing them, and
//    copies one of them into their own scenario through the step library.
// The teacher is a fresh account made a teacher of nadia's organization for
// the run; everything the run creates is deleted on the way out.
// No container is provisioned.
// ---------------------------------------------------------------------------

const API_BASE = process.env.OCF_API_URL || 'http://localhost:8080/api/v1';
const MANAGER_EMAIL = process.env.E2E_ORG_MANAGER_EMAIL || 'nadia@test.ocf';
const PASSWORD = process.env.E2E_PASS || 'OcfTest2026!';
const STAMP = Date.now().toString(36);
const TEACHER = freshUser('teacher', STAMP);
const OWN_TITLE = `E2E teacher lab ${STAMP}`;
const COLLEAGUE_TITLE = `E2E colleague lab ${STAMP}`;
const COLLEAGUE_STEP = 'Read the briefing';
const COLLEAGUE_TEXT = 'Everything here belongs to a colleague.';
const PUBLIC_TITLE = `E2E public lab ${STAMP}`;
const PUBLIC_STEP = 'A step worth reusing';
const PUBLIC_TEXT = 'Taken from the platform catalogue.';
const PUBLIC_VERIFY = 'test -f /tmp/reused';

let manager: ApiSession;
let teacher: ApiSession | null = null;
let orgId = '';
let membershipId: string | null = null;
let colleagueLabId: string | null = null;
let publicLabId: string | null = null;
const createdByTeacher: string[] = [];

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ browser }) => {
  manager = await apiLogin(MANAGER_EMAIL, PASSWORD);
  orgId = (await findTeacherGroup(manager, /test class/i, 1))?.organization_id ?? '';
  if (!orgId) return;

  const page = await browser.newPage();
  await registerViaUi(page, TEACHER);
  await page.close();
  await verifyEmailViaToken(TEACHER.email);
  teacher = await apiLogin(TEACHER.email, TEACHER.password);

  const added = await manager.api.post(`${API_BASE}/organization-members`, {
    headers: { Authorization: `Bearer ${manager.token}` },
    data: { organization_id: orgId, user_id: await getUserId(teacher), role: 'teacher' },
  });
  expect(added.ok(), `adding the teacher failed: ${added.status()} ${await added.text()}`).toBeTruthy();
  membershipId = (await added.json()).id;

  colleagueLabId = (await importScenario(manager, orgId, {
    title: COLLEAGUE_TITLE,
    steps: [{ title: COLLEAGUE_STEP, step_type: 'info', text_content: COLLEAGUE_TEXT }],
  })).id;

  // A public platform scenario, which only an administrator can publish.
  const admin = await adminSession();
  if (admin) {
    publicLabId = (await importScenario(admin, null, {
      title: PUBLIC_TITLE,
      is_public: true,
      steps: [{ title: PUBLIC_STEP, step_type: 'terminal', text_content: PUBLIC_TEXT, verify_script: PUBLIC_VERIFY }],
    })).id;
    await admin.api.dispose();
  }
});

test.afterAll(async () => {
  const admin = await adminSession();
  for (const id of createdByTeacher) await deleteScenarioById(admin ?? manager, id);
  if (colleagueLabId) await deleteScenarioById(manager, colleagueLabId);
  if (publicLabId && admin) await deleteScenarioById(admin, publicLabId);
  if (membershipId) await removeOrgMembership(manager, membershipId);
  if (admin) {
    // Registration gave the teacher a personal organization; it goes with them.
    if (teacher) {
      const orgs = await teacher.api.get(`${API_BASE}/organizations`, { headers: { Authorization: `Bearer ${teacher.token}` } })
        .then(r => r.json()).catch(() => []);
      for (const org of (Array.isArray(orgs) ? orgs : orgs?.data || []).filter((o: any) => o.id !== orgId)) {
        await deleteOrganization(admin, org.id);
      }
    }
    await deleteUsersByEmail(admin, [TEACHER.email]);
    await admin.api.dispose();
  }
  await teacher?.api.dispose();
  await manager?.api.dispose();
});

async function openEditorAsTeacher(page: Page): Promise<void> {
  await login(page, TEACHER.email, TEACHER.password);
  await dismissVerificationBanner(page);
  await navigateViaMenuCategory(page, 'scenarios', '/scenario-editor');
  await expect(page.getByTestId('scenario-picker')).toBeVisible({ timeout: 20_000 });
}

test('a teacher writes and edits a scenario in their organization', async ({ page }) => {
  test.skip(!teacher, `${MANAGER_EMAIL} teaches no class — seed the dev personas first`);
  test.setTimeout(120_000);
  await openEditorAsTeacher(page);

  await page.getByTestId('scenario-create-btn').click();
  await page.locator('#scenario-name').fill(`e2e-teacher-${STAMP}`);
  await page.locator('#scenario-title').fill(OWN_TITLE);
  await page.locator('#create-scope').selectOption(`org:${orgId}`);
  await page.locator('.base-modal-footer .btn.btn-primary').first().click();
  await expect(page.getByTestId('no-steps-state')).toBeVisible({ timeout: 20_000 });
  createdByTeacher.push(new URL(page.url()).searchParams.get('scenarioId')!);

  await addStep(page, 'info');
  await fillStepAndSave(page, 'First words');
  await page.locator('#step-text-content').fill('Written by a teacher.');
  await saveStep(page);

  await page.reload();
  await expect(outlineTitles(page)).toHaveText(['First words'], { timeout: 20_000 });
  await expect(page.locator('#step-text-content')).toHaveValue('Written by a teacher.');
});

test("a teacher reads a colleague's lab, cannot retire it, and duplicates it to edit", async ({ page }) => {
  test.skip(!teacher || !colleagueLabId, 'no teacher or colleague lab was set up');
  test.setTimeout(120_000);
  await openEditorAsTeacher(page);

  await page.getByTestId('scenario-picker').selectOption(colleagueLabId!);

  // Read only, with the content shown as the learner reads it.
  await expect(page.getByTestId('readonly-step')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('step-preview')).toContainText(COLLEAGUE_TEXT);
  // The same editor, read only: shown, nothing to save.
  await expect(page.locator('#step-title')).toHaveAttribute('readonly', '');
  await expect(page.getByTestId('step-edit-save')).toHaveCount(0);
  await expect(page.getByTestId('outline-add-step')).toHaveCount(0);

  // Exporting a colleague's lab is allowed; archiving or deleting it is not.
  await expect(page.getByTestId('scenario-export-btn')).toBeEnabled();
  await page.getByTestId('scenario-more-actions').click();
  await expect(page.getByRole('button', { name: /archive|archiver/i })).toHaveCount(0);
  await expect(page.getByTestId('scenario-delete')).toHaveCount(0);
  await page.keyboard.press('Escape');

  await page.getByTestId('readonly-step').getByTestId('duplicate-into-org').click();
  await page.locator('#duplicate-target').selectOption(`org:${orgId}`);
  await page.locator('.base-modal-footer .btn.btn-primary').first().click();

  // The copy opens, and it is the teacher's to edit.
  await expect(page).not.toHaveURL(new RegExp(colleagueLabId!), { timeout: 20_000 });
  await expect(page.locator('#step-title')).toHaveValue(COLLEAGUE_STEP, { timeout: 20_000 });
  await expect(page.locator('#step-title')).toBeEditable();
  const copyId = new URL(page.url()).searchParams.get('scenarioId');
  expect(copyId).not.toBe(colleagueLabId);
  createdByTeacher.push(copyId!);

  await openStep(page, COLLEAGUE_STEP);
  await page.locator('#step-text-content').fill('Now mine.');
  await saveStep(page);
  await expect(page.getByTestId('step-preview')).toContainText('Now mine.');
});

test("a teacher reads a public scenario's steps and copies one into their own scenario", async ({ page }) => {
  test.skip(!teacher || !publicLabId || !createdByTeacher[0], 'needs the teacher, their scenario and a public lab');
  test.setTimeout(120_000);
  await openEditorAsTeacher(page);

  // Read only, its outline and content visible.
  await page.getByTestId('scenario-picker').selectOption(publicLabId!);
  await expect(outlineTitles(page)).toHaveText([PUBLIC_STEP], { timeout: 20_000 });
  await expect(page.getByTestId('step-preview')).toContainText(PUBLIC_TEXT);
  await expect(page.getByTestId('step-edit-save')).toHaveCount(0);
  // Its scripts too: what a duplicate would carry.
  await page.locator('#tab-verify').click();
  await expect(page.locator('#step-verify-script')).toHaveValue(PUBLIC_VERIFY);
  await expect(page.locator('#step-verify-script')).toBeDisabled();
  // And its settings, to read.
  await page.getByTestId('outline-scenario-card').click();
  await expect(page.locator('.base-modal-footer .btn-primary')).toHaveCount(0);
  await expect(page.locator('#scenario-name')).toBeDisabled();
  await page.locator('.base-modal-close').click();

  // Copying from the library warns that a step may lean on its scenario's setup.
  // (Checked below, once a step is ticked.)

  // Their own scenario: copy the public step after its first step.
  await page.getByTestId('scenario-picker').selectOption(createdByTeacher[0]);
  await expect(outlineTitles(page)).toHaveText(['First words'], { timeout: 20_000 });
  const library = page.locator('#tab-library');
  if (!(await library.isVisible())) await page.getByTestId('rail-strip-library').click();
  else await library.click();
  await page.getByTestId(`step-library-scenario-${publicLabId}`).click();
  const step = page.getByTestId('step-library').locator('.ocf-library-step').filter({ hasText: PUBLIC_STEP });
  await step.locator('input[type="checkbox"]').check();
  await expect(page.getByTestId('step-library-notice')).toBeVisible();
  await page.getByTestId('step-library-insert').click();

  await expect(outlineTitles(page)).toHaveText(['First words', PUBLIC_STEP], { timeout: 20_000 });
  // The copy is the teacher's: it opens editable, with the source's text and script.
  await expect(page.locator('#step-title')).toHaveValue(PUBLIC_STEP);
  await expect(page.locator('#step-text-content')).toHaveValue(PUBLIC_TEXT);
  await expect(page.locator('#step-text-content')).toBeEditable();
  await page.locator('#tab-verify').click();
  await expect(page.locator('#step-verify-script')).toHaveValue(PUBLIC_VERIFY);
});

test("Play on a public scenario follows the catalogue's verdict", async ({ page }) => {
  test.skip(!teacher || !publicLabId, 'needs the teacher and a public lab');
  await openEditorAsTeacher(page);
  await page.getByTestId('scenario-picker').selectOption(publicLabId!);
  await expect(outlineTitles(page)).toHaveText([PUBLIC_STEP], { timeout: 20_000 });

  // Preview is not theirs on a platform scenario; launching is the catalogue's
  // call (GET /scenario-sessions/available), so the spec asks it too. A stack
  // with no terminal backend or plan answers "not launchable".
  const available = await teacher!.api.get(`${API_BASE}/scenario-sessions/available`, {
    headers: { Authorization: `Bearer ${teacher!.token}` },
  });
  const cards = available.ok() ? await available.json() : [];
  const launchable = !!(Array.isArray(cards) ? cards : cards?.data || []).find((c: any) => c.id === publicLabId)?.launchable;

  const play = page.getByTestId('scenario-play-btn');
  if (!launchable) {
    await expect(play).toBeDisabled();
    return;
  }
  await expect(play).toBeEnabled({ timeout: 10_000 });
  await play.click();
  await expect(page).toHaveURL(new RegExp(`/scenarios\\?scenario=${publicLabId}`));
  await expect(page.locator(`[data-scenario-id="${publicLabId}"]`)).toHaveClass(/scenario-card--focused/);
});
