<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import { useAdminViewMode } from '../../composables/useAdminViewMode'
import { teacherService } from '../../services/domain/scenario'
import BaseModal from '../Modals/BaseModal.vue'
import ScenarioUploadModal from '../Modals/ScenarioUploadModal.vue'
import ScenarioJSONImportModal from '../Modals/ScenarioJSONImportModal.vue'
import AdminBadge from '../Common/AdminBadge.vue'

interface OrgScenario {
  id: string
  name: string
  title: string
  difficulty: string
  instance_type?: string
  estimated_time?: number
  created_at?: string
}

const props = defineProps<{
  organizationId: string
  canManage: boolean
}>()

const { isAdmin } = useAdminViewMode()

const { t } = useTranslations({
  en: {
    orgScenarios: {
      title: 'Scenario Library',
      importKillercoda: 'Import KillerCoda',
      importJson: 'Import JSON',
      noScenarios: 'No scenarios in this organization yet.',
      confirmDelete: 'Are you sure you want to delete this scenario? This will also remove all assignments.',
      deleteSuccess: 'Scenario deleted successfully',
      exportJson: 'Export JSON',
      exportKillercoda: 'Export KillerCoda Archive',
      delete: 'Delete',
      searchPlaceholder: 'Search scenarios...',
      difficulty: 'Difficulty',
      instanceType: 'Instance Type',
      estimatedTime: 'Estimated Time',
      createdAt: 'Created',
      confirmDeleteTitle: 'Delete Scenario',
      cancel: 'Cancel',
      loadError: 'Failed to load scenarios',
      deleteError: 'Failed to delete scenario',
      exportError: 'Failed to export scenario',
      importSuccess: 'Scenario imported successfully',
      difficultyBeginner: 'Beginner',
      difficultyIntermediate: 'Intermediate',
      difficultyAdvanced: 'Advanced',
      minutes: 'min'
    }
  },
  fr: {
    orgScenarios: {
      title: 'Bibliothèque de scénarios',
      importKillercoda: 'Importer KillerCoda',
      importJson: 'Importer JSON',
      noScenarios: 'Aucun scénario dans cette organisation.',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce scénario ? Cela supprimera également toutes les affectations.',
      deleteSuccess: 'Scénario supprimé avec succès',
      exportJson: 'Exporter JSON',
      exportKillercoda: 'Exporter Archive KillerCoda',
      delete: 'Supprimer',
      searchPlaceholder: 'Rechercher des scénarios...',
      difficulty: 'Difficulté',
      instanceType: 'Type d\'instance',
      estimatedTime: 'Durée estimée',
      createdAt: 'Créé le',
      confirmDeleteTitle: 'Supprimer le scénario',
      cancel: 'Annuler',
      loadError: 'Échec du chargement des scénarios',
      deleteError: 'Échec de la suppression du scénario',
      exportError: 'Échec de l\'export du scénario',
      importSuccess: 'Scénario importé avec succès',
      difficultyBeginner: 'Débutant',
      difficultyIntermediate: 'Intermédiaire',
      difficultyAdvanced: 'Avancé',
      minutes: 'min'
    }
  }
})

const { showError: notifyError, showSuccess: notifySuccess } = useNotification()

// State
const scenarios = ref<OrgScenario[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const showDeleteModal = ref(false)
const scenarioToDelete = ref<OrgScenario | null>(null)

// Import modal state
const showUploadModal = ref(false)
const showJSONImportModal = ref(false)

// Filtered scenarios
const filteredScenarios = computed(() => {
  if (!searchQuery.value.trim()) return scenarios.value
  const q = searchQuery.value.toLowerCase()
  return scenarios.value.filter(
    s => s.title.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  )
})

// Load scenarios
async function loadScenarios() {
  isLoading.value = true
  try {
    scenarios.value = await teacherService.orgListScenarios(props.organizationId)
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('orgScenarios.loadError'))
  } finally {
    isLoading.value = false
  }
}

// Delete scenario
function handleDelete(scenario: OrgScenario) {
  scenarioToDelete.value = scenario
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!scenarioToDelete.value) return
  try {
    await teacherService.orgDeleteScenario(props.organizationId, scenarioToDelete.value.id)
    showDeleteModal.value = false
    scenarioToDelete.value = null
    notifySuccess(t('orgScenarios.deleteSuccess'))
    await loadScenarios()
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('orgScenarios.deleteError'))
  }
}

// Export handlers
async function handleExportJSON(scenario: OrgScenario) {
  try {
    const data = await teacherService.orgExportScenarioJSON(props.organizationId, scenario.id)
    const name = scenario.title || scenario.name || scenario.id
    downloadJSON(data, `${name}.json`)
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('orgScenarios.exportError'))
  }
}

async function handleExportArchive(scenario: OrgScenario) {
  try {
    const blob = await teacherService.orgExportScenarioArchive(props.organizationId, scenario.id)
    const name = scenario.title || scenario.name || scenario.id
    downloadBlob(blob, `${name}.zip`)
  } catch (err: any) {
    notifyError(err.response?.data?.error_message || t('orgScenarios.exportError'))
  }
}

// Download helpers
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

// Import handlers
function handleImportSuccess() {
  showUploadModal.value = false
  showJSONImportModal.value = false
  notifySuccess(t('orgScenarios.importSuccess'))
  loadScenarios()
}

// Helpers
function getDifficultyClass(difficulty: string) {
  switch (difficulty) {
    case 'beginner': return 'difficulty-beginner'
    case 'intermediate': return 'difficulty-intermediate'
    case 'advanced': return 'difficulty-advanced'
    default: return ''
  }
}

function translateDifficulty(difficulty: string): string {
  const difficultyMap: Record<string, string> = {
    beginner: t('orgScenarios.difficultyBeginner'),
    intermediate: t('orgScenarios.difficultyIntermediate'),
    advanced: t('orgScenarios.difficultyAdvanced')
  }
  return difficultyMap[difficulty] || difficulty
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}

onMounted(() => {
  loadScenarios()
})
</script>

<template>
  <div class="scenarios-tab">
    <div class="tab-header">
      <h3>{{ t('orgScenarios.title') }}</h3>
      <div v-if="canManage" class="tab-header-actions">
        <button @click="showUploadModal = true" class="btn btn-sm btn-primary">
          <i class="fas fa-file-import"></i>
          {{ t('orgScenarios.importKillercoda') }}
          <AdminBadge v-if="isAdmin" icon-only />
        </button>
        <button @click="showJSONImportModal = true" class="btn btn-sm btn-primary">
          <i class="fas fa-file-code"></i>
          {{ t('orgScenarios.importJson') }}
          <AdminBadge v-if="isAdmin" icon-only />
        </button>
      </div>
    </div>

    <!-- Search -->
    <div v-if="scenarios.length > 0" class="search-bar">
      <div class="search-input-wrapper">
        <i class="fas fa-search"></i>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          :placeholder="t('orgScenarios.searchPlaceholder')"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state" role="status">
      <i class="fas fa-spinner fa-spin"></i>
    </div>

    <!-- Empty -->
    <div v-else-if="scenarios.length === 0" class="empty-state">
      <i class="fas fa-flask"></i>
      <p>{{ t('orgScenarios.noScenarios') }}</p>
    </div>

    <!-- Scenario Cards -->
    <div v-else class="scenarios-list">
      <div
        v-for="scenario in filteredScenarios"
        :key="scenario.id"
        class="scenario-card"
      >
        <div class="scenario-info">
          <div class="scenario-title">
            {{ scenario.title || scenario.name }}
          </div>
          <div class="scenario-meta">
            <span
              v-if="scenario.difficulty"
              :class="['difficulty-badge', getDifficultyClass(scenario.difficulty)]"
            >
              {{ translateDifficulty(scenario.difficulty) }}
            </span>
            <span v-if="scenario.instance_type" class="meta-item">
              <i class="fas fa-server"></i>
              {{ scenario.instance_type }}
            </span>
            <span v-if="scenario.estimated_time" class="meta-item">
              <i class="fas fa-clock"></i>
              {{ scenario.estimated_time }} {{ t('orgScenarios.minutes') }}
            </span>
            <span v-if="scenario.created_at" class="meta-item">
              <i class="fas fa-calendar"></i>
              {{ formatDate(scenario.created_at) }}
            </span>
          </div>
        </div>
        <div v-if="canManage" class="scenario-actions">
          <button
            @click="handleExportJSON(scenario)"
            class="btn btn-sm btn-outline"
            :title="t('orgScenarios.exportJson')"
          >
            <i class="fas fa-file-download"></i>
            {{ t('orgScenarios.exportJson') }}
          </button>
          <button
            @click="handleExportArchive(scenario)"
            class="btn btn-sm btn-outline"
            :title="t('orgScenarios.exportKillercoda')"
          >
            <i class="fas fa-file-archive"></i>
            {{ t('orgScenarios.exportKillercoda') }}
          </button>
          <button
            @click="handleDelete(scenario)"
            class="btn btn-sm btn-danger"
          >
            <i class="fas fa-trash"></i>
            {{ t('orgScenarios.delete') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <BaseModal
      :visible="showDeleteModal"
      :title="t('orgScenarios.confirmDeleteTitle')"
      size="small"
      :show-default-footer="true"
      :confirm-text="t('orgScenarios.delete')"
      :cancel-text="t('orgScenarios.cancel')"
      @confirm="confirmDelete"
      @close="showDeleteModal = false"
    >
      <p>{{ t('orgScenarios.confirmDelete') }}</p>
    </BaseModal>

    <!-- KillerCoda Upload Modal -->
    <ScenarioUploadModal
      :visible="showUploadModal"
      :organization-id="organizationId"
      @close="showUploadModal = false"
      @uploaded="handleImportSuccess"
    />

    <!-- JSON Import Modal -->
    <ScenarioJSONImportModal
      :visible="showJSONImportModal"
      :organization-id="organizationId"
      @close="showJSONImportModal = false"
      @imported="handleImportSuccess"
    />
  </div>
</template>

<style scoped>
.scenarios-tab {
  padding: 0;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.tab-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.tab-header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.search-bar {
  margin-bottom: var(--spacing-lg);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-wrapper i {
  position: absolute;
  left: var(--spacing-md);
  color: var(--color-text-muted);
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) var(--spacing-2xl);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--color-primary);
  font-size: var(--font-size-xl);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}

.empty-state i {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-md);
}

.scenarios-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.scenario-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  transition: var(--transition-base);
}

.scenario-card:hover {
  border-color: var(--color-border-medium);
}

.scenario-info {
  flex: 1;
}

.scenario-title {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  margin-bottom: var(--spacing-xs);
}

.scenario-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.difficulty-badge {
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.difficulty-beginner {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
}

.difficulty-intermediate {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.difficulty-advanced {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.scenario-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
}

.btn-outline:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-dark);
}

/* Responsive */
@media (max-width: 768px) {
  .scenario-card {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .scenario-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .scenario-meta {
    flex-wrap: wrap;
  }

  .tab-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .tab-header-actions {
    flex-wrap: wrap;
  }
}
</style>
