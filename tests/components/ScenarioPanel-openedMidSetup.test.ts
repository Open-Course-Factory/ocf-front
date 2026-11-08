/**
 * A run opened while its environment is still being set up — a preview goes
 * straight to the session page — reads ocf-core's "Setting up environment..."
 * placeholder as its step. The page notices when the setup ends and passes the
 * new status down; the panel must then read the real step, or it stays on the
 * placeholder until a manual reload.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: vi.fn().mockResolvedValue(true),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn()
  })
}))

const mockGetCurrentStep = vi.fn()
const mockGetSessionInfo = vi.fn()
const mockVerifyStep = vi.fn()
const mockReprovisionStep = vi.fn()
const mockSubmitFlag = vi.fn()
const mockSubmitQuiz = vi.fn()

vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    getCurrentStep: (...a: any[]) => mockGetCurrentStep(...a),
    getSessionInfo: (...a: any[]) => mockGetSessionInfo(...a),
    getScenario: vi.fn().mockResolvedValue(null),
    getStepByOrder: vi.fn(),
    revealHint: vi.fn(),
    verifyStep: (...a: any[]) => mockVerifyStep(...a),
    reprovisionStep: (...a: any[]) => mockReprovisionStep(...a),
    submitFlag: (...a: any[]) => mockSubmitFlag(...a),
    submitQuiz: (...a: any[]) => mockSubmitQuiz(...a),
    abandonSession: vi.fn()
  }
}))

import ScenarioPanel from '../../src/components/Terminal/ScenarioPanel.vue'

const STEP = {
  step_order: 1,
  title: 'Find the key',
  text: 'Look around.',
  step_type: 'terminal',
  status: 'active',
  total_steps: 3,
  hints_total_count: 0,
  hints_revealed: 0
}

function mountPanel(options: { props?: Record<string, unknown>; realVerify?: boolean } = {}) {
  return mount(ScenarioPanel, {
    props: { scenarioSessionId: 'scen-1', isActive: true, ...options.props },
    global: {
      plugins: [createI18n({
        legacy: false,
        locale: 'en',
        fallbackLocale: 'en',
        messages: { en: {}, fr: {} },
        missingWarn: false,
        fallbackWarn: false
      })],
      stubs: {
        ScenarioElapsedTimer: true,
        // Both expose what the panel lets them do, and can submit regardless —
        // as a click racing a prop update would.
        ScenarioFlagSubmit: {
          name: 'ScenarioFlagSubmit',
          props: ['isActive', 'modelValue'],
          emits: ['update:modelValue', 'submit'],
          template: '<button class="flag-stub" :data-active="String(isActive)" @click="$emit(\'update:modelValue\', \'FLAG{x}\'); $nextTick(() => $emit(\'submit\'))"></button>'
        },
        ScenarioQuizPanel: {
          name: 'ScenarioQuizPanel',
          props: ['isActive'],
          emits: ['submit'],
          template: '<button class="quiz-stub" :data-active="String(isActive)" @click="$emit(\'submit\', { q1: \'a\' })"></button>'
        },
        ScenarioHintPanel: true,
        ProvisioningPhaseList: true,
        ScenarioVerifyResult: options.realVerify ? false : {
          name: 'ScenarioVerifyResult',
          emits: ['verify'],
          template: '<button class="verify-stub" @click="$emit(\'verify\')"></button>'
        }
      }
    }
  })
}

const SETUP_PLACEHOLDER = {
  step_order: 1,
  title: 'Setting up environment...',
  status: 'provisioning',
  total_steps: 3,
  hints_total_count: 0,
  hints_revealed: 0
}

describe('ScenarioPanel opened mid-setup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the real step once the page reports the setup over', async () => {
    mockGetCurrentStep.mockResolvedValueOnce(SETUP_PLACEHOLDER).mockResolvedValue(STEP)
    const wrapper = mountPanel({ props: { sessionStatus: 'provisioning' } })
    await flushPromises()
    expect(wrapper.text()).toContain('Setting up environment...')

    await wrapper.setProps({ sessionStatus: 'active' })
    await flushPromises()

    expect(wrapper.text()).toContain('Find the key')
    expect(mockGetCurrentStep).toHaveBeenCalledTimes(2)
  })

  it('does not reload a real step when the status changes', async () => {
    mockGetCurrentStep.mockResolvedValue(STEP)
    const wrapper = mountPanel({ props: { sessionStatus: 'active' } })
    await flushPromises()

    await wrapper.setProps({ sessionStatus: 'provisioning' })
    await wrapper.setProps({ sessionStatus: 'active' })
    await flushPromises()

    expect(mockGetCurrentStep).toHaveBeenCalledTimes(1)
  })
})
