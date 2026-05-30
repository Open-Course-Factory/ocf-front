/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Session/step DATA, loading, review-navigation and DOM-helper logic for the
 * scenario panel. Extracted from ScenarioPanel.vue (commit #6 of #243).
 *
 * Owns step data only. Hint reveal, the nudge timer and the
 * auto-reveal-on-failure logic stay in the component, which wraps loadStepData
 * (returning the fetched step) to do revealed-hint loading + transient resets.
 */

import { ref, computed, onBeforeUnmount, nextTick } from 'vue'
import { useTranslations } from './useTranslations'
import {
  renderKillercodaMarkdown,
  loadScenarioImages,
  revokeScenarioImageUrls
} from '../utils/killercodaMarkdown'
import { scenarioSessionService } from '../services/domain/scenario'
import type { CurrentStepResponse, ScenarioInfo } from '../services/domain/scenario'

export interface ScenarioSessionEmit {
  paste: (cmd: string) => void
  scenarioInfoLoaded: (info: ScenarioInfo) => void
}

export function useScenarioSession(
  scenarioSessionId: () => string,
  emit: ScenarioSessionEmit
) {
  const { t } = useTranslations({
    en: {
      scenarioPanel: {
        copyCode: 'Copy',
        codeCopied: 'Copied!',
        pasteToTerminal: 'Paste to terminal'
      }
    },
    fr: {
      scenarioPanel: {
        copyCode: 'Copier',
        codeCopied: 'Copié !',
        pasteToTerminal: 'Coller dans le terminal'
      }
    }
  })

  // ---- State ----
  const isLoading = ref(false)
  const loadError = ref(false)
  const isSessionCompleted = ref(false)
  const currentStep = ref<CurrentStepResponse | null>(null)
  const totalSteps = ref(0)
  const scenarioInfo = ref<ScenarioInfo | null>(null)
  const sessionStartedAt = ref<string | null>(null)

  // Step review navigation state
  const reviewingStep = ref<CurrentStepResponse | null>(null)
  const isLoadingReview = ref(false)

  // Ref for step content container (for copy-to-clipboard injection)
  const stepContentRef = ref<HTMLElement | null>(null)

  // ---- Computeds ----
  // The displayed step: either the review step or the current step
  const displayedStep = computed(() => reviewingStep.value || currentStep.value)

  // Rendered markdown for the displayed step
  const renderedDisplayedStepText = computed(() => {
    if (!displayedStep.value?.text) return ''
    return renderKillercodaMarkdown(displayedStep.value.text)
  })

  const hasProgressiveHints = computed(() => {
    return displayedStep.value && displayedStep.value.hints_total_count > 0
  })

  // Resolve the step type with backward-compat for legacy data: when step_type is empty,
  // fall back to has_flag-driven detection (flag vs terminal).
  const resolvedStepType = computed<'terminal' | 'flag' | 'info' | 'quiz'>(() => {
    const st = displayedStep.value?.step_type
    if (st === 'terminal' || st === 'flag' || st === 'info' || st === 'quiz') return st
    return displayedStep.value?.has_flag ? 'flag' : 'terminal'
  })

  // Rendered finish_text (markdown) for the completion screen
  const renderedFinishText = computed(() => {
    if (!scenarioInfo.value?.finish_text) return ''
    return renderKillercodaMarkdown(scenarioInfo.value.finish_text)
  })

  // ---- Functions ----
  // Load scenario metadata (name, description) from the API
  async function loadScenarioInfo() {
    try {
      const session = await scenarioSessionService.getSessionInfo(scenarioSessionId())
      if (session?.started_at) {
        sessionStartedAt.value = session.started_at
      }
      if (session?.scenario_id) {
        scenarioInfo.value = await scenarioSessionService.getScenario(session.scenario_id)
        if (scenarioInfo.value) {
          emit.scenarioInfoLoaded(scenarioInfo.value)
        }
      }
    } catch (err) {
      // Non-critical: scenario name is a nice-to-have, fall back to generic title
      console.warn('Could not load scenario info:', err)
    }
  }

  // Handle clicks on {{exec}} commands (event delegation on markdown containers)
  function handleExecClick(event: MouseEvent) {
    const target = event.target as HTMLElement
    if (target.classList.contains('exec-command')) {
      const command = target.textContent?.trim()
      if (command) {
        emit.paste(command)
      }
    }
    if (target.classList.contains('copy-command')) {
      const text = target.textContent?.trim()
      if (text) {
        navigator.clipboard.writeText(text)
        target.classList.add('copied')
        setTimeout(() => target.classList.remove('copied'), 1500)
      }
    }
  }

  // Add copy-to-clipboard and paste-to-terminal buttons to <pre><code> blocks
  function addCopyButtons(container: HTMLElement) {
    const preBlocks = container.querySelectorAll('pre')
    preBlocks.forEach(pre => {
      // Skip if already processed
      if (pre.parentElement?.classList.contains('code-block-wrapper')) return

      const wrapper = document.createElement('div')
      wrapper.className = 'code-block-wrapper'

      const code = pre.querySelector('code')
      const text = (code?.textContent || pre.textContent || '').trim()

      // Copy button
      const copyBtn = document.createElement('button')
      copyBtn.className = 'copy-code-btn'
      copyBtn.type = 'button'
      copyBtn.innerHTML = `<i class="fas fa-copy"></i> <span>${t('scenarioPanel.copyCode')}</span>`
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(text)
          copyBtn.innerHTML = `<i class="fas fa-check"></i> <span>${t('scenarioPanel.codeCopied')}</span>`
          copyBtn.classList.add('copied')
          setTimeout(() => {
            copyBtn.innerHTML = `<i class="fas fa-copy"></i> <span>${t('scenarioPanel.copyCode')}</span>`
            copyBtn.classList.remove('copied')
          }, 2000)
        } catch {
          console.warn('Clipboard API not available')
        }
      })

      // Paste-to-terminal button (for single-line commands, or exec-block marked blocks)
      const isExecBlock = pre.classList.contains('exec-block')
      const isSingleLine = !text.includes('\n')
      if ((isSingleLine || isExecBlock) && text.length > 0) {
        const pasteBtn = document.createElement('button')
        pasteBtn.className = 'paste-terminal-btn'
        pasteBtn.type = 'button'
        pasteBtn.innerHTML = `<i class="fas fa-terminal"></i>`
        pasteBtn.title = t('scenarioPanel.pasteToTerminal')
        pasteBtn.addEventListener('click', () => {
          emit.paste(text)
        })
        wrapper.appendChild(pasteBtn)
      }

      pre.parentNode?.insertBefore(wrapper, pre)
      wrapper.appendChild(pre)
      wrapper.appendChild(copyBtn)
    })
  }

  // Inject copy buttons and (re)load images for the rendered step content.
  async function refreshStepContent(stepOrder: number | undefined) {
    await nextTick()
    if (!stepContentRef.value) return
    addCopyButtons(stepContentRef.value)
    revokeScenarioImageUrls()
    if (scenarioInfo.value?.id && stepOrder !== undefined) {
      const stepDir = `step${stepOrder + 1}`
      loadScenarioImages(stepContentRef.value, scenarioInfo.value.id, stepDir)
    }
  }

  // Fetch the current step's DATA. Returns the fetched step (or null on error).
  // Does NOT touch hint/verify/flag/quiz transient state and does NOT load
  // revealed hints — the component wrapper handles those.
  async function loadStepData(opts: { skipSpinner?: boolean } = {}): Promise<CurrentStepResponse | null> {
    if (!opts.skipSpinner) {
      isLoading.value = true
    }
    loadError.value = false

    try {
      const step = await scenarioSessionService.getCurrentStep(scenarioSessionId())
      currentStep.value = step

      // Use total_steps from backend (fixed count, not client-side tracking)
      if (step.total_steps) {
        totalSteps.value = step.total_steps
      }

      // If the step status indicates session is completed
      if (step.status === 'completed' && !step.title) {
        isSessionCompleted.value = true
      }

      // Load scenario info once (for name/description display and image loading)
      if (!scenarioInfo.value) {
        await loadScenarioInfo()
      }
    } catch (err: any) {
      console.error('Failed to load scenario step:', err)
      // If 404 or specific status, might mean session is completed
      if (err.response?.status === 404 || err.response?.data?.status === 'completed') {
        isSessionCompleted.value = true
      } else {
        loadError.value = true
      }
    } finally {
      isLoading.value = false
    }

    // After loading spinner is hidden and step content is rendered,
    // inject copy buttons and load images
    await refreshStepContent(currentStep.value?.step_order)

    return currentStep.value
  }

  // Navigate to a specific step for review.
  // Returns the fetched review step (or null when no fetch happened / on error)
  // so the component can load that step's already-revealed hints.
  async function navigateToStep(stepOrder: number): Promise<CurrentStepResponse | null> {
    // If clicking the current step, exit review mode
    if (currentStep.value && stepOrder === currentStep.value.step_order) {
      reviewingStep.value = null
      return null
    }
    isLoadingReview.value = true
    try {
      const step = await scenarioSessionService.getStepByOrder(scenarioSessionId(), stepOrder)
      if (step) {
        reviewingStep.value = step
        // Load images and copy buttons after review step renders
        await refreshStepContent(step.step_order)
      }
      return step ?? null
    } catch (err) {
      console.warn('Could not load step for review:', err)
      return null
    } finally {
      isLoadingReview.value = false
    }
  }

  function backToCurrentStep() {
    reviewingStep.value = null
  }

  // Navigate back to the previous step for review (info step "Previous" button)
  async function goToPreviousStep() {
    if (!currentStep.value) return
    const targetOrder = currentStep.value.step_order - 1
    if (targetOrder < 0) return
    await navigateToStep(targetOrder)
  }

  // Image cleanup on unmount (the component may also stop its own timers).
  onBeforeUnmount(revokeScenarioImageUrls)

  return {
    // refs
    isLoading,
    loadError,
    isSessionCompleted,
    currentStep,
    totalSteps,
    scenarioInfo,
    sessionStartedAt,
    reviewingStep,
    isLoadingReview,
    stepContentRef,
    // computeds
    displayedStep,
    renderedDisplayedStepText,
    resolvedStepType,
    hasProgressiveHints,
    renderedFinishText,
    // functions
    loadStepData,
    loadScenarioInfo,
    navigateToStep,
    backToCurrentStep,
    goToPreviousStep,
    addCopyButtons,
    handleExecClick
  }
}
