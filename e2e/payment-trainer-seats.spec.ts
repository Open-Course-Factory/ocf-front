import { test, expect, type Page } from '@playwright/test';
import { login } from './helpers/auth';
import { dismissVerificationBanner, navigateViaSubscriptionMenu } from './helpers/ui';
import { demoPause } from './helpers/demo';
import {
  apiLogin,
  getPersonalOrganizationId,
  getPurchasableSeatPlans,
  listBatches,
  getBatchLicenses,
  revokeAllBatchLicenses,
  waitForNewBatch,
  getCurrentSubscription,
  type ApiSession,
} from './helpers/paymentApi';
import { fillStripeCheckout } from './helpers/stripeCheckout';

/**
 * Trainer seat purchase — the B2B journey of the payment E2E suite.
 *
 * Scenario: a trainer runs a 3-day course for 4 students. They buy a prepaid
 * learner-day pack (4 learners × 3 days = 12 learner-days), assign the four
 * seats through the license dashboard, and a student then sees the assigned
 * subscription as their active plan.
 *
 * The trainer defaults to marc@test.ocf (Formateur plan — grants bulk
 * purchase); students default to the legacy roster seeded in every
 * environment. Teardown revokes every assigned seat (restoring the students)
 * but keeps the batch: its Stripe subscription self-cancels at the pack
 * deadline, and the surviving row moves the checkout idempotency
 * discriminator, so the spec is re-runnable the same day.
 *
 * Skips itself when the environment offers no purchasable learner-day plan
 * (e.g. CI until its seed grows one).
 */

const TRAINER_EMAIL = process.env.E2E_TRAINER_EMAIL || 'marc@test.ocf';
const TRAINER_PASSWORD = process.env.E2E_TRAINER_PASSWORD || 'OcfTest2026!';
const STUDENT_EMAILS = (
  process.env.E2E_STUDENT_EMAILS ||
  '1.student@test.com,2.student@test.com,3.student@test.com,4.student@test.com'
).split(',');
const STUDENT_PASSWORD = process.env.E2E_STUDENT_PASSWORD || 'test';
const DURATION_DAYS = 3;

let trainerApi: ApiSession;
let trainerOrgId: string | null;
let packPlan: any | null;
let knownBatchIds: Set<string>;

test.beforeAll(async () => {
  trainerApi = await apiLogin(TRAINER_EMAIL, TRAINER_PASSWORD);
  trainerOrgId = await getPersonalOrganizationId(trainerApi);
  const plans = await getPurchasableSeatPlans(trainerApi);
  packPlan = plans.find((p) => p.seat_unit === 'learner_day') || null;
  knownBatchIds = new Set((await listBatches(trainerApi)).map((b) => b.id));
});

test.afterAll(async () => {
  // Revoke every seat the run assigned — even after a mid-test failure — so
  // the students return to their previous plans. The batches themselves stay:
  // their Stripe subscriptions self-cancel at the pack deadline, and keeping
  // the rows is what gives the next run a fresh checkout idempotency key.
  try {
    const batches = await listBatches(trainerApi);
    for (const batch of batches.filter((b) => !knownBatchIds.has(b.id))) {
      await revokeAllBatchLicenses(trainerApi, batch.id).catch(() => {});
    }
  } finally {
    await trainerApi.api.dispose();
  }
});

/** Expected pack total in cents: BillingUnits priced through graduated tiers. */
function expectedPackTotalCents(plan: any, billingUnits: number): number {
  let remaining = billingUnits;
  let floor = 0;
  let total = 0;
  for (const tier of plan.pricing_tiers || []) {
    const capacity = tier.max_quantity > 0 ? tier.max_quantity - floor : remaining;
    const inTier = Math.min(remaining, capacity);
    total += inTier * tier.unit_amount;
    remaining -= inTier;
    floor = tier.max_quantity;
    if (remaining <= 0) break;
  }
  return total + remaining * 0; // graduated table always covers the tail (max 0 = ∞)
}

async function assignSeatTo(page: Page, email: string) {
  // One unassigned row's assign action opens the search modal.
  await page.locator('.btn-action.assign').first().click();
  const modal = page.locator('.assignment-modal-content');
  await expect(modal).toBeVisible();
  await page.locator('#user-search').fill(email);
  const result = page.locator('.user-result').filter({ hasText: email }).first();
  await expect(result).toBeVisible({ timeout: 10_000 });
  await result.click();
  await demoPause(page);
  await page.locator('.base-modal-footer .btn-primary').click();
  await expect(modal).not.toBeVisible({ timeout: 15_000 });
}

test.describe('Trainer seat purchase', () => {
  test('buys a 3-day pack for 4 students and assigns every seat', async ({ page, browser }) => {
    test.skip(!packPlan, 'no purchasable learner-day plan in this environment');
    test.setTimeout(300_000); // Stripe round-trip + webhook + 4 assignments

    const learners = STUDENT_EMAILS.length;
    const billingUnits = learners * DURATION_DAYS;

    // ------------------------------------------------------------------
    // Act 1 — the trainer orders seats in their own terms: 4 learners, 3 days.
    // ------------------------------------------------------------------
    await page.goto('/login');
    if (trainerOrgId) {
      await page.evaluate(
        (orgId) => localStorage.setItem('currentOrganizationId', orgId),
        trainerOrgId
      );
    }
    await login(page, TRAINER_EMAIL, TRAINER_PASSWORD);
    await dismissVerificationBanner(page);
    await navigateViaSubscriptionMenu(page, '/bulk-license-purchase');

    await page.locator('[data-test="seat-purchase-learners"]').fill(String(learners));
    await page.locator('[data-test="seat-purchase-duration"]').selectOption(String(DURATION_DAYS));

    // The quote card for the learner-day pack shows the graduated total.
    const packQuote = page
      .locator('[data-test="seat-purchase-quote"]')
      .filter({ hasText: packPlan.name });
    await expect(packQuote).toBeVisible({ timeout: 15_000 });
    const totalCents = expectedPackTotalCents(packPlan, billingUnits);
    const euros = Math.floor(totalCents / 100);
    const cents = String(totalCents % 100).padStart(2, '0');
    await expect(packQuote).toContainText(new RegExp(`${euros}[.,]${cents}`));
    await demoPause(page, 2); // let the audience compare the quotes

    await packQuote.click();
    await demoPause(page);
    await page.locator('.btn-purchase').click();

    // ------------------------------------------------------------------
    // Act 2 — Stripe checkout, then the license dashboard shows the batch.
    // ------------------------------------------------------------------
    await fillStripeCheckout(page, { email: TRAINER_EMAIL });

    await expect(page).toHaveURL(/\/license-management/, { timeout: 60_000 });
    const batchId = await waitForNewBatch(trainerApi, knownBatchIds);
    const batchCard = page.locator('.batch-card').filter({ hasText: packPlan.name }).first();
    await expect(batchCard).toBeVisible({ timeout: 30_000 });
    await demoPause(page, 2); // dwell on the provisioned batch

    // Backend agreement: 4 licences, each expiring with the pack (~3 days).
    const licenses = await getBatchLicenses(trainerApi, batchId);
    expect(licenses).toHaveLength(learners);
    const expectedDeadline = Date.now() + DURATION_DAYS * 24 * 3600 * 1000;
    for (const license of licenses) {
      expect(license.expires_at, 'every pack licence must carry the pack deadline').toBeTruthy();
      expect(Math.abs(new Date(license.expires_at).getTime() - expectedDeadline)).toBeLessThan(
        6 * 3600 * 1000
      );
    }

    // ------------------------------------------------------------------
    // Act 3 — assign the four seats from the batch's detail page.
    // ------------------------------------------------------------------
    await batchCard.locator('.btn-action.success').click();
    await expect(page.locator('.btn-action.assign').first()).toBeVisible({ timeout: 15_000 });

    for (const email of STUDENT_EMAILS) {
      await assignSeatTo(page, email);
    }

    await expect(page.locator('.stat-card.assigned .stat-value')).toHaveText(String(learners), {
      timeout: 15_000,
    });
    await demoPause(page, 2); // dwell on the fully-assigned batch

    // ------------------------------------------------------------------
    // Act 4 — a student sees the assigned seat as their active plan.
    // ------------------------------------------------------------------
    const studentContext = await browser.newContext();
    try {
      const studentPage = await studentContext.newPage();
      const studentApi = await apiLogin(STUDENT_EMAILS[0], STUDENT_PASSWORD);
      try {
        const studentOrgId = await getPersonalOrganizationId(studentApi);
        await studentPage.goto('/login');
        if (studentOrgId) {
          await studentPage.evaluate(
            (orgId) => localStorage.setItem('currentOrganizationId', orgId),
            studentOrgId
          );
        }
        await login(studentPage, STUDENT_EMAILS[0], STUDENT_PASSWORD);
        await dismissVerificationBanner(studentPage);
        await navigateViaSubscriptionMenu(studentPage, '/subscription-dashboard');
        await expect(studentPage.locator('.plan-name').first()).toHaveText(packPlan.name, {
          timeout: 20_000,
        });
        await demoPause(studentPage, 2); // dwell on the student's assigned plan

        // The backend agrees, and the seat dies with the pack.
        const studentSub = await getCurrentSubscription(studentApi);
        expect(studentSub?.subscription_plan?.name).toBe(packPlan.name);
      } finally {
        await studentApi.api.dispose();
      }
    } finally {
      await studentContext.close();
    }
  });
});
