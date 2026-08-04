import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { dismissVerificationBanner } from './helpers/ui';
import {
  apiLogin,
  resetToFreePlan,
  getCurrentSubscription,
  getPersonalOrganizationId,
  type ApiSession,
} from './helpers/paymentApi';
import { fillStripeCheckout } from './helpers/stripeCheckout';

/**
 * Payment purchase happy path — the reference spec for the payment E2E suite.
 *
 * Scenario: a user on the free Trial plan upgrades to the paid Solo plan
 * through the real UI and the real Stripe test-mode Checkout, and lands back
 * on an activated subscription.
 *
 * Requirements (see e2e/README-payments.md):
 *   - ocf-core on :8080 with Stripe TEST keys, ocf-front on :4000
 *   - `stripe listen --forward-to localhost:8080/api/v1/webhooks/stripe`
 *   - seeded persona users (jp@test.ocf)
 *
 * The payer is jp@test.ocf — a persona no other spec subscribes with, so
 * plan-gating expectations elsewhere stay untouched. Setup and teardown reset
 * jp to the free plan through the API, which makes the spec re-runnable even
 * after an aborted run.
 */

const PAYER_EMAIL = 'jp@test.ocf';
const PAYER_PASSWORD = 'OcfTest2026!';
const TARGET_PLAN = 'Solo';

let payerApi: ApiSession;
let personalOrgId: string;

test.beforeAll(async () => {
  payerApi = await apiLogin(PAYER_EMAIL, PAYER_PASSWORD);
  personalOrgId = await getPersonalOrganizationId(payerApi);
});

test.beforeEach(async () => {
  await resetToFreePlan(payerApi);
});

test.afterAll(async () => {
  // Leave jp on the free plan for whoever runs next, then release the context.
  await resetToFreePlan(payerApi).catch(() => {});
  await payerApi.api.dispose();
});

test.describe('Plan purchase', () => {
  test('upgrades from free Trial to paid Solo through Stripe Checkout', async ({ page }) => {
    test.setTimeout(180_000); // real Stripe round-trip + webhook delivery

    // Purchase must happen in the PERSONAL org context: with the team org
    // active (the post-login default), the plans page compares against the
    // org's subscription and never recognizes the user's own Trial. Pin the
    // context before login — the org store restores it from localStorage.
    await page.goto('/login');
    await page.evaluate(
      (orgId) => localStorage.setItem('currentOrganizationId', orgId),
      personalOrgId
    );
    await login(page, PAYER_EMAIL, PAYER_PASSWORD);
    await page.goto('/subscription-plans');
    await dismissVerificationBanner(page);

    // The catalog shows the current (free) plan as active and Solo as an upgrade.
    const soloCard = page
      .locator('.plan-card-compact')
      .filter({ has: page.locator('.plan-name-compact', { hasText: TARGET_PLAN }) });
    await expect(soloCard).toBeVisible({ timeout: 15_000 });

    await soloCard.locator('.btn-subscribe-compact').click();

    // Free → paid replaces the Trial: confirm the plan change...
    await page.locator('[data-test="confirm-plan-change"]').click();

    // ...then skip the optional coupon and continue to Stripe.
    await expect(page.locator('[data-test="coupon-input"]')).toBeVisible();
    await page.locator('[data-test="coupon-confirm"]').click();

    // Hosted Stripe Checkout (test mode), paid with the 4242 test card.
    await fillStripeCheckout(page, { email: PAYER_EMAIL });

    // Back on our side: the success page polls until the webhook activates the
    // subscription, then swaps the spinner for the confirmation content.
    await expect(page).toHaveURL(/\/checkout-success/, { timeout: 60_000 });
    await expect(page.locator('.success-animation')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.subscription-details')).toContainText(TARGET_PLAN);

    // The dashboard now reports Solo as the active subscription source.
    await page.goto('/subscription-dashboard');
    await expect(page.locator('.plan-name').first()).toHaveText(TARGET_PLAN, { timeout: 15_000 });

    // And the backend agrees — the paid subscription is active for the payer.
    const subscription = await getCurrentSubscription(payerApi);
    expect(subscription?.subscription_plan?.name).toBe(TARGET_PLAN);
    expect(subscription?.status).toBe('active');
  });
});
