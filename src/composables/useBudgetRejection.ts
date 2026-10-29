/**
 * Composable: useBudgetRejection
 *
 * Single source of truth for the backend's budget refusal — the plan's CPU/RAM
 * quota is full. ocf-core answers starts AND resumes with the same payload
 * (httperrors.WriteBudgetRejection):
 *
 *   403 { error_code, error_message, source: 'budget', reason, remaining }
 *
 * `reason` is `budget_exhausted` (quota full) or `plan_restriction` (the size is
 * not in the plan at all). Only running machines use the quota, so the useful
 * answer to "quota full" on a resume is which running machines to stop: the
 * resume message fetches them once from my-usage and names them.
 */

import { useTranslations } from './useTranslations'
import { terminalService } from '../services/domain/terminal'

/** HTTP 403 with `source: 'budget'`. Pure — safe to call anywhere. */
export function isBudgetRejection(err: any): boolean {
  return err?.response?.status === 403 && err?.response?.data?.source === 'budget'
}

/** A budget refusal because the quota is full — not because the plan excludes the size. */
export function isQuotaFullRejection(err: any): boolean {
  return isBudgetRejection(err) && err.response.data.reason === 'budget_exhausted'
}

export function useBudgetRejection() {
  const { t } = useTranslations({
    en: {
      budgetRejection: {
        resumeQuotaFull: 'Your quota is full: resuming a paused machine needs free CPU and RAM. Stop one of your running machines to make room: {machines}.',
        resumeQuotaFullUnnamed: 'Your quota is full: resuming a paused machine needs free CPU and RAM. Stop one of your running machines to make room, then try again.'
      }
    },
    fr: {
      budgetRejection: {
        resumeQuotaFull: 'Votre quota est plein : reprendre une machine en pause demande du CPU et de la RAM libres. Arrêtez l\'une de vos machines en cours pour faire de la place : {machines}.',
        resumeQuotaFullUnnamed: 'Votre quota est plein : reprendre une machine en pause demande du CPU et de la RAM libres. Arrêtez l\'une de vos machines en cours pour faire de la place, puis réessayez.'
      }
    }
  })

  /**
   * Message for a resume refused because the quota is full, naming the
   * machines that use it (`counts_toward_quota`, decided by the backend).
   * Falls back to the unnamed copy when the list can't be read.
   */
  async function getResumeQuotaFullMessage(organizationId?: string): Promise<string> {
    try {
      const usage = await terminalService.getMyUsage(organizationId)
      const machines = usage.active_sessions
        .filter(s => s.counts_toward_quota === true)
        .map(s => `${s.name || s.session_id} (${s.size_key.toUpperCase()})`)
      if (machines.length > 0) {
        return t('budgetRejection.resumeQuotaFull', { machines: machines.join(', ') })
      }
    } catch {
      // Non-critical: the unnamed copy still tells the user what to do.
    }
    return t('budgetRejection.resumeQuotaFullUnnamed')
  }

  return { getResumeQuotaFullMessage }
}
