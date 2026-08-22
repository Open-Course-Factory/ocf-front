import { test, expect } from '@playwright/test';
import { login, openUserMenu } from './helpers/auth';
import { demoPause } from './helpers/demo';
import {
  freshUser,
  registerViaUi,
  verifyEmailViaToken,
  adminSession,
  deleteUsersByEmail,
  purgeVerificationTokens,
  reportLeaks,
  FRESH_PASSWORD,
  type FreshUser,
} from './helpers/freshUsers';

/**
 * Confirming your address *after* you have signed in.
 *
 * The full trainer journey also signs up and buys, and it never caught this,
 * because it confirms the address before it logs in: by the time a session
 * exists, /auth/me already answers `email_verified: true` and the store is
 * never wrong.
 *
 * A person cannot follow that order. Registration routes them to /login, so
 * they sign in first, and only then go and open the mail. The click on the
 * link lands wherever their mail client opens it — another tab, another
 * browser — never in the tab they came back to. That tab is left holding the
 * snapshot loadUserData() took at login, when the address was still
 * unconfirmed, and it has no reason to look again.
 *
 * The router guard on the billing pages read that snapshot and sent them to
 * /verify-email, whose token was already spent and whose resend is silently
 * dropped for an address that is already confirmed. There was no way out of it
 * from inside the app.
 *
 * So the spec confirms out of band, exactly as the mail client does, and then
 * asks for a page the guard protects.
 */

const STAMP = Date.now().toString(36);
const buyer: FreshUser = freshUser('verifyorder', STAMP);

test.afterAll(async () => {
  const leaks: string[] = [];
  const admin = await adminSession();

  if (admin) {
    const deleted = await deleteUsersByEmail(admin, [buyer.email]);
    if (!deleted.includes(buyer.email)) leaks.push(`account ${buyer.email}`);
    await admin.api.dispose();
  } else {
    leaks.push(`account ${buyer.email} (no admin session to delete it)`);
  }

  purgeVerificationTokens([buyer.email]);
  reportLeaks(leaks);
});

test('confirming the address after signing in still opens the billing pages', async ({ page }) => {
  test.setTimeout(180_000);

  await test.step('the buyer signs up and signs in, address not yet confirmed', async () => {
    await registerViaUi(page, buyer);
    await login(page, buyer.email, FRESH_PASSWORD);
  });

  await test.step('they open the mail and confirm, somewhere this tab cannot see', async () => {
    await verifyEmailViaToken(buyer.email);
    // Deliberately no reload: a person coming back from their mail client
    // finds the tab exactly as they left it.
  });

  await test.step('the billing pages let them in', async () => {
    await openUserMenu(page);
    await demoPause(page);
    await page.locator('.dropdown-item[href="/payment-methods"]').click();

    // On the path, not on the whole URL: a bounce carries the destination back
    // as ?redirect=/payment-methods, so the raw URL still ends in the string we
    // were hoping to land on.
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 15_000 })
      .toBe('/payment-methods');

    // The failure this guards against is a bounce to the token form, which the
    // buyer has no token for.
    await expect(page.locator('#token-input')).toHaveCount(0);
  });
});
