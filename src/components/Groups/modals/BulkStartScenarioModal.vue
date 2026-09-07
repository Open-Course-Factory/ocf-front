<template>
  <BaseModal
    :visible="visible"
    :title="t('groupScenarios.bulkStartTitle')"
    size="medium"
    :show-default-footer="true"
    :confirm-text="t('groupScenarios.bulkStart')"
    :cancel-text="t('groupScenarios.cancel')"
    @confirm="$emit('confirm')"
    @close="$emit('close')"
  >
    <p class="instance-type-description">
      {{ t('groupScenarios.bulkStartDescription') }}
    </p>
    <!-- The distribution is the scenario's own; only the host is the teacher's call. -->
    <BackendSelector
      v-if="backendsStore.backends.length > 0"
      :model-value="backendsStore.selectedBackendId || ''"
      :backends="backendsStore.backends"
      :disabled="backendsStore.isLoading"
      @update:model-value="backendsStore.selectBackend($event)"
    />
  </BaseModal>
</template>

<script setup lang="ts">
import { useTranslations } from '../../../composables/useTranslations'
import { useTerminalBackendsStore } from '../../../stores/terminalBackends'
import BaseModal from '../../Modals/BaseModal.vue'
import BackendSelector from '../../Terminal/BackendSelector.vue'
import type { ScenarioAssignment } from '../../../types/groupScenarios'

defineProps<{
  visible: boolean
  assignment: ScenarioAssignment | null
}>()

defineEmits<{
  confirm: []
  close: []
}>()

const backendsStore = useTerminalBackendsStore()

const { t } = useTranslations({
  en: {
    groupScenarios: {
      bulkStartTitle: 'Start for all learners',
      bulkStartDescription: 'A session is started for every learner in this group, on the distribution the scenario declares.',
      bulkStart: 'Start for All',
      cancel: 'Cancel'
    }
  },
  fr: {
    groupScenarios: {
      bulkStartTitle: 'Démarrer pour tous les apprenants',
      bulkStartDescription: 'Une session est démarrée pour chaque apprenant de ce groupe, sur la distribution déclarée par le scénario.',
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
</style>
