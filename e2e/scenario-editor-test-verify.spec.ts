import { test, expect, type Page } from '@playwright/test';
import { loginFresh } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import { addStep, saveStep } from './helpers/scenarioEditor';
import {
  apiLogin,
  cleanupScenarioSession,
  deleteScenarioById,
  findTeacherGroup,
  type ApiSession,
} from './helpers/scenarioApi';

// ---------------------------------------------------------------------------
// Tier B (real container) — "Test this check" (ocf-orchestrator#6). An author
// runs the verify script as it stands in the editor, unsaved, on their own
// preview: with no preview running the button offers to start one and the
// author stays in the editor, then the check runs on it and the verdict, exit
// code and learner-facing output are shown. A second, failing version of the
// script runs on the same preview, which has not moved.
// ---------------------------------------------------------------------------

const AUTHOR_EMAIL = process.env.E2E_ORG_MANAGER_EMAIL || 'nadia@test.ocf';
const PASSWORD = process.env.E2E_PASS || 'OcfTest2026!';
const STAMP = Date.now().toString(36);
const STEP = 'Look around';

let author: ApiSession;
let scenarioId: string | null = null;
let groupId: string | null = null;

test.beforeAll(async () => {
  author = await apiLogin(AUTHOR_EMAIL, PASSWORD);
  groupId = (await findTeacherGroup(author, /test class/i, 1))?.group_id ?? null;
});

test.afterAll(async () => {
  if (scenarioId) {
    await cleanupScenarioSession(author, scenarioId).catch(() => {});
    await deleteScenarioById(author, scenarioId);
  }
  await author?.api.dispose();
});

async function authorScenario(page: Page): Promise<void> {
  await loginFresh(page, AUTHOR_EMAIL, PASSWORD);
  await dismissVerificationBanner(page);
  await navigateViaMenuCategory(page, 'scenarios', '/scenario-editor');
  await page.waitForSelector('[data-testid="scenario-picker"]', { timeout: 20_000 });

  await page.getByTestId('scenario-create-btn').click();
  await page.locator('#scenario-name').fill(`e2e-test-verify-${STAMP}`);
  await page.locator('#scenario-title').fill(`E2E test verify ${STAMP}`);
  await page.locator('#create-scope').selectOption(`group:${groupId}`);
  await page.locator('.base-modal-footer .btn.btn-primary').first().click();
  await expect(page.getByTestId('no-steps-state')).toBeVisible({ timeout: 20_000 });
  scenarioId = new URL(page.url()).searchParams.get('scenarioId');

  await page.getByTestId('outline-scenario-card').click();
  await page.locator('#tab-options').click();
  await page.locator('#scenario-instance-type').selectOption('xs');
  await page.locator('#scenario-os-type').selectOption('apk');
  await page.locator('.base-modal-footer .btn.btn-primary').first().click();
  await expect(page.locator('#scenario-instance-type')).toBeHidden({ timeout: 15_000 });

  await addStep(page, 'terminal');
  await page.locator('#step-title').fill(STEP);
  await saveStep(page);
}

test('an author tests an unsaved check on a preview started from the editor', async ({ page }) => {
  test.skip(!groupId, `${AUTHOR_EMAIL} teaches no class — seed the dev personas first`);
  test.setTimeout(360_000);
  await authorScenario(page);

  await page.locator('#tab-verify').click();
  const script = page.locator('#step-verify-script');
  await script.fill('[ -f /etc/hostname ] || { echo "no hostname"; exit 1; }');

  await page.getByTestId('verify-test-run').click();
  await page.getByTestId('verify-test-start-preview').click();
  const confirm = page.locator('.base-modal-container').filter({ hasText: /stay in the editor|restez dans l'éditeur/ });
  await confirm.locator('.base-modal-footer .btn.btn-primary').click();

  const verdict = page.getByTestId('verify-test-verdict');
  const refused = page.locator('.el-notification');
  await Promise.race([
    verdict.waitFor({ state: 'visible', timeout: 300_000 }),
    refused.waitFor({ state: 'visible', timeout: 300_000 }),
  ]);
  if (!(await verdict.isVisible())) test.skip(true, 'preview refused by the backend (likely host capacity)');

  // Still in the editor, unsaved script included.
  await expect(page).toHaveURL(/scenario-editor/);
  await expect(verdict).toHaveText(/passed|réussie/i);
  await expect(page.getByTestId('verify-test-result')).toContainText(/exit code 0|code de sortie 0/);

  await script.fill('[ -f /etc/no-such-file ] || { echo "the file is missing"; exit 3; }');
  await page.getByTestId('verify-test-run').click();
  await expect(verdict).toHaveText(/failed|échouée/i, { timeout: 30_000 });
  await expect(page.getByTestId('verify-test-result')).toContainText(/exit code 3|code de sortie 3/);
  await expect(page.getByTestId('verify-test-output')).toHaveText('the file is missing');
});
