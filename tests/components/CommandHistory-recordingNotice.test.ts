/**
 * The command-recording notice must not crowd out the history it introduces.
 *
 * The notice sits at the top of the history panel. Rendered in full by
 * default, its summary sentence took most of the panel and hid the commands
 * themselves. It is an RGPD transparency notice, so it stays visible as one
 * compact line (icon + short label) and its full text stays one click away:
 * a "Details" toggle reveals the summary, the details and the privacy link.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
  }),
}))

import CommandHistory from '../../src/components/Terminal/CommandHistory.vue'

const COLLAPSED_KEY = 'terminal_history_collapsed'

const EN_SUMMARY = 'Terminal commands are recorded for security auditing and pedagogy'
const FR_SUMMARY = 'Les commandes saisies dans le terminal sont enregistrées'
const EN_DETAILS = 'Recording serves two purposes'

let mounted: VueWrapper | null = null

function mountHistory(locale: 'en' | 'fr' = 'en') {
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
  setActivePinia(createPinia())

  // No sessionId: nothing is fetched, the panel renders its static parts only.
  // Attached to the document so isVisible() honours v-show's display: none.
  mounted = mount(CommandHistory, {
    attachTo: document.body,
    props: { isActive: false },
    global: {
      plugins: [i18n],
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a class="router-link-stub" :href="to"><slot /></a>',
        },
        BaseModal: true,
      },
    },
  })
  return mounted
}

describe('CommandHistory — the recording notice is compact by default', () => {
  beforeEach(() => {
    localStorage.clear()
    // The history itself is open, so only the notice's own state is under test.
    localStorage.setItem(COLLAPSED_KEY, 'false')
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = null
  })

  it('renders one short line with a collapsed Details toggle (EN)', () => {
    const wrapper = mountHistory('en')
    const notice = wrapper.find('[data-testid="recording-notice"]')

    expect(notice.exists(), 'expected the notice to carry data-testid="recording-notice"').toBe(true)
    expect(notice.isVisible()).toBe(true)
    expect(notice.find('.fa-shield-alt').exists(), 'the shield icon marks the notice').toBe(true)
    expect(notice.text()).toContain('Commands are recorded')

    const toggle = wrapper.find('[data-testid="recording-notice-toggle"]')
    expect(toggle.exists(), 'expected data-testid="recording-notice-toggle"').toBe(true)
    expect(toggle.text()).toContain('Details')
    expect(toggle.attributes('aria-expanded')).toBe('false')

    expect(notice.text(), 'the long summary hides the history when shown by default').not.toContain(EN_SUMMARY)
    expect(notice.text()).not.toContain(EN_DETAILS)
    expect(wrapper.find('[data-testid="recording-notice-details"]').exists()).toBe(false)
    expect(wrapper.find('a[href="/privacy"]').exists()).toBe(false)
  })

  it('renders the compact line in French', () => {
    const wrapper = mountHistory('fr')
    const notice = wrapper.find('[data-testid="recording-notice"]')

    expect(notice.exists()).toBe(true)
    expect(notice.text()).toContain('Commandes enregistrées')
    expect(wrapper.find('[data-testid="recording-notice-toggle"]').text()).toContain('Détails')
    expect(notice.text()).not.toContain(FR_SUMMARY)
  })

  it('reveals the summary, the details and the privacy link on toggle, and hides them again', async () => {
    const wrapper = mountHistory('en')
    const toggle = wrapper.find('[data-testid="recording-notice-toggle"]')
    expect(toggle.exists(), 'expected data-testid="recording-notice-toggle"').toBe(true)

    await toggle.trigger('click')

    expect(toggle.attributes('aria-expanded')).toBe('true')
    const details = wrapper.find('[data-testid="recording-notice-details"]')
    expect(details.exists(), 'expected data-testid="recording-notice-details" once expanded').toBe(true)
    expect(details.text()).toContain(EN_SUMMARY)
    expect(details.text()).toContain(EN_DETAILS)
    expect(details.find('a[href="/privacy"]').exists(), 'the privacy policy stays one click away').toBe(true)

    await toggle.trigger('click')

    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[data-testid="recording-notice-details"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain(EN_SUMMARY)
  })

  it('hides together with the history when the history is collapsed', () => {
    localStorage.setItem(COLLAPSED_KEY, 'true')
    const wrapper = mountHistory('en')
    const notice = wrapper.find('[data-testid="recording-notice"]')

    // Either not rendered or hidden: both keep it out of a collapsed panel.
    expect(notice.exists() && notice.isVisible()).toBe(false)
    expect(wrapper.text()).not.toContain('Commands are recorded')
  })
})
