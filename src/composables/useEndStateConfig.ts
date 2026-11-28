/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Labinux
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
        primary: 'View My Scenarios',
        continue: 'Continue experimenting'
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
      run_over: {
        title: 'Run Over',
        body: 'A fatal mistake ended this run — that is part of the challenge, not a bug. This machine is closed and its progress is gone. Relaunch the scenario for a fresh attempt with new flags.',
        primary: 'Relaunch the scenario'
      },
      open_elsewhere: {
        title: 'Open in another tab',
        body: 'This scenario\'s machine is open in another tab of your browser. Continue in that tab.'
      },
      machine_failed: {
        title: 'The machine could not start',
        body: 'This lab runs in your browser, which could not start its machine ({detail}). Use a computer with Chrome or Edge 137 or later, or Firefox 153 or later. Your progress is kept.'
      },
      machine_crashed: {
        title: 'The machine stopped',
        body: 'The machine stopped: not enough memory. Close other tabs and reload the page.'
      },
      machine_halted: {
        title: 'The machine is shut down',
        body: 'The machine was shut down. Reload the page: it is rebuilt at your current step.'
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
        primary: 'Voir mes scénarios',
        continue: 'Continuer à expérimenter'
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
      run_over: {
        title: 'Partie terminée',
        body: "Une erreur fatale a mis fin à cette partie — cela fait partie du défi, ce n'est pas un bug. Cette machine est fermée et sa progression est perdue. Relancez le scénario pour une nouvelle tentative avec de nouveaux flags.",
        primary: 'Relancer le scénario'
      },
      open_elsewhere: {
        title: 'Ouvert dans un autre onglet',
        body: 'La machine de ce scénario est ouverte dans un autre onglet de votre navigateur. Continuez dans cet onglet.'
      },
      machine_failed: {
        title: 'La machine n\'a pas pu démarrer',
        body: 'Ce lab tourne dans votre navigateur, qui n\'a pas pu lancer sa machine ({detail}). Utilisez un ordinateur avec Chrome ou Edge 137 ou plus récent, ou Firefox 153 ou plus récent. Votre progression est conservée.'
      },
      machine_crashed: {
        title: 'La machine s\'est arrêtée',
        body: 'La machine s\'est arrêtée : mémoire insuffisante. Fermez d\'autres onglets et rechargez la page.'
      },
      machine_halted: {
        title: 'La machine est éteinte',
        body: 'La machine a été éteinte. Rechargez la page : elle est reconstruite à l\'étape en cours.'
      },
      backToSessions: 'Retour aux sessions',
      backToScenarios: 'Retour aux scénarios',
      expiredScenario: 'Votre session terminal a atteint sa limite de temps. Vous pouvez relancer le scénario depuis la liste des scénarios.',
      stoppedScenario: 'Cette session terminal a été arrêtée. Vous pouvez relancer le scénario depuis la liste des scénarios.'
    }
  }
}

export type EndStateReason = 'completed' | 'abandoned' | 'expired' | 'stopped' | 'revoked' | 'setup_failed' | 'disconnected' | 'run_over'
  | 'open_elsewhere' | 'machine_failed' | 'machine_crashed' | 'machine_halted'

// Action buttons trigger an in-place handler (emitted by the overlay) instead of
// navigating. The consumer wires the concrete handler for each key.
export type EndStateActionKey = 'reconnect' | 'endSession' | 'continue'

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

export interface EndStateOptions {
  hasScenario?: boolean
  // The session's machine still runs, so the learner can go back to it.
  canContinue?: boolean
  // What the browser said when a machine in it could not start.
  machineDetail?: string
}

export function useEndStateConfig() {
  const { t } = useTranslations(endStateTranslations)

  const configs: Record<EndStateReason, (options: EndStateOptions) => EndStateConfig> = {
    // Completing a run does not stop its machine: while it runs, the learner
    // may dismiss the overlay and keep experimenting in the console.
    completed: ({ canContinue }) => ({
      icon: 'fas fa-trophy',
      tone: 'success',
      title: t('endState.completed.title'),
      body: t('endState.completed.body'),
      primary: canContinue
        ? { kind: 'action', label: t('endState.completed.continue'), actionKey: 'continue' }
        : { kind: 'route', label: t('endState.completed.primary'), route: { name: 'MyScenarios' } },
      secondary: canContinue
        ? { kind: 'route', label: t('endState.completed.primary'), route: { name: 'MyScenarios' } }
        : { kind: 'route', label: t('endState.backToSessions'), route: { name: 'TerminalSessions' } }
    }),
    abandoned: () => ({
      icon: 'fas fa-door-open',
      tone: 'info',
      title: t('endState.abandoned.title'),
      body: t('endState.abandoned.body'),
      primary: { kind: 'route', label: t('endState.abandoned.primary'), route: { name: 'MyScenarios' } },
      secondary: { kind: 'route', label: t('endState.backToSessions'), route: { name: 'TerminalSessions' } }
    }),
    expired: ({ hasScenario }) => ({
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
    stopped: ({ hasScenario }) => ({
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
    }),
    // A crash-trap run that ended in permadeath. Both buttons navigate: there
    // is deliberately no reconnect action, because ocf-core has already
    // abandoned the scenario session and stopped the terminal — offering
    // Reconnect would only produce a refusal. Relaunching is the intended
    // rogue-lite loop, not a fallback, so it is the primary.
    run_over: () => ({
      icon: 'fas fa-skull',
      tone: 'info',
      title: t('endState.run_over.title'),
      body: t('endState.run_over.body'),
      primary: { kind: 'route', label: t('endState.run_over.primary'), route: { name: 'ScenarioLauncher' } },
      secondary: { kind: 'route', label: t('endState.backToSessions'), route: { name: 'TerminalSessions' } }
    }),
    // A run's machine in the browser serves one tab: this one stands aside.
    open_elsewhere: () => ({
      icon: 'fas fa-clone',
      tone: 'info',
      title: t('endState.open_elsewhere.title'),
      body: t('endState.open_elsewhere.body'),
      primary: { kind: 'route', label: t('endState.backToScenarios'), route: { name: 'ScenarioLauncher' } }
    }),
    // A machine in this browser that could not boot (plan rule 7): the
    // browser's own reason, and the run's terminal is given back.
    machine_failed: ({ machineDetail }) => ({
      icon: 'fas fa-laptop',
      tone: 'danger',
      title: t('endState.machine_failed.title'),
      body: t('endState.machine_failed.body', { detail: machineDetail ?? '' }),
      primary: { kind: 'route', label: t('endState.backToScenarios'), route: { name: 'ScenarioLauncher' } }
    }),
    // A machine in this browser that died: its worker ran out of memory, or
    // its kernel failed. A reload rebuilds the run at its step.
    machine_crashed: () => ({
      icon: 'fas fa-memory',
      tone: 'danger',
      title: t('endState.machine_crashed.title'),
      body: t('endState.machine_crashed.body'),
      primary: { kind: 'route', label: t('endState.backToScenarios'), route: { name: 'ScenarioLauncher' } }
    }),
    machine_halted: () => ({
      icon: 'fas fa-power-off',
      tone: 'info',
      title: t('endState.machine_halted.title'),
      body: t('endState.machine_halted.body'),
      primary: { kind: 'route', label: t('endState.backToScenarios'), route: { name: 'ScenarioLauncher' } }
    })
  }

  function getEndStateConfig(reason: EndStateReason, options: EndStateOptions = {}): EndStateConfig {
    return configs[reason](options)
  }

  return { getEndStateConfig }
}
