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

interface Props {
  modelValue: string
  disabled?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  reset: []
}>()

const { t } = useTranslations({
  en: {
    terminalStarter: {
      advancedOptions: 'Advanced Options',
      nameOptional: 'Terminal Name (Optional)',
      namePlaceholder: 'My terminal...',
      nameHelp: 'Give your terminal a custom name to easily find it. Maximum 255 characters.',
      buttonReset: 'Reset'
    }
  },
  fr: {
    terminalStarter: {
      advancedOptions: 'Options Avancées',
      nameOptional: 'Nom du Terminal (Optionnel)',
      namePlaceholder: 'Mon terminal...',
      nameHelp: 'Donnez un nom personnalisé à votre terminal pour le retrouver facilement. Maximum 255 caractères.',
      buttonReset: 'Réinitialiser'
    }
  }
})

const isExpanded = ref(false)

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
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
