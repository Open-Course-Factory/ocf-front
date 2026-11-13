/**
 * When the router guard bounces an already-verified user to /verify-email,
 * the page sends them on to `?redirect=` — but only when it names a path
 * inside the app; anything else goes to My Sessions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const mockPush = vi.fn()
const routeQuery: Record<string, any> = {}
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: routeQuery }),
  useRouter: () => ({ push: mockPush }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn()
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({
    isAuthenticated: true,
    userEmail: 'test@example.com',
    refreshVerificationStatus: vi.fn().mockResolvedValue({ verified: true })
  })
}))

vi.mock('../../src/composables/useEmailVerification', () => ({
  useEmailVerification: () => ({ verifyEmail: vi.fn() })
}))

import VerifyEmail from '../../src/components/Pages/VerifyEmail.vue'

async function arriveWithRedirect(redirect: string) {
  for (const key of Object.keys(routeQuery)) delete routeQuery[key]
  routeQuery.redirect = redirect
  mount(VerifyEmail, {
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: { ResendVerificationEmail: true, 'router-link': true } }
  })
  await flushPromises()
}

describe('VerifyEmail — destination for an already-verified user', () => {
  beforeEach(() => vi.clearAllMocks())

  it('goes to the in-app path named by redirect', async () => {
    await arriveWithRedirect('/courses')
    expect(mockPush).toHaveBeenCalledWith('/courses')
  })

  it.each([
    'javascript:alert(1)',
    '//example.com',
    'https://example.com'
  ])('goes to My Sessions when redirect is %j', async (redirect) => {
    await arriveWithRedirect(redirect)
    expect(mockPush).toHaveBeenCalledWith('/terminal-sessions')
  })
})
