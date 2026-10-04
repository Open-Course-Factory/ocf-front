import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { login, loginFresh } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import { apiLogin, deleteScenarioById, findTeacherGroup, type ApiSession } from './helpers/scenarioApi';
import { zipDirectory } from './helpers/zip';

// ---------------------------------------------------------------------------
// A teacher imports a KillerCoda lab into her class from the scenario editor,
// lands on it, and exports it back out in both formats; the catalogue offers
// the same Import to her and not to a learner. No container is provisioned.
//
// The archive is the challenges repo's test-minimal (copied under
// e2e/fixtures), zipped here with a per-run title: an import upserts by name
// within the organization, so a fixed title would overwrite a previous run.
// ---------------------------------------------------------------------------

const TEACHER_EMAIL = process.env.E2E_ORG_MANAGER_EMAIL || 'nadia@test.ocf';
const PASSWORD = process.env.E2E_PASS || 'OcfTest2026!';
// Owns and manages nothing, not even a personal organization — see
// scenario-editor-access.spec.ts for why the class learners do not qualify.
const LEARNER_EMAIL = process.env.E2E_STUDENT_EMAIL || '1.student@test.com';
const LEARNER_PASSWORD = process.env.E2E_STUDENT_PASSWORD || 'test';

const STAMP = Date.now().toString(36);
const TITLE = `E2E import ${STAMP}`;
const FIXTURE_DIR = fileURLToPath(new URL('./fixtures/scenario-test-minimal', import.meta.url));

let teacher: ApiSession;
let groupId: string | null = null;
let importedId: string | null = null;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  teacher = await apiLogin(TEACHER_EMAIL, PASSWORD);
  groupId = (await findTeacherGroup(teacher, /test class/i))?.group_id ?? null;
});

test.afterAll(async () => {
  if (importedId) await deleteScenarioById(teacher, importedId);
  await teacher?.api.dispose();
});

function archive(): Buffer {
  const index = JSON.parse(readFileSync(join(FIXTURE_DIR, 'index.json'), 'utf-8'));
  return zipDirectory(FIXTURE_DIR, { 'index.json': JSON.stringify({ ...index, title: TITLE }) });
}

async function downloadVia(page: Page, testId: string) {
  await page.getByTestId('scenario-export-btn').click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId(testId).click()]);
  return download;
}

test('a teacher imports a KillerCoda archive into her class and exports it back', async ({ page }) => {
  test.skip(!groupId, `${TEACHER_EMAIL} teaches no class — seed the dev personas first`);

  await loginFresh(page, TEACHER_EMAIL, PASSWORD);
  await dismissVerificationBanner(page);
  await navigateViaMenuCategory(page, 'scenarios', '/scenario-editor');
  await page.waitForSelector('[data-testid="scenario-picker"]', { timeout: 20_000 });

  // Nothing selected yet: Export is there, but says there is nothing to export.
  await expect(page.getByTestId('scenario-export-btn')).toBeDisabled();

  await page.getByTestId('editor-empty-state').getByTestId('scenario-import-btn').click();
  await expect(page.getByTestId('scenario-import-format-killercoda')).toBeChecked();
  await page.locator('#import-destination').selectOption(`group:${groupId}`);
  await page.locator('.base-modal-footer .btn-primary').click();

  await page.locator('input[type="file"][accept*=".zip"]').setInputFiles({
    name: 'test-minimal.zip',
    mimeType: 'application/zip',
    buffer: archive(),
  });
  await page.locator('.upload-footer .btn-primary').click();
  await expect(page.getByText(/scenario imported successfully|scénario importé avec succès/i)).toBeVisible({ timeout: 20_000 });
  await page.locator('.upload-success .btn-primary').click();

  // The editor opens what was just imported.
  await expect(page.locator('[data-testid="scenario-picker"] option:checked')).toContainText(TITLE, { timeout: 15_000 });
  await expect(page.getByTestId('outline-scenario-card')).toBeVisible({ timeout: 15_000 });
  importedId = new URL(page.url()).searchParams.get('scenarioId');
  expect(importedId).not.toBeNull();

  await expect(page.getByTestId('scenario-export-btn')).toBeEnabled();

  const zip = await downloadVia(page, 'scenario-export-killercoda');
  expect(zip.suggestedFilename()).toMatch(/\.zip$/);
  const zipBytes = readFileSync(await zip.path());
  expect(zipBytes.subarray(0, 2).toString()).toBe('PK');
  expect(zipBytes.includes(Buffer.from('index.json'))).toBe(true);

  const json = await downloadVia(page, 'scenario-export-json');
  expect(json.suggestedFilename()).toMatch(/\.json$/);
  const exported = JSON.parse(readFileSync(await json.path(), 'utf-8'));
  expect(exported.title).toBe(TITLE);
  expect(exported.steps).toHaveLength(3);
});

test('the scenario catalogue offers Import to a teacher', async ({ page }) => {
  await loginFresh(page, TEACHER_EMAIL, PASSWORD);
  await dismissVerificationBanner(page);
  await navigateViaMenuCategory(page, 'scenarios', '/scenarios');

  await expect(page.locator('.scenario-launcher h2')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('scenario-import-btn')).toBeVisible();
});

test('the scenario catalogue offers no Import to a learner', async ({ page }) => {
  await login(page, LEARNER_EMAIL, LEARNER_PASSWORD);
  await dismissVerificationBanner(page);
  await navigateViaMenuCategory(page, 'scenarios', '/scenarios');

  await expect(page.locator('.scenario-launcher h2')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('scenario-import-btn')).toHaveCount(0);
  await expect(page.getByTestId('scenario-export-btn')).toHaveCount(0);
});
