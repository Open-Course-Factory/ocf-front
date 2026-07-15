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
      revoked: {
        title: 'Session ended',
        body: 'Your session was stopped because your subscription or license is no longer active. Contact your trainer or check your subscription to continue.',
        primary: 'Check my subscription'
      },
      setup_failed: {
        title: 'Setup Failed',
        body: 'The scenario environment could not be prepared. This is usually a temporary issue. Please try again.',
        primary: 'Back to Scenarios'
      },
      disconnected: {
        title: 'Terminal Disconnected',
        body: 'Your terminal connection was lost, but your environment is still running. Reconnect to pick up where you left off.',
        primary: 'Reconnect',
        secondary: 'End Session'
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
      revoked: {
        title: 'Session interrompue',
        body: "Votre session a été arrêtée car votre abonnement ou votre licence n'est plus actif. Contactez votre formateur ou vérifiez votre abonnement pour continuer.",
        primary: 'Vérifier mon abonnement'
      },
      setup_failed: {
        title: 'Échec de la préparation',
        body: 'L\'environnement du scénario n\'a pas pu être préparé. Il s\'agit généralement d\'un problème temporaire. Veuillez réessayer.',
        primary: 'Retour aux scénarios'
      },
      disconnected: {
        title: 'Terminal déconnecté',
        body: 'La connexion à votre terminal a été perdue, mais votre environnement est toujours actif. Reconnectez-vous pour reprendre où vous en étiez.',
        primary: 'Se reconnecter',
        secondary: 'Terminer la session'
      },
      backToSessions: 'Retour aux sessions',
      backToScenarios: 'Retour aux scénarios',
      expiredScenario: 'Votre session terminal a atteint sa limite de temps. Vous pouvez relancer le scénario depuis la liste des scénarios.',
      stoppedScenario: 'Cette session terminal a été arrêtée. Vous pouvez relancer le scénario depuis la liste des scénarios.'
    }
  }
}

export type EndStateReason = 'completed' | 'abandoned' | 'expired' | 'stopped' | 'revoked' | 'setup_failed' | 'disconnected'

// Action buttons trigger an in-place handler (emitted by the overlay) instead of
// navigating. The consumer wires the concrete handler for each key.
export type EndStateActionKey = 'reconnect' | 'endSession'

// A single end-state button. Discriminated on `kind`: a 'route' button
// navigates via <router-link>; an 'action' button emits its actionKey for the
// consumer to handle in place. This makes invalid combinations (both a route
// and an action, or neither) unrepresentable.
export type EndStateButton =
  | { kind: 'route'; label: string; route: { name: string } }
  | { kind: 'action'; label: string; actionKey: EndStateActionKey }

export interface EndStateConfig {
  icon: string
  tone: string
  title: string
  body: string
  primary: EndStateButton
  secondary?: EndStateButton
}

export function useEndStateConfig() {
  const { t } = useTranslations(endStateTranslations)

  const configs: Record<EndStateReason, (hasScenario?: boolean) => EndStateConfig> = {
    completed: () => ({
      icon: 'fas fa-trophy',
      tone: 'success',
      title: t('endState.completed.title'),
      body: t('endState.completed.body'),
      primary: { kind: 'route', label: t('endState.completed.primary'), route: { name: 'MyScenarios' } },
      secondary: { kind: 'route', label: t('endState.backToSessions'), route: { name: 'TerminalSessions' } }
    }),
    abandoned: () => ({
      icon: 'fas fa-door-open',
      tone: 'info',
      title: t('endState.abandoned.title'),
      body: t('endState.abandoned.body'),
      primary: { kind: 'route', label: t('endState.abandoned.primary'), route: { name: 'MyScenarios' } },
      secondary: { kind: 'route', label: t('endState.backToSessions'), route: { name: 'TerminalSessions' } }
    }),
    expired: (hasScenario?: boolean) => ({
      icon: 'fas fa-hourglass-end',
      tone: 'warning',
      title: t('endState.expired.title'),
      body: hasScenario ? t('endState.expiredScenario') : t('endState.expired.body'),
      primary: {
        kind: 'route',
        label: hasScenario ? t('endState.backToScenarios') : t('endState.expired.primary'),
        route: { name: hasScenario ? 'ScenarioLauncher' : 'TerminalSessions' }
      },
      secondary: hasScenario
        ? { kind: 'route', label: t('endState.backToSessions'), route: { name: 'TerminalSessions' } }
        : undefined
    }),
    stopped: (hasScenario?: boolean) => ({
      icon: 'fas fa-stop-circle',
      tone: 'info',
      title: t('endState.stopped.title'),
      body: hasScenario ? t('endState.stoppedScenario') : t('endState.stopped.body'),
      primary: {
        kind: 'route',
        label: hasScenario ? t('endState.backToScenarios') : t('endState.stopped.primary'),
        route: { name: hasScenario ? 'ScenarioLauncher' : 'TerminalSessions' }
      },
      secondary: hasScenario
        ? { kind: 'route', label: t('endState.backToSessions'), route: { name: 'TerminalSessions' } }
        : undefined
    }),
    revoked: () => ({
      icon: 'fas fa-ban',
      tone: 'warning',
      title: t('endState.revoked.title'),
      body: t('endState.revoked.body'),
      primary: { kind: 'route', label: t('endState.revoked.primary'), route: { name: 'SubscriptionPlans' } },
      secondary: { kind: 'route', label: t('endState.backToSessions'), route: { name: 'TerminalSessions' } }
    }),
    setup_failed: () => ({
      icon: 'fas fa-exclamation-triangle',
      tone: 'danger',
      title: t('endState.setup_failed.title'),
      body: t('endState.setup_failed.body'),
      primary: { kind: 'route', label: t('endState.setup_failed.primary'), route: { name: 'ScenarioLauncher' } },
      secondary: { kind: 'route', label: t('endState.backToSessions'), route: { name: 'TerminalSessions' } }
    }),
    disconnected: () => ({
      icon: 'fas fa-plug',
      tone: 'warning',
      title: t('endState.disconnected.title'),
      body: t('endState.disconnected.body'),
      // Both buttons are in-place actions: Reconnect resumes the still-running
      // environment, End Session stops it.
      primary: { kind: 'action', label: t('endState.disconnected.primary'), actionKey: 'reconnect' },
      secondary: { kind: 'action', label: t('endState.disconnected.secondary'), actionKey: 'endSession' }
    })
  }

  function getEndStateConfig(reason: EndStateReason, options?: { hasScenario?: boolean }): EndStateConfig {
    return configs[reason](options?.hasScenario)
  }

  return { getEndStateConfig }
}
