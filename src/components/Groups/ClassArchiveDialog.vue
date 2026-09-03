<!--
  Archive a class and offboard the cohort that leaves with it.

  The backend's archive-preview decides who may be offboarded from here: a
  member still in another open class of the organization keeps their access
  whatever is ticked, and one already offboarded has nothing left to switch.
  Archiving happens first, through the generic store action, and offboarding
  is a second call on the organization — the two rules live in two places on
  the backend, so a failure of the second is reported as exactly that.
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useClassGroupsStore } from '../../stores/classGroups'
import { classArchiveService } from '../../services/domain/group'
import { organizationService } from '../../services/domain/organization'
import type { ClassArchivePreview, ClassArchivePreviewMember, ClassGroup } from '../../types'
import BaseModal from '../Modals/BaseModal.vue'

const props = defineProps<{
  visible: boolean
  group: Pick<ClassGroup, 'id' | 'organization_id' | 'display_name'>
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'archived'): void
}>()

const groupStore = useClassGroupsStore()

const { t } = useTranslations({
  en: {
    classArchive: {
      title: 'Archive {name}',
      intro: 'The class closes: no new member, assignment or session. Its roster and results stay readable.',
      loading: 'Checking who leaves with the class...',
      membersHeading: 'Who leaves the organization with this class?',
      noMembers: 'This class has no member.',
      continuing: 'Continuing',
      left: 'Has left',
      markAllLeft: 'Mark all as left',
      markAllContinuing: 'Keep all',
      reasonOtherClasses: 'In {count} other open classes of the organization',
      reasonOtherClass: 'In 1 other open class of the organization',
      reasonOffboarded: 'Already offboarded',
      leftCountZero: 'No member will be offboarded',
      leftCountOne: '1 member will be offboarded',
      leftCountMany: '{count} members will be offboarded',
      retentionWithDays: 'Members marked as left lose access today; their accounts are erased after {days} days, the retention delay of the organization.',
      retentionDefault: 'Members marked as left lose access today; their accounts are erased after the platform default retention delay.',
      confirm: 'Archive the class',
      cancel: 'Cancel',
      archiving: 'Archiving...',
      archiveFailed: 'The class could not be archived',
      offboardFailed: 'The class is archived, but offboarding failed: {reason}',
      previewFailed: 'The members of this class could not be checked'
    }
  },
  fr: {
    classArchive: {
      title: 'Archiver {name}',
      intro: 'La classe se ferme : plus de nouveau membre, d’assignation ni de session. Sa liste et ses résultats restent consultables.',
      loading: 'Vérification de qui part avec la classe...',
      membersHeading: 'Qui quitte l’organisation avec cette classe ?',
      noMembers: 'Cette classe n’a aucun membre.',
      continuing: 'Continue',
      left: 'Parti',
      markAllLeft: 'Tous partis',
      markAllContinuing: 'Tous continuent',
      reasonOtherClasses: 'Dans {count} autres classes ouvertes de l’organisation',
      reasonOtherClass: 'Dans 1 autre classe ouverte de l’organisation',
      reasonOffboarded: 'Déjà parti',
      leftCountZero: 'Aucun membre ne sera désinscrit',
      leftCountOne: '1 membre sera désinscrit',
      leftCountMany: '{count} membres seront désinscrits',
      retentionWithDays: 'Les membres marqués comme partis perdent l’accès aujourd’hui ; leurs comptes sont effacés après {days} jours, le délai de conservation de l’organisation.',
      retentionDefault: 'Les membres marqués comme partis perdent l’accès aujourd’hui ; leurs comptes sont effacés après le délai de conservation par défaut de la plateforme.',
      confirm: 'Archiver la classe',
      cancel: 'Annuler',
      archiving: 'Archivage...',
      archiveFailed: 'La classe n’a pas pu être archivée',
      offboardFailed: 'La classe est archivée, mais la désinscription a échoué : {reason}',
      previewFailed: 'Les membres de cette classe n’ont pas pu être vérifiés'
    }
  }
})

const preview = ref<ClassArchivePreview | null>(null)
const isLoading = ref(false)
const isArchiving = ref(false)
const error = ref('')
const leftUserIds = ref<Set<string>>(new Set())
// Set once the archive call succeeded: a retry after a failed offboarding
// must not archive the class a second time.
const isArchivedHere = ref(false)

const backendReason = (err: any, fallbackKey: string) =>
  err?.response?.data?.error_message || err?.message || t(fallbackKey)

// Mirrors the backend rule (ocf-core#492): offboarding is only offered to a
// member the organization would otherwise lose track of — active, and in no
// other open class. The backend re-checks; this only removes wrong choices.
const isEligible = (member: ClassArchivePreviewMember) =>
  member.other_active_classes_in_org === 0 && member.org_member_state !== 'offboarded'

const members = computed(() => {
  const all = preview.value?.members ?? []
  return [...all.filter(isEligible), ...all.filter(m => !isEligible(m))]
})

const eligibleMembers = computed(() => members.value.filter(isEligible))

const reasonFor = (member: ClassArchivePreviewMember): string => {
  if (member.org_member_state === 'offboarded') return t('classArchive.reasonOffboarded')
  return member.other_active_classes_in_org === 1
    ? t('classArchive.reasonOtherClass')
    : t('classArchive.reasonOtherClasses', { count: member.other_active_classes_in_org })
}

const leftCountLabel = computed(() => {
  const count = leftUserIds.value.size
  const key = count === 0
    ? 'classArchive.leftCountZero'
    : count === 1 ? 'classArchive.leftCountOne' : 'classArchive.leftCountMany'
  return t(key, { count })
})

const retentionSentence = computed(() => {
  const days = preview.value?.retention_days
  return days == null
    ? t('classArchive.retentionDefault')
    : t('classArchive.retentionWithDays', { days })
})

const hasLeft = (member: ClassArchivePreviewMember) => leftUserIds.value.has(member.user_id)

const setLeft = (member: ClassArchivePreviewMember, left: boolean) => {
  const next = new Set(leftUserIds.value)
  if (left) next.add(member.user_id)
  else next.delete(member.user_id)
  leftUserIds.value = next
}

const markAll = (left: boolean) => {
  leftUserIds.value = left
    ? new Set(eligibleMembers.value.map(m => m.user_id))
    : new Set()
}

const loadPreview = async () => {
  preview.value = null
  error.value = ''
  leftUserIds.value = new Set()
  isArchivedHere.value = false
  isLoading.value = true
  try {
    preview.value = await classArchiveService.getArchivePreview(props.group.id)
  } catch (err: any) {
    error.value = backendReason(err, 'classArchive.previewFailed')
  } finally {
    isLoading.value = false
  }
}

watch(() => props.visible, (visible) => {
  if (visible) loadPreview()
}, { immediate: true })

const canConfirm = computed(() => !isLoading.value && !isArchiving.value && preview.value !== null)

const confirm = async () => {
  if (!canConfirm.value) return

  isArchiving.value = true
  error.value = ''
  if (!isArchivedHere.value) {
    try {
      await groupStore.archiveEntity('/class-groups', props.group.id)
    } catch (err: any) {
      error.value = backendReason(err, 'classArchive.archiveFailed')
      isArchiving.value = false
      return
    }
    // From here the class IS archived: the caller must refresh whatever
    // happens to the second call, and a failure names itself as an
    // offboarding one.
    isArchivedHere.value = true
    emit('archived')
  }

  try {
    if (leftUserIds.value.size > 0) {
      await organizationService.offboardMembers(props.group.organization_id, [...leftUserIds.value])
    }
    emit('close')
  } catch (err: any) {
    error.value = t('classArchive.offboardFailed', { reason: backendReason(err, 'classArchive.archiveFailed') })
  } finally {
    isArchiving.value = false
  }
}
</script>

<template>
  <BaseModal
    :visible="visible"
    :title="t('classArchive.title', { name: group.display_name })"
    title-icon="fas fa-box-archive"
    size="medium"
    show-default-footer
    :confirm-text="t('classArchive.confirm')"
    confirm-icon="fas fa-box-archive"
    :confirm-disabled="!canConfirm"
    :cancel-text="t('classArchive.cancel')"
    :is-loading="isArchiving"
    :loading-text="t('classArchive.archiving')"
    :close-on-overlay-click="!isArchiving"
    @close="emit('close')"
    @confirm="confirm"
  >
    <p class="ocf-archive-intro">{{ t('classArchive.intro') }}</p>

    <!-- Reserved slot: the error line keeps its height whether or not it has
         something to say, so the list below never jumps. -->
    <p class="ocf-archive-error" :class="{ 'ocf-archive-error--empty': !error }" data-test="archive-error" aria-live="polite">
      {{ error }}
    </p>

    <div v-if="isLoading" class="ocf-archive-loading">
      <i class="fas fa-spinner fa-spin"></i>
      {{ t('classArchive.loading') }}
    </div>

    <template v-else-if="preview">
      <div class="ocf-archive-members-header">
        <h4>{{ t('classArchive.membersHeading') }}</h4>
        <div class="ocf-archive-bulk" v-if="eligibleMembers.length > 0">
          <button type="button" class="btn btn-sm btn-secondary" data-test="mark-all-continuing" @click="markAll(false)">
            {{ t('classArchive.markAllContinuing') }}
          </button>
          <button type="button" class="btn btn-sm btn-secondary" data-test="mark-all-left" @click="markAll(true)">
            {{ t('classArchive.markAllLeft') }}
          </button>
        </div>
      </div>

      <p v-if="members.length === 0" class="ocf-archive-empty">{{ t('classArchive.noMembers') }}</p>

      <ul v-else class="ocf-archive-members">
        <li
          v-for="member in members"
          :key="member.user_id"
          class="ocf-archive-member"
          :class="{ 'ocf-archive-member--kept': !isEligible(member) }"
          data-test="archive-member"
        >
          <div class="ocf-archive-member-identity">
            <span class="ocf-archive-member-name" data-test="member-name">{{ member.display_name || member.email }}</span>
            <span class="ocf-archive-member-email">{{ member.email }}</span>
          </div>
          <label v-if="isEligible(member)" class="ocf-archive-switch">
            <input
              type="checkbox"
              data-test="member-left"
              :checked="hasLeft(member)"
              @change="setLeft(member, ($event.target as HTMLInputElement).checked)"
            />
            <span>{{ hasLeft(member) ? t('classArchive.left') : t('classArchive.continuing') }}</span>
          </label>
          <span v-else class="ocf-archive-member-reason" data-test="member-reason">{{ reasonFor(member) }}</span>
        </li>
      </ul>

      <p class="ocf-archive-left-count" data-test="left-count">{{ leftCountLabel }}</p>
      <p class="ocf-archive-retention" data-test="retention-sentence">
        <i class="fas fa-info-circle"></i>
        {{ retentionSentence }}
      </p>
    </template>
  </BaseModal>
</template>

<style scoped>
.ocf-archive-intro {
  margin: 0 0 var(--spacing-sm);
  color: var(--color-text-secondary);
}

.ocf-archive-error {
  min-height: 1.5em;
  margin: 0 0 var(--spacing-md);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}

.ocf-archive-error--empty {
  visibility: hidden;
}

.ocf-archive-loading,
.ocf-archive-empty {
  color: var(--color-text-muted);
  padding: var(--spacing-md) 0;
}

.ocf-archive-members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.ocf-archive-members-header h4 {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.ocf-archive-bulk {
  display: flex;
  gap: var(--spacing-xs);
}

.ocf-archive-members {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 40vh;
  overflow-y: auto;
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
}

.ocf-archive-member {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
}

.ocf-archive-member:last-child {
  border-bottom: none;
}

.ocf-archive-member--kept {
  color: var(--color-text-muted);
  background: var(--color-bg-secondary);
}

.ocf-archive-member-identity {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ocf-archive-member-name {
  font-weight: var(--font-weight-medium);
}

.ocf-archive-member-email {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Fixed width: the label flips between two words without moving the column. */
.ocf-archive-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  min-width: 7rem;
  cursor: pointer;
  user-select: none;
}

.ocf-archive-member-reason {
  font-size: var(--font-size-sm);
  font-style: italic;
  text-align: right;
}

.ocf-archive-left-count {
  margin: var(--spacing-sm) 0 0;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.ocf-archive-retention {
  margin: var(--spacing-xs) 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
