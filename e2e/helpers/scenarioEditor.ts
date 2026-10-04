import { type Page, expect } from '@playwright/test';

/**
 * Interactions with the scenario editor's outline and step form, shared by the
 * editor specs. Everything goes through what a teacher sees and clicks.
 */

export type StepType = 'terminal' | 'flag' | 'info' | 'quiz';

/**
 * Add a step of `type` from the outline — at the end, or before the step
 * currently at `beforeIndex` (0-based) — and wait for its form to open.
 */
export async function addStep(page: Page, type: StepType, beforeIndex?: number): Promise<void> {
  if (beforeIndex === undefined) {
    await page.getByTestId('outline-add-step').click();
  } else {
    // The insert target is an overlay revealed on hover, like a teacher finds it.
    await page.getByTestId(`outline-step-${beforeIndex}`).hover();
    await page.getByTestId(`outline-insert-${beforeIndex}`).click();
  }
  await page.getByTestId(`step-type-${type}`).click();
  await expect(page.getByTestId('step-editor')).toBeVisible();
}

/** Save whatever the step form holds and wait until the header says it is saved. */
export async function saveStep(page: Page): Promise<void> {
  await page.getByTestId('step-edit-save').click();
  await expect(page.getByTestId('save-state')).toHaveText(/^\s*(saved|enregistré)\s*$/i, { timeout: 15_000 });
}

/** Give the open step a title and save it. */
export async function fillStepAndSave(page: Page, title: string): Promise<void> {
  await page.locator('#step-title').fill(title);
  await saveStep(page);
}

/** The step titles as the outline lists them, in order. */
export function outlineTitles(page: Page) {
  return page.getByTestId('outline-list').locator('.ocf-outline-title');
}

/** Open the step whose outline row shows `title`. */
export async function openStep(page: Page, title: string): Promise<void> {
  await page.getByTestId('outline-list').locator('.ocf-outline-row').filter({ hasText: title }).click();
  await expect(page.locator('#step-title')).toHaveValue(title);
}
