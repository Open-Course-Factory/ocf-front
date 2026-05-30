<template>
  <BaseModal
    :visible="visible"
    :title="t('groupScenarios.selectDistribution')"
    size="medium"
    :show-default-footer="true"
    :confirm-text="t('groupScenarios.bulkStart')"
    :cancel-text="t('groupScenarios.cancel')"
    @confirm="$emit('confirm')"
    @close="$emit('close')"
  >
    <p class="instance-type-description">
      {{ t('groupScenarios.distributionDescription') }}
    </p>
    <!-- Backend selector (only if org has backends) -->
    <BackendSelector
      v-if="backendsStore.backends.length > 0"
      :model-value="backendsStore.selectedBackendId || ''"
      :backends="backendsStore.backends"
      :disabled="backendsStore.isLoading"
      @update:model-value="backendsStore.selectBackend($event)"
    />
    <div v-if="loadingDistributions" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
    </div>
    <div v-else class="form-group">
      <label>{{ t('groupScenarios.distribution') }}</label>
      <select
        :value="selectedDistribution"
        class="form-control"
        @change="$emit('update:selectedDistribution', ($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>{{ t('groupScenarios.selectDistribution') }}</option>
        <option
          v-for="dist in distributions"
          :key="dist.prefix"
          :value="dist.prefix"
        >
          {{ dist.name }} — {{ dist.description }}
        </option>
      </select>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { useTranslations } from '../../../composables/useTranslations'
import { useTerminalBackendsStore } from '../../../stores/terminalBackends'
import BaseModal from '../../Modals/BaseModal.vue'
import BackendSelector from '../../Terminal/BackendSelector.vue'
import type { ScenarioAssignment, Distribution } from '../../../types/groupScenarios'

defineProps<{
  visible: boolean
  assignment: ScenarioAssignment | null
  distributions: Distribution[]
  selectedDistribution: string
  loadingDistributions: boolean
}>()

defineEmits<{
  'update:selectedDistribution': [value: string]
  confirm: []
  close: []
}>()

const backendsStore = useTerminalBackendsStore()

const { t } = useTranslations({
  en: {
    groupScenarios: {
      selectDistribution: 'Select Distribution',
      distribution: 'Distribution',
      distributionDescription: 'Choose the terminal distribution for all learners in this group.',
      bulkStart: 'Start for All',
      cancel: 'Cancel'
    }
  },
  fr: {
    groupScenarios: {
      selectDistribution: 'Sélectionner la distribution',
      distribution: 'Distribution',
      distributionDescription: 'Choisissez la distribution terminal pour tous les apprenants de ce groupe.',
      bulkStart: 'Démarrer pour tous',
      cancel: 'Annuler'
    }
  }
})
</script>

<style scoped>
.instance-type-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--color-primary);
  font-size: var(--font-size-xl);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.form-control {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}
</style>
