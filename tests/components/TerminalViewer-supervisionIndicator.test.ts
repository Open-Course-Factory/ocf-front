/**
 * RED tests for the learner-side supervision indicator in the session title bar.
 *
 * BUG (original): the indicator was a `.supervision-banner` inserted as a FLOW
 * element above `.terminal-container`, shifting the terminal when supervision
 * toggled. It was moved into the title bar.
 *
 * OWNER PLACEMENT CORRECTION (this revision): the indicator sits in the CENTER of
 * the title bar and is layout-inert by ABSOLUTE CENTERING, NOT by a reserved slot.
 * The right-side control group (connection status / network / SessionCountdown /
 * buttons in `#headerActions`, and `.session-info` in the standalone header)
 * returns to EXACTLY its pre-chip composition — the chip is NOT a flow participant
 * anywhere in the header, and is NOT even a DOM descendant of the right group. The
 * previous reserved-slot machinery (`.supervision-slot` + `.supervision-slot-sizer`,
 * and the `SupervisionSlot` component) is REMOVED.
 *
 * WHERE THE USER SEES IT (primary path): the student session page
 *   /terminal-session/:id → TerminalSessionView → TerminalSessionPanel
 *   → TerminalViewer with `use-settings-card` + `supervision-enabled`.
 * `useSettingsCard` is true there, so the visible title bar is the SettingsCard
 * `.card-header`. The right group lives in the `#headerActions` slot; the centered
 * chip lives in a NEW `#headerCenter` slot that SettingsCard renders as a direct
 * child of `.card-header` (separate from `.header-actions`).
 *
 * ── CLASS / STRUCTURE CONTRACT pinned here (implement to this) ─────────────────
 *   • The indicator is a single element with class `.supervision-chip`, hosted by a
 *     dedicated centering wrapper `.supervision-center-anchor` (absolutely centered
 *     over the title bar — `position:absolute; left:50%; translateX(-50%)` or
 *     equivalent; the CSS centering itself is the dev's responsibility, verified by
 *     review — jsdom cannot measure pixels, so we pin the STRUCTURE).
 *   • Controlled state adds `.supervision-chip-controlled`; icon (👁 / ✋) and i18n
 *     text (terminal.supervisionWatched / terminal.supervisionControlled) unchanged.
 *   • ARIA on the chip: watched → role="status", aria-live="polite";
 *     controlled → role="alert", aria-live="assertive".
 *   • Placement of the centering wrapper (NEVER inside the right group):
 *       SettingsCard mode → passed via SettingsCard's `#headerCenter` slot (a direct
 *                           child of `.card-header`, NOT of `.header-actions`).
 *       standalone header → a direct child of `.terminal-header`, sibling to
 *                           `.session-info` / `.terminal-controls` (NOT inside
 *                           `.session-info`).
 *       overlay (showHeader=false) → UNCHANGED: `.supervision-chip.supervision-chip-overlay`
 *                           over the terminal; already absolute, no anchor needed.
 *   • RIGHT-GROUP PURITY: `#headerActions` (SettingsCard) and `.session-info`
 *     (standalone) contain NO supervision element (`.supervision-chip`,
 *     `.supervision-center-anchor`, `.supervision-slot*`) in ANY state.
 *   • REMOVED entirely: `.supervision-banner`, `has-supervision-banner` on
 *     `.terminal-container`, and the reserved-slot machinery
 *     (`.supervision-slot`, `.supervision-slot-sizer`). None appear anywhere.
 *   • The chip is only rendered (inside the anchor) when active; idle → no chip and
 *     no live region (AT hears nothing). Because the anchor is out of flow, its
 *     appearance/disappearance never displaces a control.
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

// SettingsCard stub with the header split into TWO distinct, queryable regions:
//   .header-center-stub  ← the NEW `#headerCenter` slot (centered over the card
//                          header) where the supervision anchor must land;
//   .header-actions-stub ← the existing `#headerActions` slot: the right-side
//                          control group whose purity the owner requires.
// This pins the contract that SettingsCard exposes a `#headerCenter` slot and that
// the chip lives there, never among the right-group controls.
const SettingsCardStub = {
  template: '<div class="settings-card-stub"><div class="card-header-stub"><div class="header-center-stub"><slot name="headerCenter" /></div><div class="header-actions-stub"><slot name="headerActions" /></div></div><div class="card-body-stub"><slot /></div></div>'
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

// Any element that is a supervision indicator (chip, its centering wrapper, or the
// now-removed slot machinery) — used to assert the right group is pure.
const SUPERVISION_SELECTOR = '.supervision-chip, .supervision-center-anchor, .supervision-slot, .supervision-slot-sizer'

describe('TerminalViewer — supervision indicator centered in the title bar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── PRIMARY: student session page (SettingsCard). Chip centered via #headerCenter,
  //    right group (#headerActions) pure. ──
  describe('SettingsCard mode (student session page) — chip centered, right group pure', () => {
    it('renders the watched chip in the centered #headerCenter wrapper (NOT in #headerActions)', async () => {
      const wrapper = mountViewer({ useSettingsCard: true })
      await setSupervision(wrapper, { watched: true })

      // Chip lives in the centered wrapper in the card header.
      const anchor = wrapper.find('.header-center-stub .supervision-center-anchor')
      expect(anchor.exists()).toBe(true)
      const chip = anchor.find('.supervision-chip')
      expect(chip.exists()).toBe(true)
      expect(chip.text()).toContain(WATCHED_TEXT)
      expect(chip.text()).toContain('👁')
      expect(chip.classes()).not.toContain('supervision-chip-controlled')
      expect(chip.attributes('role')).toBe('status')
      expect(chip.attributes('aria-live')).toBe('polite')
      // The standalone header does NOT exist on this path.
      expect(wrapper.find('.terminal-header').exists()).toBe(false)
    })

    it('keeps the right group pure: #headerActions still has connection status + network, and NO supervision element', async () => {
      const wrapper = mountViewer({ useSettingsCard: true })

      for (const s of [{}, { watched: true }, { watched: true, controlled: true }]) {
        await setSupervision(wrapper, s)
        const actions = wrapper.find('.header-actions-stub')
        // The pre-chip right group is intact...
        expect(actions.find('.connection-status').exists()).toBe(true)
        expect(actions.find('.network-indicator').exists()).toBe(true)
        // ...and carries NO supervision indicator in any state (the owner's complaint).
        expect(actions.find(SUPERVISION_SELECTOR).exists()).toBe(false)
      }
    })

    it('keeps the SessionCountdown timer in the right group, with the chip in the centered wrapper', async () => {
      const wrapper = mountViewer({ useSettingsCard: true })
      await setSupervision(wrapper, { watched: true })

      const actions = wrapper.find('.header-actions-stub')
      expect(actions.findComponent({ name: 'SessionCountdown' }).exists()).toBe(true)
      expect(actions.find('.supervision-chip').exists()).toBe(false)
      expect(wrapper.find('.header-center-stub .supervision-chip').exists()).toBe(true)
    })

    it('renders the controlled chip variant in the centered wrapper with alert/assertive aria', async () => {
      const wrapper = mountViewer({ useSettingsCard: true })
      await setSupervision(wrapper, { watched: true, controlled: true })

      const chip = wrapper.find('.header-center-stub .supervision-center-anchor .supervision-chip')
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

    it('renders no chip when supervision is enabled but the session is neither watched nor controlled', async () => {
      const wrapper = mountViewer({ useSettingsCard: true })
      await setSupervision(wrapper, {})
      expect(wrapper.find('.supervision-chip').exists()).toBe(false)
    })
  })

  // ── SECONDARY: pages that render the standalone .terminal-header ──
  describe('standalone mode, showHeader=true — chip centered in .terminal-header', () => {
    it('renders the watched chip in a centering anchor that is a child of .terminal-header, not of .session-info', async () => {
      const wrapper = mountViewer()
      await setSupervision(wrapper, { watched: true })

      const anchor = wrapper.find('.terminal-header .supervision-center-anchor')
      expect(anchor.exists()).toBe(true)
      // The anchor must NOT be inside the right-side info group.
      expect(wrapper.find('.session-info .supervision-center-anchor').exists()).toBe(false)
      expect(wrapper.find('.session-info .supervision-chip').exists()).toBe(false)

      const chip = anchor.find('.supervision-chip')
      expect(chip.exists()).toBe(true)
      expect(chip.text()).toContain(WATCHED_TEXT)
      expect(chip.text()).toContain('👁')
      expect(chip.attributes('role')).toBe('status')
      expect(chip.attributes('aria-live')).toBe('polite')
    })

    it('renders the controlled chip variant in the anchor with alert/assertive aria', async () => {
      const wrapper = mountViewer()
      await setSupervision(wrapper, { watched: true, controlled: true })

      const chip = wrapper.find('.terminal-header .supervision-center-anchor .supervision-chip')
      expect(chip.exists()).toBe(true)
      expect(chip.classes()).toContain('supervision-chip-controlled')
      expect(chip.attributes('role')).toBe('alert')
      expect(chip.attributes('aria-live')).toBe('assertive')
    })

    it('keeps .session-info pure: no supervision element there in any state', async () => {
      const wrapper = mountViewer()

      for (const s of [{}, { watched: true }, { watched: true, controlled: true }]) {
        await setSupervision(wrapper, s)
        expect(wrapper.find('.session-info').exists()).toBe(true)
        expect(wrapper.find('.session-info').find(SUPERVISION_SELECTOR).exists()).toBe(false)
      }
    })

    it('flips the SAME chip from watched to controlled live (no remount) — aria/text/icon all update', async () => {
      const wrapper = mountViewer()

      await setSupervision(wrapper, { watched: true })
      const watchedChip = wrapper.find('.terminal-header .supervision-chip')
      expect(watchedChip.exists()).toBe(true)
      expect(watchedChip.attributes('role')).toBe('status')
      expect(watchedChip.attributes('aria-live')).toBe('polite')
      expect(watchedChip.text()).toContain(WATCHED_TEXT)
      expect(watchedChip.text()).toContain('👁')

      // Trainer takes the hand on the already-mounted, already-watched session.
      await setSupervision(wrapper, { watched: true, controlled: true })

      const controlledChip = wrapper.find('.terminal-header .supervision-chip')
      // Same DOM node upgraded in place (no :key remount) — the live-region update
      // is what a screen reader announces assertively.
      expect(controlledChip.element).toBe(watchedChip.element)
      expect(controlledChip.classes()).toContain('supervision-chip-controlled')
      expect(controlledChip.attributes('role')).toBe('alert')
      expect(controlledChip.attributes('aria-live')).toBe('assertive')
      expect(controlledChip.text()).toContain(CONTROLLED_TEXT)
      expect(controlledChip.text()).toContain('✋')
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

  // ── Reserved-slot machinery is GONE, and idle is AT-silent everywhere ──
  describe('reserved-slot machinery removed + idle AT-silence', () => {
    it('renders NO .supervision-slot or .supervision-slot-sizer anywhere, in any state (SettingsCard)', async () => {
      const wrapper = mountViewer({ useSettingsCard: true })

      for (const s of [{}, { watched: true }, { watched: true, controlled: true }]) {
        await setSupervision(wrapper, s)
        expect(wrapper.find('.supervision-slot').exists()).toBe(false)
        expect(wrapper.find('.supervision-slot-sizer').exists()).toBe(false)
      }
    })

    it('renders NO .supervision-slot or .supervision-slot-sizer anywhere, in any state (standalone)', async () => {
      const wrapper = mountViewer()

      for (const s of [{}, { watched: true }, { watched: true, controlled: true }]) {
        await setSupervision(wrapper, s)
        expect(wrapper.find('.supervision-slot').exists()).toBe(false)
        expect(wrapper.find('.supervision-slot-sizer').exists()).toBe(false)
      }
    })

    it('idle announces nothing to AT: no chip and no live region anywhere (SettingsCard)', async () => {
      const wrapper = mountViewer({ useSettingsCard: true })
      await setSupervision(wrapper, {})

      expect(wrapper.find('.supervision-chip').exists()).toBe(false)
      // No status/alert live region present while idle (an empty one would announce
      // silence). The right group and centered wrapper both carry nothing.
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })

    it('idle announces nothing to AT: no chip and no live region anywhere (standalone)', async () => {
      const wrapper = mountViewer()
      await setSupervision(wrapper, {})

      expect(wrapper.find('.supervision-chip').exists()).toBe(false)
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  describe('no supervision — nothing renders (zero input)', () => {
    it('renders neither chip nor anchor nor slot nor banner when supervision is off and idle', async () => {
      const wrapper = mountViewer({ useSettingsCard: true, supervisionEnabled: false })
      await nextTick()

      expect(wrapper.find('.supervision-chip').exists()).toBe(false)
      expect(wrapper.find('.supervision-center-anchor').exists()).toBe(false)
      expect(wrapper.find('.supervision-slot').exists()).toBe(false)
      expect(wrapper.find('.supervision-banner').exists()).toBe(false)
      expect(wrapper.find('.terminal-container').classes()).not.toContain('has-supervision-banner')
    })
  })
})
