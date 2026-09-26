/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * The ways back into a scenario run whose environment is gone — Rebuild and
 * resume, and Start over — for the launcher card, the scenario history and
 * the session view alike, and the one reading of a refused launch or resume,
 * so a refusal reads the same wherever the learner meets it.
 *
 * None of them waits for a build: the terminal is opened as soon as the
 * backend answers, and the session view shows the replay.
 */

import { useRouter } from 'vue-router'
import { useTranslations } from './useTranslations'
import { useNotification } from './useNotification'
import { useDunningRejection } from './useDunningRejection'
import { scenarioSessionService } from '../services/domain/scenario'

export function useScenarioRunRecovery() {
  const router = useRouter()
  const { showError, showConfirm } = useNotification()
  const { isDunningRejection, getDunningCopy } = useDunningRejection()
  const { t } = useTranslations({
    en: {
      runRecovery: {
        runOver: 'This run is over and can no longer be resumed. Start over to play the scenario again.',
        retry: 'Your environment could not be rebuilt right now. Please try again in a moment.',
        notInPlan: 'Your plan no longer covers this machine. Ask your trainer.',
        cannotResume: 'This run can no longer be resumed. Abandon it to clear it from your list.',
        budgetResume: 'Your plan\'s machines are all in use right now. Stop another terminal or try again in a moment — your progress is kept.',
        budgetLaunch: 'Your plan\'s machines are all in use right now. Stop another terminal or try again in a moment.',
        alreadyRunning: 'You are already running this scenario. Resume it from its card.',
        setupFailed: 'Scenario setup failed. The environment could not be prepared.',
        setupTimeout: 'Scenario setup timed out. Please try again.',
        launchError: 'The scenario could not be launched. Please try again.',
        startOverTitle: 'Start over',
        startOverConfirm: 'Abandon this run and start the scenario again from the beginning? Your progress in this run will be lost.',
        abandonFailed: 'Failed to abandon the run.'
      }
    },
    fr: {
      runRecovery: {
        runOver: 'Cette session est terminée et ne peut plus être reprise. Recommencez pour rejouer le scénario.',
        retry: 'Votre environnement n\'a pas pu être reconstruit pour le moment. Réessayez dans un instant.',
        notInPlan: 'Votre offre ne couvre plus cette machine. Demandez à votre formateur.',
        cannotResume: 'Cette session ne peut plus être reprise. Abandonnez-la pour la retirer de votre liste.',
        budgetResume: 'Les machines de votre offre sont toutes utilisées pour le moment. Arrêtez un autre terminal ou réessayez dans un instant — votre progression est conservée.',
        budgetLaunch: 'Les machines de votre offre sont toutes utilisées pour le moment. Arrêtez un autre terminal ou réessayez dans un instant.',
        alreadyRunning: 'Vous avez déjà un scénario en cours. Reprenez-le depuis sa carte.',
        setupFailed: 'La préparation du scénario a échoué. L\'environnement n\'a pas pu être configuré.',
        setupTimeout: 'La préparation du scénario a expiré. Veuillez réessayer.',
        launchError: 'Le scénario n\'a pas pu être lancé. Veuillez réessayer.',
        startOverTitle: 'Recommencer',
        startOverConfirm: 'Abandonner cette session et recommencer le scénario depuis le début ? Votre progression dans cette session sera perdue.',
        abandonFailed: 'Impossible d\'abandonner la session.'
      }
    }
  })

  // The learner's words for a refusal, by cause — never the backend's
  // English, and never an action that would be refused too.
  function refusalMessage(err: any, action: 'launch' | 'resume'): string {
    const status = err?.response?.status
    const data = err?.response?.data || {}
    // The org budget is shared by the class: a miss is transient.
    if (data.source === 'budget') return t(action === 'resume' ? 'runRecovery.budgetResume' : 'runRecovery.budgetLaunch')
    if (action === 'launch') {
      if (data.reason === 'session_exists') return t('runRecovery.alreadyRunning')
      if (err?.message === 'SETUP_FAILED') return t('runRecovery.setupFailed')
      if (err?.message === 'SETUP_TIMEOUT') return t('runRecovery.setupTimeout')
      return t('runRecovery.launchError')
    }
    if (data.reason === 'run_over') return t('runRecovery.runOver')
    if (data.reason === 'not_in_plan') return t('runRecovery.notInPlan')
    // No access any more, the scenario archived, or no environment for it:
    // a launch is refused as well, so only Abandon clears the card.
    if (!data.reason && (status === 403 || status === 409)) return t('runRecovery.cannotResume')
    return t('runRecovery.retry')
  }

  // A resume already under way (a double click, a second tab) is not an error:
  // there is nothing to say, the caller just reloads.
  async function explainRefusal(err: any, action: 'launch' | 'resume'): Promise<void> {
    if (isDunningRejection(err)) {
      const copy = getDunningCopy()
      const confirmed = await showConfirm(copy.message, copy.title, {
        confirmButtonText: copy.action,
        cancelButtonText: copy.dismiss
      })
      if (confirmed) Promise.resolve(router.push('/subscription-dashboard')).catch(() => {})
      return
    }
    if (err?.response?.data?.reason === 'resume_in_progress') return
    showError(refusalMessage(err, action))
  }

  // Resumes the run — on a new machine at the learner's step when its
  // container is gone — and opens its terminal. false when refused: the
  // refusal is explained, and the caller reloads what it shows.
  async function rebuild(runId: string, options: { replace?: boolean } = {}): Promise<boolean> {
    try {
      const { terminal_session_id: sessionId } = await scenarioSessionService.resumeSession(runId)
      const target = { name: 'TerminalSessionView', params: { sessionId } }
      options.replace ? router.replace(target) : router.push(target)
      return true
    } catch (err: any) {
      await explainRefusal(err, 'resume')
      return false
    }
  }

  async function launch(scenarioId: string, launchOptions: { organization_id?: string; locale?: string }): Promise<boolean> {
    try {
      const { terminal_session_id: sessionId } = await scenarioSessionService.launchScenario(scenarioId, launchOptions)
      router.push({ name: 'TerminalSessionView', params: { sessionId } })
      return true
    } catch (err: any) {
      await explainRefusal(err, 'launch')
      return false
    }
  }

  // Abandons the run, then starts the scenario afresh with `relaunch` — once
  // the learner has confirmed, since the run's progress is lost.
  async function startOver(runId: string, relaunch: () => Promise<unknown>): Promise<void> {
    if (!await showConfirm(t('runRecovery.startOverConfirm'), t('runRecovery.startOverTitle'))) return
    try {
      await scenarioSessionService.abandonSession(runId)
    } catch {
      showError(t('runRecovery.abandonFailed'))
      return
    }
    await relaunch()
  }

  return { rebuild, launch, startOver, explainRefusal }
}
