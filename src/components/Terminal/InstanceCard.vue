<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div
    class="instance-card"
    :class="{
      'available': availability?.available,
      'restricted': !availability?.available,
      'selected': isSelected
    }"
    @click="$emit('select', instance)"
  >
    <div class="instance-header">
      <div class="instance-info">
        <h5>{{ translatedName }}</h5>
        <p>{{ translatedDescription }}</p>
      </div>
      <div class="instance-status">
        <i v-if="availability?.available"
           class="fas fa-check-circle text-success"></i>
        <i v-else class="fas fa-lock text-warning"></i>
      </div>
    </div>

    <!-- Size badges -->
    <div class="size-badges">
      <span
        v-for="size in displayedSizes"
        :key="size"
        class="size-badge"
        :class="{
          'available': isSizeAllowed(size),
          'restricted': !isSizeAllowed(size)
        }"
      >
        {{ size }}
      </span>
    </div>

    <!-- Availability message with upgrade button -->
    <div class="availability-message">
      <div v-if="availability?.available" class="available-message">
        <small class="text-success">
          <i class="fas fa-check"></i> {{ t('terminalStarter.availableInPlan') }}
        </small>
      </div>
      <div v-else class="restricted-message">
        <small class="text-warning">
          <i class="fas fa-exclamation-triangle"></i> {{ t('terminalStarter.requiresUpgrade') }}
        </small>
        <router-link to="/subscription-plans" class="upgrade-link">
          <i class="fas fa-arrow-up"></i>
          {{ t('terminalStarter.upgrade') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { instanceUtils } from '../../services/terminalService'
import type { InstanceType } from '../../types'
import type { InstanceAvailability } from '../../services/terminalService'

interface Props {
  instance: InstanceType
  isSelected: boolean
  availability: InstanceAvailability | null
  allowedSizes: string[]
}

const props = defineProps<Props>()

defineEmits<{
  select: [instance: InstanceType]
}>()

const { t, te } = useTranslations({
  en: {
    terminalStarter: {
      availableInPlan: 'Available in your plan',
      requiresUpgrade: 'Requires plan upgrade',
      upgrade: 'Upgrade'
    }
  },
  fr: {
    terminalStarter: {
      availableInPlan: 'Disponible dans votre plan',
      requiresUpgrade: 'Nécessite une mise à niveau',
      upgrade: 'Mettre à niveau'
    }
  }
})

const translatedName = computed(() => {
  const key = `terminals.instances.${props.instance.name.toLowerCase()}.name`
  // Check if translation exists before attempting to translate
  if (te(key)) {
    return t(key)
  }
  // Fallback to formatted instance name
  return props.instance.name.charAt(0).toUpperCase() + props.instance.name.slice(1)
})

const translatedDescription = computed(() => {
  const key = `terminals.instances.${props.instance.name.toLowerCase()}.description`
  // Check if translation exists before attempting to translate
  if (te(key)) {
    return t(key)
  }
  // Fallback to original description
  return props.instance.description
})

const displayedSizes = computed(() => {
  return instanceUtils.getSizeDisplay(props.instance.size)
})

function isSizeAllowed(size: string): boolean {
  return instanceUtils.isSizeAllowed(size, props.allowedSizes)
}
</script>

<style scoped>
.instance-card {
  border: var(--border-width-medium) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-base);
  background: var(--color-bg-primary);
}

.instance-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.instance-card.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.instance-card.available {
  border-left: var(--border-width-thick) solid var(--color-success);
}

.instance-card.restricted {
  border-left: var(--border-width-thick) solid var(--color-warning);
  opacity: 0.8;
}

.instance-card.restricted:hover {
  border-color: var(--color-warning);
  cursor: not-allowed;
}

.instance-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xs);
}

.instance-info h5 {
  margin: 0 0 2px 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.instance-info p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  line-height: 1.3;
}

.instance-status {
  font-size: var(--font-size-lg);
  line-height: 1;
}

.size-badges {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.size-badge {
  padding: 2px 6px;
  border-radius: var(--border-radius-full);
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  line-height: 1.2;
}

.size-badge.available {
  background: var(--color-success-bg);
  color: var(--color-success-text);
  border: var(--border-width-thin) solid var(--color-success);
}

.size-badge.restricted {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  border: var(--border-width-thin) solid var(--color-warning);
}

.availability-message {
  margin-top: 6px;
}

.availability-message small {
  font-size: 11px;
  line-height: 1.2;
}

.restricted-message {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-xs);
}

.upgrade-link {
  padding: 2px 6px;
  font-size: 10px;
  border-radius: var(--border-radius-sm);
  text-decoration: none;
  white-space: nowrap;
  background-color: var(--color-primary);
  color: var(--color-white);
  border: var(--border-width-thin) solid var(--color-primary);
  transition: all var(--transition-fast);
}

.upgrade-link:hover {
  background-color: var(--color-primary-hover);
  text-decoration: none;
}

.text-success {
  color: var(--color-success);
}

.text-warning {
  color: var(--color-warning-text);
}

@media (max-width: 768px) {
  .instance-header {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}
</style>
