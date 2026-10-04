import { test, expect, type Page } from '@playwright/test';
import { loginFresh } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import { apiLogin, deleteScenarioById, type ApiSession } from './helpers/scenarioApi';
import { EXAMPLE_SCENARIO } from '../src/utils/scenarioAiPrompt';

/**
 * Authoring a scenario with the teacher's own AI assistant: no model runs on
 * our side, so the test plays the assistant — it reads the prompt the page
 * shows and pastes canned answers back, wrapped in the prose and fences real
 * assistants add.
 */

const TEACHER_EMAIL = process.env.E2E_ORG_MANAGER_EMAIL || 'nadia@test.ocf';
const PASSWORD = process.env.E2E_PASS || 'OcfTest2026!';
const API_BASE = process.env.OCF_API_URL || 'http://localhost:8080/api/v1';

const STAMP = Date.now().toString(36);
const TITLE = `E2E AI lab ${STAMP}`;
const VALID = { ...EXAMPLE_SCENARIO, title: TITLE };

let teacher: ApiSession;
let createdId: string | null = null;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  teacher = await apiLogin(TEACHER_EMAIL, PASSWORD);
});

test.afterAll(async () => {
  if (createdId) await deleteScenarioById(teacher, createdId);
  await teacher?.api.dispose();
});

/** What an assistant typically answers: a sentence, the fenced JSON, an offer to do more. */
function assistantAnswer(json: unknown): string {
  return `Here is your lab, ready to import:\n\n\`\`\`json\n${JSON.stringify(json, null, 2)}\n\`\`\`\n\nWant me to add {more} steps?`;
}

async function exportedSteps(id: string): Promise<string[]> {
  const response = await teacher.api.get(`${API_BASE}/scenarios/${id}/export?format=json`, {
    headers: { Authorization: `Bearer ${teacher.token}` },
  });
  expect(response.ok()).toBe(true);
  return ((await response.json()).steps || []).map((s: any) => s.title);
}

/** The teacher's team organization (nadia manages shared-test-org in the dev personas). */
async function teamOrgId(): Promise<string | null> {
  const response = await teacher.api.get(`${API_BASE}/organizations`, { headers: { Authorization: `Bearer ${teacher.token}` } });
  const body = await response.json();
  const orgs = Array.isArray(body) ? body : body.data || [];
  return orgs.find((o: any) => o.organization_type === 'team')?.id ?? null;
}

async function openEditor(page: Page) {
  await loginFresh(page, TEACHER_EMAIL, PASSWORD);
  await dismissVerificationBanner(page);
  await navigateViaMenuCategory(page, 'scenarios', '/scenario-editor');
  await page.waitForSelector('.flow-canvas', { timeout: 20_000 });
}

test('a teacher creates a scenario from her AI\'s answer, after one refused answer', async ({ page, context }) => {
  const orgId = await teamOrgId();
  test.skip(!orgId, `${TEACHER_EMAIL} is in no team organization — seed the dev personas first`);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  await openEditor(page);
  await expect(page.getByTestId('scenario-ai-improve-btn')).toBeDisabled();

  await page.getByTestId('scenario-ai-create-btn').click();
  await page.locator('#ai-description').fill('Practise file permissions with chmod and a hidden flag.');
  await page.locator('#ai-destination').selectOption(`org:${orgId}`);
  await page.getByTestId('scenario-ai-next').click();

  const prompt = page.getByTestId('scenario-ai-prompt');
  await expect(prompt).toHaveValue(/Practise file permissions with chmod and a hidden flag\./);
  // The instructions follow the UI language; the contract tokens are the same in both.
  await expect(prompt).toHaveValue(/"flag_path"/);
  await page.getByTestId('scenario-ai-copy-prompt').click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('OCF_FLAG_CURRENT');
  expect(copied).toContain('Practise file permissions with chmod and a hidden flag.');

  await page.getByTestId('scenario-ai-next').click();

  // A refused answer: every problem listed, and a follow-up prompt to hand back.
  const invalid = structuredClone(VALID) as any;
  invalid.steps[1].questions[1].correct_answer = '4';
  invalid.steps.push({ title: 'Bonus', step_type: 'lab' });
  await page.locator('#ai-answer').fill(assistantAnswer(invalid));
  await expect(page.getByTestId('scenario-ai-parse-status')).toContainText(/4 (step|étape)\(s\)/);
  await page.getByTestId('scenario-ai-import').click();

  const problems = page.getByTestId('scenario-import-problems');
  await expect(problems.locator('li')).toHaveCount(2);
  await expect(problems).toContainText('correct_answer "4" is not an option index');
  await expect(problems).toContainText('step_type "lab" is not one of');
  await page.getByTestId('scenario-ai-copy-fix').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('correct_answer "4" is not an option index');

  // The corrected answer imports and opens in the editor.
  await page.locator('#ai-answer').fill(assistantAnswer(VALID));
  await page.getByTestId('scenario-ai-import').click();

  await expect(page.getByTestId('scenario-ai-step-answer')).toHaveCount(0);
  await expect(page.locator('.scenario-select option:checked')).toContainText(TITLE, { timeout: 15_000 });
  await expect(page.locator('.scenario-node')).toBeAttached({ timeout: 15_000 });
  createdId = new URL(page.url()).searchParams.get('scenarioId');
  expect(createdId).not.toBeNull();
  expect(await exportedSteps(createdId!)).toHaveLength(3);
});

test('a teacher improves the scenario with her AI and it is updated in place', async ({ page }) => {
  test.skip(!createdId, 'the create test did not produce a scenario');

  await openEditor(page);
  await page.locator('.scenario-select').selectOption(createdId!);
  await expect(page.locator('.scenario-node')).toBeAttached({ timeout: 15_000 });

  await page.getByTestId('scenario-ai-improve-btn').click();
  await page.locator('#ai-instruction').fill('Add a step about umask.');
  await page.getByTestId('scenario-ai-next').click();
  await expect(page.getByTestId('scenario-ai-prompt')).toHaveValue(new RegExp(`"title": "${TITLE}"`));
  await page.getByTestId('scenario-ai-next').click();

  // The assistant adds a step — and renames the scenario, which the page catches.
  const improved = {
    ...VALID,
    title: `${TITLE} (improved)`,
    steps: [
      ...VALID.steps,
      {
        title: 'Set a umask',
        step_type: 'terminal',
        text_content: 'Make `/root/.bashrc` set `umask 027`.',
        verify_script: '#!/bin/bash\ngrep -q "umask 027" /root/.bashrc || { echo "Add umask 027 to /root/.bashrc." >&2; exit 1; }',
      },
    ],
  };
  await page.locator('#ai-answer').fill(assistantAnswer(improved));
  const changes = page.getByTestId('scenario-ai-changes');
  await expect(changes).toContainText('3 → 4');
  await expect(changes).toContainText('+ Set a umask');
  await expect(page.getByTestId('scenario-ai-title-changed').locator('input')).toBeChecked();
  await page.getByTestId('scenario-ai-import').click();

  await expect(page.getByTestId('scenario-ai-step-answer')).toHaveCount(0);
  await expect(page.locator('.scenario-select option:checked')).toContainText(TITLE, { timeout: 15_000 });
  expect(new URL(page.url()).searchParams.get('scenarioId')).toBe(createdId);
  expect(await exportedSteps(createdId!)).toEqual([...VALID.steps.map(s => s.title), 'Set a umask']);
  await expect(page.locator('.scenario-select option', { hasText: `${TITLE} (improved)` })).toHaveCount(0);
});
