<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <BaseModal
    :visible="visible"
    :title="t('licenseAssignment.title')"
    :show-default-footer="true"
    :confirm-text="t('licenseAssignment.assign')"
    :cancel-text="t('licenseAssignment.cancel')"
    :is-loading="isAssigning"
    :confirm-disabled="!selectedUserId"
    @confirm="handleAssign"
    @close="handleClose"
  >
    <div class="assignment-modal-content">
      <p class="modal-description">
        {{ t('licenseAssignment.description') }}
      </p>

      <!-- User Search -->
      <div class="form-group">
        <label for="user-search">
          {{ t('licenseAssignment.searchUser') }}
        </label>
        <input
          id="user-search"
          v-model="searchQuery"
          type="text"
          class="form-control"
          :placeholder="t('licenseAssignment.searchPlaceholder')"
          @input="handleSearch"
        />
      </div>

      <!-- Search Results -->
      <div v-if="isSearching" class="search-loading">
        <i class="fas fa-spinner fa-spin"></i>
        {{ t('licenseAssignment.searching') }}
      </div>

      <div v-else-if="searchResults.length > 0" class="search-results">
        <div
          v-for="user in searchResults"
          :key="user.id"
          :class="['user-result', { selected: selectedUserId === user.id }]"
          @click="selectUser(user.id)"
        >
          <div class="user-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="user-info">
            <div class="user-name">{{ user.display_name || user.username }}</div>
            <div class="user-email">{{ user.email }}</div>
          </div>
          <div v-if="selectedUserId === user.id" class="user-check">
            <i class="fas fa-check-circle"></i>
          </div>
        </div>
      </div>

      <div v-else-if="searchQuery.length > 2" class="empty-results">
        <i class="fas fa-search"></i>
        <p>{{ t('licenseAssignment.noResults') }}</p>
      </div>

      <!-- Error message -->
      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import BaseModal from './BaseModal.vue'
import { userService } from '../../services/domain/user'
import type { User } from '../../types/entities'

const props = defineProps<{
  visible: boolean
  batchId: string
}>()

const emit = defineEmits<{
  close: []
  assigned: [userId: string]
}>()

const { t } = useTranslations({
  en: {
    licenseAssignment: {
      title: 'Assign License',
      description: 'Search for a user to assign a license to',
      searchUser: 'Search for user',
      searchPlaceholder: 'Enter name or email...',
      searching: 'Searching...',
      noResults: 'No users found',
      assign: 'Assign License',
      cancel: 'Cancel',
      assignSuccess: 'License assigned successfully',
      assignError: 'Failed to assign license'
    }
  },
  fr: {
    licenseAssignment: {
      title: 'Assigner une Licence',
      description: 'Rechercher un utilisateur pour lui assigner une licence',
      searchUser: 'Rechercher un utilisateur',
      searchPlaceholder: 'Entrer un nom ou email...',
      searching: 'Recherche...',
      noResults: 'Aucun utilisateur trouvé',
      assign: 'Assigner la Licence',
      cancel: 'Annuler',
      assignSuccess: 'Licence assignée avec succès',
      assignError: 'Échec de l\'assignation de la licence'
    }
  }
})

const searchQuery = ref('')
const searchResults = ref<User[]>([])
const selectedUserId = ref('')
const isSearching = ref(false)
const isAssigning = ref(false)
const error = ref('')

let searchTimeout: NodeJS.Timeout | null = null

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (searchQuery.value.length < 3) {
    searchResults.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    isSearching.value = true
    error.value = ''

    try {
      const results = await userService.searchUsers(searchQuery.value)
      searchResults.value = results
    } catch (err: any) {
      console.error('Search error:', err)
      error.value = err.response?.data?.error_message ||
                    err.response?.data?.message ||
                    t('licenseAssignment.assignError')
    } finally {
      isSearching.value = false
    }
  }, 300)
}

const selectUser = (userId: string) => {
  selectedUserId.value = userId
}

const handleAssign = () => {
  if (!selectedUserId.value) return
  isAssigning.value = true
  emit('assigned', selectedUserId.value)
}

const handleClose = () => {
  resetForm()
  emit('close')
}

const resetForm = () => {
  searchQuery.value = ''
  searchResults.value = []
  selectedUserId.value = ''
  error.value = ''
  isAssigning.value = false
}

// Reset form when modal is closed
watch(() => props.visible, (newVisible) => {
  if (!newVisible) {
    resetForm()
  }
})
</script>

<style scoped>
.assignment-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.modal-description {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-group label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.form-control {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-default);
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.search-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 300px;
  overflow-y: auto;
  padding: var(--spacing-xs);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.user-result {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border-light);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.user-result:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.user-result.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  box-shadow: var(--shadow-sm);
}

.user-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
  border-radius: 50%;
  font-size: var(--font-size-lg);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-email {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-check {
  color: var(--color-primary);
  font-size: var(--font-size-xl);
}

.empty-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
}

.empty-results i {
  font-size: var(--font-size-3xl);
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
}
</style>
