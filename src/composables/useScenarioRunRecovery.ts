/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * The ways back into a scenario run whose environment is gone — Rebuild &
 * resume, and Start over — for the launcher card, the scenario history and
 * the session view alike, so a refusal reads the same wherever the learner
 * meets it.
 */

import { onBeforeUnmount } from 'vue'
import { useTranslations } from './useTranslations'
import { useNotification } from './useNotification'
import { scenarioSessionService, pollProvisioningStatus } from '../services/domain/scenario'
import type { LaunchScenarioResponse } from '../services/domain/scenario'

interface WaitOptions {
  // Wait for a build still under way before resolving, within the deadline
  // the backend returned. Without it the terminal id comes back at once and
  // the page opened on it does its own waiting.
  wait?: boolean
  onPhaseChange?: (phase: string) => void
}

export function useScenarioRunRecovery() {
  const { showError, showConfirm } = useNotification()
  // A build can take minutes: stop waiting for it once the page is left.
  const unmounted = new AbortController()
  onBeforeUnmount(() => unmounted.abort())
  const { t } = useTranslations({
    en: {
      runRecovery: {
        runOver: 'This run is over and can no longer be resumed. Start over to play the scenario again.',
        retry: 'Your environment could not be rebuilt right now. Please try again in a moment.',
        notInPlan: 'Your plan no longer allows this machine. Start over or ask your trainer.',
        cannotRebuild: 'This run can\'t be rebuilt. Start over or abandon it.',
        setupFailed: 'The environment could not be prepared.',
        setupTimeout: 'Preparing the environment took too long. Please try again.',
        failed: 'The environment could not be prepared.',
        startOverTitle: 'Start over',
        startOverConfirm: 'Abandon this run and start the scenario again from the beginning? Your progress in this run will be lost.',
        abandonFailed: 'Failed to abandon the run.'
      }
    },
    fr: {
      runRecovery: {
        runOver: 'Cette session est terminée et ne peut plus être reprise. Recommencez pour rejouer le scénario.',
        retry: 'Votre environnement n\'a pas pu être reconstruit pour le moment. Réessayez dans un instant.',
        notInPlan: 'Votre offre ne permet plus cette machine. Recommencez ou demandez à votre formateur.',
        cannotRebuild: 'Cette session ne peut pas être reconstruite. Recommencez ou abandonnez-la.',
        setupFailed: 'L\'environnement n\'a pas pu être préparé.',
        setupTimeout: 'La préparation de l\'environnement a pris trop de temps. Veuillez réessayer.',
        failed: 'L\'environnement n\'a pas pu être préparé.',
        startOverTitle: 'Recommencer',
        startOverConfirm: 'Abandonner cette session et recommencer le scénario depuis le début ? Votre progression dans cette session sera perdue.',
        abandonFailed: 'Impossible d\'abandonner la session.'
      }
    }
  })

  // The learner's words for a failed resume or launch — never the backend's
  // English. null for a resume already under way (a double click, a second
  // tab): not an error, the caller just reloads.
  function failureMessage(err: any): string | null {
    const reason = err?.response?.data?.reason
    const status = err?.response?.status
    if (reason === 'resume_in_progress') return null
    if (reason === 'run_over') return t('runRecovery.runOver')
    if (reason === 'resume_retry') return t('runRecovery.retry')
    if (reason === 'not_in_plan') return t('runRecovery.notInPlan')
    // No access any more (the learner left the org), or the scenario archived.
    if (status === 403 || status === 409) return t('runRecovery.cannotRebuild')
    if (err?.message === 'SETUP_FAILED') return t('runRecovery.setupFailed')
    if (err?.message === 'SETUP_TIMEOUT') return t('runRecovery.setupTimeout')
    return err?.response?.data?.error_message || t('runRecovery.failed')
  }

  // The terminal to open once the request has answered — and, with `wait`,
  // once its build is over. null when there is none: the failure was
  // explained, or another resume of the run is under way.
  async function terminalOf(request: Promise<LaunchScenarioResponse>, options: WaitOptions): Promise<string | null> {
    try {
      const result = await request
      if (options.wait && result.status === 'provisioning') {
        await pollProvisioningStatus(result.scenario_session_id, options.onPhaseChange ?? (() => {}), unmounted.signal, {
          deadlineSeconds: result.provisioning_timeout_seconds
        })
      }
      return unmounted.signal.aborted ? null : result.terminal_session_id
    } catch (err: any) {
      const message = failureMessage(err)
      if (message) showError(message)
      return null
    }
  }

  // Gets back into the run: a new machine at the learner's step when its
  // container is gone.
  function rebuild(runId: string, options: WaitOptions = {}): Promise<string | null> {
    return terminalOf(scenarioSessionService.resumeSession(runId), options)
  }

  function launch(scenarioId: string, launchOptions: { organization_id?: string } = {}, options: WaitOptions = {}): Promise<string | null> {
    return terminalOf(scenarioSessionService.launchScenario(scenarioId, launchOptions), options)
  }

  // Abandons the run, then starts the scenario afresh with `relaunch` — once
  // the learner has confirmed, since the run's progress is lost.
  async function startOver(runId: string, relaunch: () => Promise<unknown>): Promise<void> {
    if (!await showConfirm(t('runRecovery.startOverConfirm'), t('runRecovery.startOverTitle'))) return
    try {
      await scenarioSessionService.abandonSession(runId)
    } catch (err: any) {
      showError(err?.response?.data?.error_message || t('runRecovery.abandonFailed'))
      return
    }
    await relaunch()
  }

  return { rebuild, launch, startOver }
}
