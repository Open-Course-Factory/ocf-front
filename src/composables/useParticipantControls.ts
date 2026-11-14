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
        done: {
          cut: 'Internet cut for {name}.',
          restore: 'Internet restored for {name}.',
          stop: '{name}’s sessions stopped.',
          block: '{name} is blocked.',
          unblock: '{name} is unblocked.'
        },
        partial: 'Done for some sessions only. Check their sessions.',
        failed: 'The action failed. Please try again.',
        codes: {
          feature_not_in_session: 'This session was started without internet access.',
          session_not_running: 'The session is not running.',
          vm_not_supported: 'This action is not available on a virtual machine.',
          network_renew_failed: 'Internet was restored but the session could not get a new address: ask the learner to restart it.',
          network_still_present: 'Internet could not be cut on this session.',
          state_not_recorded: 'The change was applied but could not be saved. Please try again.'
        }
      }
    },
    fr: {
      participantControls: {
        done: {
          cut: 'Internet coupé pour {name}.',
          restore: 'Internet rétabli pour {name}.',
          stop: 'Sessions de {name} arrêtées.',
          block: 'Démarrage des sessions bloqué pour {name}.',
          unblock: 'Blocage levé pour {name}.'
        },
        partial: 'Fait pour une partie des sessions seulement. Vérifiez ses sessions.',
        failed: 'L’action a échoué. Veuillez réessayer.',
        codes: {
          feature_not_in_session: 'Cette session a été lancée sans accès à internet.',
          session_not_running: 'La session n’est pas en cours.',
          vm_not_supported: 'Cette action n’est pas disponible sur une machine virtuelle.',
          network_renew_failed: 'Internet est rétabli, mais la session n’a pas obtenu de nouvelle adresse : demandez à la personne en formation de redémarrer la session.',
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

  // A skipped session (nothing to do on it) counts as done, and stays out of
  // a partial result. No results — a block, a cut with no session — is a
  // success.
  function report(response: ParticipantActionResponse | undefined, success: string) {
    const results = response?.results ?? []
    const attempted = results.filter(r => !r.skipped)
    if (attempted.every(r => r.ok)) {
      toast.success(success)
    } else if (attempted.some(r => r.ok)) {
      toast.warning(t('participantControls.partial'))
    } else {
      toast.error(messageForCode(attempted.find(r => r.code)?.code))
    }
  }

  type Done = 'cut' | 'restore' | 'stop' | 'block' | 'unblock'

  async function run(userId: string, done: Done, action: () => Promise<ParticipantActionResponse>): Promise<void> {
    // The name is read before the reload, which may drop the participant.
    const name = participantFor(userId)?.user_name || userId
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
      report(response, t(`participantControls.done.${done}`, { name }))
    }
  }

  const stopSessions = (userId: string, sessionIds?: string[]) =>
    run(userId, 'stop', () => participantControlsService.stopSessions(toValue(groupIdSource), userId, sessionIds))

  const setNetwork = (userId: string, enabled: boolean, sessionIds?: string[]) =>
    run(userId, enabled ? 'restore' : 'cut', () => participantControlsService.setNetwork(toValue(groupIdSource), userId, enabled, sessionIds))

  const setClassBlock = (userId: string, change: BlockChange) =>
    run(userId, change.blocked ? 'block' : 'unblock', () => participantControlsService.setClassBlock(toValue(groupIdSource), userId, change))

  const setOrgBlock = (orgId: string, userId: string, change: BlockChange) =>
    run(userId, change.blocked ? 'block' : 'unblock', () => participantControlsService.setOrgBlock(orgId, userId, change))

  return { participants, participantFor, pendingUserId, load, stopSessions, setNetwork, setClassBlock, setOrgBlock }
}
