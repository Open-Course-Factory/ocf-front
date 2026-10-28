/**
 * A trainer running a lab themselves can jump ahead from the progress dots,
 * as the class view lets them do for a learner. The panel offers it only on
 * the backend's can_run verdict; a learner's locked dots stay inert.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const mockShowConfirm = vi.fn()
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: (...a: any[]) => mockShowConfirm(...a),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn()
  })
}))

const mockGetCurrentStep = vi.fn()
const mockGetScenario = vi.fn()
const mockSkipToStep = vi.fn()

vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    getCurrentStep: (...a: any[]) => mockGetCurrentStep(...a),
    getSessionInfo: vi.fn().mockResolvedValue({ id: 'scen-1', scenario_id: 'sc-1', status: 'active' }),
    getScenario: (...a: any[]) => mockGetScenario(...a),
    getStepByOrder: vi.fn(),
    revealHint: vi.fn(),
    verifyStep: vi.fn(),
    reprovisionStep: vi.fn(),
    skipToStep: (...a: any[]) => mockSkipToStep(...a),
    submitFlag: vi.fn(),
    submitQuiz: vi.fn(),
    abandonSession: vi.fn()
  }
}))

import ScenarioPanel from '../../src/components/Terminal/ScenarioPanel.vue'

const STEP = {
  step_order: 0,
  position: 1,
  step_orders: [0, 1, 2],
  title: 'First',
  text: 'Do it.',
  step_type: 'terminal',
  status: 'active',
  total_steps: 3,
  hints_total_count: 0,
  hints_revealed: 0
}

function mountPanel() {
  return mount(ScenarioPanel, {
    props: { scenarioSessionId: 'scen-1', isActive: true, sessionStatus: 'active' },
    global: {
      plugins: [createI18n({
        legacy: false, locale: 'en', fallbackLocale: 'en',
        messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false
      })],
      stubs: { ScenarioElapsedTimer: true }
    }
  })
}

async function lastDot(canRun: boolean) {
  mockGetScenario.mockResolvedValue({ id: 'sc-1', name: 'lab', title: 'Lab', can_run: canRun })
  const wrapper = mountPanel()
  await flushPromises()
  const dots = wrapper.findAll('[data-testid="scenario-progress-dot"]')
  expect(dots).toHaveLength(3)
  return { wrapper, dot: dots[2] }
}

describe('ScenarioPanel — trainer skipping their own run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCurrentStep.mockResolvedValue(STEP)
  })

  it('skips to the clicked step after confirmation, then loads it', async () => {
    mockShowConfirm.mockResolvedValue(true)
    mockSkipToStep.mockResolvedValue({ step_order: 2 })
    const { dot } = await lastDot(true)

    expect(dot.classes()).toContain('clickable')
    await dot.trigger('click')
    await flushPromises()

    expect(mockSkipToStep).toHaveBeenCalledWith('scen-1', 2)
    expect(mockGetCurrentStep.mock.calls.length).toBeGreaterThan(1)
  })

  it('does nothing when the confirmation is declined', async () => {
    mockShowConfirm.mockResolvedValue(false)
    const { dot } = await lastDot(true)

    await dot.trigger('click')
    await flushPromises()

    expect(mockSkipToStep).not.toHaveBeenCalled()
  })

  it('leaves a learner\'s locked steps inert', async () => {
    const { dot } = await lastDot(false)

    expect(dot.classes()).not.toContain('clickable')
    await dot.trigger('click')
    await flushPromises()

    expect(mockShowConfirm).not.toHaveBeenCalled()
    expect(mockSkipToStep).not.toHaveBeenCalled()
  })
})
