<script setup lang="ts">
import Entity from '../Entity.vue'
import { ref } from 'vue'
import { useScenariosStore } from '../../../stores/scenarios'
import { useTranslations } from '../../../composables/useTranslations'
import { useNotification } from '../../../composables/useNotification'
import { teacherService } from '../../../services/domain/scenario'
import ScenarioUploadModal from '../../Modals/ScenarioUploadModal.vue'
import ScenarioJSONImportModal from '../../Modals/ScenarioJSONImportModal.vue'

const entityStore = useScenariosStore()
const showUploadModal = ref(false)
const showJSONImportModal = ref(false)

const { showError: notifyError } = useNotification()

const { t } = useTranslations({
  en: {
    scenarios: {
      importKillercoda: 'Import KillerCoda',
      importJson: 'Import JSON',
      importSuccess: 'Scenario imported successfully',
      exportJson: 'Export JSON',
      exportKillercoda: 'Export KillerCoda',
      exportError: 'Failed to export scenario'
    }
  },
  fr: {
    scenarios: {
      importKillercoda: 'Importer KillerCoda',
      importJson: 'Importer JSON',
      importSuccess: 'Scénario importé avec succès',
      exportJson: 'Exporter JSON',
      exportKillercoda: 'Exporter KillerCoda',
      exportError: 'Échec de l\'export du scénario'
    }
  }
})

function handleUploaded() {
  showUploadModal.value = false
  entityStore.loadEntities('scenarios')
}

function handleJSONImported() {
  showJSONImportModal.value = false
  entityStore.loadEntities('scenarios')
}

function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function exportJSON(entity: any) {
  try {
    const data = await teacherService.exportScenarioJSON(entity.id)
    const name = entity.title || entity.name || entity.id
    downloadJSON(data, `${name}.json`)
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('scenarios.exportError'))
  }
}

async function exportArchive(entity: any) {
  try {
    const blob = await teacherService.exportScenarioArchive(entity.id)
    const name = entity.title || entity.name || entity.id
    downloadBlob(blob, `${name}.zip`)
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('scenarios.exportError'))
  }
}
</script>

<template>
  <div class="wrapper">
    <div class="scenario-toolbar">
      <button class="btn btn-primary" @click="showUploadModal = true">
        <i class="fas fa-file-import"></i>
        {{ t('scenarios.importKillercoda') }}
      </button>
      <button class="btn btn-primary" @click="showJSONImportModal = true">
        <i class="fas fa-file-code"></i>
        {{ t('scenarios.importJson') }}
      </button>
    </div>
    <Entity :entity-name="'scenarios'" :entity-store="entityStore">
      <template #actions="{ entity }">
        <button class="btn btn-sm btn-outline" @click="exportJSON(entity)" :title="t('scenarios.exportJson')">
          <i class="fas fa-file-download"></i>
        </button>
        <button class="btn btn-sm btn-outline" @click="exportArchive(entity)" :title="t('scenarios.exportKillercoda')">
          <i class="fas fa-file-archive"></i>
        </button>
      </template>
    </Entity>
    <ScenarioUploadModal
      :visible="showUploadModal"
      @close="showUploadModal = false"
      @uploaded="handleUploaded"
    />
    <ScenarioJSONImportModal
      :visible="showJSONImportModal"
      @close="showJSONImportModal = false"
      @imported="handleJSONImported"
    />
  </div>
</template>

<style scoped>
.scenario-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
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

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
}

.btn-outline:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-dark);
}
</style>
