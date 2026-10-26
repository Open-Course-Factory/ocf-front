<template>
  <BaseModal
    :visible="visible"
    :title="t('adminSetPassword.title')"
    title-icon="fas fa-unlock-keyhole"
    size="medium"
    :is-loading="saving"
    @close="close"
  >
    <form id="admin-set-password-form" class="ocf-admin-user-form" @submit.prevent="submit">
      <p class="form-text">{{ t('adminSetPassword.warning', { name: userName }) }}</p>
      <PasswordConfirmFields v-model:password="password" v-model:confirm="passwordConfirm" id-prefix="sp" />

      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>
    </form>
    <template #footer>
      <button type="button" class="btn btn-secondary" :disabled="saving" @click="close">
        {{ t('adminSetPassword.cancel') }}
      </button>
      <!-- Outside the <form> (BaseModal footer): the form attribute keeps it
           the form's submitter so native validation runs. -->
      <button
        type="submit"
        form="admin-set-password-form"
        class="btn btn-primary"
        :disabled="saving || !passwordConfirmed(password, passwordConfirm)"
      >
        <i v-if="saving" class="fas fa-spinner fa-spin"></i>
        {{ t('adminSetPassword.title') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useAdminUserError } from '../../composables/useAdminUserError'
import { adminUsersService, type AdminUserListing } from '../../services/admin/usersService'
import { passwordConfirmed } from '../../utils/passwordConfirmation'
import BaseModal from './BaseModal.vue'
import PasswordConfirmFields from '../Common/PasswordConfirmFields.vue'

const props = defineProps<{
  visible: boolean
  user: AdminUserListing | null
}>()

const emit = defineEmits<{ close: [] }>()

const { t } = useTranslations({
  en: {
    adminSetPassword: {
      title: 'Set password',
      cancel: 'Cancel',
      warning: 'Set a new password for {name} directly. No email is sent — share it with them yourself.',
      error: 'Failed to set password'
    }
  },
  fr: {
    adminSetPassword: {
      title: 'Définir le mot de passe',
      cancel: 'Annuler',
      warning: 'Définissez directement un nouveau mot de passe pour {name}. Aucun email n’est envoyé — transmettez-le vous-même.',
      error: 'Échec de la définition du mot de passe'
    }
  }
})
const describeError = useAdminUserError()

const userName = computed(() => props.user?.display_name || props.user?.username || '')
const password = ref('')
const passwordConfirm = ref('')
const saving = ref(false)
const error = ref('')

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    password.value = ''
    passwordConfirm.value = ''
    error.value = ''
  }
)

function close() {
  if (!saving.value) emit('close')
}

async function submit() {
  if (!props.user || !passwordConfirmed(password.value, passwordConfirm.value)) return
  saving.value = true
  error.value = ''
  try {
    await adminUsersService.setPassword(props.user.id, password.value)
    emit('close')
  } catch (err: any) {
    error.value = describeError(err, t('adminSetPassword.error'))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.ocf-admin-user-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
</style>
