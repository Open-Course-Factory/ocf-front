/**
 * Learner-side supervision indicator placement.
 *
 * The chip is an absolute overlay at the terminal's top-right corner, in every
 * mode (SettingsCard, standalone with or without header). It used to be centered
 * in the title bar, where on narrow screens it covered the header controls
 * (Ports chip, countdown…). Pinned here: the chip lives inside `.terminal-wrapper`
 * as `.supervision-chip-overlay`, never in a title bar; idle renders nothing.
 *
 * Supervision state is driven directly through the internal `supervisionState` ref
 * (its flip logic is covered by supervisionControlFrame / supervisionMessageHandler
 * tests); these tests assert the resulting DOM.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { sessionId: 'sess-test' }, query: {} }),
  useRouter: () => ({ push: vi.fn() }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn()
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ secretToken: 'tok' })
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
    showConfirm: vi.fn().mockResolvedValue(true)
  })
}))

vi.mock('../../src/services/domain/terminal/terminalService', () => ({
  terminalService: { syncSession: vi.fn().mockResolvedValue({}) }
}))

vi.mock('@xterm/xterm', () => ({ Terminal: class { open() {} loadAddon() {} attachCustomKeyEventHandler() {} dispose() {} onResize() {} onData() { return { dispose() {} } } focus() {} reset() {} write() {} paste() {} cols = 80; rows = 24; element = null } }))
vi.mock('@xterm/addon-fit', () => ({ FitAddon: class { fit() {} dispose() {} } }))

import TerminalViewer from '../../src/components/Terminal/TerminalViewer.vue'

const WATCHED_TEXT = 'A trainer is watching this session'
const CONTROLLED_TEXT = 'A trainer is typing in your terminal'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
      en: { terminal: { supervisionWatched: WATCHED_TEXT, supervisionControlled: CONTROLLED_TEXT } },
      fr: {}
    },
    missingWarn: false,
    fallbackWarn: false
  })
}

const SettingsCardStub = {
  template: '<div class="settings-card-stub"><div class="card-header-stub"><slot name="headerActions" /></div><div class="card-body-stub"><slot /></div></div>'
}

function mountViewer(props: Record<string, unknown> = {}) {
  setActivePinia(createPinia())
  return mount(TerminalViewer, {
    props: {
      sessionInfo: { session_id: 'sess-test', state: 'running', expires_at: '2999-01-01T00:00:00Z' },
      autoConnect: false,
      ...props
    },
    global: {
      plugins: [createTestI18n()],
      stubs: {
        SettingsCard: SettingsCardStub,
        Button: true,
        RecordingIndicator: true,
        SessionCountdown: true,
        TerminalEndStateOverlay: true
      }
    }
  })
}

// Drive the internal supervisionState ref. Assigning through setupState sets the
// ref's .value (Vue's setupState proxy forwards writes to the underlying ref), so
// the chip computed re-evaluates. The flip logic itself is tested elsewhere.
async function setSupervision(
  wrapper: ReturnType<typeof mountViewer>,
  s: { watched?: boolean; controlled?: boolean } = {}
) {
  ;(wrapper.vm as any).$.setupState.supervisionState = {
    watched: false,
    controlled: false,
    observers: 0,
    ended: false,
    ...s
  }
  await nextTick()
}

const MODES: Array<[string, Record<string, unknown>, string | null]> = [
  ['SettingsCard (student session page)', { useSettingsCard: true }, '.card-header-stub'],
  ['standalone with header', {}, '.terminal-header'],
  ['standalone without header', { showHeader: false }, null]
]

describe('TerminalViewer — supervision indicator overlays the terminal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe.each(MODES)('%s', (_name, props, headerSelector) => {
    it('renders the watched chip as an overlay inside the terminal, not in the title bar', async () => {
      const wrapper = mountViewer(props)
      await setSupervision(wrapper, { watched: true })

      const chip = wrapper.find('.terminal-wrapper > .supervision-chip.supervision-chip-overlay')
      expect(chip.exists()).toBe(true)
      expect(chip.text()).toContain(WATCHED_TEXT)
      expect(chip.text()).toContain('👁')
      expect(chip.classes()).not.toContain('supervision-chip-controlled')
      expect(chip.attributes('role')).toBe('status')
      expect(chip.attributes('aria-live')).toBe('polite')
      if (headerSelector) {
        expect(wrapper.find(headerSelector).exists()).toBe(true)
        expect(wrapper.find(headerSelector).find('.supervision-chip').exists()).toBe(false)
      }
    })

    it('flips the SAME chip from watched to controlled live (no remount)', async () => {
      const wrapper = mountViewer(props)
      await setSupervision(wrapper, { watched: true })
      const watchedChip = wrapper.find('.supervision-chip')

      await setSupervision(wrapper, { watched: true, controlled: true })
      const controlledChip = wrapper.find('.supervision-chip')
      // Same DOM node upgraded in place — the live-region update is what a screen
      // reader announces assertively.
      expect(controlledChip.element).toBe(watchedChip.element)
      expect(controlledChip.classes()).toContain('supervision-chip-controlled')
      expect(controlledChip.attributes('role')).toBe('alert')
      expect(controlledChip.attributes('aria-live')).toBe('assertive')
      expect(controlledChip.text()).toContain(CONTROLLED_TEXT)
      expect(controlledChip.text()).toContain('✋')
    })

    it('idle announces nothing to AT: no chip and no live region', async () => {
      const wrapper = mountViewer(props)
      await setSupervision(wrapper, {})

      expect(wrapper.find('.supervision-chip').exists()).toBe(false)
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })
})
