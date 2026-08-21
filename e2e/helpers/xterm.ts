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

  // xterm.js reads keystrokes through a hidden textarea, and that is what has
  // to hold focus. Clicking the container alone is not enough after the panel
  // re-renders — a step advance moves focus away and the keystrokes then go
  // nowhere at all, silently: no error, no echo, nothing in the shell.
  const helper = page.locator('.xterm-helper-textarea').first();
  if (await helper.count()) {
    await helper.focus();
  } else {
    await term.click();
  }
  // Let focus settle before the first character, which is otherwise the one
  // that gets dropped (`cho` for `echo`). Confirmed by waiting for the element
  // to actually hold focus rather than by guessing at how long that takes.
  await page
    .waitForFunction(() => document.activeElement?.classList.contains('xterm-helper-textarea'), null, { timeout: 2_000 })
    .catch(() => {});
  await page.waitForTimeout(60);

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

  // The probe must be one the SHELL has to compute. A marker that appears in
  // the text we type is satisfied by the terminal echoing our own keystrokes —
  // and it does echo them before anything is executing, so the old
  // `echo ready-x` / look-for-`ready-x` probe reported a live terminal on a
  // console that was still attaching. Every later step then failed for reasons
  // that had nothing to do with what it was testing.
  //
  // The operands are random so a marker left in the scrollback by an earlier
  // probe cannot satisfy a later one.
  const a = 1_000 + Math.floor(Math.random() * 8_000);
  const b = 1_000 + Math.floor(Math.random() * 8_000);
  const probe = `echo MARK$((${a}+${b}))END`;
  const marker = `MARK${a + b}END`;

  while (Date.now() < deadline) {
    if (await retryBtn.isVisible().catch(() => false)) {
      await retryBtn.click();
      await page.waitForTimeout(2_000);
      continue;
    }
    if (await page.locator('.xterm').first().isVisible().catch(() => false)) {
      await typeInTerminal(page, probe);
      // Poll for the answer instead of sleeping for it: the probe usually lands
      // long before the old fixed wait was up, and this is on the critical path
      // of every session start.
      const settle = Date.now() + 2_000;
      for (;;) {
        if ((await readTerminalText(page)).includes(marker)) return;
        if (Date.now() >= settle) break;
        await page.waitForTimeout(150);
      }
    } else {
      await page.waitForTimeout(300);
    }
  }
  throw new Error(
    'terminal never executed a command (it may be attached but not accepting input)'
  );
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
