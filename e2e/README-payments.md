# Payment E2E suite

End-to-end tests for the payment / subscription features, driving the real UI
and the real Stripe **test-mode** hosted Checkout. `payment-purchase.spec.ts` is
the reference spec — new payment specs should copy its recipe.

The specs double as **feature presentations**: run them headed with demo pacing
and they walk through the product the way a real user does (suite rule: no
`page.goto()` inside the product — only real navigation).

## Running manually (local dev)

### 1. Prerequisites — the full stack must be up

| Piece | How to start it |
|---|---|
| postgres + casdoor | `cd ocf-core && docker compose up -d postgres casdoor` |
| ocf-core on :8080 | run it in its devcontainer, or on the host: `cd ocf-core && PATH=/usr/local/go/bin:$PATH POSTGRES_HOST=localhost CASDOOR_ENDPOINT=http://localhost:8000 go run main.go` |
| ocf-front on :4000 | `cd ocf-front && npm run dev` |
| Stripe webhooks | `stripe listen --forward-to localhost:8080/api/v1/webhooks/stripe` |

ocf-core's `.env` must carry Stripe **test** keys (`sk_test_…`). The Stripe
CLI's signing secret must match `STRIPE_WEBHOOK_SECRET` in that `.env` — it
does by default, `stripe listen` reuses a stable per-account secret.

**Without the webhook forwarder the payment completes on Stripe but the
subscription never activates** — the success page stays on its "pending" state.
This is the #1 cause of a red run.

### 2. Run the test

```bash
cd ocf-front
npx playwright test payment-purchase              # headless, fast (~40s)
npx playwright test payment-purchase --headed     # watch it live
DEMO=1 npx playwright test payment-purchase --headed        # presentation pace
DEMO_PACE=3000 npx playwright test payment-purchase --headed # slower pace
npx playwright test payment-purchase --trace on   # record a rich trace
```

After a run: `npx playwright show-report` opens the HTML report (traces,
screenshots and videos attached when recorded). Videos are only recorded on
retry by default; to record a demo video, temporarily set `video: 'on'` in
`playwright.config.ts` (or use a config override) and play the resulting
`.webm` from `test-results/`.

### 3. What a run does to your data

The payer (default `jp@test.ocf` / `OcfTest2026!`) really purchases the
cheapest paid catalog plan in the Stripe sandbox, then setup/teardown resets
them to the free plan through the API. Runs are safe to repeat — but **don't
run two at once**: they fight over the payer's subscription state.

Overridable via environment:

| Variable | Default | Meaning |
|---|---|---|
| `E2E_PAYER_EMAIL` / `E2E_PAYER_PASSWORD` | `jp@test.ocf` / `OcfTest2026!` | the purchasing user (must exist, be on the free plan or resettable to it, and have a verified email) |
| `OCF_API_URL` | `http://localhost:8080/api/v1` | ocf-core API base for the setup/teardown helpers |
| `DEMO` / `DEMO_PACE` | off | demo pacing (see below) |

### Demo mode (presentations)

The specs carry explicit pacing points via `helpers/demo.ts` — a pause before
each meaningful click and a longer dwell on result screens — inactive (zero
delay) in normal and CI runs. Unlike `slowMo`, form-filling stays fast; only
the moments worth reading slow down.

## The recipe (for writing the next specs)

1. **Setup/teardown through the API, behavior through the UI.**
   `helpers/paymentApi.ts` logs in against ocf-core directly and resets the
   payer to the free plan before AND after each test, so specs are re-runnable
   against a long-lived dev database — including after an aborted run.
2. **Dedicated payer, discovered plan.** Purchases run as the payer user (a
   persona no other spec subscribes with); the target plan is discovered from
   the catalog (cheapest active paid plan) so specs work on any seeded DB.
3. **Personal org context.** Subscription state is org-scoped: with a team org
   active, `/user-subscriptions/current` answers for the org, not the user. Pin
   `localStorage.currentOrganizationId` to the personal org before login.
4. **Real navigation only.** No `page.goto()` after login — use
   `navigateViaSubscriptionMenu()` (sidebar → More → Subscription & Licenses)
   or in-page CTAs, and `scrollIntoViewIfNeeded()` before a demo dwell.
5. **Stripe checkout.** `helpers/stripeCheckout.ts` drives the hosted page with
   the 4242 test card: selects the Card accordion, fills the France billing
   address, and retries the submit once (the address autocomplete overlay can
   swallow the first click). It refuses to run outside `checkout.stripe.com`.
6. **Assert three layers.** The success page (plan name in the details card),
   the dashboard (active subscription source), and the backend
   (`/user-subscriptions/current` via the API helper).

## CI setup

The `e2e:payment` job (`.gitlab-ci.yml`) runs **automatically on main only**
(post-merge); on MR pipelines it appears as a **manual, non-blocking** job you
can trigger from the pipeline view when a change warrants the full-stack check.

It builds the whole stack from scratch on the runner's Docker: it clones
ocf-core, brings up postgres + casdoor + the
ocf-core app via `docker-compose.test.yml` + `e2e/ci/docker-compose.core.yml`,
forwards Stripe webhooks with the Stripe CLI, seeds via ocf-core's own
development-mode startup (default plans, test users, Trial auto-assign) plus
`e2e/ci/seed-e2e.sh` (waits for Stripe price sync, marks emails verified), and
runs the spec with the CI-seeded payer (`1.student@test.com`).

One-time configuration on GitLab (the job is **skipped** until done):

1. **`STRIPE_TEST_SECRET_KEY`** — masked CI variable on ocf-front: the Stripe
   sandbox `sk_test_…` key. Never a live key.
2. **`token_jwt_key_test`** — CI variable on ocf-front: base64 of the Casdoor
   JWT certificate PEM (same value as ocf-core's variable of the same name).
3. **Job-token allowlist** — ocf-core → Settings → CI/CD → Job token
   permissions: add `open-course-factory/ocf-front` (the job clones ocf-core).

Each CI run performs a real sandbox purchase with a throwaway database, so the
Stripe sandbox accumulates test customers/products over time — harmless, and
prunable from the Stripe dashboard.
