/**
 * useParticipantControls — a class manager's controls over the class's
 * participants (#384), backed by ocf-core#580.
 *
 * One bulk read (GET /class-groups/:id/participant-controls) feeds a whole page
 * or one wall poll: never a request per participant. Every action goes to its
 * own route, then the bulk read is reloaded so the page shows the new state,
 * and a toast reports success, a partial result, or a failure in the viewer's
 * language — never the raw backend code.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const axiosGet = vi.fn()
const axiosPost = vi.fn()
const axiosPut = vi.fn()

vi.mock('axios', () => ({
  default: {
    get: (...args: unknown[]) => axiosGet(...args),
    post: (...args: unknown[]) => axiosPost(...args),
    put: (...args: unknown[]) => axiosPut(...args),
    patch: vi.fn(),
    delete: vi.fn()
  }
}))

const toastSuccess = vi.fn()
const toastWarning = vi.fn()
const toastError = vi.fn()
vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({
    success: (...args: unknown[]) => toastSuccess(...args),
    warning: (...args: unknown[]) => toastWarning(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: vi.fn(),
    show: vi.fn()
  })
}))

import { useParticipantControls } from '../../src/composables/useParticipantControls'

const GROUP_ID = 'grp-1'
const ORG_ID = 'org-1'
const KARIM = 'u-karim'
/** Each action can take ~25 s per session server-side: the calls wait 2 minutes. */
const LONG_TIMEOUT = expect.objectContaining({ timeout: 120000 })

const ROWS = [
  {
    user_id: KARIM,
    user_name: 'Karim',
    role: 'member',
    class_block: null,
    org_blocked: false,
    global_block: false,
    network_cut: false,
    sessions: [
      { session_id: 's-1', state: 'running', network_feature: true, network_disabled: false, persistence_mode: 'persistent' }
    ]
  },
  {
    user_id: 'u-lea',
    user_name: 'Lea',
    role: 'member',
    class_block: { reason: 'Exam' },
    org_blocked: false,
    global_block: false,
    network_cut: true,
    sessions: []
  }
]

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

/** Runs the composable inside a component so its translations resolve. */
function setup(locale: 'en' | 'fr' = 'en') {
  let controls!: ReturnType<typeof useParticipantControls>
  mount(defineComponent({
    setup() {
      controls = useParticipantControls(GROUP_ID)
      return () => h('div')
    }
  }), { global: { plugins: [createTestI18n(locale)] } })
  return controls
}

function controlsReads() {
  return axiosGet.mock.calls.filter(([url]) => url === `/class-groups/${GROUP_ID}/participant-controls`)
}

function allFailed(status: number, code: string) {
  return { response: { status, data: { code, error_message: `english text for ${code}` } } }
}

describe('useParticipantControls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axiosGet.mockResolvedValue({ data: ROWS })
    axiosPost.mockResolvedValue({ data: { results: [{ session_id: 's-1', ok: true }] } })
    axiosPut.mockResolvedValue({ data: { results: [{ session_id: 's-1', ok: true }] } })
  })

  describe('the bulk read', () => {
    it('reads the whole class in one request per load', async () => {
      const controls = setup()

      await controls.load()

      expect(controlsReads()).toHaveLength(1)
      expect(controls.participants.value.map(p => p.user_id)).toEqual([KARIM, 'u-lea'])
      expect(controls.participantFor('u-lea')?.class_block?.reason).toBe('Exam')
      expect(controls.participantFor('nobody')).toBeNull()
    })

    it('reads again on every load, still once each', async () => {
      const controls = setup()

      await controls.load()
      await controls.load()

      expect(controlsReads()).toHaveLength(2)
    })

    it('keeps an empty roster when the read fails', async () => {
      axiosGet.mockRejectedValueOnce({ response: { status: 403, data: {} } })
      const controls = setup()

      await controls.load()

      expect(controls.participants.value).toEqual([])
    })
  })

  describe('the actions hit their routes', () => {
    it('stops a participant’s sessions', async () => {
      const controls = setup()

      await controls.stopSessions(KARIM)

      expect(axiosPost).toHaveBeenCalledTimes(1)
      const [url, body] = axiosPost.mock.calls[0]
      expect(url).toBe(`/class-groups/${GROUP_ID}/participants/${KARIM}/stop-sessions`)
      expect(body?.session_ids).toBeUndefined()
    })

    it('stops only the sessions named', async () => {
      const controls = setup()

      await controls.stopSessions(KARIM, ['s-1'])

      expect(axiosPost).toHaveBeenCalledWith(
        `/class-groups/${GROUP_ID}/participants/${KARIM}/stop-sessions`,
        { session_ids: ['s-1'] },
        LONG_TIMEOUT
      )
    })

    it('cuts and restores internet', async () => {
      const controls = setup()

      await controls.setNetwork(KARIM, false)
      await controls.setNetwork(KARIM, true, ['s-1'])

      expect(axiosPut).toHaveBeenNthCalledWith(
        1,
        `/class-groups/${GROUP_ID}/participants/${KARIM}/network`,
        { enabled: false },
        LONG_TIMEOUT
      )
      expect(axiosPut).toHaveBeenNthCalledWith(
        2,
        `/class-groups/${GROUP_ID}/participants/${KARIM}/network`,
        { enabled: true, session_ids: ['s-1'] },
        LONG_TIMEOUT
      )
    })

    it('blocks in the class with a reason and the stop option', async () => {
      axiosPut.mockResolvedValue({ data: {} })
      const controls = setup()

      await controls.setClassBlock(KARIM, { blocked: true, reason: 'Exam in progress', stop_running: true })

      expect(axiosPut).toHaveBeenCalledWith(
        `/class-groups/${GROUP_ID}/participants/${KARIM}/session-block`,
        { blocked: true, reason: 'Exam in progress', stop_running: true },
        LONG_TIMEOUT
      )
    })

    it('unblocks in the class', async () => {
      axiosPut.mockResolvedValue({ data: {} })
      const controls = setup()

      await controls.setClassBlock(KARIM, { blocked: false })

      expect(axiosPut).toHaveBeenCalledWith(
        `/class-groups/${GROUP_ID}/participants/${KARIM}/session-block`,
        { blocked: false },
        LONG_TIMEOUT
      )
    })

    it('blocks in the organisation through the organisation route', async () => {
      axiosPut.mockResolvedValue({ data: {} })
      const controls = setup()

      await controls.setOrgBlock(ORG_ID, KARIM, { blocked: true, reason: 'Unpaid', stop_running: false })

      expect(axiosPut).toHaveBeenCalledWith(
        `/organizations/${ORG_ID}/members/${KARIM}/session-block`,
        { blocked: true, reason: 'Unpaid', stop_running: false },
        LONG_TIMEOUT
      )
    })
  })

  describe('the actions wait for slow sessions', () => {
    it('gives the stop two minutes', async () => {
      const controls = setup()

      await controls.stopSessions(KARIM)

      expect(axiosPost.mock.calls[0][2]).toEqual(LONG_TIMEOUT)
    })

    it('gives the internet cut two minutes', async () => {
      const controls = setup()

      await controls.setNetwork(KARIM, false)

      expect(axiosPut.mock.calls[0][2]).toEqual(LONG_TIMEOUT)
    })

    it('gives both blocks two minutes', async () => {
      axiosPut.mockResolvedValue({ data: {} })
      const controls = setup()

      await controls.setClassBlock(KARIM, { blocked: true, stop_running: true })
      await controls.setOrgBlock(ORG_ID, KARIM, { blocked: true, stop_running: true })

      expect(axiosPut.mock.calls[0][2]).toEqual(LONG_TIMEOUT)
      expect(axiosPut.mock.calls[1][2]).toEqual(LONG_TIMEOUT)
    })
  })

  describe('the sticky internet cut', () => {
    it('cuts a participant with no session at all, without naming sessions', async () => {
      axiosPut.mockResolvedValueOnce({ data: { results: [] } })
      const controls = setup()

      await controls.setNetwork('u-lea', false)

      expect(axiosPut).toHaveBeenCalledWith(
        `/class-groups/${GROUP_ID}/participants/u-lea/network`,
        { enabled: false },
        LONG_TIMEOUT
      )
      expect(toastSuccess).toHaveBeenCalledTimes(1)
    })

    it('reads the cut from the bulk read', async () => {
      const controls = setup()

      await controls.load()

      expect(controls.participantFor('u-lea')?.network_cut).toBe(true)
      expect(controls.participantFor(KARIM)?.network_cut).toBe(false)
    })
  })

  describe('after an action', () => {
    it('reloads the bulk read once, whether the action worked or not', async () => {
      const controls = setup()
      await controls.load()

      await controls.stopSessions(KARIM)
      expect(controlsReads()).toHaveLength(2)

      axiosPut.mockRejectedValueOnce(allFailed(409, 'session_not_running'))
      await controls.setNetwork(KARIM, false)
      expect(controlsReads()).toHaveLength(3)
    })

    it('marks the participant busy while the action runs', async () => {
      let release!: (value: unknown) => void
      axiosPost.mockReturnValueOnce(new Promise(resolve => { release = resolve }))
      const controls = setup()

      const pending = controls.stopSessions(KARIM)
      expect(controls.pendingUserId.value).toBe(KARIM)

      release({ data: { results: [{ session_id: 's-1', ok: true }] } })
      await pending
      await flushPromises()
      expect(controls.pendingUserId.value).toBeNull()
    })
  })

  describe('the toast', () => {
    it('reports success when every session went through', async () => {
      const controls = setup()

      await controls.stopSessions(KARIM)

      expect(toastSuccess).toHaveBeenCalledTimes(1)
      expect(String(toastSuccess.mock.calls[0][0]).length).toBeGreaterThan(0)
      expect(toastWarning).not.toHaveBeenCalled()
      expect(toastError).not.toHaveBeenCalled()
    })

    it('counts a skipped session as done, not as a failure', async () => {
      axiosPut.mockResolvedValueOnce({
        data: { results: [{ session_id: 's-1', ok: true }, { session_id: 's-2', ok: false, skipped: true }] }
      })
      const controls = setup()

      await controls.setNetwork(KARIM, false)

      expect(toastSuccess).toHaveBeenCalledTimes(1)
      expect(toastWarning).not.toHaveBeenCalled()
    })

    it('reports a partial result as a warning', async () => {
      axiosPut.mockResolvedValueOnce({
        data: {
          results: [
            { session_id: 's-1', ok: true },
            { session_id: 's-2', ok: false, code: 'vm_not_supported' }
          ]
        }
      })
      const controls = setup()

      await controls.setNetwork(KARIM, false)

      expect(toastWarning).toHaveBeenCalledTimes(1)
      expect(toastSuccess).not.toHaveBeenCalled()
      expect(toastError).not.toHaveBeenCalled()
    })

    it('counts an all-skipped result as done', async () => {
      axiosPost.mockResolvedValueOnce({
        data: { results: [{ session_id: 's-1', ok: false, skipped: true }, { session_id: 's-2', ok: false, skipped: true }] }
      })
      const controls = setup()

      await controls.stopSessions(KARIM)

      expect(toastSuccess).toHaveBeenCalledTimes(1)
      expect(toastWarning).not.toHaveBeenCalled()
      expect(toastError).not.toHaveBeenCalled()
    })

    it('leaves skipped sessions out of a partial result', async () => {
      axiosPut.mockResolvedValueOnce({
        data: {
          results: [
            { session_id: 's-1', ok: false, skipped: true },
            { session_id: 's-2', ok: false, code: 'vm_not_supported' }
          ]
        }
      })
      const controls = setup()

      await controls.setNetwork(KARIM, false)

      expect(toastError).toHaveBeenCalledTimes(1)
      expect(toastWarning).not.toHaveBeenCalled()
      expect(toastSuccess).not.toHaveBeenCalled()
    })

    it('reports a partial result when one session worked, one was skipped and one failed', async () => {
      axiosPut.mockResolvedValueOnce({
        data: {
          results: [
            { session_id: 's-1', ok: true },
            { session_id: 's-2', ok: false, skipped: true },
            { session_id: 's-3', ok: false, code: 'vm_not_supported' }
          ]
        }
      })
      const controls = setup()

      await controls.setNetwork(KARIM, false)

      expect(toastWarning).toHaveBeenCalledTimes(1)
    })

    const CODES = [
      'feature_not_in_session',
      'session_not_running',
      'vm_not_supported',
      'network_renew_failed',
      'network_still_present',
      'state_not_recorded'
    ]

    async function errorMessageFor(code: string, locale: 'en' | 'fr' = 'en'): Promise<string> {
      toastError.mockClear()
      axiosPut.mockRejectedValueOnce(allFailed(code === 'network_renew_failed' ? 502 : 409, code))
      const controls = setup(locale)
      await controls.setNetwork(KARIM, false)
      expect(toastError, `an error toast for ${code}`).toHaveBeenCalledTimes(1)
      return String(toastError.mock.calls[0][0])
    }

    it.each(CODES)('explains %s in words, not with the code', async (code) => {
      const generic = await errorMessageFor('some_future_code')
      const message = await errorMessageFor(code)

      expect(message).not.toContain(code)
      expect(message).not.toContain('english text for')
      expect(message, `${code} has its own explanation`).not.toBe(generic)
    })

    it('falls back to a generic message for an unknown code, still without the backend text', async () => {
      const message = await errorMessageFor('some_future_code')

      expect(message.length).toBeGreaterThan(0)
      expect(message).not.toContain('some_future_code')
      expect(message).not.toContain('english text for')
    })

    it('speaks French to a French viewer', async () => {
      const en = await errorMessageFor('session_not_running', 'en')
      const fr = await errorMessageFor('session_not_running', 'fr')

      expect(fr).not.toBe(en)
    })

    it('reports a refused block as an error', async () => {
      axiosPut.mockRejectedValueOnce({ response: { status: 400, data: { error_message: 'reason too long' } } })
      const controls = setup()

      await controls.setClassBlock(KARIM, { blocked: true, reason: 'x' })

      expect(toastError).toHaveBeenCalledTimes(1)
      expect(toastSuccess).not.toHaveBeenCalled()
    })

    it('asks the trainer to have the learner restart the session when the address renewal fails', async () => {
      const en = await errorMessageFor('network_renew_failed', 'en')
      const fr = await errorMessageFor('network_renew_failed', 'fr')

      expect(en).toMatch(/ask/i)
      expect(en).toMatch(/restart/i)
      expect(en).not.toMatch(/(^|\.\s+)Restart the session/)
      expect(fr).toMatch(/demande/i)
      expect(fr).toMatch(/redémarr/i)
      expect(fr).not.toMatch(/Redémarrez la session/)
    })

    it('words every French toast without gendered forms', async () => {
      const messages: string[] = []
      for (const code of [...CODES, 'some_future_code']) messages.push(await errorMessageFor(code, 'fr'))
      toastSuccess.mockClear()
      toastWarning.mockClear()
      axiosPut.mockResolvedValueOnce({ data: { results: [{ session_id: 's-1', ok: true }, { session_id: 's-2', ok: false, code: 'vm_not_supported' }] } })
      const controls = setup('fr')
      await controls.setNetwork(KARIM, false)
      await controls.stopSessions(KARIM)
      messages.push(...toastWarning.mock.calls.map(c => String(c[0])), ...toastSuccess.mock.calls.map(c => String(c[0])))

      expect(messages.length).toBe(CODES.length + 3)
      for (const message of messages) {
        expect(message).not.toMatch(/Bloqué |débloqué|Votre formateur/)
      }
    })

    it('reports a block as a success', async () => {
      axiosPut.mockResolvedValueOnce({ data: {} })
      const controls = setup()

      await controls.setClassBlock(KARIM, { blocked: true, stop_running: true })

      expect(toastSuccess).toHaveBeenCalledTimes(1)
    })
  })
})
