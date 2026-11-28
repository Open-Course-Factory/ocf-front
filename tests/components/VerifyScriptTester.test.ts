/**
 * "Test this check" in the step editor (ocf-orchestrator#6).
 *
 * The author's verify script runs on their own preview of the scenario through
 * POST /scenario-sessions/:id/test-verify. What the author must see: the
 * verdict, the exit code and the output a learner would get; an offer to start
 * a preview when none is running; and a sentence they can act on when ocf-core
 * refuses. axios is mocked, not the service, so the real request and the real
 * provisioning poll are what is exercised.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const getMock = vi.fn()
const postMock = vi.fn()
vi.mock('axios', () => ({
  default: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args)
  }
}))

const host = vi.hoisted(() => ({ run: vi.fn(), release: vi.fn() }))
vi.mock('../../src/services/domain/terminal/localMachine', () => ({
  hostLocalRun: (...args: unknown[]) => { host.run(...args); return host.release }
}))
vi.mock('../../src/stores/currentUser', () => ({ useCurrentUserStore: () => ({ secretToken: 'tok' }) }))

import VerifyScriptTester from '../../src/components/ScenarioEditor/VerifyScriptTester.vue'

const SCENARIO = 'sc-1'
const preview = { id: 'ss-preview', scenario_id: SCENARIO, status: 'active', resumable: true, is_preview: true }

function mountTester(props: Record<string, unknown> = {}) {
  const i18n = createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })
  return mount(VerifyScriptTester, {
    props: { scenarioId: SCENARIO, script: '[ -f /etc/app.conf ] || { echo "missing"; exit 1; }', ...props },
    global: { plugins: [i18n] }
  })
}

function refusal(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), { response: { status, data: {} } })
}

beforeEach(() => {
  getMock.mockReset()
  postMock.mockReset()
  host.run.mockReset()
  host.release.mockReset()
})

describe('VerifyScriptTester', () => {
  it('runs the unsaved script on the running preview and shows what the learner would get', async () => {
    getMock.mockResolvedValue({ data: [preview] })
    postMock.mockResolvedValue({ data: { passed: false, exit_code: 1, output: 'missing', duration_ms: 42 } })
    const wrapper = mountTester()

    await wrapper.get('[data-testid="verify-test-run"]').trigger('click')
    await flushPromises()

    expect(postMock).toHaveBeenCalledWith(
      '/scenario-sessions/ss-preview/test-verify',
      { script: '[ -f /etc/app.conf ] || { echo "missing"; exit 1; }' },
      expect.anything()
    )
    expect(wrapper.get('[data-testid="verify-test-verdict"]').text()).toBe('Failed')
    expect(wrapper.text()).toContain('exit code 1')
    expect(wrapper.text()).toContain('42 ms')
    expect(wrapper.get('[data-testid="verify-test-output"]').text()).toBe('missing')
  })

  it("ignores the author's own learner run of the scenario and offers to start a preview", async () => {
    getMock.mockResolvedValue({ data: [{ ...preview, is_preview: false }, { ...preview, scenario_id: 'other' }] })
    const wrapper = mountTester()

    await wrapper.get('[data-testid="verify-test-run"]').trigger('click')
    await flushPromises()

    expect(postMock).not.toHaveBeenCalled()
    await wrapper.get('[data-testid="verify-test-start-preview"]').trigger('click')
    expect(wrapper.emitted('start-preview')).toHaveLength(1)
  })

  it('runs the check once the preview the page started is ready', async () => {
    vi.useFakeTimers()
    getMock.mockResolvedValue({ data: { status: 'active' } })
    postMock.mockResolvedValue({ data: { passed: true, exit_code: 0, output: '', duration_ms: 7 } })
    const wrapper = mountTester()

    await wrapper.setProps({ startedPreviewId: 'ss-new' })
    expect(wrapper.text()).toContain('Your preview is starting')
    await vi.advanceTimersByTimeAsync(3000)
    await flushPromises()
    vi.useRealTimers()

    expect(postMock).toHaveBeenCalledWith('/scenario-sessions/ss-new/test-verify', expect.anything(), expect.anything())
    expect(wrapper.get('[data-testid="verify-test-verdict"]').text()).toBe('Passed')
    expect(wrapper.get('[data-testid="verify-test-output"]').text()).toBe('(no output)')
  })

  it.each([
    [429, 'Too many checks in a short time'],
    [413, 'too large to test'],
    [403, 'only be tested on your own preview']
  ])('explains a %i refusal', async (status, sentence) => {
    getMock.mockResolvedValue({ data: [preview] })
    postMock.mockRejectedValue(refusal(status))
    const wrapper = mountTester()

    await wrapper.get('[data-testid="verify-test-run"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="verify-test-error"]').text()).toContain(sentence)
  })

  it('offers a new preview when the one it found has ended meanwhile (409)', async () => {
    getMock.mockResolvedValue({ data: [preview] })
    postMock.mockRejectedValue(refusal(409))
    const wrapper = mountTester()

    await wrapper.get('[data-testid="verify-test-run"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="verify-test-start-preview"]').exists()).toBe(true)
  })

  // A preview on a machine in the author's browser has no run page open: this
  // tab runs its machine, so its build and the check have somewhere to run.
  it('runs the machine of a local preview in this tab, and lets it go on leaving', async () => {
    getMock.mockResolvedValue({ data: [{ ...preview, terminal_session_id: 'local-p' }] })
    postMock.mockResolvedValue({ data: { passed: true, exit_code: 0, output: '', duration_ms: 7 } })
    const wrapper = mountTester()

    await wrapper.get('[data-testid="verify-test-run"]').trigger('click')
    await flushPromises()
    expect(host.run).toHaveBeenCalledWith('ss-preview', 'local-p', 'tok')
    expect(postMock).toHaveBeenCalled()
    expect(host.run.mock.invocationCallOrder[0]).toBeLessThan(postMock.mock.invocationCallOrder[0])

    wrapper.unmount()
    expect(host.release).toHaveBeenCalled()
  })

  it('runs the machine of the local preview the page started, before waiting for its build', async () => {
    getMock.mockResolvedValue({ data: { id: 'ss-new', status: 'active', terminal_session_id: 'local-n' } })
    postMock.mockResolvedValue({ data: { passed: true, exit_code: 0, output: '', duration_ms: 7 } })
    const wrapper = mountTester()

    await wrapper.setProps({ startedPreviewId: 'ss-new' })
    await flushPromises()
    expect(host.run).toHaveBeenCalledWith('ss-new', 'local-n', 'tok')
  })

  it('runs no machine for a preview in a container', async () => {
    getMock.mockResolvedValue({ data: [{ ...preview, terminal_session_id: 'sess-incus' }] })
    postMock.mockResolvedValue({ data: { passed: true, exit_code: 0, output: '', duration_ms: 7 } })
    const wrapper = mountTester()
    await wrapper.get('[data-testid="verify-test-run"]').trigger('click')
    await flushPromises()
    expect(host.run).not.toHaveBeenCalled()
  })

  it('cannot run on a read-only scenario, and says why', () => {
    const button = mountTester({ disabled: true }).get('[data-testid="verify-test-run"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('title')).toContain('read only')
  })

  it('has nothing to run while the script is empty', () => {
    expect(mountTester({ script: '  ' }).get('[data-testid="verify-test-run"]').attributes('disabled')).toBeDefined()
  })
})
