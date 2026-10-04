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
//  - may not archive or delete the colleague's lab.
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

let manager: ApiSession;
let teacher: ApiSession | null = null;
let orgId = '';
let membershipId: string | null = null;
let colleagueLabId: string | null = null;
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
});

test.afterAll(async () => {
  const admin = await adminSession();
  for (const id of createdByTeacher) await deleteScenarioById(admin ?? manager, id);
  if (colleagueLabId) await deleteScenarioById(manager, colleagueLabId);
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
  await expect(page.locator('#step-title')).toHaveCount(0);
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
  await expect(page.locator('#step-title')).toHaveValue(COLLEAGUE_STEP, { timeout: 20_000 });
  const copyId = new URL(page.url()).searchParams.get('scenarioId');
  expect(copyId).not.toBe(colleagueLabId);
  createdByTeacher.push(copyId!);

  await openStep(page, COLLEAGUE_STEP);
  await page.locator('#step-text-content').fill('Now mine.');
  await saveStep(page);
  await expect(page.getByTestId('step-preview')).toContainText('Now mine.');
});
