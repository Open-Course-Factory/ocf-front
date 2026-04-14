import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Help page translations — direct load (hard navigation)
//
// Bug #171: useHelpTranslations merges vue-i18n messages in onMounted.
// Vue-i18n v11 no longer triggers reactivity from mergeLocaleMessage, so
// components render raw translation keys (e.g. "help.terminals.gettingStarted.title")
// when the page is loaded directly via URL.
//
// These tests cover the "red" state: they are expected to FAIL until the fix
// is applied. The dev server must be running at http://localhost:4000 before
// running these tests (`npm run dev`).
// ---------------------------------------------------------------------------

test.describe('Help page translations on direct load', () => {
  test('terminals/getting-started renders translated content, not raw keys', async ({ page }) => {
    // Hard navigation — no prior SPA routing, triggers the bug
    await page.goto('/help-public/terminals/getting-started');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').innerText();

    // Must NOT contain raw translation keys
    expect(bodyText).not.toMatch(/help\.terminals\./);
    expect(bodyText).not.toContain('help.terminals.gettingStarted.title');

    // Must show the French title (fr is the default locale per src/i18n.ts)
    expect(bodyText).toContain('Premiers Pas avec les Terminaux');
  });

  test('terminals/troubleshooting renders translated content, not raw keys', async ({ page }) => {
    // Hard navigation to a second help page — confirms the bug is not page-specific
    await page.goto('/help-public/terminals/troubleshooting');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').innerText();

    // Must NOT contain raw translation keys
    expect(bodyText).not.toMatch(/help\.terminals\./);
    expect(bodyText).not.toContain('help.terminals.troubleshooting.title');

    // Must show the French title for this page
    expect(bodyText).toContain('Dépannage Terminal');
  });
});
