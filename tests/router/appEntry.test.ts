/**
 * The app's front door. Marketing lives on www.labinux.com, so `/` has no page
 * of its own: it opens the login form, which sends a signed-in user on to the app.
 */

import { describe, it, expect } from 'vitest'
import router from '../../src/router'

describe('the root of the app', () => {
  it('opens the login page', () => {
    const redirect = router.resolve('/').matched[0]?.redirect
    expect(redirect).toEqual({ name: 'Login' })
  })

  it('has no landing page left to fall back on', () => {
    expect(router.hasRoute('LandingPage')).toBe(false)
  })
})

// Prices are published on the marketing site. The purchase flow is the
// authenticated /subscription-plans page, which stays.
describe('the public pricing page', () => {
  it('is gone from the router', () => {
    expect(router.hasRoute('PublicOffers')).toBe(false)
  })

  it('no longer resolves /pricing to a page', () => {
    expect(router.resolve('/pricing').name).not.toBe('PublicOffers')
    expect(router.resolve('/pricing').matched.some(r => r.path === '/pricing')).toBe(false)
  })

  it('leaves the authenticated purchase flow in place', () => {
    expect(router.resolve('/subscription-plans').matched.length).toBeGreaterThan(0)
  })
})
