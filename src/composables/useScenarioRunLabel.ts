/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * How a learner's scenario run reads — paused, or ended — for the launcher
 * card and the scenario history alike. Whether a run can be resumed is the
 * backend's verdict (`resumable`), never re-derived from `status`: a row stays
 * 'active' until something notices its terminal is gone.
 */

import { useTranslations } from './useTranslations'
import type { MyScenarioSession } from '../services/domain/scenario'

type Run = Pick<MyScenarioSession, 'status' | 'resumable' | 'resume_mode' | 'completed_steps'>

// Stopped by the platform with its disk kept: resuming restarts the terminal
// at the same step.
export function isPausedRun(run: Run): boolean {
  return run.resumable === true && run.resume_mode === 'paused'
}

// A run whose row has not caught up with a terminal that is gone.
export function isEndedRun(run: Run): boolean {
  return run.resumable !== true && (run.status === 'active' || run.status === 'provisioning')
}

// The step a run resumes at — the one after the last completed. Not
// current_step: that is an order, whose base varies by authoring path.
export function resumeStep(run: Run): number | null {
  return typeof run.completed_steps === 'number' ? run.completed_steps + 1 : null
}

export function useScenarioRunLabel() {
  const { t } = useTranslations({
    en: {
      scenarioRun: {
        paused: 'Paused',
        pausedAtStep: 'Paused — resume at step {step}',
        ended: 'Previous run ended'
      }
    },
    fr: {
      scenarioRun: {
        paused: 'En pause',
        pausedAtStep: 'En pause — reprendre à l\'étape {step}',
        ended: 'Session précédente terminée'
      }
    }
  })

  // '' for a live, completed or abandoned run: the caller shows its own status.
  return (run: Run): string => {
    if (isPausedRun(run)) {
      const step = resumeStep(run)
      return step === null ? t('scenarioRun.paused') : t('scenarioRun.pausedAtStep', { step })
    }
    if (isEndedRun(run)) return t('scenarioRun.ended')
    return ''
  }
}
