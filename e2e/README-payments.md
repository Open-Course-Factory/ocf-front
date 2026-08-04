# Payment E2E suite

End-to-end tests for the payment / subscription features, driving the real UI
and the real Stripe **test-mode** hosted Checkout. `payment-purchase.spec.ts` is
the reference spec — new payment specs should copy its recipe.

## Environment requirements

The suite runs against a live local stack:

| Piece | How |
|---|---|
| ocf-core on :8080 | With Stripe **test** keys in `.env` (`sk_test_…`) |
| ocf-front on :4000 | `npm run dev` |
| Stripe webhooks | `stripe listen --forward-to localhost:8080/api/v1/webhooks/stripe` — the CLI's signing secret must match `STRIPE_WEBHOOK_SECRET` in ocf-core's `.env` (it does by default: `stripe listen` reuses a stable per-account secret) |
| Seeded personas | `jp@test.ocf` etc., password `OcfTest2026!` |

Without the webhook forwarder the payment completes on Stripe but the
subscription never activates — the success page stays in its "pending" state.

## The recipe

1. **Setup/teardown through the API, behavior through the UI.**
   `helpers/paymentApi.ts` logs in against ocf-core directly and resets the
   payer to the free plan before AND after each test, so specs are re-runnable
   against a long-lived dev database — including after an aborted run.
2. **Dedicated payer.** Purchases run as `jp@test.ocf`, a persona no other spec
   subscribes with, so plan-gating expectations elsewhere stay untouched.
3. **Personal org context.** Subscription state is org-scoped: with a team org
   active, `/user-subscriptions/current` answers for the org, not the user. Pin
   `localStorage.currentOrganizationId` to the personal org before login.
4. **Stripe checkout.** `helpers/stripeCheckout.ts` drives the hosted page with
   the 4242 test card: selects the Card accordion, fills the France billing
   address, and retries the submit once (the address autocomplete overlay can
   swallow the first click). It refuses to run outside `checkout.stripe.com`.
5. **Assert three layers.** The success page (plan name in the details card),
   the dashboard (active subscription source), and the backend
   (`/user-subscriptions/current` via the API helper).

## Running

```bash
cd ocf-front
npx playwright test payment-purchase            # headless, fast
npx playwright test payment-purchase --headed   # watch it live
```

## Demo mode (presentations)

The specs carry explicit pacing points via `helpers/demo.ts` — a pause before
each meaningful click and a longer dwell on result screens — inactive (zero
delay) in normal and CI runs. Unlike `slowMo`, form-filling stays fast; only
the moments worth reading slow down.

```bash
DEMO=1 npx playwright test payment-purchase --headed     # 1.8s pauses
DEMO_PACE=3000 npx playwright test payment-purchase --headed  # custom pace
```

Videos are only recorded on retry by default (`video: 'on-first-retry'`); to
record a demo run, temporarily set `video: 'on'` in `playwright.config.ts` or
use a config override.
