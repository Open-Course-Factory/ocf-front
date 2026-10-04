import { test, expect, type Page } from '@playwright/test';
import { loginFresh } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import { addStep, saveStep } from './helpers/scenarioEditor';
import { apiLogin, deleteScenarioById, findTeacherGroup, type ApiSession } from './helpers/scenarioApi';

// ---------------------------------------------------------------------------
// A teacher who is not a shell expert writes a verify script from the
// "Insert a template" menu: the check lands in the script, the value to fill in
// is already selected so typing replaces it, and a second check goes after the
// first rather than over it. No container is involved — the script is only
// written here, never run.
// ---------------------------------------------------------------------------

const AUTHOR_EMAIL = process.env.E2E_ORG_MANAGER_EMAIL || 'nadia@test.ocf';
const PASSWORD = process.env.E2E_PASS || 'OcfTest2026!';
const STAMP = Date.now().toString(36);

let author: ApiSession;
let scenarioId: string | null = null;
let groupId: string | null = null;

test.beforeAll(async () => {
  author = await apiLogin(AUTHOR_EMAIL, PASSWORD);
  groupId = (await findTeacherGroup(author, /test class/i, 1))?.group_id ?? null;
});

test.afterAll(async () => {
  if (scenarioId) await deleteScenarioById(author, scenarioId);
  await author?.api.dispose();
});

async function createScenarioWithTerminalStep(page: Page): Promise<void> {
  await loginFresh(page, AUTHOR_EMAIL, PASSWORD);
  await dismissVerificationBanner(page);
  await navigateViaMenuCategory(page, 'scenarios', '/scenario-editor');
  await page.waitForSelector('[data-testid="scenario-picker"]', { timeout: 20_000 });

  await page.getByTestId('scenario-create-btn').click();
  await page.locator('#scenario-name').fill(`e2e-verify-templates-${STAMP}`);
  await page.locator('#scenario-title').fill(`E2E verify templates ${STAMP}`);
  await page.locator('#create-scope').selectOption(`group:${groupId}`);
  await page.locator('.base-modal-footer .btn.btn-primary').first().click();
  await expect(page.getByTestId('no-steps-state')).toBeVisible({ timeout: 20_000 });
  scenarioId = new URL(page.url()).searchParams.get('scenarioId');

  await addStep(page, 'terminal');
  await page.locator('#step-title').fill('Create the config file');
}

test('a check inserted from the template menu is ready to fill in and saves with the step', async ({ page }) => {
  test.skip(!groupId, `${AUTHOR_EMAIL} teaches no class — seed the dev personas first`);
  test.setTimeout(90_000);
  await createScenarioWithTerminalStep(page);

  await page.locator('#tab-verify').click();
  const script = page.locator('#step-verify-script');
  await expect(script).toHaveValue('');

  await page.getByTestId('verify-template-menu').click();
  await page.getByTestId('verify-template-file-exists').click();
  // The placeholder is selected: typing replaces it.
  await page.keyboard.type('/etc/app.conf');
  await expect(script).toHaveValue(/^file='\/etc\/app\.conf'\n\[ -f "\$file" \] \|\| \{ echo .+; exit 1; \}\n$/);

  await page.getByTestId('verify-template-menu').click();
  await page.getByTestId('verify-template-file-contains').click();
  await page.keyboard.type('/etc/app.conf');
  const value = await script.inputValue();
  // The second check follows the first, which is still whole.
  const [first, second] = value.split('\n\n');
  expect(first).toMatch(/^file='\/etc\/app\.conf'\n\[ -f "\$file" \] \|\| /);
  expect(second).toMatch(/^file='\/etc\/app\.conf'\ntext='__TEXT__'\ngrep -qF /);

  await saveStep(page);
  await page.reload();
  await page.getByTestId('outline-list').locator('.ocf-outline-row').filter({ hasText: 'Create the config file' }).click();
  await page.locator('#tab-verify').click();
  await expect(page.locator('#step-verify-script')).toHaveValue(value);
});
