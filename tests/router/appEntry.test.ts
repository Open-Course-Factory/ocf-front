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
