import { type Page } from '@playwright/test';

/**
 * Interactions with the scenario editor canvas, shared by the editor specs.
 */

/**
 * Dispatch a synthetic HTML5 drag-and-drop sequence onto the VueFlow canvas.
 * Playwright's built-in dragTo does not reliably propagate custom dataTransfer
 * types (`application/vueflow`), so the event loop is driven inside the page.
 *
 * `nodeType` is one of: 'scenario' | 'terminal' | 'flag' | 'info' | 'quiz'.
 * Drop position is in CSS pixels relative to the canvas top-left corner.
 */
export async function dropStepNode(page: Page, nodeType: string, x: number, y: number): Promise<void> {
  await page.evaluate(
    ({ nodeType, x, y }) => {
      // VueFlow renders a `.vue-flow` root inside our `.flow-canvas` wrapper.
      // The `@drop` handler in FlowCanvas.vue is bound to <VueFlow>'s root,
      // which is `.vue-flow`. Use `.vue-flow__pane` (the actual pannable
      // surface) to be safe — events bubble up to `.vue-flow`.
      const pane =
        (document.querySelector('.vue-flow__pane') as HTMLElement | null) ||
        (document.querySelector('.vue-flow') as HTMLElement | null) ||
        (document.querySelector('.flow-canvas') as HTMLElement | null);
      if (!pane) throw new Error('vue-flow pane element not found');

      const rect = pane.getBoundingClientRect();
      const clientX = rect.left + x;
      const clientY = rect.top + y;

      const dataTransfer = new DataTransfer();
      dataTransfer.effectAllowed = 'copy';
      dataTransfer.setData('application/vueflow', JSON.stringify({ type: nodeType, isNewNode: true }));

      const dragOverEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer,
      });
      pane.dispatchEvent(dragOverEvent);

      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer,
      });
      pane.dispatchEvent(dropEvent);
    },
    { nodeType, x, y }
  );
  // Let Vue process the new node + open the edit modal
  await page.waitForTimeout(800);
}

/** Fill the step edit modal's title field and save. The modal must be open. */
export async function fillStepModalAndSave(page: Page, title: string): Promise<void> {
  const titleInput = page.locator('#step-title');
  await titleInput.waitFor({ state: 'visible', timeout: 10_000 });
  await titleInput.fill(title);
  await saveStepModal(page);
}

/**
 * Save whatever the step edit modal currently holds. Split out of
 * fillStepModalAndSave so a caller can edit more than the title (quiz
 * questions, scripts) between filling and saving.
 */
export async function saveStepModal(page: Page): Promise<void> {
  const titleInput = page.locator('#step-title');
  // The step modal uses a custom footer slot; scope to the last primary button
  // so an earlier modal's footer cannot be picked up.
  await page.locator('.base-modal-footer .btn.btn-primary').last().click({ force: true });
  await titleInput.waitFor({ state: 'hidden', timeout: 5_000 });
  await page.waitForTimeout(300);
}
