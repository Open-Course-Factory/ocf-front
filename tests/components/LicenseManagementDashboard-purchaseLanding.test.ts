/**
 * RED — bulk-license purchase landing on LicenseManagementDashboard.vue
 * (issue #254, repurposed to the residual webhook-lag gap).
 *
 * Bug: the bulk paid checkout redirects to `/license-management?success=true`
 * (BulkLicensePurchase.vue:335). On arrival, LicenseManagementDashboard's
 * onMounted does a SINGLE-SHOT `loadBatches()` and, if `?success=true`, fires a
 * "purchase complete" toast. If the Stripe webhook that provisions the batch
 * has not landed yet, `GET /subscription-batches` returns nothing, so the user
 * sees the empty state ("No License Batches") — right after being told the
 * purchase completed. There is no polling.
 *
 * Desired behavior (pinned loosely — retries + terminal states, not exact tick
 * counts, so the dev keeps latitude). On arrival with `?success=true`:
 *   1. RETRY the batches load (house style = CheckoutSuccess.vue's 10×1s poll)
 *      until a batch appears OR the poll budget is exhausted.
 *   2. While waiting, show a DISTINGUISHABLE "processing" state — NOT the empty
 *      "no batches" state.
 *   3. When a batch appears mid-poll, render it and clear the processing state
 *      (terminal success — stop polling).
 *   4. If the budget runs out with still no batch, settle GRACEFULLY into a
 *      "still processing" notice — NOT the empty state, NOT an error.
 *
 * The polled endpoint is `loadBatches()` → bulkLicenseService.getMyBatches()
 * → GET /subscription-batches (scoped to the current purchaser; no org context
 * needed — the buyer always sees their own batches).
 *
 * ---------------------------------------------------------------------------
 * CONTRACT for the frontend-dev (DOM hooks these tests drive; pick different
 * ones if you prefer, but the behavior — retries + the three terminal states —
 * is the contract):
 *   [data-test="purchase-processing"]        — shown while polling, no batch yet
 *   [data-test="purchase-still-processing"]  — settled notice after budget runs out
 *   .empty-state                             — existing "No License Batches" block;
 *                                              must be SUPPRESSED during/after a
 *                                              ?success=true poll that hasn't
 *                                              produced a batch.
 * ---------------------------------------------------------------------------
 *
 * EXPECTED STATE: tests #1–#5 are now GREEN — the polling fix shipped in
 * `8c8a484`. Tests #6–#7 (added after a reviewer follow-up, at the bottom of
 * this file) are the new RED phase: they pin the count-based `?prior=<N>` gate
 * for repeat buyers and poll cancellation on unmount, both of which the shipped
 * fix does not yet handle.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'

// All spies / mutable state referenced inside vi.mock factories must come from
// vi.hoisted — the factories are hoisted above these declarations.
const h = vi.hoisted(() => ({
  loadBatches: vi.fn(),
  updateBatchQuantity: vi.fn(),
  deleteBatch: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showConfirm: vi.fn(),
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
  // Replaced with real Vue refs after import (ref() is unavailable at hoist time).
  routeQuery: { value: {} as Record<string, string> },
  batches: { value: [] as any[] },
  error: { value: null as any },
  // Per-test queue: each loadBatches() call shifts the next batches snapshot,
  // simulating the webhook landing after N polls.
  queue: [] as any[][],
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ get query() { return h.routeQuery.value } }),
  useRouter: () => ({ push: h.routerPush, replace: h.routerReplace }),
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (k: string) => k }),
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showSuccess: h.showSuccess,
    showError: h.showError,
    showConfirm: h.showConfirm,
  }),
}))

vi.mock('../../src/stores/subscriptionBatches', () => ({
  useSubscriptionBatchesStore: () => ({
    get batches() { return h.batches.value },
    get error() { return h.error.value },
    loadBatches: h.loadBatches,
    updateBatchQuantity: h.updateBatchQuantity,
    deleteBatch: h.deleteBatch,
  }),
}))

import LicenseManagementDashboard from '../../src/components/Pages/LicenseManagementDashboard.vue'

// Swap the plain holders for real reactive refs so the component's
// `batches` computed re-renders when loadBatches() mutates them.
h.batches = ref<any[]>([]) as any
h.error = ref<any>(null) as any

const BATCH = {
  id: 'batch-abcdef01',
  status: 'active',
  subscription_plan: { name: 'Solo' },
  total_quantity: 10,
  assigned_quantity: 0,
  available_quantity: 10,
  current_period_end: '2026-08-01T00:00:00Z',
  created_at: '2026-07-01T00:00:00Z',
}

function mountDashboard() {
  return mount(LicenseManagementDashboard, {
    global: {
      stubs: {
        AddLicensesModal: true,
        'router-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  })
}

// Advance fake timers by `ms` (flushing microtasks) and let Vue re-render.
async function tick(ms = 0) {
  await vi.advanceTimersByTimeAsync(ms)
  await nextTick()
}

describe('LicenseManagementDashboard — bulk purchase landing (?success=true)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    h.loadBatches.mockReset()
    h.showSuccess.mockReset()
    h.showError.mockReset()
    h.routerReplace.mockReset()
    h.batches.value = []
    h.error.value = null
    h.queue = []
    h.routeQuery.value = {}
    // Each load applies the next queued snapshot (webhook-lag simulation).
    h.loadBatches.mockImplementation(async () => {
      const next = h.queue.shift()
      if (next !== undefined) h.batches.value = next
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ---- #1 RED: the load is retried while the batch is missing ----
  it('#1 polls the batches endpoint more than once while the purchased batch has not appeared', async () => {
    h.routeQuery.value = { success: 'true' }
    h.queue = [] // batch never lands within the window → stays empty every poll

    const wrapper = mountDashboard()
    await tick(0)        // initial single-shot load resolves (empty)
    await tick(12000)    // give a correct impl its full ~10×1s poll budget

    // Today: loadBatches is called exactly once (onMounted) and never retried.
    expect(h.loadBatches.mock.calls.length).toBeGreaterThanOrEqual(2)
    wrapper.unmount()
  })

  // ---- #2 RED: a distinguishable "processing" state, not the empty state ----
  it('#2 shows a distinguishable processing state (not the empty "no batches" state) while polling', async () => {
    h.routeQuery.value = { success: 'true' }
    h.queue = [] // still waiting on the webhook

    const wrapper = mountDashboard()
    await tick(0)      // initial load resolves empty; a correct impl is now polling
    await tick(500)    // mid-poll, well within the budget

    expect(wrapper.find('[data-test="purchase-processing"]').exists()).toBe(true)
    // Must NOT fall through to the misleading empty state while still processing.
    expect(wrapper.find('.empty-state').exists()).toBe(false)
    wrapper.unmount()
  })

  // ---- #3 RED: batch arriving mid-poll renders and clears the processing UI ----
  it('#3 renders the batch and clears the processing state once it appears mid-poll', async () => {
    h.routeQuery.value = { success: 'true' }
    // 1st poll: still empty. A later poll: the batch has landed.
    h.queue = [[], [BATCH]]

    const wrapper = mountDashboard()
    await tick(0)        // initial load → empty (queue entry 1)
    await tick(12000)    // a correct impl retries, consumes the [BATCH] entry, stops

    expect(wrapper.find('.batch-card').exists()).toBe(true)
    expect(wrapper.find('[data-test="purchase-processing"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="purchase-still-processing"]').exists()).toBe(false)
    wrapper.unmount()
  })

  // ---- #4 RED: exhausted budget settles into a still-processing notice ----
  it('#4 settles into a still-processing notice (not an empty/error state) when the poll budget is exhausted', async () => {
    h.routeQuery.value = { success: 'true' }
    h.queue = [] // batch never arrives

    const wrapper = mountDashboard()
    await tick(0)
    await tick(15000) // beyond any reasonable poll budget

    expect(wrapper.find('[data-test="purchase-still-processing"]').exists()).toBe(true)
    // Graceful settle — not the bare empty state, and no error surfaced.
    expect(wrapper.find('.empty-state').exists()).toBe(false)
    expect(h.showError).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  // ---- #5 GUARD (GREEN today): a normal visit must NOT start polling ----
  it('#5 [guard] on a normal visit (no ?success=true) it loads once and shows no processing state', async () => {
    h.routeQuery.value = {} // arrived via the nav menu, not a checkout redirect
    h.queue = [[BATCH]]     // user already owns a batch

    const wrapper = mountDashboard()
    await tick(0)
    await tick(12000)

    expect(h.loadBatches).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-test="purchase-processing"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="purchase-still-processing"]').exists()).toBe(false)
    expect(wrapper.find('.batch-card').exists()).toBe(true)
    wrapper.unmount()
  })

  // ===========================================================================
  // Reviewer follow-up (#254 / MR !241) — two Important gaps in the shipped fix,
  // both RED against the current code:
  //
  //  Gap 1 — the id snapshot is inert on the real redirect. Stripe returns via a
  //  FULL PAGE LOAD, so the store is empty at mount and the "prior ids" snapshot
  //  is empty; hasNewBatch() then degrades to any-batch, so a REPEAT buyer's
  //  first load returns their OLD batches and the poll settles immediately with
  //  a premature "purchase complete". Design fix: thread the pre-purchase batch
  //  COUNT through the redirect as `?prior=<N>` and poll until batches.length > N
  //  (absent/invalid prior → 0, preserving the empty→present path).
  //
  //  Gap 2 — the 10×1s poll is never cancelled. After the user navigates away it
  //  keeps calling loadBatches()/writing refs, and the trailing
  //  router.replace({ query: {} }) fires against whatever route they're on by
  //  then. Design fix: cancel the loop on unmount — no more loadBatches, no
  //  route replace.
  // ===========================================================================

  const OLD_BATCH = { ...BATCH, id: 'batch-old000001' }
  const NEW_BATCH = { ...BATCH, id: 'batch-new000002' }

  // ---- #6 RED: repeat buyer — ?prior=1 must not settle on the pre-existing batch ----
  it('#6 with ?prior=1 and one pre-existing batch, does not settle on the old batch and keeps polling until a new one appears', async () => {
    h.routeQuery.value = { success: 'true', prior: '1' }
    // First poll returns the buyer's ONE existing (pre-purchase) batch; a later
    // poll adds the freshly-provisioned second batch (length 2 > prior 1).
    h.queue = [[OLD_BATCH], [OLD_BATCH, NEW_BATCH]]

    const wrapper = mountDashboard()
    await tick(0) // first poll → 1 batch, equal to prior → NOT the new one

    // Today: the prior-ids snapshot is empty (full-page load), so the old batch
    // counts as "new" and the poll settles here with a premature success toast.
    expect(h.showSuccess).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="purchase-processing"]').exists()).toBe(true)

    await tick(2000) // subsequent poll → 2 batches (> prior) → provisioning done

    expect(h.showSuccess).toHaveBeenCalledWith('licenseDashboard.purchaseComplete')
    expect(wrapper.find('[data-test="purchase-processing"]').exists()).toBe(false)
    expect(h.loadBatches.mock.calls.length).toBeGreaterThanOrEqual(2)
    wrapper.unmount()
  })

  // ---- #7 RED: poll is cancelled on unmount (navigating away mid-poll) ----
  it('#7 stops polling and does not replace the route when unmounted mid-poll', async () => {
    h.routeQuery.value = { success: 'true' } // prior absent → 0 (empty→present path)
    h.queue = [] // batch never arrives → a live poll would run its full budget

    const wrapper = mountDashboard()
    await tick(0)    // attempt 1
    await tick(1000) // attempt 2

    const callsAtUnmount = h.loadBatches.mock.calls.length
    // Still mid-poll: the loop hasn't settled, so the route hasn't been cleaned.
    expect(h.routerReplace).not.toHaveBeenCalled()

    wrapper.unmount()
    await tick(20000) // drain any timers a still-running loop would fire

    // Today the detached loop keeps calling loadBatches and finally replaces the
    // route against whatever page the user has since navigated to.
    expect(h.loadBatches.mock.calls.length).toBe(callsAtUnmount)
    expect(h.routerReplace).not.toHaveBeenCalled()
  })
})
