import { type Locator, type Page, expect } from '@playwright/test';
import { demoPause } from './demo';

/**
 * Drive Stripe's hosted Checkout page (checkout.stripe.com) with a test card.
 *
 * Only ever runs against a Stripe TEST-mode session — the helper refuses to
 * type a card number unless the page URL is a checkout.stripe.com one reached
 * from a test-mode session. Field set varies with the session configuration
 * (email may be prefilled, postal code depends on country), so optional fields
 * are filled only when present.
 *
 * Stripe serves two layouts and switches accounts between them on its own:
 * the classic one renders the form in the page (#cardNumber, #billingName…);
 * the newer one renders it inside nested Stripe iframes with other ids. Each
 * selector below lists both, and every lookup searches all frames.
 */

export const STRIPE_TEST_CARD = {
  number: '4242 4242 4242 4242',
  expiry: '12 / 34',
  cvc: '123',
  name: 'OCF E2E Test',
};

const CARD_NUMBER = '#cardNumber, input[name="number"]';
// Card sits behind a choice (accordion or radio list) whenever the account
// offers more than one payment method.
const CARD_CHOICE =
  '.p-AccordionButton[data-value="card"], [data-testid*="card"][data-testid*="accordion"], .AccordionItem:has-text("Card")';
const SUBMIT = '.SubmitButton, [data-testid="payment-form-submit-button"]';

async function visibleInAnyFrame(page: Page, selector: string): Promise<Locator | null> {
  for (const frame of page.frames()) {
    const match = frame.locator(selector).first();
    if (await match.isVisible().catch(() => false)) return match;
  }
  return null;
}

async function waitInAnyFrame(page: Page, selector: string, timeout: number): Promise<Locator> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const match = await visibleInAnyFrame(page, selector);
    if (match) return match;
    if (Date.now() > deadline) throw new Error(`Stripe Checkout: nothing visible matches ${selector}`);
    await page.waitForTimeout(250);
  }
}

export async function fillStripeCheckout(page: Page, options?: { email?: string }): Promise<void> {
  await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30_000 });

  // Wait for whichever renders first — the card field itself or the choice
  // hiding it — instead of probing in sequence, which wastes a full timeout on
  // the layout that isn't there.
  await waitInAnyFrame(page, `${CARD_NUMBER}, ${CARD_CHOICE}`, 30_000);
  let cardNumber = await visibleInAnyFrame(page, CARD_NUMBER);
  if (!cardNumber) {
    await (await waitInAnyFrame(page, CARD_CHOICE, 5_000)).click();
    cardNumber = await waitInAnyFrame(page, CARD_NUMBER, 15_000);
  }

  // Email: prefilled (readonly) when the backend attaches a customer; fill otherwise.
  const email = await visibleInAnyFrame(page, '#email, #linkAuthentication-emailInput');
  if (email && options?.email) {
    const isReadonly = await email.evaluate(
      (el) => (el as HTMLInputElement).readOnly || (el as HTMLInputElement).disabled
    );
    if (!isReadonly) await email.fill(options.email);
  }

  await cardNumber.fill(STRIPE_TEST_CARD.number);
  await (await waitInAnyFrame(page, '#cardExpiry, input[name="expiry"]', 5_000)).fill(STRIPE_TEST_CARD.expiry);
  await (await waitInAnyFrame(page, '#cardCvc, input[name="cvc"]', 5_000)).fill(STRIPE_TEST_CARD.cvc);
  await (await waitInAnyFrame(page, '#billingName, #billingAddress-nameInput', 5_000)).fill(STRIPE_TEST_CARD.name);

  // Country select + address appear depending on the session and layout.
  const country = await visibleInAnyFrame(page, '#billingCountry, #billingAddress-countryInput');
  await country?.selectOption('FR').catch(() => {});
  const addressFields: Array<[string, string]> = [
    ['#billingAddressLine1, #billingAddress-addressLine1Input', '1 rue de la Paix'],
    ['#billingPostalCode, #billingAddress-postalCodeInput', '75001'],
    ['#billingLocality, #billingAddress-localityInput', 'Paris'],
  ];
  for (const [selector, value] of addressFields) {
    await (await visibleInAnyFrame(page, selector))?.fill(value);
  }

  // Decline the Link save-my-info upsell if it is offered as a checkbox.
  const linkCheckbox = await visibleInAnyFrame(page, '#enableStripePass');
  if (linkCheckbox && (await linkCheckbox.isChecked().catch(() => false))) {
    await linkCheckbox.uncheck().catch(() => {});
  }

  // Let a demo audience see the filled payment form before it is submitted.
  await demoPause(page);

  // The address field opens an autocomplete overlay that can swallow the first
  // submit click — dismiss it, then submit, retrying once if the page has not
  // left Stripe (still same URL, button back to idle).
  await page.keyboard.press('Escape');
  const submit = await waitInAnyFrame(page, SUBMIT, 10_000);
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
