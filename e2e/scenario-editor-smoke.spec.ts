import { test, expect, type Page } from '@playwright/test';
import { loginFresh } from './helpers/auth';

// ---------------------------------------------------------------------------
// Smoke E2E for the scenario editor — locks in the author flow
// against future regressions.
//
// Author: an org manager (Nadia / ESITECH) creates a scenario, drops
// info / quiz / flag step nodes onto the canvas, edits each one, saves,
// reloads, asserts the steps re-render, then deletes the scenario.
//
// What is intentionally NOT covered here:
//  - terminal step (would require provisioning a real container)
//  - "Play as student" walkthrough
//  - email-based flows (verification, invites)
//
// See test.skip below for the deferred scenarios.
// ---------------------------------------------------------------------------

const TEST_PASSWORD = 'OcfTest2026!';
const ORG_MANAGER_EMAIL = 'nadia@test.ocf';

// ---------------------------------------------------------------------------
// Helper: dismiss the email verification banner if visible
// ---------------------------------------------------------------------------
async function dismissVerificationBanner(page: Page) {
  const dismissBtn = page.locator('.verification-banner .btn-dismiss');
  if (await dismissBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await dismissBtn.click({ force: true });
    await page.waitForTimeout(300);
  }
}

// ---------------------------------------------------------------------------
// Helper: dispatch a synthetic HTML5 drag-and-drop sequence onto the
// VueFlow canvas. Playwright's built-in dragTo does not reliably propagate
// custom dataTransfer types (`application/vueflow`), so we drive the event
// loop manually inside the page context.
//
// `nodeType` is one of: 'scenario' | 'terminal' | 'flag' | 'info' | 'quiz'.
// Drop position is in CSS pixels relative to the canvas top-left corner.
// ---------------------------------------------------------------------------
async function dropStepNode(page: Page, nodeType: string, x: number, y: number) {
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
      dataTransfer.setData(
        'application/vueflow',
        JSON.stringify({ type: nodeType, isNewNode: true })
      );

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

// ---------------------------------------------------------------------------
// Helper: navigate to /scenario-editor and wait for the editor shell
// ---------------------------------------------------------------------------
async function gotoScenarioEditor(page: Page) {
  await page.goto('/scenario-editor');
  await dismissVerificationBanner(page);
  // The library panel + flow canvas are the two structural anchors of the page
  await page.waitForSelector('.node-library-panel', { timeout: 15_000 });
  await page.waitForSelector('.flow-canvas', { timeout: 15_000 });
  // Allow stores (scenarios, organizations, memberships) to settle
  await page.waitForTimeout(1_500);
}

// ---------------------------------------------------------------------------
// Helper: fill the Step edit modal title field and click Save
// ---------------------------------------------------------------------------
async function fillStepModalAndSave(page: Page, title: string) {
  // Modal opens automatically when a new step is dropped
  const titleInput = page.locator('#step-title');
  await titleInput.waitFor({ state: 'visible', timeout: 10_000 });
  await titleInput.fill(title);

  // Save (the step modal uses a custom footer slot with btn-primary)
  // Scope to the .step-edit-form modal to avoid matching other modals
  const saveBtn = page
    .locator('.base-modal-footer .btn.btn-primary')
    .last();
  await saveBtn.click({ force: true });

  // Modal should close
  await titleInput.waitFor({ state: 'hidden', timeout: 5_000 });
  await page.waitForTimeout(300);
}

// ---------------------------------------------------------------------------
// Smoke: full create-edit-save-reload-delete flow
// ---------------------------------------------------------------------------
test.describe('Scenario editor — smoke', () => {
  test('author can create, edit, save, reload, and delete a scenario', async ({
    page,
  }) => {
    test.setTimeout(120_000);

    // Unique scenario name so reruns don't collide with leftover data
    const stamp = Date.now();
    const scenarioName = `e2e-smoke-${stamp}`;
    const scenarioTitle = `E2E smoke ${stamp}`;
    const scenarioDescription = 'Auto-generated by scenario-editor-smoke spec.';

    // 1. Login as an org manager so the scope picker has at least one org
    await loginFresh(page, ORG_MANAGER_EMAIL, TEST_PASSWORD);

    // 2. Navigate to the editor
    await gotoScenarioEditor(page);

    // 3. Click "Create new" in the header (icon button, identified by class)
    const createBtn = page.locator('.btn-icon.btn-create');
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click({ force: true });

    // 4. Fill name + title + description in the scenario edit modal
    const nameInput = page
      .locator('.modal-form input.form-control')
      .first();
    await nameInput.waitFor({ state: 'visible', timeout: 10_000 });
    await nameInput.fill(scenarioName);

    const titleInput = page
      .locator('.modal-form input.form-control')
      .nth(1);
    await titleInput.fill(scenarioTitle);

    const descTextarea = page.locator('.modal-form textarea.form-control').first();
    await descTextarea.fill(scenarioDescription);

    // 5. Select scope: prefer ESITECH if listed, else first org
    const scopeSelect = page.locator('#create-scope');
    await scopeSelect.waitFor({ state: 'visible', timeout: 5_000 });

    const scopeOptions = await scopeSelect.locator('option').allInnerTexts();
    const esitechIdx = scopeOptions.findIndex((label) => /esitech/i.test(label));
    if (esitechIdx >= 0) {
      // selectOption by label match — case-insensitive find requires value
      const esitechValue = await scopeSelect
        .locator('option')
        .nth(esitechIdx)
        .getAttribute('value');
      if (esitechValue) {
        await scopeSelect.selectOption(esitechValue);
      }
    }
    // Otherwise leave the auto-picked default scope (org:<currentOrg>)

    // 6. Save the scenario (BaseModal default-footer Confirm button)
    // The scenario edit modal uses `show-default-footer + confirm-text` so the
    // save button is `.base-modal-footer .btn.btn-primary` — there's only one
    // visible BaseModal at this point.
    const scenarioSaveBtn = page
      .locator('.base-modal-footer .btn.btn-primary')
      .first();
    await scenarioSaveBtn.click({ force: true });

    // Wait for the modal to close — the scope select disappears
    await scopeSelect
      .waitFor({ state: 'hidden', timeout: 15_000 })
      .catch(() => {
        // If modal didn't auto-close, fail loudly below via the next assertion
      });

    // The newly created scenario should now be selected. The scenario node
    // (`.scenario-node`) renders on the canvas once `handleScenarioSelect`
    // completes. Use `state: 'attached'` because VueFlow can keep nodes
    // visibility-hidden during initial layout.
    await page.waitForSelector('.scenario-node', {
      state: 'attached',
      timeout: 15_000,
    });
    await page.waitForTimeout(500);

    // 7. Drop 3 step types onto the canvas. Each drop opens the step edit modal.
    // We use distinct drop coords so nodes don't fully overlap.
    // Order matters: one modal at a time.
    const steps: { type: string; cls: string; title: string; x: number; y: number }[] = [
      { type: 'info', cls: 'info-step-node', title: 'E2E info step', x: 250, y: 250 },
      { type: 'quiz', cls: 'quiz-step-node', title: 'E2E quiz step', x: 450, y: 250 },
      { type: 'flag', cls: 'flag-step-node', title: 'E2E flag step', x: 650, y: 250 },
    ];

    for (const step of steps) {
      await dropStepNode(page, step.type, step.x, step.y);
      // 8. Edit modal opens automatically — fill title and save
      await fillStepModalAndSave(page, step.title);

      // The corresponding node class should now appear on the canvas
      await page.waitForSelector(`.${step.cls}`, {
        state: 'attached',
        timeout: 10_000,
      });
    }

    // 9. Save the scenario via the canvas Save button (.btn-save)
    const canvasSaveBtn = page.locator('.btn-save');
    await expect(canvasSaveBtn).toBeVisible();
    await canvasSaveBtn.click({ force: true });

    // Allow PATCH/POST round-trips to settle (positions, step orders)
    await page.waitForTimeout(2_500);

    // 10. Reload the page and re-select the scenario
    await page.reload();
    await dismissVerificationBanner(page);
    await page.waitForSelector('.scenario-select', { timeout: 15_000 });

    // Wait for the scenarios store to populate the dropdown. The store
    // load happens in onMounted and may take a moment — poll until our
    // scenario is listed.
    const select = page.locator('.scenario-select');
    let targetValue: string | null = null;
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      targetValue = await select.evaluate(
        (el, name) => {
          const sel = el as HTMLSelectElement;
          for (const opt of Array.from(sel.options)) {
            if ((opt.textContent || '').includes(name)) {
              return opt.value;
            }
          }
          return null;
        },
        scenarioName
      );
      if (targetValue) break;
      await page.waitForTimeout(500);
    }
    expect(
      targetValue,
      `created scenario "${scenarioName}" should appear in the dropdown`
    ).not.toBeNull();
    if (targetValue) {
      // The scenario from the URL query may already be auto-selected — only
      // re-select if not already.
      const currentValue = await select.evaluate(
        (el) => (el as HTMLSelectElement).value
      );
      if (currentValue !== targetValue) {
        await select.selectOption(targetValue);
      }
    }

    // 11. Assert the 3 step nodes render with the correct CSS classes
    await page.waitForSelector('.scenario-node', {
      state: 'attached',
      timeout: 15_000,
    });
    await page.waitForTimeout(500);
    for (const step of steps) {
      await page.waitForSelector(`.${step.cls}`, {
        state: 'attached',
        timeout: 15_000,
      });
      const count = await page.locator(`.${step.cls}`).count();
      expect(
        count,
        `expected at least one .${step.cls} after reload`
      ).toBeGreaterThanOrEqual(1);
    }

    // 12. Cleanup: delete the scenario via its node's delete button.
    // The scenario node has a `.delete-btn` inside `.node-actions`. Click via
    // evaluate (force-click can be intercepted by VueFlow's pan/select handler
    // before the button receives the event). A direct DOM click bypasses that
    // and triggers the Vue listener directly.
    await page.evaluate(() => {
      const btn = document.querySelector(
        '.scenario-node .action-btn.delete-btn'
      ) as HTMLButtonElement | null;
      if (!btn) throw new Error('scenario delete button not found');
      btn.click();
    });

    // Confirmation modal — its confirm button is the small modal's primary btn.
    const confirmDeleteBtn = page
      .locator('.base-modal-footer .btn.btn-primary')
      .first();
    await confirmDeleteBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await confirmDeleteBtn.click({ force: true });

    // Allow DELETE round-trip + canvas refresh
    await page.waitForTimeout(1_500);

    // The scenario node should no longer be on the canvas
    await expect(page.locator('.scenario-node')).toHaveCount(0, {
      timeout: 10_000,
    });
  });

  // -------------------------------------------------------------------------
  // Skipped: terminal-step coverage requires provisioning a real container
  // and is out of scope for a smoke test. Tracked separately.
  // -------------------------------------------------------------------------
  test.skip('terminal step drop + provision flow', () => {
    // Intentionally skipped — would require Incus + a backend ready to start
    // a real container, which is not available in CI.
  });

  // -------------------------------------------------------------------------
  // Skipped: "Play as student" walkthrough — depends on rendered scenario
  // runtime + terminal session, also out of scope here.
  // -------------------------------------------------------------------------
  test.skip('play-as-student walkthrough', () => {
    // Intentionally skipped — covered by a future scenario-runner spec.
  });
});
