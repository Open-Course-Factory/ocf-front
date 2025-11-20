<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEmailTemplatesStore } from '../../stores/emailTemplates'
import { useNotification } from '../../composables/useNotification'
import type { EmailTemplate } from '../../types/entities'
import BaseModal from '../Modals/BaseModal.vue'

const router = useRouter()
const emailTemplatesStore = useEmailTemplatesStore()
const { showSuccess, showError } = useNotification()

const templates = computed(() => emailTemplatesStore.entities as EmailTemplate[])
const isLoading = computed(() => emailTemplatesStore.isLoading)
const error = computed(() => emailTemplatesStore.error)

// Test email modal state
const showTestModal = ref(false)
const selectedTemplate = ref<EmailTemplate | null>(null)
const testEmailAddress = ref('')
const sendingTest = ref(false)

onMounted(async () => {
  await loadTemplates()
})

const loadTemplates = async () => {
  try {
    await emailTemplatesStore.loadTemplates()
  } catch (err: any) {
    showError(err.message || emailTemplatesStore.t('emailTemplates.loadError'))
  }
}

const handleCreateNew = () => {
  router.push({ name: 'EmailTemplateCreate' })
}

const handleEdit = (template: EmailTemplate) => {
  router.push({ name: 'EmailTemplateEdit', params: { id: template.id } })
}

const handleDelete = async (template: EmailTemplate) => {
  if (template.is_system) {
    showError(emailTemplatesStore.t('emailTemplates.deleteError'))
    return
  }

  if (!confirm(emailTemplatesStore.t('emailTemplates.deleteConfirm'))) {
    return
  }

  try {
    await emailTemplatesStore.deleteTemplate(template.id, template.is_system)
    showSuccess(emailTemplatesStore.t('emailTemplates.deleteSuccess'))
    await loadTemplates()
  } catch (err: any) {
    showError(err.message || 'Failed to delete template')
  }
}

const openTestModal = (template: EmailTemplate) => {
  selectedTemplate.value = template
  testEmailAddress.value = ''
  showTestModal.value = true
}

const closeTestModal = () => {
  showTestModal.value = false
  selectedTemplate.value = null
  testEmailAddress.value = ''
}

const sendTestEmail = async () => {
  if (!selectedTemplate.value || !testEmailAddress.value) return

  sendingTest.value = true
  try {
    await emailTemplatesStore.sendTestEmail(selectedTemplate.value.id, testEmailAddress.value)
    showSuccess(`${emailTemplatesStore.t('emailTemplates.testEmailSuccess')} ${testEmailAddress.value}`)
    closeTestModal()
  } catch (err: any) {
    showError(err.message || emailTemplatesStore.t('emailTemplates.testEmailError'))
  } finally {
    sendingTest.value = false
  }
}

const formatDate = (date: string | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

const getStatusBadgeClass = (isActive: boolean) => {
  return isActive ? 'badge-success' : 'badge-secondary'
}

const getTypeBadgeClass = (isSystem: boolean) => {
  return isSystem ? 'badge-info' : 'badge-warning'
}
</script>

<template>
  <div class="content">
    <div class="toolbar-container">
      <div class="toolbar">
        <div class="toolbar-left">
          <h2>{{ emailTemplatesStore.t('emailTemplates.pageTitle') }}</h2>
        </div>
        <div class="toolbar-right">
          <button class="btn btn-primary" @click="handleCreateNew">
            <i class="fas fa-plus"></i> {{ emailTemplatesStore.t('emailTemplates.add') }}
          </button>
        </div>
      </div>
    </div>

    <div class="main-content">
      <!-- Loading State -->
      <div v-if="isLoading && templates.length === 0" class="loading-container">
        <i class="fas fa-spinner fa-spin"></i>
        <p>{{ emailTemplatesStore.t('common.loading') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger">
        <i class="fas fa-exclamation-triangle"></i>
        {{ error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="templates.length === 0" class="empty-state">
        <i class="fas fa-envelope"></i>
        <h3>{{ emailTemplatesStore.t('emailTemplates.noTemplates') }}</h3>
        <button class="btn btn-primary" @click="handleCreateNew">
          <i class="fas fa-plus"></i> {{ emailTemplatesStore.t('emailTemplates.add') }}
        </button>
      </div>

      <!-- Templates List -->
      <div v-else class="templates-grid">
        <div
          v-for="template in templates"
          :key="template.id"
          class="template-card"
        >
          <div class="template-card-header">
            <div class="template-title">
              <h3>{{ template.display_name }}</h3>
              <div class="template-badges">
                <span
                  class="badge"
                  :class="getStatusBadgeClass(template.is_active)"
                >
                  {{ template.is_active ? emailTemplatesStore.t('emailTemplates.active') : emailTemplatesStore.t('emailTemplates.inactive') }}
                </span>
                <span
                  class="badge"
                  :class="getTypeBadgeClass(template.is_system)"
                >
                  {{ template.is_system ? emailTemplatesStore.t('emailTemplates.system') : emailTemplatesStore.t('emailTemplates.custom') }}
                </span>
              </div>
            </div>
          </div>

          <div class="template-card-body">
            <p v-if="template.description" class="template-description">
              {{ template.description }}
            </p>
            <div class="template-meta">
              <div class="meta-item">
                <strong>{{ emailTemplatesStore.t('emailTemplates.name') }}:</strong>
                <code>{{ template.name }}</code>
              </div>
              <div class="meta-item">
                <strong>{{ emailTemplatesStore.t('emailTemplates.subject') }}:</strong>
                {{ template.subject }}
              </div>
              <div v-if="template.last_tested_at" class="meta-item">
                <strong>{{ emailTemplatesStore.t('emailTemplates.last_tested_at') }}:</strong>
                {{ formatDate(template.last_tested_at) }}
              </div>
            </div>
          </div>

          <div class="template-card-actions">
            <button
              class="btn btn-sm btn-primary"
              @click="handleEdit(template)"
              :title="emailTemplatesStore.t('emailTemplates.modify')"
            >
              <i class="fas fa-edit"></i>
              {{ emailTemplatesStore.t('edit') }}
            </button>
            <button
              class="btn btn-sm btn-info"
              @click="openTestModal(template)"
              :title="emailTemplatesStore.t('emailTemplates.testEmail')"
            >
              <i class="fas fa-paper-plane"></i>
              {{ emailTemplatesStore.t('emailTemplates.sendTest') }}
            </button>
            <button
              v-if="!template.is_system"
              class="btn btn-sm btn-danger"
              @click="handleDelete(template)"
              :title="emailTemplatesStore.t('delete')"
            >
              <i class="fas fa-trash"></i>
              {{ emailTemplatesStore.t('delete') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Test Email Modal -->
    <BaseModal
      :visible="showTestModal"
      :title="emailTemplatesStore.t('emailTemplates.testEmail')"
      :is-loading="sendingTest"
      :loading-text="emailTemplatesStore.t('emailTemplates.sending')"
      :show-close="true"
      :close-on-overlay-click="true"
      size="small"
      :show-default-footer="true"
      :confirm-text="emailTemplatesStore.t('emailTemplates.sendTest')"
      :cancel-text="emailTemplatesStore.t('emailTemplates.cancel')"
      :confirm-disabled="!testEmailAddress || sendingTest"
      @close="closeTestModal"
      @confirm="sendTestEmail"
    >
      <div v-if="selectedTemplate" class="test-email-form">
        <p class="modal-description">
          {{ emailTemplatesStore.t('emailTemplates.testEmail') }}: <strong>{{ selectedTemplate.display_name }}</strong>
        </p>
        <div class="form-group">
          <label for="test-email">{{ emailTemplatesStore.t('emailTemplates.emailAddress') }}</label>
          <input
            id="test-email"
            v-model="testEmailAddress"
            type="email"
            class="form-control"
            :placeholder="emailTemplatesStore.t('emailTemplates.enterEmail')"
            @keyup.enter="sendTestEmail"
          />
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
}

.template-card {
  background: var(--color-background-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.template-card:hover {
  box-shadow: 0 4px 12px var(--color-shadow);
  transform: translateY(-2px);
}

.template-card-header {
  padding: var(--spacing-md);
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
}

.template-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.template-title h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-text-primary);
}

.template-badges {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.badge {
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-success {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}

.badge-secondary {
  background: var(--color-gray-light);
  color: var(--color-text-secondary);
}

.badge-info {
  background: var(--color-info-light);
  color: var(--color-info-dark);
}

.badge-warning {
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
}

.template-card-body {
  padding: var(--spacing-md);
}

.template-description {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.template-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.meta-item {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.meta-item strong {
  color: var(--color-text-primary);
}

.meta-item code {
  background: var(--color-background);
  padding: 2px 6px;
  border-radius: var(--border-radius-sm);
  font-size: 0.85rem;
}

.template-card-actions {
  padding: var(--spacing-md);
  background: var(--color-background);
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xxl);
  color: var(--color-text-secondary);
}

.empty-state i {
  font-size: 4rem;
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-md);
}

.empty-state h3 {
  margin: var(--spacing-md) 0;
  color: var(--color-text-secondary);
}

.loading-container {
  text-align: center;
  padding: var(--spacing-xxl);
  color: var(--color-text-secondary);
}

.loading-container i {
  font-size: 2rem;
  margin-bottom: var(--spacing-md);
}

.test-email-form {
  padding: var(--spacing-md) 0;
}

.modal-description {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-secondary);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 600;
  color: var(--color-text-primary);
}

.form-control {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: 1rem;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}
</style>
