import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { dismissVerificationBanner, navigateViaSubscriptionMenu } from './helpers/ui';
import { demoPause } from './helpers/demo';
import {
  apiLogin,
  resetToFreePlan,
  getCurrentSubscription,
  getPersonalOrganizationId,
  findCheapestPaidPlanName,
  type ApiSession,
} from './helpers/paymentApi';
import { fillStripeCheckout } from './helpers/stripeCheckout';

/**
 * Payment purchase happy path — the reference spec for the payment E2E suite.
 *
 * Scenario: a user on the free Trial plan upgrades to a paid plan through the
 * real UI and the real Stripe test-mode Checkout, and lands back on an
 * activated subscription.
 *
 * Requirements (see e2e/README-payments.md):
 *   - ocf-core with Stripe TEST keys, ocf-front on :4000
 *   - `stripe listen` forwarding webhooks to ocf-core
 *   - a payer user on the free plan
 *
 * The payer defaults to jp@test.ocf (dev persona no other spec subscribes
 * with, so plan-gating expectations elsewhere stay untouched); CI overrides it
 * via E2E_PAYER_EMAIL/E2E_PAYER_PASSWORD to a user its fresh stack seeds. The
 * target plan is discovered from the catalog (cheapest active paid plan), so
 * the spec works on any seeded database. Setup and teardown reset the payer to
 * the free plan through the API, which makes the spec re-runnable even after
 * an aborted run.
 */

const PAYER_EMAIL = process.env.E2E_PAYER_EMAIL || 'jp@test.ocf';
const PAYER_PASSWORD = process.env.E2E_PAYER_PASSWORD || 'OcfTest2026!';

let payerApi: ApiSession;
let personalOrgId: string | null;
let targetPlan: string;

test.beforeAll(async () => {
  payerApi = await apiLogin(PAYER_EMAIL, PAYER_PASSWORD);
  personalOrgId = await getPersonalOrganizationId(payerApi);
  targetPlan = await findCheapestPaidPlanName(payerApi);
});

test.beforeEach(async () => {
  await resetToFreePlan(payerApi);
});

test.afterAll(async () => {
  // Leave the payer on the free plan for whoever runs next, then release the context.
  await resetToFreePlan(payerApi).catch(() => {});
  await payerApi.api.dispose();
});

test.describe('Plan purchase', () => {
  test('upgrades from the free Trial to a paid plan through Stripe Checkout', async ({ page }) => {
    test.setTimeout(180_000); // real Stripe round-trip + webhook delivery

    // Purchase must happen in the PERSONAL org context: with a team org
    // active (the post-login default), the plans page compares against the
    // org's subscription and never recognizes the user's own Trial. Pin the
    // context before login — the org store restores it from localStorage.
    // (A payer without a personal org has nothing to pin.)
    await page.goto('/login');
    if (personalOrgId) {
      await page.evaluate(
        (orgId) => localStorage.setItem('currentOrganizationId', orgId),
        personalOrgId
      );
    }
    await login(page, PAYER_EMAIL, PAYER_PASSWORD);
    await dismissVerificationBanner(page);

    // Reach the catalog the way a real user does: sidebar → "More" →
    // Subscription & Licenses → Available plans.
    await navigateViaSubscriptionMenu(page, '/subscription-plans');

    // The catalog shows the current (free) plan as active and the target paid plan as an upgrade.
    const planCard = page
      .locator('.plan-card-compact')
      .filter({ has: page.locator('.plan-name-compact', { hasText: targetPlan }) });
    await expect(planCard).toBeVisible({ timeout: 15_000 });
    await planCard.scrollIntoViewIfNeeded(); // bring the card on screen BEFORE the click
    await demoPause(page, 2); // let the audience read the plan catalog

    await planCard.locator('.btn-subscribe-compact').click();

    // Free → paid goes straight to the checkout step, which states the price
    // and that the free plan is being replaced. (The modal opens only after
    // the click handler's async subscription checks resolve.)
    await expect(page.locator('[data-test="coupon-input"]')).toBeVisible({ timeout: 15_000 });

    // The price the buyer is committing to is on this screen, not only on
    // Stripe's — that is the whole point of the step.
    await expect(page.locator('[data-test="checkout-amount"]')).toBeVisible();
    await demoPause(page);

    // Selling a digital service that starts immediately means the buyer has to
    // ask for that start and acknowledge losing the 14-day withdrawal right
    // (art. L221-25 / L221-28 13°). The confirm button stays disabled until they
    // do, so a spec that skips the box waits out its whole timeout on a control
    // that was never going to become clickable.
    await page.locator('[data-test="withdrawal-waiver"]').check();
    await demoPause(page);
    await page.locator('[data-test="coupon-confirm"]').click();

    // Hosted Stripe Checkout (test mode), paid with the 4242 test card.
    await fillStripeCheckout(page, { email: PAYER_EMAIL });

    // Back on our side: the success page polls until the webhook activates the
    // subscription, then swaps the spinner for the confirmation content.
    await expect(page).toHaveURL(/\/checkout-success/, { timeout: 60_000 });
    await expect(page.locator('.success-animation')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.subscription-details')).toContainText(targetPlan);
    await demoPause(page, 2); // dwell on the activated-subscription confirmation

    // Follow the success page's own "View Dashboard" call-to-action — the
    // dashboard now reports the paid plan as the active subscription source.
    await page.locator('.next-steps a[href="/subscription-dashboard"]').first().click();
    await expect(page.locator('.plan-name').first()).toHaveText(targetPlan, { timeout: 15_000 });
    await demoPause(page, 2); // dwell on the dashboard's active-plan card

    // And the backend agrees — the paid subscription is active for the payer.
    const subscription = await getCurrentSubscription(payerApi);
    expect(subscription?.subscription_plan?.name).toBe(targetPlan);
    expect(subscription?.status).toBe('active');
  });
});
