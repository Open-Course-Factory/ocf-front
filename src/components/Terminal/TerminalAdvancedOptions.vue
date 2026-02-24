<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="collapsible-section">
    <button
      type="button"
      class="collapsible-header"
      @click="isExpanded = !isExpanded"
    >
      <i class="fas" :class="isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
      {{ t('terminalStarter.advancedOptions') }}
    </button>
    <div v-show="isExpanded" class="collapsible-content">
      <!-- Creation Mode (Bulk for Group) -->
      <div v-if="showBulkMode" class="creation-mode-selector">
        <label class="mode-label">{{ t('terminalStarter.creationMode') }}</label>
        <div class="mode-options">
          <button
            type="button"
            :class="['mode-option', { active: creationMode === 'single' }]"
            @click="emit('update:creationMode', 'single')"
          >
            <i class="fas fa-desktop"></i>
            {{ t('terminalStarter.singleTerminal') }}
          </button>
          <button
            type="button"
            :class="['mode-option', { active: creationMode === 'bulk' }]"
            @click="emit('update:creationMode', 'bulk')"
          >
            <i class="fas fa-users"></i>
            {{ t('terminalStarter.bulkForGroup') }}
          </button>
        </div>
      </div>

      <!-- Group Selection (only if bulk mode) -->
      <div v-if="creationMode === 'bulk'" class="group-selector">
        <label for="group-select" class="form-label">
          {{ t('terminalStarter.selectGroup') }}
        </label>
        <select
          id="group-select"
          :value="selectedGroupId"
          class="form-control"
          :disabled="disabled"
          @change="emit('update:selectedGroupId', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">{{ t('terminalStarter.chooseGroup') }}</option>
          <option
            v-for="group in availableGroups"
            :key="group.id"
            :value="group.id"
          >
            {{ group.display_name || group.name }} ({{ group.member_count || 0 }} {{ t('terminalStarter.members') }})
          </option>
        </select>
        <small v-if="selectedGroupId && selectedGroupMemberCount > 0" class="form-text">
          {{ t('terminalStarter.willCreate', { count: selectedGroupMemberCount }) }}
        </small>
      </div>

      <!-- Backend Selector -->
      <BackendSelector
        v-if="showBackendSelector"
        :model-value="selectedBackendId"
        :backends="backends"
        :disabled="disabled"
        @update:model-value="emit('update:selectedBackendId', $event)"
      />

      <FormGroup
        :label="t('terminalStarter.nameOptional')"
        id="terminalName"
        :help-text="t('terminalStarter.nameHelp')"
      >
        <input
          id="terminalName"
          :value="modelValue"
          type="text"
          maxlength="255"
          :placeholder="t('terminalStarter.namePlaceholder')"
          :disabled="disabled"
          @input="handleInput"
        />
        <small v-if="modelValue.length > 0" class="char-count">
          {{ modelValue.length }}/255
        </small>
      </FormGroup>

      <FormGroup
        :label="t('terminalStarter.exerciseRefLabel')"
        id="exerciseRef"
        :help-text="t('terminalStarter.exerciseRefHelp')"
      >
        <input
          id="exerciseRef"
          :value="exerciseRef"
          type="text"
          maxlength="255"
          :placeholder="t('terminalStarter.exerciseRefPlaceholder')"
          :disabled="disabled"
          @input="handleExerciseRefInput"
        />
        <small v-if="exerciseRef.length > 0" class="char-count">
          {{ exerciseRef.length }}/255
        </small>
      </FormGroup>

      <div class="form-actions">
        <Button
          type="button"
          variant="secondary"
          icon="fas fa-undo"
          size="sm"
          :disabled="disabled"
          @click="$emit('reset')"
        >
          {{ t('terminalStarter.buttonReset') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import FormGroup from '../UI/FormGroup.vue'
import Button from '../UI/Button.vue'
import BackendSelector from './BackendSelector.vue'
import type { Backend } from '../../types/entities'

interface Group {
  id: string
  name: string
  display_name?: string
  member_count?: number
}

interface Props {
  modelValue: string
  exerciseRef?: string
  disabled?: boolean
  backends?: Backend[]
  selectedBackendId?: string
  showBackendSelector?: boolean
  showBulkMode?: boolean
  creationMode?: 'single' | 'bulk'
  availableGroups?: Group[]
  selectedGroupId?: string
  selectedGroupMemberCount?: number
}

withDefaults(defineProps<Props>(), {
  exerciseRef: '',
  backends: () => [],
  selectedBackendId: '',
  showBackendSelector: false,
  showBulkMode: false,
  creationMode: 'single',
  availableGroups: () => [],
  selectedGroupId: '',
  selectedGroupMemberCount: 0
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:exerciseRef': [value: string]
  'update:selectedBackendId': [value: string]
  'update:creationMode': [value: 'single' | 'bulk']
  'update:selectedGroupId': [value: string]
  reset: []
}>()

const { t } = useTranslations({
  en: {
    terminalStarter: {
      advancedOptions: 'Advanced Options',
      nameOptional: 'Terminal Name (Optional)',
      namePlaceholder: 'My terminal...',
      nameHelp: 'Give your terminal a custom name to easily find it. Maximum 255 characters.',
      exerciseRefLabel: 'Exercise Reference',
      exerciseRefPlaceholder: 'e.g., Lab 3 - Docker Basics',
      exerciseRefHelp: 'Optional tag to identify this terminal session (visible in history exports)',
      buttonReset: 'Reset',
      creationMode: 'Creation Mode',
      singleTerminal: 'Single Terminal',
      bulkForGroup: 'Bulk for Group',
      selectGroup: 'Select Group',
      chooseGroup: 'Choose a group...',
      members: 'members',
      willCreate: 'Will create {count} terminals (1 per member)'
    }
  },
  fr: {
    terminalStarter: {
      advancedOptions: 'Options Avancées',
      nameOptional: 'Nom du Terminal (Optionnel)',
      namePlaceholder: 'Mon terminal...',
      nameHelp: 'Donnez un nom personnalisé à votre terminal pour le retrouver facilement. Maximum 255 caractères.',
      exerciseRefLabel: 'Référence d\'exercice',
      exerciseRefPlaceholder: 'ex. TP 3 - Bases Docker',
      exerciseRefHelp: 'Tag optionnel pour identifier cette session terminal (visible dans les exports)',
      buttonReset: 'Réinitialiser',
      creationMode: 'Mode de Création',
      singleTerminal: 'Terminal Unique',
      bulkForGroup: 'En Masse pour Groupe',
      selectGroup: 'Sélectionner un Groupe',
      chooseGroup: 'Choisir un groupe...',
      members: 'membres',
      willCreate: '{count} terminaux seront créés (1 par membre)'
    }
  }
})

const isExpanded = ref(false)

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function handleExerciseRefInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:exerciseRef', target.value)
}
</script>

<style scoped>
.collapsible-section {
  margin-top: var(--spacing-lg);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background: var(--color-bg-secondary);
}

.collapsible-header {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-secondary);
  border: none;
  text-align: left;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: background-color var(--transition-fast);
}

.collapsible-header:hover {
  background: var(--color-bg-tertiary);
}

.collapsible-header i {
  color: var(--color-primary);
  transition: transform var(--transition-fast);
}

.collapsible-content {
  padding: var(--spacing-lg);
  background: var(--color-bg-primary);
  border-top: var(--border-width-thin) solid var(--color-border-light);
}

/* Creation mode selector */
.creation-mode-selector {
  margin-bottom: var(--spacing-lg);
}

.mode-label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.mode-options {
  display: flex;
  gap: var(--spacing-md);
}

.mode-option {
  flex: 1;
  padding: var(--spacing-md);
  border: var(--border-width-medium) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}

.mode-option:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-bg, rgba(0, 123, 255, 0.1));
  color: var(--color-primary);
}

.mode-option.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.mode-option i {
  font-size: var(--font-size-lg);
}

/* Group selector */
.group-selector {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.form-control {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: var(--border-width-medium) solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  transition: border-color var(--transition-fast);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-control:disabled {
  background: var(--color-bg-secondary);
  cursor: not-allowed;
  opacity: 0.6;
}

.form-text {
  display: block;
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  margin-top: var(--spacing-md);
}

.char-count {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 4px;
  display: block;
  text-align: right;
}

@media (max-width: 768px) {
  .collapsible-header {
    font-size: var(--font-size-sm);
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .collapsible-content {
    padding: var(--spacing-md);
  }

  .mode-options {
    flex-direction: column;
  }

  .mode-option {
    width: 100%;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions :deep(.btn) {
    width: 100%;
    justify-content: center;
  }
}
</style>
