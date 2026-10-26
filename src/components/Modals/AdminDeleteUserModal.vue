<template>
  <BaseModal
    :visible="visible"
    :title="t('adminDeleteUser.title')"
    title-icon="fas fa-trash-alt"
    size="medium"
    :is-loading="deleting"
    @close="close"
  >
    <div class="ocf-delete-user">
      <p class="alert alert-warning">
        <i class="fas fa-exclamation-triangle"></i>
        {{ t('adminDeleteUser.warning', { name: userName }) }}
      </p>
      <ul class="ocf-delete-user__bullets">
        <li>{{ t('adminDeleteUser.bulletData') }}</li>
        <li>{{ t('adminDeleteUser.bulletIrreversible') }}</li>
        <li>{{ t('adminDeleteUser.bulletOwnership') }}</li>
      </ul>

      <div class="form-group">
        <label for="du-confirm">{{ t('adminDeleteUser.typeToConfirm', { username: user?.username }) }}</label>
        <input
          id="du-confirm"
          v-model="typedUsername"
          type="text"
          class="form-control"
          autocomplete="off"
          :disabled="deleting"
        />
      </div>

      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>
    </div>
    <template #footer>
      <button type="button" class="btn btn-secondary" :disabled="deleting" @click="close">
        {{ t('adminDeleteUser.cancel') }}
      </button>
      <button type="button" class="btn btn-danger" :disabled="deleting || !confirmed" @click="submit">
        <i :class="deleting ? 'fas fa-spinner fa-spin' : 'fas fa-trash-alt'"></i>
        {{ t('adminDeleteUser.title') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useAdminUserError } from '../../composables/useAdminUserError'
import { adminUsersService, type AdminUserListing } from '../../services/admin/usersService'
import BaseModal from './BaseModal.vue'

const props = defineProps<{
  visible: boolean
  user: AdminUserListing | null
}>()

const emit = defineEmits<{
  close: []
  deleted: [userId: string]
}>()

const { t } = useTranslations({
  en: {
    adminDeleteUser: {
      title: 'Delete user',
      cancel: 'Cancel',
      error: 'Failed to delete user',
      warning: 'You are about to permanently delete {name}\'s account. This cannot be undone.',
      bulletData: 'All their data is erased: memberships, personal organization, sessions and settings. Invoices and payment records are anonymized, not deleted.',
      bulletIrreversible: 'This action is immediate and cannot be reversed.',
      bulletOwnership: 'If they still own a non-personal organization or group, deletion is refused until ownership is transferred.',
      typeToConfirm: 'Type "{username}" to confirm'
    }
  },
  fr: {
    adminDeleteUser: {
      title: 'Supprimer l’utilisateur',
      cancel: 'Annuler',
      error: 'Échec de la suppression de l’utilisateur',
      warning: 'Vous êtes sur le point de supprimer définitivement le compte de {name}. Cette action est irréversible.',
      bulletData: 'Toutes ses données sont effacées : appartenances, organisation personnelle, sessions et réglages. Les factures et paiements sont anonymisés, pas supprimés.',
      bulletIrreversible: 'Cette action est immédiate et ne peut pas être annulée.',
      bulletOwnership: 'S’il/elle possède encore une organisation ou un groupe non personnel, la suppression est refusée jusqu’au transfert de propriété.',
      typeToConfirm: 'Tapez « {username} » pour confirmer'
    }
  }
})
const describeError = useAdminUserError()

const userName = computed(() => props.user?.display_name || props.user?.username || '')
const typedUsername = ref('')
const deleting = ref(false)
const error = ref('')
const confirmed = computed(() => !!props.user && typedUsername.value === props.user.username)

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    typedUsername.value = ''
    error.value = ''
  }
)

function close() {
  if (!deleting.value) emit('close')
}

async function submit() {
  if (!props.user || !confirmed.value) return
  const userId = props.user.id
  deleting.value = true
  error.value = ''
  try {
    await adminUsersService.deleteUser(userId)
    emit('deleted', userId)
  } catch (err: any) {
    error.value = describeError(err, t('adminDeleteUser.error'))
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.ocf-delete-user {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.ocf-delete-user__bullets {
  margin: 0;
  padding-left: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
</style>
