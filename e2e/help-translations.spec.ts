import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Help page translations — direct load (hard navigation)
//
// Regression coverage for bug #171, which had two lives:
//  1. help messages merged in onMounted — vue-i18n v11 doesn't trigger
//     reactivity from mergeLocaleMessage, so first paint showed raw keys
//     (fixed: main.ts preloads the messages before mount);
//  2. the dynamic help routes are addRoute'd AFTER the router started its
//     initial navigation, so a direct load resolved to no-match and rendered
//     an empty page (fixed: main.ts re-resolves the entry URL on isReady).
//
// The browser locale is pinned to fr-FR: the app honors navigator.language
// for first-visit locale, and Playwright's default is en-US.
// ---------------------------------------------------------------------------

test.use({ locale: 'fr-FR' });

test.describe('Help page translations on direct load', () => {
  test('terminals/getting-started renders translated content, not raw keys', async ({ page }) => {
    // Hard navigation — no prior SPA routing, triggers the bug
    await page.goto('/help-public/terminals/getting-started');

    // A network pause does not mean the page has rendered, so wait for its title.
    await expect(page.locator('body')).toContainText('Premiers pas avec les terminaux');

    const bodyText = await page.locator('body').innerText();

    // Must NOT contain raw translation keys
    expect(bodyText).not.toMatch(/help\.terminals\./);
    expect(bodyText).not.toContain('help.terminals.gettingStarted.title');
  });

  test('terminals/troubleshooting renders translated content, not raw keys', async ({ page }) => {
    // Hard navigation to a second help page — confirms the bug is not page-specific
    await page.goto('/help-public/terminals/troubleshooting');

    // A network pause does not mean the page has rendered, so wait for its title.
    await expect(page.locator('body')).toContainText('Dépannage des terminaux');

    const bodyText = await page.locator('body').innerText();

    // Must NOT contain raw translation keys
    expect(bodyText).not.toMatch(/help\.terminals\./);
    expect(bodyText).not.toContain('help.terminals.troubleshooting.title');
  });
});
