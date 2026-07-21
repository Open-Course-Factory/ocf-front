/**
 * RED tests for relocating the learner-side supervision indicator into the
 * session title bar (user-reported UX bug).
 *
 * BUG: the "a trainer is watching / has taken control" indicator is currently a
 * `.supervision-banner` inserted as a FLOW element inside `.terminal-wrapper`,
 * ABOVE `.terminal-container` (which gets a `has-supervision-banner` class that
 * shrinks it). When supervision starts or stops, the banner appears/disappears in
 * the layout flow and the terminal jumps down/up — a visible flicker. The markup
 * is duplicated across BOTH TerminalViewer render branches (SettingsCard mode
 * ~L90-99 and standalone mode ~L200-209).
 *
 * WHERE THE USER SEES IT (the primary path): the student session page
 *   route /terminal-session/:id → TerminalSessionView → TerminalSessionPanel
 *   → TerminalViewer with `use-settings-card` + `supervision-enabled`.
 * On that path `useSettingsCard` is true, so the standalone `.terminal-header` is
 * NOT rendered — the visible "title bar" is TerminalViewer's SettingsCard
 * `#headerActions` region, which already hosts the connection-status badge, the
 * internet/network badge and the SessionCountdown timer. The indicator chip must
 * sit THERE, beside those elements. (The plain `.terminal-header` variant still
 * applies to pages that render it; the no-header overlay arm to paths with
 * neither.)
 *
 * ── CLASS / STRUCTURE CONTRACT pinned here (implement to this) ─────────────────
 *   • The indicator is a single element with class `.supervision-chip`.
 *   • Controlled state adds the modifier class `.supervision-chip-controlled`
 *     (watched state has the base class only).
 *   • ARIA semantics are preserved from the old banner, on the chip element:
 *       watched    → role="status", aria-live="polite"
 *       controlled → role="alert",  aria-live="assertive"
 *   • The icon (👁 watched / ✋ controlled) and the i18n text
 *     (terminal.supervisionWatched / terminal.supervisionControlled) are unchanged.
 *   • Placement:
 *       SettingsCard mode (student page) → chip lives in the SettingsCard
 *                                          `#headerActions` region, beside the
 *                                          connection-status / network / countdown.
 *       standalone, showHeader=true      → chip is a DESCENDANT of `.terminal-header`.
 *       standalone, showHeader=false     → chip is an OVERLAY: it additionally
 *                                          carries `.supervision-chip-overlay` and is
 *                                          NOT inside any header (there is none).
 *   • REMOVED entirely: the `.supervision-banner` element and the
 *     `has-supervision-banner` class on `.terminal-container` (the layout-shift
 *     vectors). Neither must appear in any state, in any branch.
 *
 * The chip is only rendered when `supervisionEnabled` AND the session is watched or
 * controlled — driven by the internal `supervisionState` ref (whose flip logic is
 * already covered by supervisionControlFrame.test.ts / supervisionMessageHandler
 * .test.ts). These tests drive that ref directly and assert the resulting DOM.
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

vi.mock('@xterm/xterm', () => ({ Terminal: class { open() {} loadAddon() {} dispose() {} onResize() {} onData() { return { dispose() {} } } focus() {} reset() {} write() {} paste() {} cols = 80; rows = 24; element = null } }))
vi.mock('@xterm/addon-fit', () => ({ FitAddon: class { fit() {} dispose() {} } }))
vi.mock('@xterm/addon-attach', () => ({ AttachAddon: class { dispose() {} } }))

import TerminalViewer from '../../src/components/Terminal/TerminalViewer.vue'

const WATCHED_TEXT = 'A trainer is watching this session'
const CONTROLLED_TEXT = 'A trainer has taken control of this session'

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

// A settings-card stub that keeps the header slot and body slot in distinct,
// queryable regions so we can assert the chip lands in the header (title bar),
// not the terminal body — the crux of the fix.
const SettingsCardStub = {
  template: '<div class="settings-card-stub"><div class="header-actions-stub"><slot name="headerActions" /></div><div class="card-body-stub"><slot /></div></div>'
}

function mountViewer(props: Record<string, unknown> = {}) {
  setActivePinia(createPinia())
  return mount(TerminalViewer, {
    props: {
      sessionInfo: { session_id: 'sess-test', state: 'running', expires_at: '2999-01-01T00:00:00Z' },
      autoConnect: false,
      supervisionEnabled: true,
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
// the chip computed re-evaluates. The flip logic itself is tested elsewhere — here
// we only need the resulting indicator state to assert the DOM.
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

describe('TerminalViewer — supervision indicator in the title bar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── PRIMARY: the student session page (TerminalSessionPanel → use-settings-card) ──
  describe('SettingsCard mode (student session page) — chip in the card title bar', () => {
    it('renders the watched chip in #headerActions, beside the connection status, with icon/text/status aria', async () => {
      const wrapper = mountViewer({ useSettingsCard: true })
      await setSupervision(wrapper, { watched: true })

      const header = wrapper.find('.header-actions-stub')
      expect(header.exists()).toBe(true)
      // The title bar the user sees: connection status + network badge live here...
      expect(header.find('.connection-status').exists()).toBe(true)
      expect(header.find('.network-indicator').exists()).toBe(true)
      // ...and the supervision chip must sit alongside them, in the same header.
      const chip = header.find('.supervision-chip')
      expect(chip.exists()).toBe(true)
      expect(chip.text()).toContain(WATCHED_TEXT)
      expect(chip.text()).toContain('👁')
      expect(chip.classes()).not.toContain('supervision-chip-controlled')
      expect(chip.attributes('role')).toBe('status')
      expect(chip.attributes('aria-live')).toBe('polite')
      // The standalone header does NOT exist on this path.
      expect(wrapper.find('.terminal-header').exists()).toBe(false)
    })

    it('sits in the same title bar as the SessionCountdown timer', async () => {
      const wrapper = mountViewer({ useSettingsCard: true })
      await setSupervision(wrapper, { watched: true })

      const header = wrapper.find('.header-actions-stub')
      // The countdown timer renders in this region when the session has an expiry.
      expect(header.findComponent({ name: 'SessionCountdown' }).exists()).toBe(true)
      expect(header.find('.supervision-chip').exists()).toBe(true)
    })

    it('renders the controlled chip variant in #headerActions with alert/assertive aria', async () => {
      const wrapper = mountViewer({ useSettingsCard: true })
      await setSupervision(wrapper, { watched: true, controlled: true })

      const chip = wrapper.find('.header-actions-stub .supervision-chip')
      expect(chip.exists()).toBe(true)
      expect(chip.classes()).toContain('supervision-chip-controlled')
      expect(chip.text()).toContain(CONTROLLED_TEXT)
      expect(chip.text()).toContain('✋')
      expect(chip.attributes('role')).toBe('alert')
      expect(chip.attributes('aria-live')).toBe('assertive')
    })

    it('does not shift the terminal: no .supervision-banner and no has-supervision-banner in any state', async () => {
      const wrapper = mountViewer({ useSettingsCard: true })

      for (const s of [{}, { watched: true }, { watched: true, controlled: true }]) {
        await setSupervision(wrapper, s)
        expect(wrapper.find('.supervision-banner').exists()).toBe(false)
        expect(wrapper.find('.terminal-container').classes()).not.toContain('has-supervision-banner')
      }
    })

    it('keeps the title bar present and the chip out of it until supervision starts (no flow shift)', async () => {
      const wrapper = mountViewer({ useSettingsCard: true })

      // Idle: the title bar exists (stable chip host), no chip yet, no banner.
      await setSupervision(wrapper, {})
      expect(wrapper.find('.header-actions-stub').exists()).toBe(true)
      expect(wrapper.find('.supervision-chip').exists()).toBe(false)
      expect(wrapper.find('.supervision-banner').exists()).toBe(false)

      // Watched: chip appears INSIDE the title bar, still no flow banner.
      await setSupervision(wrapper, { watched: true })
      expect(wrapper.find('.header-actions-stub .supervision-chip').exists()).toBe(true)
      expect(wrapper.find('.supervision-banner').exists()).toBe(false)
    })

    it('renders no chip when supervision is enabled but the session is neither watched nor controlled', async () => {
      const wrapper = mountViewer({ useSettingsCard: true })
      await setSupervision(wrapper, {})
      expect(wrapper.find('.supervision-chip').exists()).toBe(false)
    })
  })

  // ── SECONDARY: pages that DO render the standalone .terminal-header ──
  describe('standalone mode, showHeader=true — chip lives in .terminal-header', () => {
    it('renders the watched chip inside .terminal-header with status/polite aria', async () => {
      const wrapper = mountViewer()
      await setSupervision(wrapper, { watched: true })

      const chip = wrapper.find('.terminal-header .supervision-chip')
      expect(chip.exists()).toBe(true)
      expect(chip.text()).toContain(WATCHED_TEXT)
      expect(chip.text()).toContain('👁')
      expect(chip.attributes('role')).toBe('status')
      expect(chip.attributes('aria-live')).toBe('polite')
    })

    it('renders the controlled chip variant inside .terminal-header with alert/assertive aria', async () => {
      const wrapper = mountViewer()
      await setSupervision(wrapper, { watched: true, controlled: true })

      const chip = wrapper.find('.terminal-header .supervision-chip')
      expect(chip.exists()).toBe(true)
      expect(chip.classes()).toContain('supervision-chip-controlled')
      expect(chip.attributes('role')).toBe('alert')
      expect(chip.attributes('aria-live')).toBe('assertive')
    })

    it('never renders a .supervision-banner or has-supervision-banner across none↔watched↔controlled', async () => {
      const wrapper = mountViewer()

      for (const s of [{}, { watched: true }, { watched: true, controlled: true }]) {
        await setSupervision(wrapper, s)
        expect(wrapper.find('.supervision-banner').exists()).toBe(false)
        expect(wrapper.find('.terminal-container').classes()).not.toContain('has-supervision-banner')
      }
    })

    it('renders no chip when supervision is disabled even if a watched state leaks in', async () => {
      const wrapper = mountViewer({ supervisionEnabled: false })
      await setSupervision(wrapper, { watched: true })
      expect(wrapper.find('.supervision-chip').exists()).toBe(false)
    })
  })

  // ── FALLBACK: standalone with no header at all — RGPD indicator must survive ──
  describe('standalone mode, showHeader=false — chip becomes an overlay', () => {
    it('still renders the watched indicator as an overlay chip (not a flow banner), with no header', async () => {
      const wrapper = mountViewer({ showHeader: false })
      await setSupervision(wrapper, { watched: true })

      expect(wrapper.find('.terminal-header').exists()).toBe(false)
      const chip = wrapper.find('.supervision-chip')
      expect(chip.exists()).toBe(true)
      expect(chip.classes()).toContain('supervision-chip-overlay')
      expect(chip.text()).toContain(WATCHED_TEXT)
      expect(wrapper.find('.supervision-banner').exists()).toBe(false)
      expect(wrapper.find('.terminal-container').classes()).not.toContain('has-supervision-banner')
    })

    it('renders the controlled overlay chip with assertive aria when there is no header', async () => {
      const wrapper = mountViewer({ showHeader: false })
      await setSupervision(wrapper, { watched: true, controlled: true })

      const chip = wrapper.find('.supervision-chip')
      expect(chip.exists()).toBe(true)
      expect(chip.classes()).toContain('supervision-chip-overlay')
      expect(chip.classes()).toContain('supervision-chip-controlled')
      expect(chip.attributes('role')).toBe('alert')
      expect(chip.attributes('aria-live')).toBe('assertive')
    })
  })

  describe('no supervision — nothing renders (zero input)', () => {
    it('renders neither chip nor banner nor container class when supervision is off and idle', async () => {
      const wrapper = mountViewer({ useSettingsCard: true, supervisionEnabled: false })
      await nextTick()

      expect(wrapper.find('.supervision-chip').exists()).toBe(false)
      expect(wrapper.find('.supervision-banner').exists()).toBe(false)
      expect(wrapper.find('.terminal-container').classes()).not.toContain('has-supervision-banner')
    })
  })
})
