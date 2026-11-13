/**
 * The demo portal's "return to dashboard" button follows `?return_url=`
 * only when it names a path inside the app; anything else goes back to the
 * subscription dashboard.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const routeQuery: Record<string, any> = {}
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: routeQuery }),
  useRouter: () => ({ push: vi.fn() }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn()
}))

vi.mock('../../src/services/demo', () => ({
  logDemoAction: vi.fn(),
  simulateDelay: vi.fn().mockResolvedValue(undefined)
}))

import DemoPortal from '../../src/components/Demo/DemoPortal.vue'

async function returnWith(returnUrl: string) {
  for (const key of Object.keys(routeQuery)) delete routeQuery[key]
  routeQuery.session_id = 'demo-session'
  routeQuery.return_url = returnUrl
  const wrapper = mount(DemoPortal, { global: { plugins: [createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })] } })
  await flushPromises()
  await wrapper.find('.portal-actions button').trigger('click')
  await flushPromises()
}

describe('DemoPortal — return destination', () => {
  const originalLocation = window.location

  beforeEach(() => {
    vi.clearAllMocks()
    delete (window as any).location
    ;(window as any).location = { href: '', origin: 'http://localhost:4000' }
  })

  afterEach(() => {
    ;(window as any).location = originalLocation
  })

  it('returns to the in-app path named by return_url', async () => {
    await returnWith('/subscription-dashboard?from=demo')
    expect(window.location.href).toBe('/subscription-dashboard?from=demo')
  })

  it.each([
    'javascript:alert(1)',
    '//example.com',
    'https://example.com'
  ])('returns to the subscription dashboard when return_url is %j', async (returnUrl) => {
    await returnWith(returnUrl)
    expect(window.location.href).toBe('/subscription-dashboard')
  })
})
