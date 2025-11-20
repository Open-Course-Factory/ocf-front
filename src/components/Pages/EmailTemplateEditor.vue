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
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEmailTemplatesStore } from '../../stores/emailTemplates'
import { useNotification } from '../../composables/useNotification'
import type { EmailTemplateVariable } from '../../types/entities'
import VariablesEditor from '../EmailTemplates/VariablesEditor.vue'
import EmailPreview from '../EmailTemplates/EmailPreview.vue'

const router = useRouter()
const route = useRoute()
const emailTemplatesStore = useEmailTemplatesStore()
const { showSuccess, showError } = useNotification()

const isEdit = computed(() => !!route.params.id)
const isLoading = ref(false)
const isSaving = ref(false)

const formData = reactive({
  name: '',
  display_name: '',
  description: '',
  subject: '',
  html_body: '',
  variables: '[]',
  is_active: true
})

const variableExample = '{{.VariableName}}'

const variables = computed<EmailTemplateVariable[]>(() => {
  try {
    return JSON.parse(formData.variables || '[]')
  } catch {
    return []
  }
})

onMounted(async () => {
  if (isEdit.value) {
    await loadTemplate()
  }
})

const loadTemplate = async () => {
  isLoading.value = true
  try {
    const template = await emailTemplatesStore.getTemplate(route.params.id as string)
    Object.assign(formData, {
      name: template.name,
      display_name: template.display_name,
      description: template.description || '',
      subject: template.subject,
      html_body: template.html_body,
      variables: template.variables,
      is_active: template.is_active
    })
  } catch (err: any) {
    showError(err.message || 'Failed to load template')
    router.push({ name: 'EmailTemplates' })
  } finally {
    isLoading.value = false
  }
}

const handleSave = async () => {
  if (!validateForm()) return

  isSaving.value = true
  try {
    if (isEdit.value) {
      await emailTemplatesStore.updateTemplate(route.params.id as string, formData)
      showSuccess('Template updated successfully')
    } else {
      await emailTemplatesStore.createTemplate(formData)
      showSuccess('Template created successfully')
    }
    router.push({ name: 'EmailTemplates' })
  } catch (err: any) {
    showError(err.message || 'Failed to save template')
  } finally {
    isSaving.value = false
  }
}

const validateForm = (): boolean => {
  if (!formData.name) {
    showError('Template name is required')
    return false
  }
  if (!formData.display_name) {
    showError('Display name is required')
    return false
  }
  if (!formData.subject) {
    showError('Subject is required')
    return false
  }
  if (!formData.html_body) {
    showError('HTML body is required')
    return false
  }
  return true
}

const handleCancel = () => {
  router.push({ name: 'EmailTemplates' })
}

const updateVariables = (newVariables: string) => {
  formData.variables = newVariables
}
</script>

<template>
  <div class="content">
    <div class="toolbar-container">
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="btn btn-secondary" @click="handleCancel">
            <i class="fas fa-arrow-left"></i> {{ emailTemplatesStore.t('back') }}
          </button>
          <h2>
            {{ isEdit ? emailTemplatesStore.t('emailTemplates.modify') : emailTemplatesStore.t('emailTemplates.add') }}
          </h2>
        </div>
        <div class="toolbar-right">
          <button class="btn btn-secondary" @click="handleCancel">
            <i class="fas fa-times"></i> {{ emailTemplatesStore.t('emailTemplates.cancel') }}
          </button>
          <button
            class="btn btn-primary"
            @click="handleSave"
            :disabled="isSaving"
          >
            <i class="fas" :class="isSaving ? 'fa-spinner fa-spin' : 'fa-save'"></i>
            {{ isSaving ? emailTemplatesStore.t('saving') : emailTemplatesStore.t('save') }}
          </button>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div v-if="isLoading" class="loading-container">
        <i class="fas fa-spinner fa-spin"></i>
        <p>{{ emailTemplatesStore.t('common.loading') }}</p>
      </div>

      <div v-else class="editor-layout">
        <!-- Editor Panel -->
        <div class="editor-panel">
          <div class="form-section">
            <h3>{{ emailTemplatesStore.t('emailTemplates.basicInfo') || 'Basic Information' }}</h3>

            <div class="form-group">
              <label for="name">{{ emailTemplatesStore.t('emailTemplates.name') }}</label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                class="form-control"
                placeholder="e.g., password_reset"
                :disabled="isEdit"
              />
              <small class="form-help">Unique identifier (lowercase, underscores only)</small>
            </div>

            <div class="form-group">
              <label for="display_name">{{ emailTemplatesStore.t('emailTemplates.display_name') }}</label>
              <input
                id="display_name"
                v-model="formData.display_name"
                type="text"
                class="form-control"
                placeholder="Password Reset"
              />
            </div>

            <div class="form-group">
              <label for="description">{{ emailTemplatesStore.t('emailTemplates.description') }}</label>
              <textarea
                id="description"
                v-model="formData.description"
                class="form-control"
                rows="2"
                placeholder="Describe when this template is used..."
              ></textarea>
            </div>

            <div class="form-group">
              <label for="subject">{{ emailTemplatesStore.t('emailTemplates.subject') }}</label>
              <input
                id="subject"
                v-model="formData.subject"
                type="text"
                class="form-control"
                :placeholder="'Reset Your Password - {{.PlatformName}}'"
              />
              <small class="form-help">Use {{variableExample}} for dynamic content</small>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="formData.is_active"
                  type="checkbox"
                />
                {{ emailTemplatesStore.t('emailTemplates.is_active') }}
              </label>
            </div>
          </div>

          <div class="form-section">
            <h3>{{ emailTemplatesStore.t('emailTemplates.html_body') }}</h3>
            <textarea
              v-model="formData.html_body"
              class="form-control code-editor"
              rows="20"
              placeholder="<!DOCTYPE html><html>..."
            ></textarea>
          </div>

          <div class="form-section">
            <h3>{{ emailTemplatesStore.t('emailTemplates.variables') }}</h3>
            <VariablesEditor
              :model-value="formData.variables"
              @update:model-value="updateVariables"
            />
          </div>
        </div>

        <!-- Preview Panel -->
        <div class="preview-panel">
          <div class="preview-sticky">
            <h3>{{ emailTemplatesStore.t('preview') || 'Preview' }}</h3>
            <EmailPreview
              :html="formData.html_body"
              :variables="variables"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
  max-width: 100%;
}

@media (max-width: 1200px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }

  .preview-panel {
    order: -1;
  }
}

.editor-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.preview-panel {
  position: relative;
}

.preview-sticky {
  position: sticky;
  top: var(--spacing-md);
}

.form-section {
  background: var(--color-background-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
}

.form-section h3 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
  font-size: 1.25rem;
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group:last-child {
  margin-bottom: 0;
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
  font-family: inherit;
}

.code-editor {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.form-help {
  display: block;
  margin-top: var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  width: auto;
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
</style>
