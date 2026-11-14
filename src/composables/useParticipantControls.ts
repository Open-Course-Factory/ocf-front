/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

/**
 * A class manager's controls over the class's participants (#384).
 *
 * One bulk read feeds a whole page, or one wall poll — never a request per
 * participant. Each action goes to its own route, then the bulk read is
 * reloaded (whatever the outcome) so the page shows the real state, and a
 * toast reports success, a partial result or a failure in the viewer's
 * language — never the backend's code or English text.
 * Call it in setup.
 */

import { ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useTranslations } from './useTranslations'
import { useToast } from './useToast'
import {
  participantControlsService,
  type BlockChange,
  type ParticipantActionResponse,
  type ParticipantControls
} from '../services/domain/terminal/participantControlsService'

// The failures ocf-core names for these actions; anything else reads generic.
const KNOWN_CODES = [
  'feature_not_in_session',
  'session_not_running',
  'vm_not_supported',
  'network_renew_failed',
  'network_still_present',
  'state_not_recorded'
] as const

export function useParticipantControls(groupIdSource: MaybeRefOrGetter<string>) {
  const toast = useToast()
  const { t } = useTranslations({
    en: {
      participantControls: {
        done: 'Done.',
        partial: 'Done for some sessions only. Check the participant’s sessions.',
        failed: 'The action failed. Please try again.',
        codes: {
          feature_not_in_session: 'This session was started without internet access.',
          session_not_running: 'The session is not running.',
          vm_not_supported: 'This action is not available on a virtual machine.',
          network_renew_failed: 'Internet was restored but the session could not get a new address. Restart the session.',
          network_still_present: 'Internet could not be cut on this session.',
          state_not_recorded: 'The change was applied but could not be saved. Please try again.'
        }
      }
    },
    fr: {
      participantControls: {
        done: 'C’est fait.',
        partial: 'Fait pour une partie des sessions seulement. Vérifiez les sessions du participant.',
        failed: 'L’action a échoué. Veuillez réessayer.',
        codes: {
          feature_not_in_session: 'Cette session a été lancée sans accès à internet.',
          session_not_running: 'La session n’est pas en cours.',
          vm_not_supported: 'Cette action n’est pas disponible sur une machine virtuelle.',
          network_renew_failed: 'Internet est rétabli, mais la session n’a pas obtenu de nouvelle adresse. Redémarrez la session.',
          network_still_present: 'Internet n’a pas pu être coupé sur cette session.',
          state_not_recorded: 'Le changement est appliqué mais n’a pas pu être enregistré. Veuillez réessayer.'
        }
      }
    }
  })

  const participants = ref<ParticipantControls[]>([])
  /** The participant an action is running on, to disable their menu meanwhile. */
  const pendingUserId = ref<string | null>(null)

  async function load(): Promise<void> {
    try {
      participants.value = await participantControlsService.getParticipantControls(toValue(groupIdSource))
    } catch {
      participants.value = []
    }
  }

  function participantFor(userId: string): ParticipantControls | null {
    return participants.value.find(p => p.user_id === userId) ?? null
  }

  // The action routes answer `{ code }` on failure, per session or overall.
  function messageForCode(code: string | undefined): string {
    return code && (KNOWN_CODES as readonly string[]).includes(code)
      ? t(`participantControls.codes.${code}`)
      : t('participantControls.failed')
  }

  // A skipped session (nothing to do on it) counts as done. No results — a
  // block — is a success.
  function report(response: ParticipantActionResponse | undefined) {
    const results = response?.results ?? []
    if (results.every(r => r.ok)) {
      toast.success(t('participantControls.done'))
    } else if (results.some(r => r.ok)) {
      toast.warning(t('participantControls.partial'))
    } else {
      toast.error(messageForCode(results.find(r => r.code)?.code))
    }
  }

  async function run(userId: string, action: () => Promise<ParticipantActionResponse>): Promise<void> {
    pendingUserId.value = userId
    let response: ParticipantActionResponse | undefined
    let failure: unknown = null
    try {
      response = await action()
    } catch (err) {
      failure = err
    }
    await load()
    pendingUserId.value = null
    if (failure) {
      toast.error(messageForCode((failure as any)?.response?.data?.code))
    } else {
      report(response)
    }
  }

  const stopSessions = (userId: string, sessionIds?: string[]) =>
    run(userId, () => participantControlsService.stopSessions(toValue(groupIdSource), userId, sessionIds))

  const setNetwork = (userId: string, enabled: boolean, sessionIds?: string[]) =>
    run(userId, () => participantControlsService.setNetwork(toValue(groupIdSource), userId, enabled, sessionIds))

  const setClassBlock = (userId: string, change: BlockChange) =>
    run(userId, () => participantControlsService.setClassBlock(toValue(groupIdSource), userId, change))

  const setOrgBlock = (orgId: string, userId: string, change: BlockChange) =>
    run(userId, () => participantControlsService.setOrgBlock(orgId, userId, change))

  return { participants, participantFor, pendingUserId, load, stopSessions, setNetwork, setClassBlock, setOrgBlock }
}
