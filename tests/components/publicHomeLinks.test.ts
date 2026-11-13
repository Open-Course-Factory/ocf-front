/**
 * The app opens on the login page: `/` is no longer a home page, it is the
 * login form. So a "Back to home" link or a logo on a public page that still
 * points at `/` sends a visitor in a circle. Home is the marketing site, and
 * COMPANY.website is the one place that names it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    defaults: { baseURL: '', headers: { common: {} } },
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}))
vi.mock('../../src/composables/useLocale', () => ({
  useLocale: () => ({
    currentLocale: { value: 'en' },
    supportedLocales: [],
    setLocale: vi.fn(),
    getLocaleInfo: () => ({}),
  }),
}))
vi.mock('../../src/composables/useLandingPage', () => ({
  resolveLandingPage: vi.fn().mockResolvedValue('/terminal-sessions'),
}))

import { COMPANY } from '../../src/config/company'
import Legal from '../../src/components/Pages/Legal.vue'
import Privacy from '../../src/components/Pages/Privacy.vue'
import Register from '../../src/components/Pages/Register.vue'
import PasswordReset from '../../src/components/Pages/PasswordReset.vue'
import Help from '../../src/components/Pages/Help.vue'

async function mountPage(component: any, path = '/') {
  setActivePinia(createPinia())
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:any(.*)*', component: { template: '<div />' } }],
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(component, {
    global: {
      plugins: [router, createI18n({ legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false })],
      stubs: { InstanceBrand: true, TermsOfServiceModal: true },
    },
  })
  await flushPromises()
  return wrapper
}

describe('home links on public pages lead to the marketing site', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    ['Legal', Legal, '/legal', '.back-link'],
    ['Privacy', Privacy, '/privacy', '.back-link'],
  ])('%s: "Back to home" points at COMPANY.website', async (_name, component, path, selector) => {
    const wrapper = await mountPage(component, path)

    expect(wrapper.find(selector).attributes('href')).toBe(COMPANY.website)
  })

  it.each([
    ['Register', Register, '/register'],
    ['PasswordReset', PasswordReset, '/password-reset'],
  ])('%s: the logo points at COMPANY.website', async (_name, component, path) => {
    const wrapper = await mountPage(component, path)

    expect(wrapper.find('.auth-brand a').attributes('href')).toBe(COMPANY.website)
  })

  it('public help: "Back to home" points at COMPANY.website', async () => {
    const wrapper = await mountPage(Help, '/help-public')

    expect(wrapper.find('.btn-back').attributes('href')).toBe(COMPANY.website)
  })
})
