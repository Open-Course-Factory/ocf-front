/**
 * The app's front door. Marketing lives on its own site, so `/` has no page
 * of its own: it opens the login form, which sends a signed-in user on to the app.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { ref } from 'vue'

// The global guard reads the user and the feature flags; an anonymous visitor
// is what an old bookmarked /pricing link brings in.
vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({
    isAuthenticated: false,
    needsPasswordChange: false,
    emailVerified: true,
    userId: null,
    userRoles: [],
    permissions: [],
    loadUserData: vi.fn(),
  }),
}))
vi.mock('../../src/services/features', () => ({
  featureFlagService: {
    waitForInitialization: vi.fn().mockResolvedValue(undefined),
    isEnabled: vi.fn(() => true),
  },
}))
vi.mock('../../src/composables/useSettingsNavigation', () => ({
  useSettingsNavigation: () => ({ storePreviousRoute: vi.fn() }),
}))
vi.mock('../../src/composables/useFeatureFlags', () => ({ getCurrentActorRoles: () => ref([]) }))

import router from '../../src/router'
import { COMPANY } from '../../src/config/company'

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

  // Old links and bookmarks still point at /pricing: send them to the prices.
  describe('an old /pricing link', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('sends the browser to the pricing page of the marketing site', async () => {
      const replace = vi.fn()
      vi.stubGlobal('location', { ...window.location, replace })

      await router.push('/pricing').catch(() => undefined)

      expect(replace).toHaveBeenCalledWith(`${COMPANY.website}/tarifs`)
    })
  })

  it('leaves the authenticated purchase flow in place', () => {
    expect(router.resolve('/subscription-plans').matched.length).toBeGreaterThan(0)
  })
})
