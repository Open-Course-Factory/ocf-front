<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <FormGroup
    :label="t('terminalStarter.instanceType')"
    id="instanceType"
    :help-text="t('terminalStarter.selectEnvironmentType')"
  >
    <!-- Search/Filter for many instances -->
    <div v-if="instanceTypes.length > 6" class="instance-search">
      <input
        v-model="searchTerm"
        type="text"
        :placeholder="t('terminalStarter.searchInstances')"
        @input="handleSearch"
      >
      <div class="instance-filters">
        <Button
          v-for="filterOption in availableFilters"
          :key="filterOption.key"
          size="sm"
          :variant="activeFilter === filterOption.key ? 'primary' : 'outline-secondary'"
          @click="setFilter(filterOption.key)"
        >
          {{ filterOption.label }} ({{ filterOption.count }})
        </Button>
      </div>
    </div>

    <!-- Instance Type Cards -->
    <div
      class="instance-types-grid"
      :class="{ 'compact': instanceTypes.length > 10 }"
    >
      <!-- Empty state when no instances match filters -->
      <div v-if="displayedInstances.length === 0" class="no-instances-found">
        <i class="fas fa-search"></i>
        <h5>{{ t('terminalStarter.noInstancesFound') }}</h5>
        <p v-if="searchTerm">
          {{ t('terminalStarter.noMatchingInstances', { searchTerm }) }}
        </p>
        <p v-else-if="activeFilter === 'available'">
          {{ t('terminalStarter.noAvailableInstances') }}
        </p>
        <p v-else-if="activeFilter === 'restricted'">
          {{ t('terminalStarter.allInstancesAvailable') }}
        </p>
        <Button
          v-if="searchTerm || activeFilter !== 'all'"
          size="sm"
          variant="primary"
          @click="clearFilters"
        >
          {{ t('terminalStarter.clearFilters') }}
        </Button>
      </div>

      <!-- Instance cards -->
      <InstanceCard
        v-for="instance in displayedInstances"
        :key="instance.prefix"
        :instance="instance"
        :is-selected="modelValue === instance.prefix"
        :availability="instanceAvailabilityMap.get(instance.prefix) || null"
        :allowed-sizes="allowedSizes"
        @select="handleSelect"
      />
    </div>
  </FormGroup>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { instanceUtils } from '../../services/terminalService'
import InstanceCard from './InstanceCard.vue'
import FormGroup from '../UI/FormGroup.vue'
import Button from '../UI/Button.vue'
import type { InstanceType } from '../../types'
import type { InstanceAvailability } from '../../services/terminalService'

interface Props {
  instanceTypes: InstanceType[]
  modelValue: string
  allowedSizes: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'select': [instance: InstanceType]
}>()

const { t, te } = useTranslations({
  en: {
    terminalStarter: {
      instanceType: 'Instance Type',
      selectEnvironmentType: 'Select your terminal environment type.',
      searchInstances: 'Search instances...',
      noInstancesFound: 'No instances found',
      noMatchingInstances: 'No instances match "{searchTerm}"',
      noAvailableInstances: 'No instances available for your current plan.',
      allInstancesAvailable: 'All instances are available.',
      clearFilters: 'Clear filters',
      allInstances: 'All',
      availableInstances: 'Available',
      restrictedInstances: 'Restricted'
    }
  },
  fr: {
    terminalStarter: {
      instanceType: 'Type d\'Instance',
      selectEnvironmentType: 'Sélectionnez le type d\'environnement de votre terminal.',
      searchInstances: 'Rechercher des instances...',
      noInstancesFound: 'Aucune instance trouvée',
      noMatchingInstances: 'Aucune instance ne correspond à "{searchTerm}"',
      noAvailableInstances: 'Aucune instance disponible pour votre plan actuel.',
      allInstancesAvailable: 'Toutes les instances sont disponibles.',
      clearFilters: 'Effacer les filtres',
      allInstances: 'Toutes',
      availableInstances: 'Disponibles',
      restrictedInstances: 'Restreintes'
    }
  }
})

const searchTerm = ref('')
const activeFilter = ref('all')

const instanceAvailabilityMap = computed(() => {
  const map = new Map<string, InstanceAvailability>()
  props.instanceTypes.forEach(instance => {
    const availability = instanceUtils.checkAvailability(instance, props.allowedSizes)
    map.set(instance.prefix, availability)
  })
  return map
})

const displayedInstances = computed(() => {
  let instances = props.instanceTypes

  // Apply search filter
  if (searchTerm.value.trim()) {
    const search = searchTerm.value.toLowerCase()
    instances = instances.filter(instance =>
      instance.name.toLowerCase().includes(search) ||
      instance.description.toLowerCase().includes(search) ||
      instance.prefix.toLowerCase().includes(search) ||
      getTranslatedName(instance).toLowerCase().includes(search) ||
      getTranslatedDescription(instance).toLowerCase().includes(search)
    )
  }

  // Apply category filter
  if (activeFilter.value === 'available') {
    instances = instances.filter(instance => {
      const availability = instanceAvailabilityMap.value.get(instance.prefix)
      return availability?.available || false
    })
  } else if (activeFilter.value === 'restricted') {
    instances = instances.filter(instance => {
      const availability = instanceAvailabilityMap.value.get(instance.prefix)
      return availability && !availability.available
    })
  }

  return instances
})

const availableFilters = computed(() => {
  const allCount = props.instanceTypes.length
  const availableCount = props.instanceTypes.filter(instance => {
    const availability = instanceAvailabilityMap.value.get(instance.prefix)
    return availability?.available || false
  }).length
  const restrictedCount = allCount - availableCount

  return [
    { key: 'all', label: t('terminalStarter.allInstances'), count: allCount },
    { key: 'available', label: t('terminalStarter.availableInstances'), count: availableCount },
    { key: 'restricted', label: t('terminalStarter.restrictedInstances'), count: restrictedCount }
  ].filter(filter => filter.count > 0)
})

function getTranslatedName(instance: InstanceType): string {
  const key = `terminals.instances.${instance.name.toLowerCase()}.name`
  // Check if translation exists before attempting to translate
  if (te(key)) {
    return t(key)
  }
  // Fallback to formatted instance name
  return instance.name.charAt(0).toUpperCase() + instance.name.slice(1)
}

function getTranslatedDescription(instance: InstanceType): string {
  const key = `terminals.instances.${instance.name.toLowerCase()}.description`
  // Check if translation exists before attempting to translate
  if (te(key)) {
    return t(key)
  }
  // Fallback to original description
  return instance.description
}

function handleSelect(instance: InstanceType) {
  emit('update:modelValue', instance.prefix)
  emit('select', instance)
}

function handleSearch() {
  // Filtering is handled by displayedInstances computed property
}

function setFilter(filterKey: string) {
  activeFilter.value = filterKey
}

function clearFilters() {
  searchTerm.value = ''
  activeFilter.value = 'all'
}
</script>

<style scoped>
.instance-search {
  margin-bottom: var(--spacing-lg);
}

.instance-search input {
  margin-bottom: var(--spacing-sm);
}

.instance-filters {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.instance-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  max-height: 400px;
  overflow-y: auto;
  padding: var(--spacing-sm);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
}

.instance-types-grid.compact {
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-xs);
}

.no-instances-found {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
  color: var(--color-text-muted);
  border: var(--border-width-medium) dashed var(--color-border-light);
  border-radius: var(--border-radius-lg);
}

.no-instances-found i {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

@media (max-width: 768px) {
  .instance-types-grid {
    grid-template-columns: 1fr;
    max-height: 300px;
  }

  .instance-filters {
    flex-direction: column;
  }

  .instance-filters :deep(.btn) {
    width: 100%;
  }
}
</style>
