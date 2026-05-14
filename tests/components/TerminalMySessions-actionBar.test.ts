/**
 * Tests for the 3-button action bar (Play / Stop / Trash) on the
 * TerminalMySessions page. Focuses on user-visible behavior:
 *   - Which buttons appear for each session state
 *   - Trash confirmation actually triggers terminalService.deleteSession
 *   - Cancelling the trash confirmation does NOT call deleteSession
 *   - Backward compatibility with sessions that lack the new `state` field
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

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

// terminalService is the source of truth for action calls
const mockStopSession = vi.fn()
const mockStartSession = vi.fn()
const mockDeleteSession = vi.fn()
vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: {
    stopSession: (...args: any[]) => mockStopSession(...args),
    startSession: (...args: any[]) => mockStartSession(...args),
    deleteSession: (...args: any[]) => mockDeleteSession(...args),
    getDistributions: vi.fn().mockResolvedValue([])
  }
}))

// Notification confirms are not used by the trash flow, but the page imports
// useNotification for legacy paths (discardTerminal, hideAllInactiveSessions)
// `showError` is spied so failure-path tests can assert a notification fired.
const mockShowError = vi.fn()
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: vi.fn().mockResolvedValue(true),
    showError: (...args: any[]) => mockShowError(...args),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
    showMessage: vi.fn(),
    showAlert: vi.fn(),
    showPrompt: vi.fn()
  })
}))

vi.mock('../../src/composables/useFormatters', () => ({
  useFormatters: () => ({
    formatDateTime: (s: string) => s
  })
}))

vi.mock('../../src/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    isEnabled: () => false
  })
}))

vi.mock('../../src/stores/classGroups', () => ({
  useClassGroupsStore: () => ({
    entities: [],
    loadEntities: vi.fn()
  })
}))

import axios from 'axios'
import TerminalMySessions from '../../src/components/Pages/TerminalMySessions.vue'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

type SessionFixture = {
  id: string
  session_id: string
  status?: string
  state?: 'running' | 'stopped' | 'deleted'
  idle_until?: string
  expires_at?: string
  name?: string
  // persistence_mode='persistent' enables the Stop button; default
  // (undefined) treats the session as ephemeral and disables Stop.
  persistence_mode?: 'ephemeral' | 'persistent'
}

function mountPage(sessions: SessionFixture[]) {
  setActivePinia(createPinia())
  ;(axios.get as any).mockResolvedValue({ data: sessions })
  ;(axios.post as any).mockResolvedValue({ data: {} })
  ;(axios.delete as any).mockResolvedValue({ data: {} })
  return mount(TerminalMySessions, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        // Avoid pulling vue-router into the test setup
        'router-link': {
          props: ['to'],
          template: '<a class="router-link-stub"><slot /></a>'
        },
        ErrorAlert: true
      }
    }
  })
}

describe('TerminalMySessions — 3-button action bar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('button visibility per state', () => {
    it('running → shows Stop and Trash, hides Play', async () => {
      const wrapper = mountPage([
        { id: 'a', session_id: 'sess-running', state: 'running' }
      ])
      await flushPromises()

      expect(wrapper.find('[data-testid="btn-start-sess-running"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="btn-stop-sess-running"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="btn-trash-sess-running"]').exists()).toBe(true)
    })

    it('stopped → shows Play and Trash, hides Stop', async () => {
      const wrapper = mountPage([
        { id: 'b', session_id: 'sess-stopped', state: 'stopped' }
      ])
      await flushPromises()

      expect(wrapper.find('[data-testid="btn-start-sess-stopped"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="btn-stop-sess-stopped"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="btn-trash-sess-stopped"]').exists()).toBe(true)
    })

    it('deleted → all primary actions hidden (session lives in inactive list)', async () => {
      const wrapper = mountPage([
        { id: 'c', session_id: 'sess-deleted', state: 'deleted' }
      ])
      await flushPromises()

      expect(wrapper.find('[data-testid="btn-start-sess-deleted"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="btn-stop-sess-deleted"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="btn-trash-sess-deleted"]').exists()).toBe(false)
    })
  })

  describe('missing state field (post MR !239: legacy `status` parallel field was removed)', () => {
    it('row with no `state` defaults to deleted — no action buttons rendered', async () => {
      const wrapper = mountPage([
        { id: 'd', session_id: 'sess-no-state' }
      ])
      await flushPromises()

      // Without a `state` value, getEffectiveSessionState falls through to
      // 'deleted'. The legacy `status` fallback was removed in MR !239, so
      // there is nothing left to rescue the row.
      expect(wrapper.find('[data-testid="btn-stop-sess-no-state"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="btn-start-sess-no-state"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="btn-trash-sess-no-state"]').exists()).toBe(false)
    })
  })

  describe('expires_at invariant (defensive)', () => {
    it('state="running" but expires_at in the past → treated as deleted (no primary actions)', async () => {
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const wrapper = mountPage([
        { id: 'k', session_id: 'sess-stale-running', state: 'running', expires_at: pastDate }
      ])
      await flushPromises()

      expect(wrapper.find('[data-testid="btn-stop-sess-stale-running"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="btn-start-sess-stale-running"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="btn-trash-sess-stale-running"]').exists()).toBe(false)
    })
  })

  describe('trash confirmation', () => {
    it('clicking trash opens a confirmation modal but does not call deleteSession yet', async () => {
      const wrapper = mountPage([
        { id: 'f', session_id: 'sess-running', state: 'running' }
      ])
      await flushPromises()

      await wrapper.find('[data-testid="btn-trash-sess-running"]').trigger('click')

      // Modal opens
      expect(wrapper.find('[data-testid="confirm-delete-cta"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="cancel-delete-cta"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="delete-warning"]').exists()).toBe(true)

      // No delete fired yet
      expect(mockDeleteSession).not.toHaveBeenCalled()
    })

    it('cancelling the modal does NOT call deleteSession', async () => {
      const wrapper = mountPage([
        { id: 'g', session_id: 'sess-running', state: 'running' }
      ])
      await flushPromises()

      await wrapper.find('[data-testid="btn-trash-sess-running"]').trigger('click')
      await wrapper.find('[data-testid="cancel-delete-cta"]').trigger('click')
      await flushPromises()

      expect(mockDeleteSession).not.toHaveBeenCalled()
      // Modal should be closed
      expect(wrapper.find('[data-testid="confirm-delete-cta"]').exists()).toBe(false)
    })

    it('confirming the modal calls terminalService.deleteSession with the session id', async () => {
      mockDeleteSession.mockResolvedValueOnce({})
      const wrapper = mountPage([
        { id: 'h', session_id: 'sess-running', state: 'running' }
      ])
      await flushPromises()

      await wrapper.find('[data-testid="btn-trash-sess-running"]').trigger('click')
      await wrapper.find('[data-testid="confirm-delete-cta"]').trigger('click')
      await flushPromises()

      expect(mockDeleteSession).toHaveBeenCalledTimes(1)
      expect(mockDeleteSession).toHaveBeenCalledWith('sess-running')
    })
  })

  describe('start / stop wiring', () => {
    it('clicking Stop on a running persistent session calls terminalService.stopSession', async () => {
      mockStopSession.mockResolvedValueOnce({})
      // Stop only makes sense for persistent sessions (Stop preserves the disk);
      // ephemeral sessions render the button as disabled — see ephemeral test below.
      const wrapper = mountPage([
        { id: 'i', session_id: 'sess-running', state: 'running', persistence_mode: 'persistent' }
      ])
      await flushPromises()

      await wrapper.find('[data-testid="btn-stop-sess-running"]').trigger('click')
      await flushPromises()

      expect(mockStopSession).toHaveBeenCalledWith('sess-running')
      expect(mockStartSession).not.toHaveBeenCalled()
      expect(mockDeleteSession).not.toHaveBeenCalled()
    })

    it('clicking Play on a stopped session calls terminalService.startSession', async () => {
      mockStartSession.mockResolvedValueOnce({})
      const wrapper = mountPage([
        { id: 'j', session_id: 'sess-stopped', state: 'stopped' }
      ])
      await flushPromises()

      await wrapper.find('[data-testid="btn-start-sess-stopped"]').trigger('click')
      await flushPromises()

      expect(mockStartSession).toHaveBeenCalledWith('sess-stopped')
      expect(mockStopSession).not.toHaveBeenCalled()
      expect(mockDeleteSession).not.toHaveBeenCalled()
    })
  })

  // Stop on an ephemeral session is meaningless — there is no persistent disk
  // to preserve, so the affordance is rendered but disabled (grayed) with a
  // tooltip explaining "use Destroy instead". The button must stay visible
  // (NOT hidden) so the user can hover-discover the tooltip.
  describe('Stop button is disabled (not hidden) for ephemeral sessions', () => {
    it('running ephemeral session → Stop button visible but disabled', async () => {
      const wrapper = mountPage([
        // No persistence_mode set → defaults to ephemeral semantics
        { id: 'eph', session_id: 'sess-eph', state: 'running' }
      ])
      await flushPromises()

      const stopBtn = wrapper.find('[data-testid="btn-stop-sess-eph"]')
      expect(stopBtn.exists()).toBe(true)
      expect((stopBtn.element as HTMLButtonElement).disabled).toBe(true)
    })

    it('running ephemeral session → clicking disabled Stop does NOT call stopSession', async () => {
      const wrapper = mountPage([
        { id: 'eph2', session_id: 'sess-eph2', state: 'running', persistence_mode: 'ephemeral' }
      ])
      await flushPromises()

      // Trigger the click — disabled buttons do not fire DOM events in real
      // browsers, but JSDOM dispatches them anyway. The handler's no-op via
      // :disabled is what we're asserting, not the platform's gating.
      await wrapper.find('[data-testid="btn-stop-sess-eph2"]').trigger('click')
      await flushPromises()

      expect(mockStopSession).not.toHaveBeenCalled()
    })

    it('running persistent session → Stop button visible AND enabled', async () => {
      const wrapper = mountPage([
        { id: 'per', session_id: 'sess-per', state: 'running', persistence_mode: 'persistent' }
      ])
      await flushPromises()

      const stopBtn = wrapper.find('[data-testid="btn-stop-sess-per"]')
      expect(stopBtn.exists()).toBe(true)
      expect((stopBtn.element as HTMLButtonElement).disabled).toBe(false)
    })
  })

  // The handlers must NOT optimistically flip the visible state when the
  // backend rejects the action. Failures must surface via showError, the row
  // must stay as it was, and the per-session transitioning flag must clear.
  describe('failure paths (no optimistic state flip)', () => {
    function rejectWith(status: number, errorMessage = 'session is busy') {
      return Object.assign(new Error('Request failed'), {
        response: { status, data: { error_message: errorMessage } }
      })
    }

    it('Stop returning 409 → row stays "running", showError fired, transitioning cleared', async () => {
      mockStopSession.mockRejectedValueOnce(rejectWith(409, 'session is provisioning'))
      const wrapper = mountPage([
        { id: 'i', session_id: 'sess-running', state: 'running', persistence_mode: 'persistent' }
      ])
      await flushPromises()

      await wrapper.find('[data-testid="btn-stop-sess-running"]').trigger('click')
      await flushPromises()

      // No optimistic flip: Stop button is still there, Play is not.
      expect(wrapper.find('[data-testid="btn-stop-sess-running"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="btn-start-sess-running"]').exists()).toBe(false)

      // User-visible error notification fired with backend message.
      expect(mockShowError).toHaveBeenCalledTimes(1)
      expect(mockShowError.mock.calls[0][0]).toBe('session is provisioning')

      // Stop button is enabled again (transitioning cleared).
      const stopBtn = wrapper.find('[data-testid="btn-stop-sess-running"]').element as HTMLButtonElement
      expect(stopBtn.disabled).toBe(false)
    })

    it('Start returning 409 → row stays "stopped", showError fired, transitioning cleared', async () => {
      mockStartSession.mockRejectedValueOnce(rejectWith(409, 'capacity exhausted'))
      const wrapper = mountPage([
        { id: 'j', session_id: 'sess-stopped', state: 'stopped' }
      ])
      await flushPromises()

      await wrapper.find('[data-testid="btn-start-sess-stopped"]').trigger('click')
      await flushPromises()

      // No optimistic flip: Play button still there, Stop not.
      expect(wrapper.find('[data-testid="btn-start-sess-stopped"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="btn-stop-sess-stopped"]').exists()).toBe(false)

      expect(mockShowError).toHaveBeenCalledTimes(1)
      expect(mockShowError.mock.calls[0][0]).toBe('capacity exhausted')

      const playBtn = wrapper.find('[data-testid="btn-start-sess-stopped"]').element as HTMLButtonElement
      expect(playBtn.disabled).toBe(false)
    })

    it('Delete returning 409 → modal stays open, row preserved, showError fired', async () => {
      mockDeleteSession.mockRejectedValueOnce(rejectWith(409, 'session is locked by another action'))
      const wrapper = mountPage([
        { id: 'h', session_id: 'sess-running', state: 'running' }
      ])
      await flushPromises()

      await wrapper.find('[data-testid="btn-trash-sess-running"]').trigger('click')
      await wrapper.find('[data-testid="confirm-delete-cta"]').trigger('click')
      await flushPromises()

      // Row is still here in its previous state (modal stays open so the user
      // can either retry or cancel; the action was NOT optimistically applied).
      expect(wrapper.find('[data-testid="btn-trash-sess-running"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="confirm-delete-cta"]').exists()).toBe(true)

      expect(mockShowError).toHaveBeenCalledTimes(1)
      expect(mockShowError.mock.calls[0][0]).toBe('session is locked by another action')
    })
  })
})
