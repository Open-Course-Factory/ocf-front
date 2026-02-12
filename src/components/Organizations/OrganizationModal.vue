<template>
  <BaseModal
    :visible="isOpen"
    :title="isEditMode ? t('organizations.editOrganization') : t('organizations.createOrganization')"
    :title-icon="isEditMode ? 'fas fa-edit' : 'fas fa-plus'"
    size="medium"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit">
      <!-- Name -->
      <div class="form-group">
        <label for="org-name">
          {{ t('organizations.name') }}
          <span class="required">*</span>
        </label>
        <input
          id="org-name"
          v-model="formData.name"
          type="text"
          :class="['form-control', { 'is-invalid': nameError }]"
          :placeholder="t('organizations.namePlaceholder')"
          :disabled="isEditMode"
          required
          @input="validateName"
        />
        <small v-if="nameError" class="field-error">{{ nameError }}</small>
        <small v-else class="form-text">{{ t('organizations.nameHelp') }}</small>
      </div>

      <!-- Display Name -->
      <div class="form-group">
        <label for="org-display-name">
          {{ t('organizations.displayName') }}
          <span class="required">*</span>
        </label>
        <input
          id="org-display-name"
          v-model="formData.display_name"
          type="text"
          class="form-control"
          :placeholder="t('organizations.displayNamePlaceholder')"
          required
        />
      </div>

      <!-- Description -->
      <div class="form-group">
        <label for="org-description">
          {{ t('organizations.description') }}
        </label>
        <textarea
          id="org-description"
          v-model="formData.description"
          class="form-control"
          rows="3"
          :placeholder="t('organizations.descriptionPlaceholder')"
        ></textarea>
      </div>

      <!-- Max Groups -->
      <div class="form-group">
        <label for="org-max-groups">
          {{ t('organizations.maxGroups') }}
        </label>
        <input
          id="org-max-groups"
          v-model.number="formData.max_groups"
          type="number"
          class="form-control"
          min="1"
          :placeholder="t('organizations.maxGroupsPlaceholder')"
        />
      </div>

      <!-- Max Members -->
      <div class="form-group">
        <label for="org-max-members">
          {{ t('organizations.maxMembers') }}
        </label>
        <input
          id="org-max-members"
          v-model.number="formData.max_members"
          type="number"
          class="form-control"
          min="1"
          :placeholder="t('organizations.maxMembersPlaceholder')"
        />
      </div>

      <!-- Error Message -->
      <div v-if="error" class="alert alert-danger">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        @click="handleClose"
        :disabled="isSubmitting"
      >
        {{ t('organizations.cancel') }}
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        @click="handleSubmit"
        :disabled="isSubmitting || !isFormValid"
      >
        <i :class="isSubmitting ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
        {{ isSubmitting ? t('organizations.saving') : t('organizations.save') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '../Modals/BaseModal.vue'
import { useTranslations } from '../../composables/useTranslations'
import type { Organization, CreateOrganizationRequest, UpdateOrganizationRequest } from '../../types'

interface Props {
  isOpen: boolean
  organization?: Organization | null
  isSubmitting?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  organization: null,
  isSubmitting: false,
  error: ''
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: CreateOrganizationRequest | UpdateOrganizationRequest): void
}>()

const { t } = useTranslations({
  en: {
    organizations: {
      createOrganization: 'Create Organization',
      editOrganization: 'Edit Organization',
      name: 'Organization Name',
      namePlaceholder: 'e.g., acme-corp',
      nameHelp: 'Unique identifier (lowercase, no spaces)',
      displayName: 'Display Name',
      displayNamePlaceholder: 'e.g., ACME Corporation',
      description: 'Description',
      descriptionPlaceholder: 'What is this organization for?',
      maxGroups: 'Max Groups',
      maxGroupsPlaceholder: '10',
      maxMembers: 'Max Members',
      maxMembersPlaceholder: '50',
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving...',
      nameInvalid: 'Only lowercase letters, numbers and hyphens allowed',
      nameRequired: 'Organization name is required',
    }
  },
  fr: {
    organizations: {
      createOrganization: 'Créer une organisation',
      editOrganization: 'Modifier l\'organisation',
      name: 'Nom de l\'organisation',
      namePlaceholder: 'ex: acme-corp',
      nameHelp: 'Identifiant unique (minuscules, sans espaces)',
      displayName: 'Nom d\'affichage',
      displayNamePlaceholder: 'ex: ACME Corporation',
      description: 'Description',
      descriptionPlaceholder: 'À quoi sert cette organisation ?',
      maxGroups: 'Groupes max',
      maxGroupsPlaceholder: '10',
      maxMembers: 'Membres max',
      maxMembersPlaceholder: '50',
      cancel: 'Annuler',
      save: 'Enregistrer',
      saving: 'Enregistrement...',
      nameInvalid: 'Seuls les lettres minuscules, chiffres et tirets sont autorisés',
      nameRequired: 'Le nom de l\'organisation est requis',
    }
  }
})

const isEditMode = computed(() => !!props.organization)

const formData = ref<CreateOrganizationRequest>({
  name: '',
  display_name: '',
  description: '',
  max_groups: 10,
  max_members: 50,
})

// Watch for organization changes
watch(() => props.organization, (org) => {
  if (org) {
    formData.value = {
      name: org.name,
      display_name: org.display_name,
      description: org.description || '',
      max_groups: org.max_groups,
      max_members: org.max_members,
    }
  } else {
    // Reset form
    formData.value = {
      name: '',
      display_name: '',
      description: '',
      max_groups: 10,
      max_members: 50,
    }
  }
}, { immediate: true })

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/
const nameError = ref('')

const validateName = () => {
  const name = formData.value.name.trim()
  if (!name) {
    nameError.value = t('organizations.nameRequired')
  } else if (!NAME_PATTERN.test(name)) {
    nameError.value = t('organizations.nameInvalid')
  } else {
    nameError.value = ''
  }
}

const isFormValid = computed(() => {
  return formData.value.name.trim() !== ''
    && formData.value.display_name.trim() !== ''
    && !nameError.value
})

const handleClose = () => {
  if (!props.isSubmitting) {
    emit('close')
  }
}

const handleSubmit = () => {
  if (!isFormValid.value || props.isSubmitting) return

  if (isEditMode.value) {
    // For edit mode, only send updatable fields
    const updateData: UpdateOrganizationRequest = {
      display_name: formData.value.display_name,
      description: formData.value.description,
      max_groups: formData.value.max_groups,
      max_members: formData.value.max_members,
    }
    emit('submit', updateData)
  } else {
    emit('submit', formData.value)
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.required {
  color: var(--color-danger);
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-control:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.form-control.is-invalid {
  border-color: var(--color-danger);
}

.field-error {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-danger);
}

textarea.form-control {
  resize: vertical;
}

.alert {
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.alert-danger {
  background: var(--color-danger-light);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}
</style>
