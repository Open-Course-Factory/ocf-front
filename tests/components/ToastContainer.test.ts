/**
 * The house toast: polite live region, alert role on errors, title + message, translated close label.
 * App.vue mounts exactly one container, whatever the route.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ToastContainer from '../../src/components/UI/ToastContainer.vue'
import { useToast } from '../../src/composables/useToast'

vi.mock('vue-router', () => ({ useRoute: () => ({ name: 'Login' }) }))
vi.mock('../../src/stores/currentUser', () => ({ useCurrentUserStore: () => ({ isAuthenticated: false }) }))
vi.mock('../../src/stores/userSettings', () => ({ useUserSettingsStore: () => ({}) }))

import App from '../../src/App.vue'

function mountWith(locale: 'en' | 'fr') {
  const i18n = createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { en: {}, fr: {} } })
  return mount(ToastContainer, { global: { plugins: [i18n] } })
}

beforeEach(() => {
  const { toasts } = useToast()
  toasts.value.splice(0, toasts.value.length)
})

describe('ToastContainer', () => {
  it('is a polite live region, even with no toast on screen', () => {
    expect(mountWith('en').find('.ocf-toast-container').attributes('aria-live')).toBe('polite')
  })

  it('renders title and message, alert role for errors only', async () => {
    const { show } = useToast()
    show('Saved', 'success', 0, { title: 'Success', persistent: true })
    show('Refused', 'error', 0, { title: 'Error', persistent: true })
    const wrapper = mountWith('en')
    await wrapper.vm.$nextTick()

    const toasts = wrapper.findAll('.ocf-toast')
    expect(toasts).toHaveLength(2)
    expect(toasts[0].find('.toast-title').text()).toBe('Success')
    expect(toasts[0].find('.toast-message').text()).toBe('Saved')
    // the container's live region announces it: a role on an inserted node is often not read
    expect(toasts[0].attributes('role')).toBeUndefined()
    expect(toasts[1].attributes('role')).toBe('alert')
  })

  it.each([
    ['en', 'Close notification'],
    ['fr', 'Fermer la notification'],
  ] as const)('labels the close button in %s', async (locale, label) => {
    useToast().show('Hi', 'info', 0, { persistent: true })
    const wrapper = mountWith(locale)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.toast-close').attributes('aria-label')).toBe(label)
  })
})

describe('App', () => {
  it('mounts exactly one toast container next to the routed page', () => {
    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} } })
    const wrapper = mount(App, {
      global: { plugins: [i18n], stubs: { 'router-view': true } },
    })

    expect(wrapper.findAllComponents(ToastContainer)).toHaveLength(1)
  })
})
