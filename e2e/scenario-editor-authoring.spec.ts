import { test, expect, type Page } from '@playwright/test';
import { loginFresh } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import { addStep, fillStepAndSave, openStep, outlineTitles } from './helpers/scenarioEditor';
import { apiLogin, deleteScenarioById, findTeacherGroup, type ApiSession } from './helpers/scenarioApi';

// ---------------------------------------------------------------------------
// Authoring details the smoke spec walks past:
//  - an empty editor leads to creating a scenario, instead of calling a
//    scenario that does not exist "read-only";
//  - a step inserted in the middle of the list is saved there, and a step
//    moved in the list keeps its new place after a reload;
//  - a stray click beside the scenario modal does not throw the form away,
//    and switching step with unsaved edits asks first.
// No container is provisioned.
// ---------------------------------------------------------------------------

const AUTHOR_EMAIL = process.env.E2E_ORG_MANAGER_EMAIL || 'nadia@test.ocf';
const PASSWORD = process.env.E2E_PASS || 'OcfTest2026!';
const STAMP = Date.now().toString(36);

let author: ApiSession;
let scenarioId: string | null = null;
let groupId: string | null = null;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  author = await apiLogin(AUTHOR_EMAIL, PASSWORD);
  groupId = (await findTeacherGroup(author, /test class/i, 1))?.group_id ?? null;
});

test.afterAll(async () => {
  if (scenarioId) await deleteScenarioById(author, scenarioId);
  await author?.api.dispose();
});

async function openEditor(page: Page): Promise<void> {
  await loginFresh(page, AUTHOR_EMAIL, PASSWORD);
  await dismissVerificationBanner(page);
  await navigateViaMenuCategory(page, 'scenarios', '/scenario-editor');
  await page.waitForSelector('[data-testid="scenario-picker"]', { timeout: 20_000 });
}

test('an empty editor invites creating a scenario', async ({ page }) => {
  await openEditor(page);

  const empty = page.getByTestId('editor-empty-state');
  await expect(empty).toBeVisible();
  await expect(empty.getByTestId('scenario-import-btn')).toBeVisible();
  await expect(empty.getByTestId('scenario-ai-create-btn')).toBeVisible();
  await expect(page.getByText(/read-only|lecture seule/i)).toHaveCount(0);

  await empty.getByTestId('empty-create-scenario').click();
  await expect(page.locator('#scenario-name')).toBeVisible();

  await page.locator('#scenario-name').fill(`e2e-authoring-${STAMP}`);
  await page.locator('.base-modal-overlay').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('#scenario-name')).toHaveValue(`e2e-authoring-${STAMP}`);
});

test('a step inserted between two others is saved in that place, and a moved step stays moved', async ({ page }) => {
  test.skip(!groupId, `${AUTHOR_EMAIL} teaches no class — seed the dev personas first`);
  test.setTimeout(120_000);
  await openEditor(page);

  await page.getByTestId('scenario-create-btn').click();
  await page.locator('#scenario-name').fill(`e2e-authoring-${STAMP}`);
  await page.locator('#scenario-title').fill(`E2E authoring ${STAMP}`);
  await page.locator('#create-scope').selectOption(`group:${groupId}`);
  await page.locator('.base-modal-footer .btn.btn-primary').first().click();
  await expect(page.getByTestId('no-steps-state')).toBeVisible({ timeout: 20_000 });
  scenarioId = new URL(page.url()).searchParams.get('scenarioId');
  expect(scenarioId).not.toBeNull();

  await addStep(page, 'info');
  await fillStepAndSave(page, 'Alpha');
  await addStep(page, 'info');
  await fillStepAndSave(page, 'Charlie');

  // Insert before the second step.
  await addStep(page, 'info', 1);
  await fillStepAndSave(page, 'Bravo');
  await expect(outlineTitles(page)).toHaveText(['Alpha', 'Bravo', 'Charlie']);

  // Move Alpha to the end with the keyboard.
  await page.getByTestId('outline-step-0').locator('.ocf-outline-row').focus();
  await page.keyboard.press('Alt+ArrowDown');
  await expect(outlineTitles(page)).toHaveText(['Bravo', 'Alpha', 'Charlie']);
  await page.getByTestId('outline-move-down-1').click({ force: true });
  await expect(outlineTitles(page)).toHaveText(['Bravo', 'Charlie', 'Alpha']);

  // The order is the stored one, not only the one on screen.
  await expect(page.getByTestId('save-state')).toHaveText(/^\s*(saved|enregistré)\s*$/i);
  await page.reload();
  await expect(outlineTitles(page)).toHaveText(['Bravo', 'Charlie', 'Alpha'], { timeout: 20_000 });
});

test('switching step with unsaved edits asks first', async ({ page }) => {
  test.skip(!scenarioId, 'needs the scenario the previous test created');
  await openEditor(page);
  await page.getByTestId('scenario-picker').selectOption(scenarioId!);
  await openStep(page, 'Bravo');

  await page.locator('#step-text-content').fill('Edited, not saved');
  await expect(page.getByTestId('save-state')).toHaveText(/unsaved|non enregistrées/i);
  // The preview follows the draft as it is typed.
  await expect(page.getByTestId('step-preview')).toContainText('Edited, not saved');

  await page.getByTestId('outline-list').locator('.ocf-outline-row').filter({ hasText: 'Alpha' }).click();
  await expect(page.getByText(/discard your changes|abandonner vos modifications/i)).toBeVisible();
  await page.getByRole('button', { name: /keep editing|continuer l'édition/i }).click();
  await expect(page.locator('#step-title')).toHaveValue('Bravo');
  await expect(page.locator('#step-text-content')).toHaveValue('Edited, not saved');

  await page.getByTestId('outline-list').locator('.ocf-outline-row').filter({ hasText: 'Alpha' }).click();
  await page.getByRole('button', { name: /discard changes|abandonner les modifications/i }).click();
  await expect(page.locator('#step-title')).toHaveValue('Alpha');
});
