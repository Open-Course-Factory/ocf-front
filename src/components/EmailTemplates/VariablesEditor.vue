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
import { ref, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import type { EmailTemplateVariable } from '../../types/entities'

interface Props {
  modelValue: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useTranslations({
  en: {
    variables: {
      name: 'Variable Name',
      description: 'Description',
      example: 'Example Value',
      add: 'Add Variable',
      remove: 'Remove',
      noVariables: 'No variables defined. Click "Add Variable" to create one.',
      namePlaceholder: 'e.g., UserName',
      descriptionPlaceholder: 'What this variable is for',
      examplePlaceholder: 'Used in test emails'
    }
  },
  fr: {
    variables: {
      name: 'Nom de Variable',
      description: 'Description',
      example: 'Valeur d\'Exemple',
      add: 'Ajouter une Variable',
      remove: 'Supprimer',
      noVariables: 'Aucune variable définie. Cliquez sur "Ajouter une Variable" pour en créer une.',
      namePlaceholder: 'ex: NomUtilisateur',
      descriptionPlaceholder: 'À quoi sert cette variable',
      examplePlaceholder: 'Utilisé dans les emails de test'
    }
  }
})

const variables = ref<EmailTemplateVariable[]>([])

// Parse initial value
watch(() => props.modelValue, (newValue) => {
  try {
    variables.value = JSON.parse(newValue || '[]')
  } catch {
    variables.value = []
  }
}, { immediate: true })

// Emit changes
watch(variables, (newVars) => {
  emit('update:modelValue', JSON.stringify(newVars))
}, { deep: true })

const addVariable = () => {
  variables.value.push({ name: '', description: '', example: '' })
}

const removeVariable = (index: number) => {
  variables.value.splice(index, 1)
}
</script>

<template>
  <div class="variables-editor">
    <div class="variables-header">
      <button
        type="button"
        @click="addVariable"
        class="btn btn-sm btn-secondary"
      >
        <i class="fas fa-plus"></i> {{ t('variables.add') }}
      </button>
    </div>

    <div v-if="variables.length === 0" class="empty-state">
      <p>{{ t('variables.noVariables') }}</p>
    </div>

    <div v-else class="variables-list">
      <div
        v-for="(variable, index) in variables"
        :key="index"
        class="variable-item"
      >
        <div class="variable-fields">
          <div class="field-group">
            <label :for="`var-name-${index}`">{{ t('variables.name') }}</label>
            <input
              :id="`var-name-${index}`"
              v-model="variable.name"
              type="text"
              class="form-control"
              :placeholder="t('variables.namePlaceholder')"
            />
          </div>

          <div class="field-group">
            <label :for="`var-desc-${index}`">{{ t('variables.description') }}</label>
            <input
              :id="`var-desc-${index}`"
              v-model="variable.description"
              type="text"
              class="form-control"
              :placeholder="t('variables.descriptionPlaceholder')"
            />
          </div>

          <div class="field-group">
            <label :for="`var-example-${index}`">{{ t('variables.example') }}</label>
            <input
              :id="`var-example-${index}`"
              v-model="variable.example"
              type="text"
              class="form-control"
              :placeholder="t('variables.examplePlaceholder')"
            />
          </div>
        </div>

        <button
          type="button"
          @click="removeVariable(index)"
          class="btn btn-sm btn-danger variable-remove"
          :title="t('variables.remove')"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.variables-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.variables-header {
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--color-text-secondary);
  border: 2px dashed var(--color-border);
  border-radius: var(--border-radius-md);
  background: var(--color-background);
}

.empty-state p {
  margin: 0;
  font-style: italic;
}

.variables-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.variable-item {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  align-items: flex-start;
}

.variable-fields {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1.5fr 1.5fr;
  gap: var(--spacing-sm);
}

@media (max-width: 768px) {
  .variable-fields {
    grid-template-columns: 1fr;
  }
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.field-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.form-control {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background: var(--color-background-elevated);
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-alpha);
}

.variable-remove {
  flex-shrink: 0;
  align-self: center;
  margin-top: 1.5rem;
}
</style>
