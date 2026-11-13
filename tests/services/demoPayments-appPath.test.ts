/**
 * Callers hand the demo payment service the absolute URLs Stripe needs; the
 * demo checkout and portal pages it links to only follow in-app paths, so
 * the links it builds carry the path, query and hash alone.
 */

import { describe, it, expect, vi } from 'vitest'

vi.mock('../../src/services/demo/demoConfig', () => ({
  demoConfig: {},
  logDemoAction: vi.fn(),
  simulateDelay: vi.fn().mockResolvedValue(undefined)
}))

import { demoPayments } from '../../src/services/demo/demoPayments'
import { getDemoSubscriptionPlans } from '../../src/services/demo/demoData'
import { inAppPath } from '../../src/utils/inAppPath'

const origin = window.location.origin

describe('demoPayments — demo page links carry in-app paths', () => {
  it('passes success_url and cancel_url to the demo checkout as paths', async () => {
    const planId = getDemoSubscriptionPlans()[0].id
    const { url } = await demoPayments.createCheckoutSession(
      planId,
      `${origin}/subscription-dashboard?session=ok#top`,
      `${origin}/subscription-plans?canceled=1`
    )

    const query = new URL(url).searchParams
    expect(query.get('success_url')).toBe('/subscription-dashboard?session=ok#top')
    expect(query.get('cancel_url')).toBe('/subscription-plans?canceled=1')
    expect(inAppPath(query.get('success_url'))).not.toBeNull()
    expect(inAppPath(query.get('cancel_url'))).not.toBeNull()
  })

  it('passes return_url to the demo portal as a path', async () => {
    const { url } = await demoPayments.createPortalSession(`${origin}/payment-methods`)

    const returnUrl = new URL(url).searchParams.get('return_url')
    expect(returnUrl).toBe('/payment-methods')
    expect(inAppPath(returnUrl)).not.toBeNull()
  })
})
