<template>
  <BaseModal
    :visible="visible"
    :title="t('adminCreateUser.title')"
    title-icon="fas fa-user-plus"
    size="medium"
    :is-loading="creating"
    @close="close"
  >
    <form id="admin-create-user-form" class="ocf-admin-user-form" @submit.prevent="submit">
      <div class="form-row">
        <div class="form-group">
          <label for="cu-first-name">{{ t('adminCreateUser.firstName') }}</label>
          <input id="cu-first-name" v-model="form.first_name" type="text" class="form-control" required />
        </div>
        <div class="form-group">
          <label for="cu-last-name">{{ t('adminCreateUser.lastName') }}</label>
          <input id="cu-last-name" v-model="form.last_name" type="text" class="form-control" required />
        </div>
      </div>
      <div class="form-group">
        <label for="cu-display-name">{{ t('adminCreateUser.displayName') }}</label>
        <input id="cu-display-name" v-model="form.display_name" type="text" class="form-control" required />
      </div>
      <div class="form-group">
        <label for="cu-username">{{ t('adminCreateUser.username') }}</label>
        <input id="cu-username" v-model="form.username" type="text" class="form-control" required />
      </div>
      <div class="form-group">
        <label for="cu-email">{{ t('adminCreateUser.email') }}</label>
        <input id="cu-email" v-model="form.email" type="email" class="form-control" required />
      </div>
      <PasswordConfirmFields
        v-model:password="form.password"
        v-model:confirm="passwordConfirm"
        id-prefix="cu"
        :hint="t('adminCreateUser.passwordHint')"
      />
      <label class="checkbox-label">
        <input v-model="form.email_verified" type="checkbox" />
        {{ t('adminCreateUser.emailVerifiedCheckbox') }}
      </label>

      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>
    </form>
    <template #footer>
      <button type="button" class="btn btn-secondary" :disabled="creating" @click="close">
        {{ t('adminCreateUser.cancel') }}
      </button>
      <!-- Submit lives in BaseModal's footer, outside the <form>: the form
           attribute keeps it the form's submitter so native validation runs. -->
      <button
        type="submit"
        form="admin-create-user-form"
        class="btn btn-primary"
        :disabled="creating || !passwordConfirmed(form.password, passwordConfirm)"
      >
        <i v-if="creating" class="fas fa-spinner fa-spin"></i>
        {{ t('adminCreateUser.submit') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useAdminUserError } from '../../composables/useAdminUserError'
import { adminUsersService, type AdminCreateUserInput, type AdminUserListing } from '../../services/admin/usersService'
import { passwordConfirmed } from '../../utils/passwordConfirmation'
import BaseModal from './BaseModal.vue'
import PasswordConfirmFields from '../Common/PasswordConfirmFields.vue'

const props = defineProps<{ visible: boolean }>()

const emit = defineEmits<{
  close: []
  created: [user: AdminUserListing]
}>()

const { t } = useTranslations({
  en: {
    adminCreateUser: {
      title: 'Create user',
      submit: 'Create user',
      cancel: 'Cancel',
      firstName: 'First name',
      lastName: 'Last name',
      displayName: 'Display name',
      username: 'Username',
      email: 'Email',
      passwordHint: 'At least 8 characters. Share it with the user yourself — it is not emailed to them.',
      emailVerifiedCheckbox: 'Email already verified (I confirmed this address myself)',
      error: 'Failed to create user'
    }
  },
  fr: {
    adminCreateUser: {
      title: 'Créer un utilisateur',
      submit: 'Créer un utilisateur',
      cancel: 'Annuler',
      firstName: 'Prénom',
      lastName: 'Nom',
      displayName: 'Nom affiché',
      username: 'Nom d’utilisateur',
      email: 'Email',
      passwordHint: 'Au moins 8 caractères. Transmettez-le vous-même à l’utilisateur — il ne lui est pas envoyé par email.',
      emailVerifiedCheckbox: 'Email déjà validé (j’ai vérifié cette adresse moi-même)',
      error: 'Échec de la création de l’utilisateur'
    }
  }
})
const describeError = useAdminUserError()

function emptyForm(): AdminCreateUserInput {
  return {
    username: '',
    display_name: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    email_verified: false
  }
}

const form = ref<AdminCreateUserInput>(emptyForm())
const passwordConfirm = ref('')
const creating = ref(false)
const error = ref('')

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    form.value = emptyForm()
    passwordConfirm.value = ''
    error.value = ''
  }
)

function close() {
  if (!creating.value) emit('close')
}

async function submit() {
  if (!passwordConfirmed(form.value.password, passwordConfirm.value)) return
  creating.value = true
  error.value = ''
  try {
    const created = await adminUsersService.createUser(form.value)
    emit('created', {
      id: created.id,
      username: created.username,
      display_name: form.value.display_name,
      email: created.email,
      is_active: true,
      is_admin: false,
      email_verified: form.value.email_verified,
      organizations: [],
      groups: []
    })
  } catch (err: any) {
    error.value = describeError(err, t('adminCreateUser.error'))
  } finally {
    creating.value = false
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
