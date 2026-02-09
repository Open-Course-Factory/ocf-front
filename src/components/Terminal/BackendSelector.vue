<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <FormGroup
    :label="t('backendSelector.label')"
    id="backendSelector"
    :help-text="t('backendSelector.helpText')"
  >
    <!-- Single backend: show as info only -->
    <div v-if="backends.length === 1" class="single-backend-info">
      <span class="connection-dot" :class="backends[0].connected ? 'online' : 'offline'"></span>
      <span>{{ backends[0].name || backends[0].id }}</span>
      <span v-if="backends[0].is_default" class="default-badge">{{ t('backendSelector.default') }}</span>
    </div>

    <!-- Multiple backends: selectable cards -->
    <div v-else class="backend-cards">
      <button
        v-for="backend in backends"
        :key="backend.id"
        type="button"
        :class="[
          'backend-card',
          {
            'selected': modelValue === backend.id,
            'offline': !backend.connected
          }
        ]"
        :disabled="!backend.connected || disabled"
        @click="handleSelect(backend.id)"
      >
        <div class="card-content">
          <span class="connection-dot" :class="backend.connected ? 'online' : 'offline'"></span>
          <div class="card-text">
            <span class="card-name">{{ backend.name || backend.id }}</span>
            <span v-if="backend.description" class="card-description">{{ backend.description }}</span>
          </div>
          <span v-if="backend.is_default" class="default-badge">{{ t('backendSelector.default') }}</span>
          <span v-if="!backend.connected" class="offline-badge">{{ t('backendSelector.offline') }}</span>
        </div>
      </button>
    </div>
  </FormGroup>
</template>

<script setup lang="ts">
import { useTranslations } from '../../composables/useTranslations'
import FormGroup from '../UI/FormGroup.vue'
import type { Backend } from '../../types/entities'

interface Props {
  modelValue: string
  backends: Backend[]
  disabled?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useTranslations({
  en: {
    backendSelector: {
      label: 'Backend Server',
      helpText: 'Select which server to run your terminal on.',
      default: 'Default',
      offline: 'Offline'
    }
  },
  fr: {
    backendSelector: {
      label: 'Serveur Backend',
      helpText: 'Sélectionnez sur quel serveur exécuter votre terminal.',
      default: 'Par défaut',
      offline: 'Hors ligne'
    }
  }
})

function handleSelect(backendId: string) {
  emit('update:modelValue', backendId)
}
</script>

<style scoped>
.single-backend-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.backend-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-sm);
}

.backend-card {
  display: block;
  width: 100%;
  padding: var(--spacing-md);
  border: var(--border-width-medium) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
  font-family: inherit;
  font-size: inherit;
  color: var(--color-text-primary);
}

.backend-card:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.backend-card.selected {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.backend-card.selected .card-description {
  color: rgba(255, 255, 255, 0.8);
}

.backend-card.offline {
  opacity: 0.5;
  cursor: not-allowed;
}

.backend-card:disabled {
  cursor: not-allowed;
}

.card-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.card-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.card-name {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
}

.card-description {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.connection-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.connection-dot.online {
  background-color: var(--color-success);
}

.connection-dot.offline {
  background-color: var(--color-danger);
}

.default-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 1px var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  background-color: var(--color-primary);
  color: var(--color-white);
  flex-shrink: 0;
}

.backend-card.selected .default-badge {
  background-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.offline-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-danger);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .backend-cards {
    grid-template-columns: 1fr;
  }
}
</style>
