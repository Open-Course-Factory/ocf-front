/**
 * Tests for useScenarioSession — the session/step data + loading +
 * review-navigation + DOM-helper logic extracted from ScenarioPanel.vue
 * (commit #6 of ocf-front #243).
 *
 * The composable owns step DATA only. Hint reveal, the nudge timer and the
 * auto-reveal-on-failure logic stay in the component (the component does
 * revealed-hint loading + transient resets in its own wrapper around
 * loadStepData, which returns the fetched step). Service calls go through
 * scenarioSessionService.
 *
 * Signature under test:
 *   useScenarioSession(
 *     scenarioSessionId: () => string,
 *     emit: { paste: (cmd: string) => void,
 *             scenarioInfoLoaded: (info: ScenarioInfo) => void },
 *   ) → {
 *     // refs
 *     isLoading, loadError, isSessionCompleted, currentStep, totalSteps,
 *     scenarioInfo, sessionStartedAt, reviewingStep, isLoadingReview,
 *     stepContentRef,
 *     // computeds
 *     displayedStep, renderedDisplayedStepText, resolvedStepType,
 *     hasProgressiveHints, renderedFinishText,
 *     // functions
 *     loadStepData, loadScenarioInfo, navigateToStep, backToCurrentStep,
 *     goToPreviousStep, addCopyButtons, handleExecClick,
 *   }
 *
 * Harness: composables that use lifecycle hooks / useTranslations must run
 * inside a real setup(). We mount a tiny dummy component (the established
 * `runInSetup` pattern from useComposeErrorMessage.test.ts) with a real
 * createI18n plugin and capture the returned object.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

// ---- Mock the scenario service module (controllable per test) ----
const mockGetCurrentStep = vi.fn()
const mockGetSessionInfo = vi.fn()
const mockGetScenario = vi.fn()
const mockGetStepByOrder = vi.fn()
const mockRevealHint = vi.fn()

vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    getCurrentStep: (...a: any[]) => mockGetCurrentStep(...a),
    getSessionInfo: (...a: any[]) => mockGetSessionInfo(...a),
    getScenario: (...a: any[]) => mockGetScenario(...a),
    getStepByOrder: (...a: any[]) => mockGetStepByOrder(...a),
    revealHint: (...a: any[]) => mockRevealHint(...a),
  },
}))

// ---- Mock the markdown/image utils (pure-ish, but avoid DOM/image side effects) ----
vi.mock('../../src/utils/killercodaMarkdown', () => ({
  renderKillercodaMarkdown: (md: string) => `<p>${md}</p>`,
  preprocessKillercodaMarkdown: (md: string) => md,
  processExecSyntax: (html: string) => html,
  revokeScenarioImageUrls: vi.fn(),
  loadScenarioImages: vi.fn(),
}))

import { useScenarioSession } from '../../src/composables/useScenarioSession'

type Composable = ReturnType<typeof useScenarioSession>

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

interface Emit {
  paste: (cmd: string) => void
  scenarioInfoLoaded: (info: any) => void
}

/**
 * Run the composable inside a fake setup() so it can use lifecycle hooks and
 * useTranslations(). Returns the composable's object.
 */
function setupComposable(
  sessionId = 'sess-1',
  emit: Emit = { paste: vi.fn(), scenarioInfoLoaded: vi.fn() },
): Composable {
  let captured!: Composable
  const Dummy = defineComponent({
    setup() {
      captured = useScenarioSession(() => sessionId, emit)
      return () => h('div')
    },
  })
  mount(Dummy, { global: { plugins: [createTestI18n()] } })
  return captured
}

function makeStep(overrides: Record<string, any> = {}) {
  return {
    step_order: 0,
    total_steps: 3,
    title: 'Step',
    status: 'active',
    has_flag: false,
    hints_total_count: 0,
    hints_revealed: 0,
    step_type: 'terminal',
    ...overrides,
  }
}

describe('useScenarioSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: scenario-info loading is a no-op success (loadStepData calls it once).
    mockGetSessionInfo.mockResolvedValue({})
    mockGetScenario.mockResolvedValue(null)
  })

  describe('loadStepData', () => {
    it('success: sets currentStep, totalSteps and clears loading/error flags', async () => {
      mockGetCurrentStep.mockResolvedValue(makeStep({ step_order: 1, total_steps: 5 }))
      const c = setupComposable()

      await c.loadStepData()

      expect(c.currentStep.value).not.toBeNull()
      expect(c.currentStep.value!.step_order).toBe(1)
      expect(c.totalSteps.value).toBe(5)
      expect(c.isLoading.value).toBe(false)
      expect(c.loadError.value).toBe(false)
      expect(c.isSessionCompleted.value).toBe(false)
    })

    it('completed status with no title: marks the session completed, not errored', async () => {
      mockGetCurrentStep.mockResolvedValue(makeStep({ status: 'completed', title: '' }))
      const c = setupComposable()

      await c.loadStepData()

      expect(c.isSessionCompleted.value).toBe(true)
      expect(c.loadError.value).toBe(false)
    })

    it('404 response: marks the session completed, not errored', async () => {
      mockGetCurrentStep.mockRejectedValue({ response: { status: 404 } })
      const c = setupComposable()

      await c.loadStepData()

      expect(c.isSessionCompleted.value).toBe(true)
      expect(c.loadError.value).toBe(false)
      expect(c.isLoading.value).toBe(false)
    })

    it('generic error: sets loadError, not completed', async () => {
      mockGetCurrentStep.mockRejectedValue({ response: { status: 500 } })
      const c = setupComposable()

      await c.loadStepData()

      expect(c.loadError.value).toBe(true)
      expect(c.isSessionCompleted.value).toBe(false)
      expect(c.isLoading.value).toBe(false)
    })
  })

  describe('displayedStep', () => {
    it('returns reviewingStep when set, else currentStep', async () => {
      mockGetCurrentStep.mockResolvedValue(makeStep({ step_order: 0, title: 'Current' }))
      const c = setupComposable()
      await c.loadStepData()

      // No review → displayedStep is the current step.
      expect(c.displayedStep.value!.title).toBe('Current')

      // Review a different step → displayedStep follows reviewingStep.
      c.reviewingStep.value = makeStep({ step_order: 2, title: 'Reviewed' }) as any
      expect(c.displayedStep.value!.title).toBe('Reviewed')
    })
  })

  describe('navigateToStep', () => {
    it('sets reviewingStep to the fetched step', async () => {
      mockGetCurrentStep.mockResolvedValue(makeStep({ step_order: 0 }))
      mockGetStepByOrder.mockResolvedValue(makeStep({ step_order: 2, title: 'Past step' }))
      const c = setupComposable()
      await c.loadStepData()

      await c.navigateToStep(2)

      expect(c.reviewingStep.value).not.toBeNull()
      expect(c.reviewingStep.value!.step_order).toBe(2)
      expect(c.reviewingStep.value!.title).toBe('Past step')
    })

    it('navigating to the current step order exits review mode', async () => {
      mockGetCurrentStep.mockResolvedValue(makeStep({ step_order: 3 }))
      const c = setupComposable()
      await c.loadStepData()

      // Enter review on another step.
      c.reviewingStep.value = makeStep({ step_order: 1 }) as any
      expect(c.reviewingStep.value).not.toBeNull()

      // Navigating to the current step's order clears review.
      await c.navigateToStep(3)
      expect(c.reviewingStep.value).toBeNull()
      // It must NOT have fetched a step in this case.
      expect(mockGetStepByOrder).not.toHaveBeenCalled()
    })
  })

  describe('resolvedStepType', () => {
    it('maps an explicit step_type', async () => {
      mockGetCurrentStep.mockResolvedValue(makeStep({ step_type: 'quiz' }))
      const c = setupComposable()
      await c.loadStepData()
      expect(c.resolvedStepType.value).toBe('quiz')
    })

    it('falls back to flag when step_type is empty and has_flag is true', async () => {
      mockGetCurrentStep.mockResolvedValue(makeStep({ step_type: '', has_flag: true }))
      const c = setupComposable()
      await c.loadStepData()
      expect(c.resolvedStepType.value).toBe('flag')
    })

    it('falls back to terminal when step_type is empty and has_flag is false', async () => {
      mockGetCurrentStep.mockResolvedValue(makeStep({ step_type: '', has_flag: false }))
      const c = setupComposable()
      await c.loadStepData()
      expect(c.resolvedStepType.value).toBe('terminal')
    })
  })

  describe('handleExecClick', () => {
    it('invokes emit.paste with the command text when the target is an exec-command', () => {
      const paste = vi.fn()
      const c = setupComposable('sess-1', { paste, scenarioInfoLoaded: vi.fn() })

      const el = document.createElement('span')
      el.className = 'exec-command'
      el.textContent = '  ls -la  '
      c.handleExecClick({ target: el } as unknown as MouseEvent)

      expect(paste).toHaveBeenCalledTimes(1)
      expect(paste).toHaveBeenCalledWith('ls -la')
    })

    it('does not invoke emit.paste when the target is not an exec-command', () => {
      const paste = vi.fn()
      const c = setupComposable('sess-1', { paste, scenarioInfoLoaded: vi.fn() })

      const el = document.createElement('span')
      el.className = 'something-else'
      el.textContent = 'rm -rf /'
      c.handleExecClick({ target: el } as unknown as MouseEvent)

      expect(paste).not.toHaveBeenCalled()
    })
  })
})
