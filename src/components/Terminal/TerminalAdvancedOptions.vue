<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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
        :label="t('terminalStarter.hostnameLabel')"
        id="hostname"
        :help-text="t('terminalStarter.hostnameHelp')"
      >
        <input
          id="hostname"
          :value="hostname"
          type="text"
          maxlength="63"
          :placeholder="t('terminalStarter.hostnamePlaceholder')"
          :disabled="disabled"
          @input="handleHostnameInput"
        />
        <small v-if="hostname.length > 0" class="char-count">
          {{ hostname.length }}/63
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

      <FormGroup
        :label="t('terminalStarter.packagesLabel')"
        id="packages"
        :help-text="t('terminalStarter.packagesHelp')"
      >
        <input
          id="packages"
          :value="packages"
          type="text"
          maxlength="500"
          :placeholder="t('terminalStarter.packagesPlaceholder')"
          :disabled="disabled"
          @input="handlePackagesInput"
        />
        <div v-if="defaultPackages.length > 0" class="default-packages">
          <small class="default-packages-label">{{ t('terminalStarter.preInstalled') }}</small>
          <span v-for="pkg in defaultPackages" :key="pkg" class="package-badge">{{ pkg }}</span>
        </div>
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

interface Props {
  modelValue: string
  exerciseRef?: string
  hostname?: string
  packages?: string
  defaultPackages?: string[]
  disabled?: boolean
  backends?: Backend[]
  selectedBackendId?: string
  showBackendSelector?: boolean
}

withDefaults(defineProps<Props>(), {
  exerciseRef: '',
  hostname: '',
  packages: '',
  defaultPackages: () => [],
  backends: () => [],
  selectedBackendId: '',
  showBackendSelector: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:exerciseRef': [value: string]
  'update:hostname': [value: string]
  'update:packages': [value: string]
  'update:selectedBackendId': [value: string]
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
      hostnameLabel: 'Container Hostname (Optional)',
      hostnamePlaceholder: 'e.g., webserver',
      hostnameHelp: "Custom hostname for the terminal prompt (root{'@'}hostname). Lowercase, alphanumeric and hyphens, max 63 chars.",
      packagesLabel: 'Startup Packages (Optional)',
      packagesPlaceholder: 'e.g., git, curl, vim, htop',
      packagesHelp: 'Comma-separated list of packages to install when the terminal starts. These are installed on top of the defaults.',
      preInstalled: 'Pre-installed:'
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
      hostnameLabel: 'Nom d\'hôte (Optionnel)',
      hostnamePlaceholder: 'ex. webserver',
      hostnameHelp: "Nom d'hôte personnalisé pour le prompt (root{'@'}hostname). Minuscules, alphanumérique et tirets, 63 caractères max.",
      packagesLabel: 'Paquets de démarrage (Optionnel)',
      packagesPlaceholder: 'ex. git, curl, vim, htop',
      packagesHelp: 'Liste de paquets séparés par des virgules à installer au démarrage du terminal. Installés en plus des paquets par défaut.',
      preInstalled: 'Pré-installés :'
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

function handleHostnameInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:hostname', target.value)
}

function handlePackagesInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:packages', target.value)
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

.default-packages {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
}

.default-packages-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.package-badge {
  display: inline-block;
  padding: 1px var(--spacing-xs);
  font-size: var(--font-size-xs);
  background-color: var(--color-bg-tertiary, var(--color-bg-secondary));
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .collapsible-header {
    font-size: var(--font-size-sm);
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .collapsible-content {
    padding: var(--spacing-md);
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
