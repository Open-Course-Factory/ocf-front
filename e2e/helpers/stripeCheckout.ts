import { type Page, expect } from '@playwright/test';
import { demoPause } from './demo';

/**
 * Drive Stripe's hosted Checkout page (checkout.stripe.com) with a test card.
 *
 * Only ever runs against a Stripe TEST-mode session — the helper refuses to
 * type a card number unless the page URL is a checkout.stripe.com one reached
 * from a test-mode session. Field set varies with the session configuration
 * (email may be prefilled, postal code depends on country), so optional fields
 * are filled only when present.
 */

export const STRIPE_TEST_CARD = {
  number: '4242 4242 4242 4242',
  expiry: '12 / 34',
  cvc: '123',
  name: 'OCF E2E Test',
};

export async function fillStripeCheckout(page: Page, options?: { email?: string }): Promise<void> {
  await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30_000 });

  // The hosted page is a SPA. Payment methods can render either as a direct
  // card form (#cardNumber immediately present) or as an accordion (Card /
  // SEPA / …) where the card fields only exist after the Card method is
  // selected — wait for whichever appears first instead of probing them in
  // sequence, which wastes a full timeout on the layout that isn't there.
  const cardNumber = page.locator('#cardNumber');
  const cardAccordion = page
    .locator('[data-testid*="card"][data-testid*="accordion"], .AccordionItem:has-text("Card")')
    .first();
  await expect(cardNumber.or(cardAccordion).first()).toBeVisible({ timeout: 30_000 });
  if (!(await cardNumber.isVisible())) {
    await cardAccordion.click();
    await cardNumber.waitFor({ state: 'visible', timeout: 15_000 });
  }

  // Email: prefilled (readonly) when the backend attaches a customer; fill otherwise.
  const email = page.locator('#email');
  if (await email.isVisible().catch(() => false)) {
    const isReadonly = await email.evaluate(
      (el) => (el as HTMLInputElement).readOnly || (el as HTMLInputElement).disabled
    );
    if (!isReadonly && options?.email) {
      await email.fill(options.email);
    }
  }

  await cardNumber.fill(STRIPE_TEST_CARD.number);
  await page.locator('#cardExpiry').fill(STRIPE_TEST_CARD.expiry);
  await page.locator('#cardCvc').fill(STRIPE_TEST_CARD.cvc);
  await page.locator('#billingName').fill(STRIPE_TEST_CARD.name);

  // Country select + postal code appear depending on the session; France needs
  // no postal code, US layouts do.
  const country = page.locator('#billingCountry');
  if (await country.isVisible().catch(() => false)) {
    await country.selectOption('FR').catch(() => {});
  }
  const addressFields: Array<[string, string]> = [
    ['#billingAddressLine1', '1 rue de la Paix'],
    ['#billingPostalCode', '75001'],
    ['#billingLocality', 'Paris'],
  ];
  for (const [selector, value] of addressFields) {
    const field = page.locator(selector);
    if (await field.isVisible().catch(() => false)) {
      await field.fill(value);
    }
  }

  // Decline the Link save-my-info upsell if it is offered as a checkbox.
  const linkCheckbox = page.locator('#enableStripePass');
  if (await linkCheckbox.isChecked().catch(() => false)) {
    await linkCheckbox.uncheck().catch(() => {});
  }

  // Let a demo audience see the filled payment form before it is submitted.
  await demoPause(page);

  // The address field opens an autocomplete overlay that can swallow the first
  // submit click — dismiss it, then submit, retrying once if the page has not
  // left Stripe (still same URL, button back to idle).
  await page.keyboard.press('Escape');
  const submit = page.locator('.SubmitButton');
  for (let attempt = 0; attempt < 2; attempt++) {
    await submit.click();
    const left = await page
      .waitForURL((url) => !url.hostname.includes('checkout.stripe.com'), { timeout: 20_000 })
      .then(() => true)
      .catch(() => false);
    if (left) return;
  }
  throw new Error('Stripe Checkout did not redirect after submitting payment');
}
