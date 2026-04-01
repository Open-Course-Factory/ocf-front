/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Shared composable for end-of-session state configurations.
 * Used by TerminalViewer (overlay) and TerminalSessionView (banner).
 */

import { useTranslations } from './useTranslations'

const endStateTranslations = {
  en: {
    endState: {
      completed: {
        title: 'Session Complete',
        body: 'You have successfully completed this scenario. Well done!',
        primary: 'View My Scenarios'
      },
      abandoned: {
        title: 'Scenario Abandoned',
        body: 'You left this scenario. You can retry it anytime from your scenario list.',
        primary: 'View My Scenarios'
      },
      expired: {
        title: 'Session Expired',
        body: 'Your terminal session has reached its time limit. Start a new session to continue working.',
        primary: 'Start New Session'
      },
      stopped: {
        title: 'Session Stopped',
        body: 'This terminal session has been stopped. You can start a new one from your sessions page.',
        primary: 'Back to Sessions'
      },
      setup_failed: {
        title: 'Setup Failed',
        body: 'The scenario environment could not be prepared. This is usually a temporary issue. Please try again.',
        primary: 'Back to Scenarios'
      },
      backToSessions: 'Back to Sessions',
      backToScenarios: 'Back to Scenarios',
      expiredScenario: 'Your terminal session has reached its time limit. You can relaunch the scenario from the scenario list.',
      stoppedScenario: 'This terminal session has been stopped. You can relaunch the scenario from the scenario list.'
    }
  },
  fr: {
    endState: {
      completed: {
        title: 'Session terminée',
        body: 'Vous avez terminé ce scénario avec succès. Bravo !',
        primary: 'Voir mes scénarios'
      },
      abandoned: {
        title: 'Scénario abandonné',
        body: 'Vous avez quitté ce scénario. Vous pouvez le retenter à tout moment depuis votre liste de scénarios.',
        primary: 'Voir mes scénarios'
      },
      expired: {
        title: 'Session expirée',
        body: 'Votre session terminal a atteint sa limite de temps. Démarrez une nouvelle session pour continuer.',
        primary: 'Démarrer une nouvelle session'
      },
      stopped: {
        title: 'Session arrêtée',
        body: 'Cette session terminal a été arrêtée. Vous pouvez en démarrer une nouvelle depuis votre page de sessions.',
        primary: 'Retour aux sessions'
      },
      setup_failed: {
        title: 'Échec de la préparation',
        body: 'L\'environnement du scénario n\'a pas pu être préparé. Il s\'agit généralement d\'un problème temporaire. Veuillez réessayer.',
        primary: 'Retour aux scénarios'
      },
      backToSessions: 'Retour aux sessions',
      backToScenarios: 'Retour aux scénarios',
      expiredScenario: 'Votre session terminal a atteint sa limite de temps. Vous pouvez relancer le scénario depuis la liste des scénarios.',
      stoppedScenario: 'Cette session terminal a été arrêtée. Vous pouvez relancer le scénario depuis la liste des scénarios.'
    }
  }
}

export type EndStateReason = 'completed' | 'abandoned' | 'expired' | 'stopped' | 'setup_failed'

export interface EndStateConfig {
  icon: string
  tone: string
  title: string
  body: string
  primaryLabel: string
  primaryRoute: { name: string }
  secondaryLabel?: string
  secondaryRoute?: { name: string }
}

export function useEndStateConfig() {
  const { t } = useTranslations(endStateTranslations)

  const configs: Record<EndStateReason, (hasScenario?: boolean) => EndStateConfig> = {
    completed: () => ({
      icon: 'fas fa-trophy',
      tone: 'success',
      title: t('endState.completed.title'),
      body: t('endState.completed.body'),
      primaryLabel: t('endState.completed.primary'),
      primaryRoute: { name: 'MyScenarios' },
      secondaryLabel: t('endState.backToSessions'),
      secondaryRoute: { name: 'TerminalSessions' }
    }),
    abandoned: () => ({
      icon: 'fas fa-door-open',
      tone: 'info',
      title: t('endState.abandoned.title'),
      body: t('endState.abandoned.body'),
      primaryLabel: t('endState.abandoned.primary'),
      primaryRoute: { name: 'MyScenarios' },
      secondaryLabel: t('endState.backToSessions'),
      secondaryRoute: { name: 'TerminalSessions' }
    }),
    expired: (hasScenario?: boolean) => ({
      icon: 'fas fa-hourglass-end',
      tone: 'warning',
      title: t('endState.expired.title'),
      body: hasScenario ? t('endState.expiredScenario') : t('endState.expired.body'),
      primaryLabel: hasScenario ? t('endState.backToScenarios') : t('endState.expired.primary'),
      primaryRoute: { name: hasScenario ? 'ScenarioLauncher' : 'TerminalSessions' },
      secondaryLabel: hasScenario ? t('endState.backToSessions') : undefined,
      secondaryRoute: hasScenario ? { name: 'TerminalSessions' } : undefined
    }),
    stopped: (hasScenario?: boolean) => ({
      icon: 'fas fa-stop-circle',
      tone: 'info',
      title: t('endState.stopped.title'),
      body: hasScenario ? t('endState.stoppedScenario') : t('endState.stopped.body'),
      primaryLabel: hasScenario ? t('endState.backToScenarios') : t('endState.stopped.primary'),
      primaryRoute: { name: hasScenario ? 'ScenarioLauncher' : 'TerminalSessions' },
      secondaryLabel: hasScenario ? t('endState.backToSessions') : undefined,
      secondaryRoute: hasScenario ? { name: 'TerminalSessions' } : undefined
    }),
    setup_failed: () => ({
      icon: 'fas fa-exclamation-triangle',
      tone: 'danger',
      title: t('endState.setup_failed.title'),
      body: t('endState.setup_failed.body'),
      primaryLabel: t('endState.setup_failed.primary'),
      primaryRoute: { name: 'ScenarioLauncher' },
      secondaryLabel: t('endState.backToSessions'),
      secondaryRoute: { name: 'TerminalSessions' }
    })
  }

  function getEndStateConfig(reason: EndStateReason, options?: { hasScenario?: boolean }): EndStateConfig {
    return configs[reason](options?.hasScenario)
  }

  return { getEndStateConfig }
}
