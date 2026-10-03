import { test, expect, type Page } from '@playwright/test';
import { loginFresh } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import { dropStepNode, fillStepModalAndSave } from './helpers/scenarioEditor';
import { apiLogin, deleteScenarioById, findTeacherGroup, type ApiSession } from './helpers/scenarioApi';

// ---------------------------------------------------------------------------
// Authoring details the smoke spec walks past:
//  - an empty editor leads to creating a scenario, instead of calling a
//    scenario that does not exist "read-only";
//  - a step added in the middle of the chain is saved there, instead of
//    jumping to the front when the canvas reloads from the stored order;
//  - a stray click beside an editor modal does not throw the form away.
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
  await page.waitForSelector('.flow-canvas', { timeout: 20_000 });
}

/** The "Step N" caption the canvas shows under an info step's title. */
function stepCaption(page: Page, title: string) {
  return page.locator('.info-step-node').filter({ hasText: title }).locator('.node-subtitle');
}

test('dropping a step on an empty editor leads to creating a scenario', async ({ page }) => {
  await openEditor(page);

  await expect(page.getByText(/create one, then drag steps|créez-en un, puis glissez-y/i)).toBeVisible();

  await dropStepNode(page, 'info', 300, 250);

  await expect(page.locator('#scenario-name')).toBeVisible();
  await expect(page.getByText(/create the scenario first|créez d’abord le scénario/i)).toBeVisible();
  await expect(page.getByText(/read-only|lecture seule/i)).toHaveCount(0);
  await expect(page.locator('.info-step-node')).toHaveCount(0);

  // A click beside the modal keeps what was typed.
  await page.locator('#scenario-name').fill(`e2e-authoring-${STAMP}`);
  await page.locator('.base-modal-overlay').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('#scenario-name')).toHaveValue(`e2e-authoring-${STAMP}`);
});

test('a step inserted between two others is saved in that place', async ({ page }) => {
  test.skip(!groupId, `${AUTHOR_EMAIL} teaches no class — seed the dev personas first`);
  test.setTimeout(120_000);
  await openEditor(page);

  await page.locator('.btn-icon.btn-create').click();
  await page.locator('#scenario-name').fill(`e2e-authoring-${STAMP}`);
  await page.locator('#scenario-title').fill(`E2E authoring ${STAMP}`);
  // Her class, as the roundtrip spec does: a scope she certainly manages.
  await page.locator('#create-scope').selectOption(`group:${groupId}`);
  await page.locator('.base-modal-footer .btn.btn-primary').first().click();
  await page.waitForSelector('.scenario-node', { state: 'attached', timeout: 20_000 });
  scenarioId = new URL(page.url()).searchParams.get('scenarioId');
  expect(scenarioId).not.toBeNull();

  // Appending, starting from an empty scenario.
  await dropStepNode(page, 'info', 300, 250);
  await fillStepModalAndSave(page, 'Alpha');
  await expect(stepCaption(page, 'Alpha')).toHaveText(/\b1$/);

  await dropStepNode(page, 'info', 550, 250);
  await fillStepModalAndSave(page, 'Charlie');
  await expect(stepCaption(page, 'Charlie')).toHaveText(/\b2$/);

  // "+" on the Alpha → Charlie link. A DOM click: VueFlow's pan handler
  // swallows a pointer click before the badge sees it.
  await page.evaluate(() => {
    const badge = document.querySelector(
      '.insertable-edge-badge-wrapper[data-edge-id^="edge-step-"] .insertable-edge-badge:not(.insertable-edge-badge--remove)'
    ) as HTMLButtonElement | null;
    if (!badge) throw new Error('insert badge on the step link not found');
    badge.click();
  });
  await page.locator('.insert-node-picker .picker-item').filter({ hasText: 'Info' }).click();

  // A click beside the step editor keeps it open.
  await page.locator('#step-title').fill('Bravo');
  await page.locator('.base-modal-overlay').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('#step-title')).toHaveValue('Bravo');
  await fillStepModalAndSave(page, 'Bravo');

  // The canvas has just been rebuilt from the stored order.
  await expect(stepCaption(page, 'Alpha')).toHaveText(/\b1$/);
  await expect(stepCaption(page, 'Bravo')).toHaveText(/\b2$/);
  await expect(stepCaption(page, 'Charlie')).toHaveText(/\b3$/);
});
