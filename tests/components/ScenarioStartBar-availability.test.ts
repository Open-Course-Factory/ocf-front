/**
 * Whether the scenario bar should exist at all.
 *
 * It used to render unconditionally: a "Start a Scenario" prompt that only
 * discovered, after the user clicked, that nothing on this machine could run.
 * Offering an action that leads to an empty list is worse than offering none,
 * so the bar now answers the question before it renders.
 *
 * The component still mounts either way — the parent holds a ref to it and
 * calls abortProvisioning() through that ref, so it must not be removed from
 * above. Only its own DOM is gated.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

const mockListScenarios = vi.fn()
const mockGetDistributions = vi.fn()

vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    listScenarios: (...a: any[]) => mockListScenarios(...a),
    startScenario: vi.fn(),
  },
  pollProvisioningStatus: vi.fn(),
}))

vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: {
    getDistributions: (...a: any[]) => mockGetDistributions(...a),
  }
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (k: string) => k, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (k: string) => k, te: () => true, locale: ref('en') })
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({ showError: vi.fn(), showSuccess: vi.fn() })
}))

vi.mock('../../src/composables/useDifficultyLabel', () => ({
  useDifficultyLabel: () => (d: string) => d
}))

import ScenarioStartBar from '../../src/components/Terminal/ScenarioStartBar.vue'

function scenario(over: Record<string, any> = {}) {
  return {
    id: 's1', name: 'Gameshell', description: 'shell basics',
    launchable: true, os_type: '', ...over,
  }
}

async function mountBar() {
  const wrapper = mount(ScenarioStartBar, {
    props: { terminalSessionId: 'sess-1', terminalInstanceType: 'debian', terminalMachineSize: 'M' },
    global: { stubs: { AdminBadge: true } },
  })
  for (let i = 0; i < 5; i++) await flushPromises()
  return wrapper
}

describe('ScenarioStartBar — whether to offer anything at all', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetDistributions.mockResolvedValue([{ name: 'debian', os_type: '' }])
  })

  it('shows nothing when no scenario can run on this machine', async () => {
    mockListScenarios.mockResolvedValue([])

    const wrapper = await mountBar()

    expect(wrapper.find('[data-testid="scenario-start-bar"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="scenario-start-bar-btn"]').exists()).toBe(false)
  })

  it('shows nothing when the only scenarios are not launchable here', async () => {
    // The backend already decided this one cannot run (no machine available).
    mockListScenarios.mockResolvedValue([scenario({ launchable: false })])

    const wrapper = await mountBar()

    expect(wrapper.find('[data-testid="scenario-start-bar"]').exists()).toBe(false)
  })

  it('offers the bar when something can actually run', async () => {
    mockListScenarios.mockResolvedValue([scenario()])

    const wrapper = await mountBar()

    expect(wrapper.find('[data-testid="scenario-start-bar"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="scenario-start-bar-btn"]').exists()).toBe(true)
  })

  it('opens the picker on click without a second round trip', async () => {
    mockListScenarios.mockResolvedValue([scenario()])

    const wrapper = await mountBar()
    expect(mockListScenarios).toHaveBeenCalledTimes(1)

    await wrapper.find('[data-testid="scenario-start-bar-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('[data-testid="scenario-picker-item"]').length).toBe(1)
    expect(mockListScenarios, 'the list was already loaded on mount').toHaveBeenCalledTimes(1)
  })

  it('stays hidden and silent when the scenarios cannot be loaded', async () => {
    // The user never asked for scenarios, so a failed background load must not
    // raise a toast on every terminal open — nor offer a picker we could not verify.
    mockListScenarios.mockRejectedValue(new Error('backend down'))

    const wrapper = await mountBar()

    expect(wrapper.find('[data-testid="scenario-start-bar"]').exists()).toBe(false)
  })

  it('stays mounted so the parent can still abort provisioning through its ref', async () => {
    mockListScenarios.mockResolvedValue([])

    const wrapper = await mountBar()

    // Nothing rendered, but the instance and its exposed API are alive.
    expect(wrapper.find('[data-testid="scenario-start-bar"]').exists()).toBe(false)
    expect(typeof (wrapper.vm as any).abortProvisioning).toBe('function')
    expect(() => (wrapper.vm as any).abortProvisioning()).not.toThrow()
  })
})
