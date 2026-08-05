import { type Page, expect } from '@playwright/test';

/**
 * Drive the in-page xterm.js terminal (TerminalViewer renders with the DOM
 * renderer — only fit + attach addons are loaded — so the buffer is readable
 * from `.xterm-rows`).
 */

/** Click the terminal to focus it, then type a command and press Enter. */
export async function typeInTerminal(page: Page, command: string): Promise<void> {
  const term = page.locator('.xterm').first();
  await expect(term).toBeVisible({ timeout: 30_000 });
  await term.click();
  // A small per-key delay keeps the attach-addon websocket from coalescing
  // keystrokes into frames the remote shell echoes out of order.
  await page.keyboard.type(command, { delay: 25 });
  await page.keyboard.press('Enter');
}

/** Current visible text of the terminal buffer. */
export async function readTerminalText(page: Page): Promise<string> {
  const rows = page.locator('.xterm-rows').first();
  return (await rows.innerText().catch(() => '')) || '';
}

/**
 * Wait until the terminal prompt is live: type a probe command and wait for
 * its output to appear. More reliable than waiting for the shell banner,
 * which varies per distribution.
 *
 * If the viewer shows its connection-error panel, click Retry the way a real
 * user does. This absorbs a known race: composed sessions are created in
 * State=starting and the console endpoint 403s until the starting→running
 * sync lands, and TerminalViewer does not retry on its own after that 403.
 */
export async function waitForLiveTerminal(page: Page, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const retryBtn = page.locator('.terminal-error-actions .btn-primary');
  const probe = `echo ready-${Date.now().toString(36)}`;
  const marker = probe.slice(5);
  while (Date.now() < deadline) {
    if (await retryBtn.isVisible().catch(() => false)) {
      await retryBtn.click();
      await page.waitForTimeout(2_000);
      continue;
    }
    if (await page.locator('.xterm').first().isVisible().catch(() => false)) {
      await typeInTerminal(page, probe);
      await page.waitForTimeout(1_500);
      if ((await readTerminalText(page)).includes(marker)) return;
    } else {
      await page.waitForTimeout(1_000);
    }
  }
  throw new Error('terminal never became interactive');
}

/**
 * Read a deployed scenario flag the way a student does: `cat` its file and
 * scrape the FLAG{16 hex} token from the buffer. Retries because standard-mode
 * flag deployment happens asynchronously on step transition.
 */
export async function readFlagFromTerminal(
  page: Page,
  stepOrder: number,
  timeoutMs = 30_000
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await typeInTerminal(page, `cat /tmp/.flag_step_${stepOrder}`);
    await page.waitForTimeout(1_500);
    const text = await readTerminalText(page);
    const matches = text.match(/FLAG\{[0-9a-f]{16}\}/g);
    if (matches?.length) return matches[matches.length - 1];
  }
  throw new Error(`no FLAG{...} found in terminal for step ${stepOrder}`);
}
