import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, type I18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

// ---- Mocks (must be before component imports) ----

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

import ImpersonationBanner from '../../src/components/UI/ImpersonationBanner.vue'
import { useImpersonationStore, type UserSummary } from '../../src/stores/impersonation'

function createTestI18n(locale: 'en' | 'fr' = 'en'): I18n {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

const targetUser: UserSummary = {
  id: 'target-id',
  username: 'target',
  display_name: 'Target Display',
  email: 'target@x.com'
}

const adminUser: UserSummary = {
  id: 'admin-id',
  username: 'admin',
  display_name: 'Admin Display',
  email: 'admin@x.com'
}

function mountBanner(opts: {
  locale?: 'en' | 'fr'
  setupStore?: () => void
} = {}) {
  setActivePinia(createPinia())
  if (opts.setupStore) opts.setupStore()
  const i18n = createTestI18n(opts.locale ?? 'en')

  return mount(ImpersonationBanner, {
    global: {
      plugins: [i18n]
    }
  })
}

function activateImpersonation() {
  const store = useImpersonationStore()
  store.targetUserId = targetUser.id
  store.target = { ...targetUser }
  store.impersonator = { ...adminUser }
}

describe('ImpersonationBanner', () => {
  // Stub window.location so onStop can safely assign to .href
  // without actually navigating in the JSDOM test environment.
  const originalLocation = window.location

  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-ignore — JSDOM allows replacing location after delete
    delete (window as any).location
    // @ts-ignore
    ;(window as any).location = { href: '' }
  })

  afterEach(() => {
    // @ts-ignore
    ;(window as any).location = originalLocation
  })

  it('renders nothing when not impersonating', () => {
    const wrapper = mountBanner()
    expect(wrapper.find('.impersonation-banner').exists()).toBe(false)
  })

  it('renders banner when impersonating', () => {
    const wrapper = mountBanner({ setupStore: activateImpersonation })
    expect(wrapper.find('.impersonation-banner').exists()).toBe(true)
  })

  it('shows target display name', () => {
    const wrapper = mountBanner({ setupStore: activateImpersonation })
    expect(wrapper.text()).toContain('Target Display')
  })

  it('shows impersonator display name', () => {
    const wrapper = mountBanner({ setupStore: activateImpersonation })
    expect(wrapper.text()).toContain('Admin Display')
  })

  it('shows stop button', () => {
    const wrapper = mountBanner({ setupStore: activateImpersonation })
    expect(wrapper.find('button.stop-impersonating').exists()).toBe(true)
  })

  it('clicking stop calls store.stop()', async () => {
    const wrapper = mountBanner({ setupStore: activateImpersonation })
    const store = useImpersonationStore()
    const stopSpy = vi.spyOn(store, 'stop').mockResolvedValue(undefined)

    await wrapper.find('button.stop-impersonating').trigger('click')
    await nextTick()

    expect(stopSpy).toHaveBeenCalledTimes(1)
    // Called with no arguments (NOT silent — silent would pass `true`)
    expect(stopSpy.mock.calls[0].length).toBe(0)
  })

  it('clicking stop triggers a hard reload to / after stop resolves', async () => {
    const wrapper = mountBanner({ setupStore: activateImpersonation })
    const store = useImpersonationStore()
    vi.spyOn(store, 'stop').mockResolvedValue(undefined)

    await wrapper.find('button.stop-impersonating').trigger('click')
    // Wait for the stop() promise to resolve before asserting navigation.
    await new Promise(resolve => setTimeout(resolve, 0))

    // Hard reload required so all Pinia stores re-initialize as the admin —
    // SPA navigation would keep the impersonated user's stale store state.
    expect(window.location.href).toBe('/')
  })

  it('falls back to username if display_name is empty', () => {
    const wrapper = mountBanner({
      setupStore: () => {
        const store = useImpersonationStore()
        store.targetUserId = targetUser.id
        store.target = { ...targetUser, display_name: '' }
        store.impersonator = { ...adminUser }
      }
    })
    expect(wrapper.text()).toContain('target')
    expect(wrapper.text()).not.toContain('Target Display')
  })

  it('renders in French when locale is fr', () => {
    const wrapper = mountBanner({
      locale: 'fr',
      setupStore: activateImpersonation
    })
    // French label "Vous incarnez"
    expect(wrapper.text()).toContain('Vous incarnez')
  })

  it('renders in English when locale is en', () => {
    const wrapper = mountBanner({
      locale: 'en',
      setupStore: activateImpersonation
    })
    expect(wrapper.text()).toContain('Impersonating')
  })
})
