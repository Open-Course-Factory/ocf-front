<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Labinux
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<script setup lang="ts">
/**
 * What a trainer may do to one participant (#384), shared by the class members
 * list and the live wall.
 *
 * Presentational: it picks the items from the participant's terminals and
 * blocks and from the viewer's rights, asks first where an action disrupts the
 * learner, and emits the confirmed action — the page wires the emits to
 * useParticipantControls. The host page's own items (default slot) share the
 * same ⋯ menu.
 *
 * Actions only target participants (class role `member`), never the viewer; a
 * platform admin gets them on everyone, badged whenever the admin role is the
 * reason. The organisation block is the organisation managers' — a class
 * manager reads it, they do not lift it.
 */
import { computed, ref, useSlots } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { CLASS_PAGE_NAMES } from '../../router/classPages'
import type {
  BlockChange,
  ParticipantControls,
  ParticipantRole
} from '../../services/domain/terminal/participantControlsService'
import DropdownMenu from '../Common/DropdownMenu.vue'
import AdminBadge from '../Common/AdminBadge.vue'
import BaseModal from '../Modals/BaseModal.vue'

export interface ParticipantActionsViewer {
  userId: string
  isPlatformAdmin: boolean
  /** Owner or manager of the class, or manager of its organisation. */
  managesClass: boolean
  /** Manager or owner of the class's organisation. */
  managesOrg: boolean
}

const props = defineProps<{
  groupId: string
  organizationId?: string
  participant: ParticipantControls | null
  participantRole: ParticipantRole
  viewer: ParticipantActionsViewer
  /**
   * Where the menu sits: the members list links to the wall and the session
   * page; a wall tile focuses itself; the focused view already shows both.
   */
  context: 'members' | 'wall' | 'focused'
  /** An action on this participant is running: the items wait. */
  busy?: boolean
  /** Accessible name of the ⋯ trigger; defaults to "Actions for <name>". */
  triggerLabel?: string
}>()

const emit = defineEmits<{
  (e: 'stop-sessions', userId: string): void
  (e: 'set-network', userId: string, enabled: boolean): void
  (e: 'set-class-block', userId: string, change: BlockChange): void
  (e: 'set-org-block', userId: string, change: BlockChange): void
  (e: 'watch-screen', sessionId: string): void
}>()

const slots = useSlots()

const REASON_MAX = 500

const { t } = useTranslations({
  en: {
    participantActions: {
      menuLabel: 'Actions for {name}',
      watch: 'Watch screen',
      openSession: 'Open session page',
      cutInternet: 'Cut internet',
      restoreInternet: 'Restore internet',
      stop: 'Stop sessions',
      blockClass: 'Block in this class',
      unblockClass: 'Unblock in this class',
      blockOrg: 'Block in the organisation',
      unblockOrg: 'Unblock in the organisation',
      orgBlocked: 'Session start blocked by the organisation',
      stopTitle: 'Stop sessions',
      stopBody: 'Stop {name}’s running sessions? Their work is kept on disk: they can resume later.',
      stopBodyTemporary: 'Stop {name}’s running sessions? A temporary session is deleted when it stops: its work is lost.',
      cutTitle: 'Cut internet',
      cutBody: 'Cut internet for {name}? The cut holds for their current sessions and the new ones they start in this class’s organisation, until you restore it. Their exposed ports stop answering too.',
      blockClassTitle: 'Block in this class',
      blockClassBody: '{name} will not be able to start or resume a session in this class until you unblock them.',
      blockOrgTitle: 'Block in the organisation',
      blockOrgBody: '{name} will not be able to start or resume a session anywhere in the organisation until it is lifted.',
      reasonLabel: 'Reason (optional, shown to the learner)',
      stopRunning: 'Also stop their running sessions',
      runningKept: 'Their running sessions stop; their work is kept on disk.',
      runningLost: 'A temporary session is deleted when it stops: its work is lost.',
      runningContinue: 'Their running sessions keep running.',
      confirmStop: 'Stop',
      confirmCut: 'Cut internet',
      confirmBlock: 'Block',
      cancel: 'Cancel'
    }
  },
  fr: {
    participantActions: {
      menuLabel: 'Actions pour {name}',
      watch: 'Voir l’écran',
      openSession: 'Ouvrir la page de la session',
      cutInternet: 'Couper internet',
      restoreInternet: 'Rétablir internet',
      stop: 'Arrêter les sessions',
      blockClass: 'Bloquer dans cette classe',
      unblockClass: 'Débloquer dans cette classe',
      blockOrg: 'Bloquer dans l’organisation',
      unblockOrg: 'Débloquer dans l’organisation',
      orgBlocked: 'Démarrage bloqué par l’organisation',
      stopTitle: 'Arrêter les sessions',
      stopBody: 'Arrêter les sessions en cours de {name} ? Le travail est conservé sur le disque : les sessions pourront reprendre plus tard.',
      stopBodyTemporary: 'Arrêter les sessions en cours de {name} ? Une session temporaire est supprimée à l’arrêt : son travail est perdu.',
      cutTitle: 'Couper internet',
      cutBody: 'Couper internet pour {name} ? La coupure vaut pour ses sessions en cours et les nouvelles sessions lancées dans l’organisation de cette classe, jusqu’à ce qu’internet soit rétabli. Ses ports exposés ne répondent plus non plus.',
      blockClassTitle: 'Bloquer dans cette classe',
      blockClassBody: '{name} ne pourra plus lancer ni reprendre de session dans cette classe tant que le blocage n’est pas levé.',
      blockOrgTitle: 'Bloquer dans l’organisation',
      blockOrgBody: '{name} ne pourra plus lancer ni reprendre de session dans toute l’organisation tant que le blocage n’est pas levé.',
      reasonLabel: 'Motif (facultatif, visible par la personne concernée)',
      stopRunning: 'Arrêter aussi ses sessions en cours',
      runningKept: 'Ses sessions en cours s’arrêtent ; le travail est conservé sur le disque.',
      runningLost: 'Une session temporaire est supprimée à l’arrêt : son travail est perdu.',
      runningContinue: 'Ses sessions en cours continuent de tourner.',
      confirmStop: 'Arrêter',
      confirmCut: 'Couper internet',
      confirmBlock: 'Bloquer',
      cancel: 'Annuler'
    }
  }
})

// --- What the participant has -------------------------------------------------

const liveSessions = computed(() =>
  (props.participant?.sessions ?? []).filter(s => s.state !== 'deleted')
)
// The cut sticks to the participant — their current and next sessions — so it
// is offered until it is set, sessions or not. Restore also lifts a session
// still cut on its own.
const canCutInternet = computed(() => !props.participant?.network_cut)
const canRestoreInternet = computed(() =>
  !!props.participant?.network_cut || liveSessions.value.some(s => s.network_disabled)
)
const runningSession = computed(() => liveSessions.value.find(s => s.state === 'running') ?? null)
// Stopping a temporary session deletes it: its work is lost. Only a session
// known to be persistent keeps its work — any other mode warns.
const stopLosesWork = computed(() =>
  liveSessions.value.some(s => s.state === 'running' && s.persistence_mode !== 'persistent')
)
const openableSession = computed(() =>
  runningSession.value ?? liveSessions.value.find(s => s.state === 'stopped') ?? null
)

// --- What the viewer may do ---------------------------------------------------

const isParticipant = computed(() => props.participantRole === 'member')
const targetable = computed(() =>
  !!props.participant &&
  props.participant.user_id !== props.viewer.userId &&
  (isParticipant.value || props.viewer.isPlatformAdmin)
)
const classActions = computed(() =>
  targetable.value && (props.viewer.managesClass || props.viewer.isPlatformAdmin)
)
const orgActions = computed(() =>
  targetable.value && !!props.organizationId && (props.viewer.managesOrg || props.viewer.isPlatformAdmin)
)
// The badge marks what the admin role alone opens: a class the admin does not
// manage, a trainer's row, an organisation they do not manage.
const classBadge = computed(() =>
  props.viewer.isPlatformAdmin && (!props.viewer.managesClass || !isParticipant.value)
)
const orgBadge = computed(() =>
  props.viewer.isPlatformAdmin && (!props.viewer.managesOrg || !isParticipant.value)
)
const orgBlockReadOnly = computed(() =>
  classActions.value && !orgActions.value && !!props.participant?.org_blocked
)

const watchLink = computed(() =>
  props.context === 'members' && runningSession.value
    ? {
        name: CLASS_PAGE_NAMES.live,
        params: { id: props.groupId },
        query: { view: 'wall', focus: runningSession.value.session_id }
      }
    : null
)
const sessionPageLink = computed(() =>
  props.context === 'members' && openableSession.value
    ? { path: `/terminal-session/${openableSession.value.session_id}`, query: { group: props.groupId } }
    : null
)
const canWatchOnWall = computed(() => props.context === 'wall' && !!runningSession.value)

const showMenu = computed(() => classActions.value || orgActions.value || !!slots.default)

const participantName = computed(() => props.participant?.user_name || props.participant?.user_id || '')

// --- Confirmations ------------------------------------------------------------

type PendingAction = 'stop' | 'cut' | 'block-class' | 'block-org'
const pending = ref<PendingAction | null>(null)
const reason = ref('')
const stopRunning = ref(true)

const isBlockDialog = computed(() => pending.value === 'block-class' || pending.value === 'block-org')

const dialog = computed(() => {
  const name = participantName.value
  switch (pending.value) {
    case 'stop':
      return {
        title: t('participantActions.stopTitle'),
        body: t(stopLosesWork.value ? 'participantActions.stopBodyTemporary' : 'participantActions.stopBody', { name }),
        confirm: t('participantActions.confirmStop')
      }
    case 'cut':
      return { title: t('participantActions.cutTitle'), body: t('participantActions.cutBody', { name }), confirm: t('participantActions.confirmCut') }
    case 'block-class':
      return { title: t('participantActions.blockClassTitle'), body: t('participantActions.blockClassBody', { name }), confirm: t('participantActions.confirmBlock') }
    case 'block-org':
      return { title: t('participantActions.blockOrgTitle'), body: t('participantActions.blockOrgBody', { name }), confirm: t('participantActions.confirmBlock') }
    default:
      return null
  }
})

// What "also stop" does to the running sessions, in the block dialog.
const runningNote = computed(() => {
  if (!runningSession.value) return ''
  if (!stopRunning.value) return t('participantActions.runningContinue')
  return t(stopLosesWork.value ? 'participantActions.runningLost' : 'participantActions.runningKept')
})

function ask(action: PendingAction) {
  reason.value = ''
  stopRunning.value = true
  pending.value = action
}

function cancel() {
  pending.value = null
}

function blockChange(): BlockChange {
  const trimmed = reason.value.trim()
  return trimmed
    ? { blocked: true, reason: trimmed, stop_running: stopRunning.value }
    : { blocked: true, stop_running: stopRunning.value }
}

function confirmPending() {
  const userId = props.participant?.user_id
  const action = pending.value
  pending.value = null
  if (!userId || !action) return
  if (action === 'stop') emit('stop-sessions', userId)
  else if (action === 'cut') emit('set-network', userId, false)
  else if (action === 'block-class') emit('set-class-block', userId, blockChange())
  else emit('set-org-block', userId, blockChange())
}

// Restoring and unblocking give back what was taken: no dialog.
function restoreInternet() {
  if (props.participant) emit('set-network', props.participant.user_id, true)
}
function unblockClass() {
  if (props.participant) emit('set-class-block', props.participant.user_id, { blocked: false })
}
function unblockOrg() {
  if (props.participant) emit('set-org-block', props.participant.user_id, { blocked: false })
}
</script>

<template>
  <DropdownMenu
    v-if="showMenu"
    :trigger-label="triggerLabel || t('participantActions.menuLabel', { name: participantName })"
  >
    <slot />

    <template v-if="classActions">
      <router-link
        v-if="watchLink"
        :to="watchLink"
        class="ocf-dropdown-item"
        data-testid="participant-action-watch"
      >
        <i class="fas fa-eye"></i>
        <span>{{ t('participantActions.watch') }}</span>
        <AdminBadge v-if="classBadge" icon-only />
      </router-link>
      <button
        v-else-if="canWatchOnWall"
        type="button"
        class="ocf-dropdown-item"
        data-testid="participant-action-watch"
        @click="emit('watch-screen', runningSession!.session_id)"
      >
        <i class="fas fa-eye"></i>
        <span>{{ t('participantActions.watch') }}</span>
        <AdminBadge v-if="classBadge" icon-only />
      </button>
      <router-link
        v-if="sessionPageLink"
        :to="sessionPageLink"
        class="ocf-dropdown-item"
        data-testid="participant-action-open-session"
      >
        <i class="fas fa-external-link-alt"></i>
        <span>{{ t('participantActions.openSession') }}</span>
        <AdminBadge v-if="classBadge" icon-only />
      </router-link>

      <button
        v-if="canCutInternet"
        type="button"
        class="ocf-dropdown-item"
        data-testid="participant-action-cut-internet"
        :disabled="busy"
        @click="ask('cut')"
      >
        <i class="fas fa-plug-circle-xmark"></i>
        <span>{{ t('participantActions.cutInternet') }}</span>
        <AdminBadge v-if="classBadge" icon-only />
      </button>
      <button
        v-if="canRestoreInternet"
        type="button"
        class="ocf-dropdown-item"
        data-testid="participant-action-restore-internet"
        :disabled="busy"
        @click="restoreInternet"
      >
        <i class="fas fa-plug-circle-check"></i>
        <span>{{ t('participantActions.restoreInternet') }}</span>
        <AdminBadge v-if="classBadge" icon-only />
      </button>
      <button
        v-if="runningSession"
        type="button"
        class="ocf-dropdown-item ocf-dropdown-item--danger"
        data-testid="participant-action-stop"
        :disabled="busy"
        @click="ask('stop')"
      >
        <i class="fas fa-stop"></i>
        <span>{{ t('participantActions.stop') }}</span>
        <AdminBadge v-if="classBadge" icon-only />
      </button>
      <button
        v-if="participant?.class_block"
        type="button"
        class="ocf-dropdown-item"
        data-testid="participant-action-unblock-class"
        :disabled="busy"
        @click="unblockClass"
      >
        <i class="fas fa-lock-open"></i>
        <span>{{ t('participantActions.unblockClass') }}</span>
        <AdminBadge v-if="classBadge" icon-only />
      </button>
      <button
        v-else
        type="button"
        class="ocf-dropdown-item ocf-dropdown-item--danger"
        data-testid="participant-action-block-class"
        :disabled="busy"
        @click="ask('block-class')"
      >
        <i class="fas fa-ban"></i>
        <span>{{ t('participantActions.blockClass') }}</span>
        <AdminBadge v-if="classBadge" icon-only />
      </button>
    </template>

    <template v-if="orgActions">
      <button
        v-if="participant?.org_blocked"
        type="button"
        class="ocf-dropdown-item"
        data-testid="participant-action-unblock-org"
        :disabled="busy"
        @click="unblockOrg"
      >
        <i class="fas fa-lock-open"></i>
        <span>{{ t('participantActions.unblockOrg') }}</span>
        <AdminBadge v-if="orgBadge" icon-only />
      </button>
      <button
        v-else
        type="button"
        class="ocf-dropdown-item ocf-dropdown-item--danger"
        data-testid="participant-action-block-org"
        :disabled="busy"
        @click="ask('block-org')"
      >
        <i class="fas fa-building-lock"></i>
        <span>{{ t('participantActions.blockOrg') }}</span>
        <AdminBadge v-if="orgBadge" icon-only />
      </button>
    </template>
    <div
      v-else-if="orgBlockReadOnly"
      class="ocf-dropdown-item ocf-participant-actions__note"
      role="note"
      data-testid="participant-org-block-readonly"
      @click.stop
    >
      <i class="fas fa-building-lock"></i>
      <span>{{ t('participantActions.orgBlocked') }}</span>
    </div>
  </DropdownMenu>

  <!-- Outside the menu (it closes on the click that opens the dialog), and out
       of the host: a wall tile's keys and clicks never see the dialog's. -->
  <Teleport to="body">
    <BaseModal
      :visible="!!dialog"
      :title="dialog?.title"
      size="small"
      :show-default-footer="true"
      :confirm-text="dialog?.confirm"
      :cancel-text="t('participantActions.cancel')"
      confirm-variant="danger"
      confirm-test-id="participant-confirm"
      cancel-test-id="participant-cancel"
      @confirm="confirmPending"
      @close="cancel"
    >
      <p class="ocf-participant-actions__body">{{ dialog?.body }}</p>
      <template v-if="isBlockDialog">
        <div class="form-group">
          <label for="participant-block-reason">{{ t('participantActions.reasonLabel') }}</label>
          <textarea
            id="participant-block-reason"
            v-model="reason"
            class="form-control"
            rows="3"
            :maxlength="REASON_MAX"
            data-testid="participant-block-reason"
          ></textarea>
          <small class="form-text" data-testid="participant-block-reason-count">{{ reason.length }}/{{ REASON_MAX }}</small>
        </div>
        <template v-if="runningSession">
          <label class="checkbox-label">
            <input v-model="stopRunning" type="checkbox" data-testid="participant-block-stop-running" />
            {{ t('participantActions.stopRunning') }}
          </label>
          <p class="form-text" data-testid="participant-block-running-note">{{ runningNote }}</p>
        </template>
      </template>
    </BaseModal>
  </Teleport>
</template>

<style scoped>
.ocf-participant-actions__note {
  color: var(--color-text-secondary);
  cursor: default;
}

.ocf-participant-actions__body {
  margin: 0 0 var(--spacing-md) 0;
}
</style>
