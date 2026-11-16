<script setup lang="ts">
import Entity from '../Entity.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useScenariosStore } from '../../../stores/scenarios'
import { useTranslations } from '../../../composables/useTranslations'
import { useNotification } from '../../../composables/useNotification'
import { teacherService } from '../../../services/domain/scenario'
import { downloadBlob, downloadJSON } from '../../../utils/download'
import ScenarioImportModal from '../../Modals/ScenarioImportModal.vue'

const router = useRouter()
const entityStore = useScenariosStore()
const importFormat = ref<'json' | 'archive' | null>(null)

const { showError: notifyError, showSuccess: notifySuccess } = useNotification()
const isDuplicating = ref<string | null>(null)
const isPreviewing = ref<string | null>(null)

const { t } = useTranslations({
  en: {
    scenarios: {
      importKillercoda: 'Import KillerCoda',
      importJson: 'Import JSON',
      importSuccess: 'Scenario imported successfully',
      exportJson: 'Export JSON',
      exportKillercoda: 'Export KillerCoda',
      exportError: 'Failed to export scenario',
      duplicate: 'Duplicate',
      duplicateSuccess: 'Scenario duplicated',
      duplicateError: 'Failed to duplicate scenario',
      test: 'Test',
      testError: 'Failed to start preview session'
    }
  },
  fr: {
    scenarios: {
      importKillercoda: 'Importer KillerCoda',
      importJson: 'Importer JSON',
      importSuccess: 'Scénario importé avec succès',
      exportJson: 'Exporter JSON',
      exportKillercoda: 'Exporter KillerCoda',
      exportError: 'Échec de l\'export du scénario',
      duplicate: 'Dupliquer',
      duplicateSuccess: 'Scénario dupliqué',
      duplicateError: 'Échec de la duplication du scénario',
      test: 'Tester',
      testError: 'Échec du lancement de la session de test'
    }
  }
})

function handleImported() {
  importFormat.value = null
  entityStore.loadEntities('scenarios')
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

async function previewScenario(entity: any) {
  isPreviewing.value = entity.id
  try {
    const response = await axios.post(`/scenarios/${entity.id}/preview`)
    const session = response.data
    const sessionId = session.terminal_session_id || session.id
    if (sessionId) {
      router.push({ name: 'TerminalSessionView', params: { sessionId } })
    }
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('scenarios.testError'))
  } finally {
    isPreviewing.value = null
  }
}

async function duplicateScenario(entity: any) {
  isDuplicating.value = entity.id
  try {
    await axios.post(`/scenarios/${entity.id}/duplicate`)
    notifySuccess(t('scenarios.duplicateSuccess'))
    entityStore.loadEntities('scenarios')
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('scenarios.duplicateError'))
  } finally {
    isDuplicating.value = null
  }
}
</script>

<template>
  <Entity :entity-name="'scenarios'" :entity-store="entityStore">
    <template #toolbar-extra>
      <button class="btn btn-secondary" @click="importFormat = 'archive'">
        <i class="fas fa-file-import"></i>
        {{ t('scenarios.importKillercoda') }}
      </button>
      <button class="btn btn-secondary" @click="importFormat = 'json'">
        <i class="fas fa-file-code"></i>
        {{ t('scenarios.importJson') }}
      </button>
    </template>
    <template #actions="{ entity }">
      <button
        class="btn btn-secondary"
        :disabled="isPreviewing === entity.id"
        @click="previewScenario(entity)"
      >
        <i :class="isPreviewing === entity.id ? 'fas fa-spinner fa-spin' : 'fas fa-play'"></i>
        {{ t('scenarios.test') }}
      </button>
      <button
        class="btn btn-secondary"
        :disabled="isDuplicating === entity.id"
        @click="duplicateScenario(entity)"
      >
        <i :class="isDuplicating === entity.id ? 'fas fa-spinner fa-spin' : 'fas fa-copy'"></i>
        {{ t('scenarios.duplicate') }}
      </button>
      <button class="btn btn-secondary" @click="exportJSON(entity)">
        <i class="fas fa-file-download"></i>
        {{ t('scenarios.exportJson') }}
      </button>
      <button class="btn btn-secondary" @click="exportArchive(entity)">
        <i class="fas fa-file-archive"></i>
        {{ t('scenarios.exportKillercoda') }}
      </button>
    </template>
  </Entity>
  <ScenarioImportModal
    :visible="importFormat !== null"
    :format="importFormat ?? 'json'"
    @close="importFormat = null"
    @imported="handleImported"
  />
</template>
