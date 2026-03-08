<script setup lang="ts">
import Entity from '../Entity.vue'
import { ref } from 'vue'
import { useScenariosStore } from '../../../stores/scenarios'
import { useTranslations } from '../../../composables/useTranslations'
import ScenarioUploadModal from '../../Modals/ScenarioUploadModal.vue'

const entityStore = useScenariosStore()
const showUploadModal = ref(false)

const { t } = useTranslations({
  en: {
    scenarios: {
      importKillercoda: 'Import KillerCoda',
      importSuccess: 'Scenario imported successfully'
    }
  },
  fr: {
    scenarios: {
      importKillercoda: 'Importer KillerCoda',
      importSuccess: 'Scenario importe avec succes'
    }
  }
})

function handleUploaded() {
  showUploadModal.value = false
  entityStore.loadEntities('scenarios')
}
</script>

<template>
  <div class="wrapper">
    <div class="scenario-toolbar">
      <button class="btn btn-primary" @click="showUploadModal = true">
        <i class="fas fa-file-import"></i>
        {{ t('scenarios.importKillercoda') }}
      </button>
    </div>
    <Entity :entity-name="'scenarios'" :entity-store="entityStore" />
    <ScenarioUploadModal
      :visible="showUploadModal"
      @close="showUploadModal = false"
      @uploaded="handleUploaded"
    />
  </div>
</template>

<style scoped>
.scenario-toolbar {
  display: flex;
  justify-content: flex-end;
  padding: var(--spacing-md) 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--btn-padding-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark, var(--color-primary-hover));
}
</style>
