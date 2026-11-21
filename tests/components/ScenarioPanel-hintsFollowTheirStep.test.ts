/**
 * Revealed hints belong to their step. Reviewing a past step used to replace the
 * current step's hints with that step's, and going back to the current step left
 * them there: the learner saw the wrong hints and "next hint" asked for the
 * wrong level.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn()
  })
}))

const mockGetCurrentStep = vi.fn()
const mockGetStepByOrder = vi.fn()
const mockRevealHint = vi.fn()

vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    getCurrentStep: (...a: any[]) => mockGetCurrentStep(...a),
    getSessionInfo: vi.fn().mockResolvedValue({ id: 'scen-1', scenario_id: 'sc-1', status: 'active' }),
    getScenario: vi.fn().mockResolvedValue({ id: 'sc-1', name: 'lab', title: 'Lab' }),
    getStepByOrder: (...a: any[]) => mockGetStepByOrder(...a),
    revealHint: (...a: any[]) => mockRevealHint(...a),
    verifyStep: vi.fn(),
    reprovisionStep: vi.fn(),
    skipToStep: vi.fn(),
    submitFlag: vi.fn(),
    submitQuiz: vi.fn(),
    abandonSession: vi.fn()
  }
}))

import ScenarioPanel from '../../src/components/Terminal/ScenarioPanel.vue'

const step = (order: number, status: string, revealed: number) => ({
  step_order: order,
  position: order + 1,
  step_orders: [0, 1],
  title: `Step ${order}`,
  text: 'Do it.',
  step_type: 'terminal',
  status,
  total_steps: 2,
  hints_total_count: 3,
  hints_revealed: revealed
})

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

const hintTexts = (wrapper: ReturnType<typeof mountPanel>) =>
  wrapper.findAll('[data-testid="hint-item"]').map(h => h.text())

describe('ScenarioPanel — revealed hints follow their step', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCurrentStep.mockResolvedValue(step(1, 'active', 1))
    mockGetStepByOrder.mockResolvedValue(step(0, 'completed', 2))
    mockRevealHint.mockImplementation(async (_sid: string, order: number, level: number) =>
      ({ level, content: `step${order}-hint${level}` }))
  })

  it('shows the current step\'s hints again after reviewing a past step', async () => {
    const wrapper = mountPanel()
    await flushPromises()
    expect(hintTexts(wrapper).join()).toContain('step1-hint1')

    await wrapper.findAll('[data-testid="scenario-progress-dot"]')[0].trigger('click')
    await flushPromises()
    expect(hintTexts(wrapper).join()).toContain('step0-hint2')

    await wrapper.find('[data-testid="scenario-back-to-current"]').trigger('click')
    await flushPromises()
    const texts = hintTexts(wrapper).join()
    expect(texts).toContain('step1-hint1')
    expect(texts).not.toContain('step0')
  })

  it('asks for the current step\'s next level after a review', async () => {
    const wrapper = mountPanel()
    await flushPromises()
    await wrapper.findAll('[data-testid="scenario-progress-dot"]')[0].trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="scenario-back-to-current"]').trigger('click')
    await flushPromises()

    mockRevealHint.mockClear()
    await wrapper.find('[data-testid="hint-reveal-next"]').trigger('click')
    await flushPromises()
    expect(mockRevealHint).toHaveBeenCalledWith('scen-1', 1, 2)
  })
})
