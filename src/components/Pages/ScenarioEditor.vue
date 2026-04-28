<template>
  <div class="scenario-editor">
    <div class="editor-header">
      <div class="header-left">
        <h1>{{ t('scenarioEditor.title') }}</h1>

        <!-- Scenario Selector -->
        <div class="scenario-selector">
          <select
            v-model="selectedScenarioId"
            @change="handleScenarioSelect"
            class="scenario-select"
          >
            <option :value="null">{{ t('scenarioEditor.selectScenario') }}</option>
            <option
              v-for="scenario in allScenarios"
              :key="scenario.id"
              :value="scenario.id"
            >
              {{ scenario.name }} - {{ scenario.title }} ({{ scenario.organization_id ? (getScenarioOrgName(scenario) || t('scenarioEditor.orgLabel')) : (isAdmin ? t('scenarioEditor.platform') + ' \u{1F6E1}\uFE0F' : t('scenarioEditor.platform')) }})
            </option>
          </select>

          <button @click="handleCreateNew" class="btn-create">
            {{ t('scenarioEditor.createNew') }}
          </button>

          <button
            v-if="selectedScenarioId"
            @click="handleImport"
            class="btn-import"
            :disabled="isImporting"
          >
            <span v-if="isImporting">⏳</span>
            <span v-else>📥</span>
            {{ t('scenarioEditor.import') }}
          </button>

          <!-- Copy to org -->
          <button
            v-if="canCopyToOrg"
            @click="openCopyModal"
            class="btn-copy-org"
          >
            {{ t('scenarioEditor.copyToOrg') }}
          </button>

          <!-- Debug info -->
          <span class="debug-info" v-if="nodes.length > 0">
            {{ nodes.length }} nodes, {{ edges.length }} edges
          </span>
        </div>

        <!-- Org context badge for loaded scenario -->
        <div v-if="currentScenario" class="scenario-org-badge">
          <span class="org-tag">
            {{ t('scenarioEditor.orgLabel') }}:
            <template v-if="currentScenario.organization_id">
              {{ getScenarioOrgName(currentScenario) || '—' }}
            </template>
            <template v-else>
              {{ t('scenarioEditor.platform') }}
              <AdminBadge v-if="isAdmin" icon-only />
            </template>
          </span>
        </div>
      </div>

      <div class="editor-actions">
        <button @click="handleSave" class="btn-primary" :disabled="!selectedScenarioId && nodes.length === 0">
          {{ t('scenarioEditor.save') }}
        </button>
        <button @click="handleReset" class="btn-secondary">
          {{ t('scenarioEditor.reset') }}
        </button>
      </div>
    </div>

    <div class="editor-container">
      <!-- Left Panel: Node Library -->
      <NodeLibraryPanel
        class="panel library-panel"
        :node-types="scenarioNodeTypeDefinitions"
        :panel-title="t('scenarioEditor.nodeLibraryTitle')"
        :help-text="t('scenarioEditor.nodeLibraryHelp')"
        @node-drag-start="handleNodeDragStart"
      />

      <!-- Center Panel: Flow Canvas -->
      <FlowCanvas
        class="panel canvas-panel"
        :nodes="nodes"
        :edges="edges"
        :dragged-node-type="draggedNodeType"
        :custom-node-types="customNodeTypes"
        :empty-icon="'🧪'"
        :empty-title="t('scenarioEditor.emptyTitle')"
        :empty-description="t('scenarioEditor.emptyDescription')"
        @nodes-change="handleNodesChange"
        @edges-change="handleEdgesChange"
        @update:nodes="nodes = $event"
        @node-click="handleNodeClick"
        @pane-click="handlePaneClick"
        @node-added="handleNodeAdded"
        @node-edit="openEditModal"
        @node-delete="openDeleteModal"
        @toggle-expand="handleToggleExpand"
        @select-tree="handleSelectTree"
        @edge-connect="handleEdgeConnect"
      />

      <!-- Right Panel: Scenario Step List -->
      <div class="panel tree-panel" :style="{ width: treePanelWidth + 'px' }">
        <div
          class="resize-handle"
          :class="{ resizing: isResizing }"
          @mousedown="startResize"
        ></div>
        <ScenarioStepListPanel
          :scenarios="allScenarios"
        />
      </div>
    </div>

    <!-- Edit Scenario Modal -->
    <BaseModal
      :visible="showScenarioEditModal"
      :title="scenarioEditModalTitle"
      size="large"
      :show-default-footer="true"
      :confirm-text="t('scenarioEditor.saveEntity')"
      :cancel-text="t('scenarioEditor.cancel')"
      :is-loading="isSaving"
      :error-message="modalError"
      @close="closeScenarioEditModal"
      @confirm="handleSaveScenario"
    >
      <!-- Tabs -->
      <div class="scenario-modal-tabs">
        <button
          v-for="tab in scenarioModalTabs"
          :key="tab.key"
          class="scenario-modal-tab"
          :class="{ active: activeScenarioTab === tab.key }"
          @click="activeScenarioTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- General tab -->
      <div v-show="activeScenarioTab === 'general'" class="modal-form">
        <div class="form-group">
          <label>{{ t('scenarioEditor.scenarioName') }}</label>
          <input
            v-model="editingScenario.name"
            type="text"
            class="form-control"
            :placeholder="t('scenarioEditor.enterName')"
          />
        </div>

        <div class="form-group">
          <label>{{ t('scenarioEditor.scenarioTitle') }}</label>
          <input
            v-model="editingScenario.title"
            type="text"
            class="form-control"
            :placeholder="t('scenarioEditor.enterTitle')"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ t('scenarioEditor.difficulty') }}</label>
            <select v-model="editingScenario.difficulty" class="form-control">
              <option value="beginner">{{ t('scenarioEditor.beginner') }}</option>
              <option value="intermediate">{{ t('scenarioEditor.intermediate') }}</option>
              <option value="advanced">{{ t('scenarioEditor.advanced') }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ t('scenarioEditor.estimatedTime') }}</label>
            <input
              v-model="editingScenario.estimated_time"
              type="text"
              class="form-control"
              placeholder="30m"
            />
          </div>
        </div>

        <div class="form-group">
          <label>{{ t('scenarioEditor.description') }}</label>
          <textarea
            v-model="editingScenario.description"
            class="form-control"
            rows="3"
            :placeholder="t('scenarioEditor.enterDescription')"
          ></textarea>
        </div>

        <!-- Org selector -->
        <div class="form-group" v-if="isAdmin">
          <label>{{ t('scenarioEditor.orgLabel') }}</label>
          <select v-model="editingScenario.organization_id" class="form-control">
            <option :value="null">{{ t('scenarioEditor.platformOnly') }}</option>
            <option
              v-for="org in organizationsStore.userOrganizations"
              :key="org.id"
              :value="org.id"
            >
              {{ org.display_name || org.name }}
            </option>
          </select>
        </div>
        <div class="form-group" v-else-if="organizationsStore.currentOrganization">
          <label>{{ t('scenarioEditor.orgLabel') }}</label>
          <input
            type="text"
            class="form-control"
            :value="organizationsStore.currentOrganization.display_name || organizationsStore.currentOrganization.name"
            disabled
          />
        </div>
      </div>

      <!-- Content tab -->
      <div v-show="activeScenarioTab === 'content'" class="modal-form">
        <div class="form-group">
          <label>{{ t('scenarioEditor.introText') }}</label>
          <textarea
            v-model="editingScenario.intro_text"
            class="form-control"
            rows="6"
            :placeholder="t('scenarioEditor.introTextPlaceholder')"
          ></textarea>
          <span class="form-hint">{{ t('scenarioEditor.markdownSupported') }}</span>
        </div>

        <div class="form-group">
          <label>{{ t('scenarioEditor.finishText') }}</label>
          <textarea
            v-model="editingScenario.finish_text"
            class="form-control"
            rows="6"
            :placeholder="t('scenarioEditor.finishTextPlaceholder')"
          ></textarea>
          <span class="form-hint">{{ t('scenarioEditor.markdownSupported') }}</span>
        </div>

        <div class="form-group">
          <label>{{ t('scenarioEditor.objectives') }}</label>
          <textarea
            v-model="editingScenario.objectives"
            class="form-control"
            rows="3"
            :placeholder="t('scenarioEditor.objectivesPlaceholder')"
          ></textarea>
        </div>

        <div class="form-group">
          <label>{{ t('scenarioEditor.prerequisites') }}</label>
          <textarea
            v-model="editingScenario.prerequisites"
            class="form-control"
            rows="3"
            :placeholder="t('scenarioEditor.prerequisitesPlaceholder')"
          ></textarea>
        </div>
      </div>

      <!-- Setup tab -->
      <div v-show="activeScenarioTab === 'setup'" class="modal-form">
        <div class="form-group">
          <label>{{ t('scenarioEditor.setupScript') }}</label>
          <textarea
            v-model="editingScenario.setup_script"
            class="form-control script-editor"
            rows="12"
            :placeholder="t('scenarioEditor.setupScriptPlaceholder')"
          ></textarea>
          <span class="form-hint">{{ t('scenarioEditor.setupScriptHint') }}</span>
        </div>
      </div>

      <!-- Options tab -->
      <div v-show="activeScenarioTab === 'options'" class="modal-form">
        <div class="form-row">
          <div class="form-group">
            <label>{{ t('scenarioEditor.instanceType') }}</label>
            <input
              v-model="editingScenario.instance_type"
              type="text"
              class="form-control"
              placeholder="S"
            />
          </div>

          <div class="form-group">
            <label>{{ t('scenarioEditor.hostname') }}</label>
            <input
              v-model="editingScenario.hostname"
              type="text"
              class="form-control"
              placeholder="lab"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ t('scenarioEditor.osType') }}</label>
            <select v-model="editingScenario.os_type" class="form-control">
              <option value="">-</option>
              <option value="deb">Debian (apt)</option>
              <option value="rpm">RPM (dnf/yum)</option>
              <option value="apk">Alpine (apk)</option>
              <option value="pacman">Arch (pacman)</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ t('scenarioEditor.sourceType') }}</label>
            <select v-model="editingScenario.source_type" class="form-control">
              <option value="">-</option>
              <option value="builtin">{{ t('scenarioEditor.sourceBuiltin') }}</option>
              <option value="git">Git</option>
              <option value="upload">Upload</option>
              <option value="seed">Seed</option>
            </select>
          </div>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="editingScenario.flags_enabled" />
            {{ t('scenarioEditor.flagsEnabled') }}
          </label>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="editingScenario.crash_traps" />
            {{ t('scenarioEditor.crashTraps') }}
          </label>
          <span class="form-hint">{{ t('scenarioEditor.crashTrapsHint') }}</span>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="editingScenario.gsh_enabled" />
            {{ t('scenarioEditor.gshEnabled') }}
          </label>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="editingScenario.is_public" />
            {{ t('scenarioEditor.isPublic') }}
          </label>
        </div>
      </div>
    </BaseModal>

    <!-- Edit Step Modal -->
    <ScenarioStepEditModal
      :visible="showStepEditModal"
      :step-data="editingStep"
      :is-new="editingStepIsNew"
      @close="closeStepEditModal"
      @save="handleSaveStep"
    />

    <!-- Delete Confirmation Modal -->
    <BaseModal
      :visible="showDeleteModal"
      :title="t('scenarioEditor.confirmDelete')"
      size="small"
      :show-default-footer="true"
      :confirm-text="t('scenarioEditor.delete')"
      :cancel-text="t('scenarioEditor.cancel')"
      confirm-icon="fas fa-trash"
      @close="closeDeleteModal"
      @confirm="confirmDelete"
    >
      <p>{{ t('scenarioEditor.deleteWarning', { type: deletingNode?.data?.entityType || 'item', name: deletingNode?.data?.label || '' }) }}</p>
    </BaseModal>

    <!-- Copy to Org Modal -->
    <BaseModal
      :visible="showCopyModal"
      :title="t('scenarioEditor.copyToOrg')"
      size="small"
      :show-default-footer="true"
      :confirm-text="isCopying ? t('scenarioEditor.copying') : t('scenarioEditor.copyToOrg')"
      :cancel-text="t('scenarioEditor.cancel')"
      :is-loading="isCopying"
      @close="closeCopyModal"
      @confirm="handleCopyToOrg"
    >
      <div class="form-group">
        <label>{{ t('scenarioEditor.selectTargetOrg') }}</label>
        <select v-model="copyTargetOrgId" class="form-control">
          <option :value="null" disabled>{{ t('scenarioEditor.selectTargetOrg') }}</option>
          <option
            v-for="org in copyTargetOrgs"
            :key="org.id"
            :value="org.id"
          >
            {{ org.display_name || org.name }}
          </option>
        </select>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, markRaw, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useScenariosStore } from '../../stores/scenarios'
import { useScenarioStepsStore } from '../../stores/scenarioSteps'
import { useOrganizationsStore } from '../../stores/organizations'
import { useTranslations } from '../../composables/useTranslations'
import { useAdminViewMode } from '../../composables/useAdminViewMode'
import { useNotification } from '../../composables/useNotification'
import NodeLibraryPanel from '../GraphEditor/NodeLibraryPanel.vue'
import type { NodeTypeDefinition } from '../GraphEditor/NodeLibraryPanel.vue'
import FlowCanvas from '../GraphEditor/FlowCanvas.vue'
import ScenarioStepListPanel from '../ScenarioEditor/ScenarioStepListPanel.vue'
import ScenarioNode from '../ScenarioEditor/nodes/ScenarioNode.vue'
import StepNode from '../ScenarioEditor/nodes/StepNode.vue'
import TerminalStepNode from '../ScenarioEditor/nodes/TerminalStepNode.vue'
import FlagStepNode from '../ScenarioEditor/nodes/FlagStepNode.vue'
import InfoStepNode from '../ScenarioEditor/nodes/InfoStepNode.vue'
import QuizStepNode from '../ScenarioEditor/nodes/QuizStepNode.vue'
import ScenarioStepEditModal from '../ScenarioEditor/ScenarioStepEditModal.vue'
import AdminBadge from '../Common/AdminBadge.vue'
import BaseModal from '../Modals/BaseModal.vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const { t } = useTranslations({
  en: {
    scenarioEditor: {
      title: 'Scenario Editor',
      selectScenario: 'Select a scenario to edit...',
      createNew: 'Create New',
      import: 'Import',
      save: 'Save Changes',
      reset: 'Reset Layout',
      saveSuccess: 'Changes saved successfully',
      saveError: 'Failed to save changes',
      loadError: 'Failed to load scenario',
      importSuccess: 'Scenario imported successfully',
      importError: 'Failed to import scenario',
      emptyTitle: 'No Nodes Yet',
      emptyDescription: 'Select a scenario or drag node types from the library',
      nodeLibraryTitle: 'Node Library',
      nodeLibraryHelp: 'Drag a node type onto the canvas to create a new entity',
      nodeTypes: {
        scenario: 'Scenario',
        step: 'Step',
        scenarioDescription: 'Root scenario container',
        stepDescription: 'Individual scenario step',
        terminalStep: 'Terminal Step',
        terminalStepDescription: 'Step with terminal verification',
        flagStep: 'Flag Step',
        flagStepDescription: 'Step with flag capture challenge',
        infoStep: 'Info Step',
        infoStepDescription: 'Informational content step',
        quizStep: 'Quiz Step',
        quizStepDescription: 'Step with quiz questions'
      },
      // Modal
      saveEntity: 'Save',
      cancel: 'Cancel',
      scenarioName: 'Name',
      enterName: 'Enter scenario name...',
      scenarioTitle: 'Title',
      enterTitle: 'Enter scenario title...',
      difficulty: 'Difficulty',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      estimatedTime: 'Estimated Time',
      description: 'Description',
      enterDescription: 'Enter description...',
      editScenario: 'Edit Scenario',
      createScenario: 'Create Scenario',
      confirmDelete: 'Confirm Deletion',
      delete: 'Delete',
      deleteWarning: 'Are you sure you want to delete this {type}: "{name}"? This action cannot be undone.',
      invalidConnection: 'Invalid connection: {source} cannot connect to {target}',
      orderSynced: '{count} step order(s) updated',
      platform: 'Platform',
      orgLabel: 'Organization',
      copyToOrg: 'Copy to organization',
      copySuccess: 'Scenario copied successfully',
      copyError: 'Failed to copy scenario',
      selectTargetOrg: 'Select target organization',
      platformOnly: 'Platform (admin only)',
      copying: 'Copying...',
      // Scenario modal tabs
      tabGeneral: 'General',
      tabContent: 'Content',
      tabSetup: 'Setup',
      tabOptions: 'Options',
      // Content tab
      introText: 'Introduction Text',
      introTextPlaceholder: 'Markdown text shown before the first step...',
      finishText: 'Completion Text',
      finishTextPlaceholder: 'Markdown text shown after the last step...',
      objectives: 'Objectives',
      objectivesPlaceholder: 'Learning objectives for this scenario...',
      prerequisites: 'Prerequisites',
      prerequisitesPlaceholder: 'Required knowledge or setup...',
      markdownSupported: 'Markdown supported',
      // Setup tab
      setupScript: 'Global Setup Script',
      setupScriptPlaceholder: '#!/bin/bash\n# This script runs once at session start, before any step...',
      setupScriptHint: 'Runs once when a student starts the scenario, before step 1. Use for global environment provisioning.',
      // Options tab
      instanceType: 'Machine Size',
      hostname: 'Container Hostname',
      osType: 'OS Type',
      sourceType: 'Source Type',
      sourceBuiltin: 'Built-in',
      flagsEnabled: 'Enable CTF flags',
      crashTraps: 'Enable crash traps (challenge mode)',
      crashTrapsHint: 'All flags deployed at start. Container crash resets progress.',
      gshEnabled: 'Enable GSH command',
      isPublic: 'Public (available to all users)'
    }
  },
  fr: {
    scenarioEditor: {
      title: 'Éditeur de Scénarios',
      selectScenario: 'Sélectionner un scénario à éditer...',
      createNew: 'Créer Nouveau',
      import: 'Importer',
      save: 'Enregistrer',
      reset: 'Réinitialiser',
      saveSuccess: 'Modifications enregistrées avec succès',
      saveError: 'Échec de l\'enregistrement',
      loadError: 'Échec du chargement du scénario',
      importSuccess: 'Scénario importé avec succès',
      importError: 'Échec de l\'importation du scénario',
      emptyTitle: 'Aucun Nœud',
      emptyDescription: 'Sélectionnez un scénario ou glissez des types de nœuds depuis la bibliothèque',
      nodeLibraryTitle: 'Bibliothèque de Nœuds',
      nodeLibraryHelp: 'Glissez un type de nœud sur le canevas pour créer une nouvelle entité',
      nodeTypes: {
        scenario: 'Scénario',
        step: 'Étape',
        scenarioDescription: 'Conteneur de scénario principal',
        stepDescription: 'Étape individuelle du scénario',
        terminalStep: 'Étape Terminal',
        terminalStepDescription: 'Étape avec vérification terminal',
        flagStep: 'Étape Drapeau',
        flagStepDescription: 'Étape avec capture de drapeau',
        infoStep: 'Étape Information',
        infoStepDescription: 'Étape de contenu informatif',
        quizStep: 'Étape Quiz',
        quizStepDescription: 'Étape avec questions de quiz'
      },
      // Modal
      saveEntity: 'Enregistrer',
      cancel: 'Annuler',
      scenarioName: 'Nom',
      enterName: 'Saisir le nom du scénario...',
      scenarioTitle: 'Titre',
      enterTitle: 'Saisir le titre du scénario...',
      difficulty: 'Difficulté',
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
      estimatedTime: 'Temps estimé',
      description: 'Description',
      enterDescription: 'Saisir la description...',
      editScenario: 'Modifier le Scénario',
      createScenario: 'Créer un Scénario',
      confirmDelete: 'Confirmer la Suppression',
      delete: 'Supprimer',
      deleteWarning: 'Êtes-vous sûr de vouloir supprimer ce {type}: "{name}"? Cette action est irréversible.',
      invalidConnection: 'Connexion invalide : {source} ne peut pas se connecter à {target}',
      orderSynced: '{count} ordre(s) d\'étape mis à jour',
      platform: 'Plateforme',
      orgLabel: 'Organisation',
      copyToOrg: 'Copier vers une organisation',
      copySuccess: 'Scénario copié avec succès',
      copyError: 'Échec de la copie du scénario',
      selectTargetOrg: 'Sélectionner l\'organisation cible',
      platformOnly: 'Plateforme (admin uniquement)',
      copying: 'Copie en cours...',
      // Onglets du modal scénario
      tabGeneral: 'Général',
      tabContent: 'Contenu',
      tabSetup: 'Installation',
      tabOptions: 'Options',
      // Onglet contenu
      introText: 'Texte d\'introduction',
      introTextPlaceholder: 'Texte markdown affiché avant la première étape...',
      finishText: 'Texte de fin',
      finishTextPlaceholder: 'Texte markdown affiché après la dernière étape...',
      objectives: 'Objectifs',
      objectivesPlaceholder: 'Objectifs pédagogiques de ce scénario...',
      prerequisites: 'Prérequis',
      prerequisitesPlaceholder: 'Connaissances ou configuration requises...',
      markdownSupported: 'Markdown supporté',
      // Onglet installation
      setupScript: 'Script d\'installation global',
      setupScriptPlaceholder: '#!/bin/bash\n# Ce script s\'exécute une fois au démarrage de la session, avant toute étape...',
      setupScriptHint: 'S\'exécute une fois lorsqu\'un étudiant démarre le scénario, avant l\'étape 1. Pour le provisionnement global.',
      // Onglet options
      instanceType: 'Taille machine',
      hostname: 'Nom d\'hôte du conteneur',
      osType: 'Type d\'OS',
      sourceType: 'Type de source',
      sourceBuiltin: 'Intégré',
      flagsEnabled: 'Activer les drapeaux CTF',
      crashTraps: 'Activer les pièges de crash (mode challenge)',
      crashTrapsHint: 'Tous les drapeaux déployés au démarrage. Un crash du conteneur réinitialise la progression.',
      gshEnabled: 'Activer la commande GSH',
      isPublic: 'Public (disponible pour tous les utilisateurs)'
    }
  }
})

const scenariosStore = useScenariosStore()
const scenarioStepsStore = useScenarioStepsStore()
const organizationsStore = useOrganizationsStore()
const { isAdmin } = useAdminViewMode()
const notification = useNotification()

// Custom node types for VueFlow
const customNodeTypes: Record<string, Component> = {
  scenario: markRaw(ScenarioNode),
  step: markRaw(StepNode),
  terminal: markRaw(TerminalStepNode),
  flag: markRaw(FlagStepNode),
  info: markRaw(InfoStepNode),
  quiz: markRaw(QuizStepNode)
}

// Step type node types (used in multiple places)
const STEP_NODE_TYPES = ['terminal', 'flag', 'info', 'quiz']

// Node type definitions for the library panel
const scenarioNodeTypeDefinitions = computed((): NodeTypeDefinition[] => [
  {
    type: 'scenario',
    icon: '\u{1F9EA}',
    color: 'var(--scenario-node-scenario)',
    bgColor: 'var(--scenario-node-scenario-bg)',
    label: t('scenarioEditor.nodeTypes.scenario'),
    description: t('scenarioEditor.nodeTypes.scenarioDescription')
  },
  {
    type: 'terminal',
    icon: '\u{1F5A5}\uFE0F',
    color: 'var(--scenario-node-terminal)',
    bgColor: 'var(--scenario-node-terminal-bg)',
    label: t('scenarioEditor.nodeTypes.terminalStep'),
    description: t('scenarioEditor.nodeTypes.terminalStepDescription')
  },
  {
    type: 'flag',
    icon: '\u{1F6A9}',
    color: 'var(--scenario-node-flag)',
    bgColor: 'var(--scenario-node-flag-bg)',
    label: t('scenarioEditor.nodeTypes.flagStep'),
    description: t('scenarioEditor.nodeTypes.flagStepDescription')
  },
  {
    type: 'info',
    icon: '\u{1F4D6}',
    color: 'var(--scenario-node-info)',
    bgColor: 'var(--scenario-node-info-bg)',
    label: t('scenarioEditor.nodeTypes.infoStep'),
    description: t('scenarioEditor.nodeTypes.infoStepDescription')
  },
  {
    type: 'quiz',
    icon: '\u{2753}',
    color: 'var(--scenario-node-quiz)',
    bgColor: 'var(--scenario-node-quiz-bg)',
    label: t('scenarioEditor.nodeTypes.quizStep'),
    description: t('scenarioEditor.nodeTypes.quizStepDescription')
  }
])

// State
const nodes = ref<any[]>([])
const edges = ref<any[]>([])
const draggedNodeType = ref<string | null>(null)
const selectedScenarioId = ref<string | null>(null)
const currentScenario = ref<any>(null)
const allScenarios = computed(() => scenariosStore.entities)
const isImporting = ref(false)

// Modal state
const showScenarioEditModal = ref(false)
const showStepEditModal = ref(false)
const showDeleteModal = ref(false)
const editingScenario = ref<any>({})
const activeScenarioTab = ref('general')
const scenarioModalTabs = computed(() => [
  { key: 'general', label: t('scenarioEditor.tabGeneral') },
  { key: 'content', label: t('scenarioEditor.tabContent') },
  { key: 'setup', label: t('scenarioEditor.tabSetup') },
  { key: 'options', label: t('scenarioEditor.tabOptions') }
])
const editingStep = ref<any>(null)
const editingStepIsNew = ref(false)
const editingStepNodeId = ref<string | null>(null)
const deletingNode = ref<any>(null)
const isSaving = ref(false)
const modalError = ref('')

// Copy to org state
const showCopyModal = ref(false)
const copyTargetOrgId = ref<string | null>(null)
const isCopying = ref(false)

// Org context helpers
const getScenarioOrgName = (scenario: any): string | null => {
  if (!scenario.organization_id) return null
  const org = organizationsStore.getOrganizationById(scenario.organization_id)
  return org?.display_name || org?.name || null
}

const canCopyToOrg = computed(() => {
  return selectedScenarioId.value &&
    currentScenario.value &&
    organizationsStore.userOrganizations.length > 1
})

const copyTargetOrgs = computed(() => {
  if (!currentScenario.value) return []
  return organizationsStore.userOrganizations.filter(
    org => org.id !== currentScenario.value?.organization_id
  )
})

// Resize state
const treePanelWidth = ref(280)
const isResizing = ref(false)
const resizeStartX = ref(0)
const resizeStartWidth = ref(0)

const scenarioEditModalTitle = computed(() => {
  return editingScenario.value?.isNew
    ? t('scenarioEditor.createScenario')
    : t('scenarioEditor.editScenario')
})

// Load all scenarios
onMounted(async () => {
  await scenariosStore.loadEntities('/scenarios?include=steps')

  // Check if scenarioId is in URL query params
  const scenarioIdFromUrl = route.query.scenarioId as string | undefined
  if (scenarioIdFromUrl) {
    selectedScenarioId.value = scenarioIdFromUrl
    await handleScenarioSelect()
  }

  // Load saved panel width from localStorage
  const savedWidth = localStorage.getItem('scenarioEditor_treePanelWidth')
  if (savedWidth) {
    const width = parseInt(savedWidth)
    if (width >= 200 && width <= 600) {
      treePanelWidth.value = width
    }
  }

  // Add global mouse event listeners for resizing
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})

// Handle scenario selection
const handleScenarioSelect = async () => {
  if (!selectedScenarioId.value) {
    nodes.value = []
    edges.value = []
    currentScenario.value = null
    router.replace({ query: {} })
    return
  }

  router.replace({ query: { scenarioId: selectedScenarioId.value } })

  try {
    // Load scenario with steps included
    const response = await axios.get(`/scenarios/${selectedScenarioId.value}?include=steps`)
    const scenario = response.data

    if (!scenario) {
      return
    }

    currentScenario.value = scenario
    convertScenarioToNodes(scenario)

    // Load saved positions
    setTimeout(() => {
      loadNodePositions()
    }, 0)
  } catch (err) {
    console.error('Error loading scenario:', err)
    notification.showError(t('scenarioEditor.loadError'))
  }
}

// Convert scenario to nodes and edges (vertical layout)
const convertScenarioToNodes = (scenario: any) => {
  const newNodes: any[] = []
  const newEdges: any[] = []

  const steps = scenario.scenario_steps || scenario.scenarioSteps || scenario.steps || []

  // Create scenario root node at top-left
  const scenarioNode = {
    id: `scenario-${scenario.id}`,
    type: 'scenario',
    position: { x: 100, y: 50 },
    data: {
      label: scenario.title || scenario.name,
      entityId: scenario.id,
      entityType: 'scenario',
      difficulty: scenario.difficulty,
      estimated_time: scenario.estimated_time,
      flags_enabled: scenario.flags_enabled,
      steps: steps,
      isNew: false,
      isExpanded: true,
      ...scenario
    }
  }
  newNodes.push(scenarioNode)

  if (steps.length === 0) {
    nodes.value = newNodes
    edges.value = newEdges
    return
  }

  // Sort steps by order
  const sortedSteps = [...steps].sort((a, b) => (a.order || 0) - (b.order || 0))

  // Layout: scenario at top-left, first step below, then steps spread horizontally
  const STEP_SPACING_X = 250      // Horizontal spacing between steps
  const LEVEL_SPACING_Y = 200     // Vertical gap from scenario to step row
  const stepRowY = 50 + LEVEL_SPACING_Y  // Steps row Y position
  let currentX = 100              // Start at same X as scenario
  let previousStepId: string | null = null

  sortedSteps.forEach((step, stepIdx) => {
    const stepId = `step-${step.id}`
    const nodeType = step.step_type && STEP_NODE_TYPES.includes(step.step_type) ? step.step_type : 'terminal'

    const stepNode = {
      id: stepId,
      type: nodeType,
      position: { x: currentX, y: stepRowY },
      data: {
        label: step.title || `Step ${stepIdx + 1}`,
        entityId: step.id,
        entityType: nodeType,
        step_type: nodeType,
        order: step.order || stepIdx + 1,
        text_content: step.text_content,
        hint_content: step.hint_content,
        hint_file_id: step.hint_file_id,
        verify_script: step.verify_script,
        verify_script_id: step.verify_script_id,
        background_script: step.background_script,
        foreground_script: step.foreground_script,
        has_flag: step.has_flag,
        flag_path: step.flag_path,
        flag_level: step.flag_level,
        questions: step.questions,
        isNew: false,
        ...step
      }
    }
    newNodes.push(stepNode)

    if (stepIdx === 0) {
      // First step: vertical edge from scenario (bottom → top)
      newEdges.push({
        id: `edge-${scenarioNode.id}-${stepId}`,
        source: scenarioNode.id,
        sourceHandle: 'bottom-source',
        target: stepId,
        targetHandle: 'top',
        type: 'smoothstep',
        animated: false
      })
    } else if (previousStepId) {
      // Subsequent steps: horizontal edge from previous step (right → left)
      newEdges.push({
        id: `edge-${previousStepId}-${stepId}`,
        source: previousStepId,
        sourceHandle: 'right-source',
        target: stepId,
        targetHandle: 'left',
        type: 'smoothstep',
        animated: false
      })
    }

    currentX += STEP_SPACING_X
    previousStepId = stepId
  })

  nodes.value = newNodes
  edges.value = newEdges
}

// Create new scenario
const handleCreateNew = () => {
  selectedScenarioId.value = null
  currentScenario.value = null
  nodes.value = []
  edges.value = []
  editingScenario.value = {
    name: '',
    title: '',
    difficulty: 'beginner',
    estimated_time: '',
    description: '',
    intro_text: '',
    finish_text: '',
    objectives: '',
    prerequisites: '',
    setup_script: '',
    instance_type: 'S',
    hostname: '',
    os_type: 'deb',
    source_type: 'builtin',
    flags_enabled: false,
    crash_traps: false,
    gsh_enabled: false,
    is_public: false,
    organization_id: isAdmin.value ? null : (organizationsStore.currentOrganization?.id || null),
    isNew: true
  }
  activeScenarioTab.value = 'general'
  showScenarioEditModal.value = true
  modalError.value = ''
}

// Import scenario
const handleImport = async () => {
  if (!selectedScenarioId.value) return
  isImporting.value = true
  try {
    await axios.post(`/scenarios/${selectedScenarioId.value}/import`)
    notification.showSuccess(t('scenarioEditor.importSuccess'))
    // Reload scenario data
    await handleScenarioSelect()
  } catch (err) {
    console.error('Import failed:', err)
    notification.showError(t('scenarioEditor.importError'))
  } finally {
    isImporting.value = false
  }
}

// Drag handlers
const handleNodeDragStart = (nodeType: string) => {
  draggedNodeType.value = nodeType
}

// Node added handler
const handleNodeAdded = (node: any) => {
  // Set step_type on new step-type nodes
  if (node.data.isNew && STEP_NODE_TYPES.includes(node.type)) {
    node.data.step_type = node.type
    node.data.entityType = node.type
  }
  if (node.data.isNew) {
    openEditModal(node)
  }
}

// Node/Edge change handlers
const handleNodesChange = (changes: any[]) => {
  const hasPositionChanges = changes.some(change =>
    change.type === 'position' && change.dragging === false
  )

  if (hasPositionChanges && selectedScenarioId.value) {
    saveNodePositions()
  }
}

const handleEdgesChange = (_changes: any[]) => {
  // Track edge changes
}

const handleNodeClick = (_event: any) => {
  // Node click handling
}

const handlePaneClick = () => {
  nodes.value.forEach(node => {
    node.selected = false
  })
  nodes.value = [...nodes.value]
}

// Toggle expand/collapse
const handleToggleExpand = (nodeData: any) => {
  const node = nodes.value.find(n => n.data.entityId === nodeData.entityId)
  if (!node) return

  node.data.isExpanded = !node.data.isExpanded

  // Show/hide step nodes when scenario is collapsed/expanded
  if (node.data.entityType === 'scenario') {
    const stepNodes = nodes.value.filter(n => STEP_NODE_TYPES.includes(n.data.entityType))
    stepNodes.forEach(stepNode => {
      stepNode.hidden = !node.data.isExpanded
    })

    // Show/hide edges connected to steps
    edges.value.forEach(edge => {
      const targetNode = nodes.value.find(n => n.id === edge.target)
      if (targetNode?.data?.entityType && STEP_NODE_TYPES.includes(targetNode.data.entityType)) {
        edge.hidden = !node.data.isExpanded
      }
    })
  }

  nodes.value = [...nodes.value]
  edges.value = [...edges.value]
}

// Select tree
const handleSelectTree = (nodeData: any) => {
  const parentNode = nodes.value.find(n => n.data.entityId === nodeData.entityId)
  if (!parentNode) return

  const nodeIdsToSelect: string[] = [parentNode.id]

  if (parentNode.data.entityType === 'scenario') {
    // Select all step nodes (any step type)
    nodes.value
      .filter(n => STEP_NODE_TYPES.includes(n.data.entityType))
      .forEach(n => nodeIdsToSelect.push(n.id))
  }

  nodes.value.forEach(node => {
    if (nodeIdsToSelect.includes(node.id)) {
      node.selected = true
    }
  })

  nodes.value = [...nodes.value]
}

// Valid parent→child type map for edge connections
const VALID_CONNECTIONS: Record<string, string[]> = {
  'scenario': STEP_NODE_TYPES,
  'terminal': STEP_NODE_TYPES,
  'flag': STEP_NODE_TYPES,
  'info': STEP_NODE_TYPES,
  'quiz': STEP_NODE_TYPES
}

const handleEdgeConnect = async (connection: any) => {
  const sourceNode = nodes.value.find(n => n.id === connection.source)
  const targetNode = nodes.value.find(n => n.id === connection.target)
  if (!sourceNode || !targetNode) return

  const sourceType = sourceNode.data.entityType
  const targetType = targetNode.data.entityType

  if (!VALID_CONNECTIONS[sourceType]?.includes(targetType)) {
    edges.value = edges.value.filter(e =>
      !(e.source === connection.source && e.target === connection.target)
    )
    notification.showWarning(t('scenarioEditor.invalidConnection', { source: sourceType, target: targetType }))
    return
  }

  // If target is an existing step, update its scenario_id
  if (targetNode.data.entityId && !targetNode.data.isNew && sourceNode.data.entityType === 'scenario') {
    try {
      await axios.patch(`/scenario-steps/${targetNode.data.entityId}`, {
        scenario_id: sourceNode.data.entityId
      })
    } catch (err) {
      console.error('Failed to sync edge connection:', err)
      edges.value = edges.value.filter(e =>
        !(e.source === connection.source && e.target === connection.target)
      )
    }
  }
}

// Modal handlers - Scenario
const openEditModal = async (node: any) => {
  if (node.data.entityType === 'scenario') {
    editingScenario.value = {
      nodeId: node.id,
      entityId: node.data.entityId,
      name: node.data.name || '',
      title: node.data.label || node.data.title || '',
      difficulty: node.data.difficulty || 'beginner',
      estimated_time: node.data.estimated_time || '',
      description: node.data.description || '',
      intro_text: node.data.intro_text || '',
      finish_text: node.data.finish_text || '',
      objectives: node.data.objectives || '',
      prerequisites: node.data.prerequisites || '',
      setup_script: node.data.setup_script || '',
      instance_type: node.data.instance_type || 'S',
      hostname: node.data.hostname || '',
      os_type: node.data.os_type || '',
      source_type: node.data.source_type || '',
      flags_enabled: node.data.flags_enabled || false,
      crash_traps: node.data.crash_traps || false,
      gsh_enabled: node.data.gsh_enabled || false,
      is_public: node.data.is_public || false,
      organization_id: node.data.organization_id || null,
      isNew: node.data.isNew || false
    }
    activeScenarioTab.value = 'general'
    showScenarioEditModal.value = true
    modalError.value = ''
  } else if (STEP_NODE_TYPES.includes(node.data.entityType)) {
    editingStepNodeId.value = node.id
    editingStepIsNew.value = node.data.isNew || false

    // Lazy load full step data (scripts are hidden by json:"-" on the model,
    // so the include=steps response doesn't contain them)
    if (node.data.entityId && !node.data.isNew && !node.data._scriptsLoaded) {
      try {
        const response = await axios.get(`/scenario-steps/${node.data.entityId}`)
        const fullStep = response.data
        // Merge fetched script data into the node data
        node.data.verify_script = fullStep.verify_script || ''
        node.data.background_script = fullStep.background_script || ''
        node.data.foreground_script = fullStep.foreground_script || ''
        node.data.text_content = fullStep.text_content || node.data.text_content || ''
        node.data.hint_content = fullStep.hint_content || node.data.hint_content || ''
        node.data.questions = fullStep.questions || node.data.questions || []
        node.data._scriptsLoaded = true
      } catch (err) {
        console.error('Failed to load step scripts:', err)
        // Open modal anyway with whatever data we have
      }
    }

    editingStep.value = node.data
    showStepEditModal.value = true
  }
}

const closeScenarioEditModal = () => {
  showScenarioEditModal.value = false
  editingScenario.value = {}
  modalError.value = ''
}

const handleSaveScenario = async () => {
  isSaving.value = true
  modalError.value = ''

  try {
    const entityData: Record<string, any> = {
      name: editingScenario.value.name,
      title: editingScenario.value.title,
      difficulty: editingScenario.value.difficulty,
      estimated_time: editingScenario.value.estimated_time,
      description: editingScenario.value.description,
      intro_text: editingScenario.value.intro_text,
      finish_text: editingScenario.value.finish_text,
      objectives: editingScenario.value.objectives,
      prerequisites: editingScenario.value.prerequisites,
      setup_script: editingScenario.value.setup_script,
      instance_type: editingScenario.value.instance_type,
      hostname: editingScenario.value.hostname,
      os_type: editingScenario.value.os_type,
      source_type: editingScenario.value.source_type,
      flags_enabled: editingScenario.value.flags_enabled,
      crash_traps: editingScenario.value.crash_traps,
      gsh_enabled: editingScenario.value.gsh_enabled,
      is_public: editingScenario.value.is_public
    }

    if (editingScenario.value.isNew) {
      // Include organization_id when creating
      if (editingScenario.value.organization_id) {
        entityData.organization_id = editingScenario.value.organization_id
      }
      const result = await scenariosStore.createEntity('/scenarios', entityData)

      if (result) {
        const newId = result.id || result.data?.id
        if (newId) {
          selectedScenarioId.value = newId
          // Reload
          await scenariosStore.loadEntities('/scenarios?include=steps')
          await handleScenarioSelect()
          router.replace({ query: { scenarioId: newId } })
        }
      }
    } else {
      const entityId = editingScenario.value.entityId
      await scenariosStore.updateEntity('/scenarios', entityId, entityData)

      // Update node in canvas
      const nodeIndex = nodes.value.findIndex(n => n.id === editingScenario.value.nodeId)
      if (nodeIndex !== -1) {
        nodes.value[nodeIndex].data = {
          ...nodes.value[nodeIndex].data,
          label: editingScenario.value.title,
          name: editingScenario.value.name,
          title: editingScenario.value.title,
          difficulty: editingScenario.value.difficulty,
          estimated_time: editingScenario.value.estimated_time,
          description: editingScenario.value.description,
          intro_text: editingScenario.value.intro_text,
          finish_text: editingScenario.value.finish_text,
          objectives: editingScenario.value.objectives,
          prerequisites: editingScenario.value.prerequisites,
          setup_script: editingScenario.value.setup_script,
          instance_type: editingScenario.value.instance_type,
          hostname: editingScenario.value.hostname,
          os_type: editingScenario.value.os_type,
          source_type: editingScenario.value.source_type,
          flags_enabled: editingScenario.value.flags_enabled,
          crash_traps: editingScenario.value.crash_traps,
          gsh_enabled: editingScenario.value.gsh_enabled,
          is_public: editingScenario.value.is_public,
          isNew: false
        }
      }
    }

    closeScenarioEditModal()
  } catch (err: any) {
    modalError.value = err.response?.data?.error_message ||
                       err.response?.data?.message ||
                       err.message ||
                       t('scenarioEditor.saveError')
  } finally {
    isSaving.value = false
  }
}

// Modal handlers - Step
const closeStepEditModal = () => {
  showStepEditModal.value = false
  editingStep.value = null
  editingStepIsNew.value = false
  editingStepNodeId.value = null
}

const handleSaveStep = async (formData: any) => {
  try {
    const stepData: Record<string, any> = { ...formData }

    // Include step_type from the editing step's data
    if (editingStep.value?.step_type) {
      stepData.step_type = editingStep.value.step_type
    }

    if (editingStepIsNew.value) {
      // New step: find parent scenario from edges
      if (editingStepNodeId.value) {
        const incomingEdge = edges.value.find(e => e.target === editingStepNodeId.value)
        if (incomingEdge) {
          const sourceNode = nodes.value.find(n => n.id === incomingEdge.source)
          if (sourceNode?.data?.entityId) {
            if (sourceNode.data.entityType === 'scenario') {
              stepData.scenario_id = sourceNode.data.entityId
            }
          }
        }
        // Fallback: use current scenario
        if (!stepData.scenario_id && currentScenario.value?.id) {
          stepData.scenario_id = currentScenario.value.id
        }
      }

      await scenarioStepsStore.createEntity('/scenario-steps', stepData)
    } else {
      const entityId = editingStep.value?.entityId || editingStep.value?.id
      if (entityId) {
        await scenarioStepsStore.updateEntity('/scenario-steps', entityId, stepData)
      }
    }

    // Reload scenario to get fresh data
    if (selectedScenarioId.value) {
      await handleScenarioSelect()
    }

    closeStepEditModal()
  } catch (err: any) {
    console.error('Save step failed:', err)
    notification.showError(err.response?.data?.error_message || t('scenarioEditor.saveError'))
  }
}

// Copy to org handlers
const openCopyModal = () => {
  copyTargetOrgId.value = null
  showCopyModal.value = true
}

const closeCopyModal = () => {
  showCopyModal.value = false
  copyTargetOrgId.value = null
}

const handleCopyToOrg = async () => {
  if (!copyTargetOrgId.value || !currentScenario.value?.id) return

  isCopying.value = true
  try {
    await axios.post(`/organizations/${copyTargetOrgId.value}/scenarios/${currentScenario.value.id}/duplicate`)
    notification.showSuccess(t('scenarioEditor.copySuccess'))
    // Reload scenarios to show the new duplicate
    await scenariosStore.loadEntities('/scenarios?include=steps')
    closeCopyModal()
  } catch (err: any) {
    console.error('Copy to org failed:', err)
    notification.showError(
      err.response?.data?.error_message ||
      err.response?.data?.message ||
      t('scenarioEditor.copyError')
    )
  } finally {
    isCopying.value = false
  }
}

// Delete modal
const openDeleteModal = (node: any) => {
  deletingNode.value = node
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deletingNode.value = null
}

const confirmDelete = async () => {
  if (!deletingNode.value) return

  const node = deletingNode.value
  const entityId = node.data.entityId
  const entityType = node.data.entityType

  try {
    if (entityId && !node.data.isNew) {
      if (entityType === 'scenario') {
        await scenariosStore.deleteEntity('/scenarios', entityId)
      } else if (STEP_NODE_TYPES.includes(entityType)) {
        await scenarioStepsStore.deleteEntity('/scenario-steps', entityId)
      }
    }

    // Remove from canvas
    nodes.value = nodes.value.filter(n => n.id !== node.id)
    edges.value = edges.value.filter(e => e.source !== node.id && e.target !== node.id)

    closeDeleteModal()
  } catch (err) {
    console.error('Delete failed:', err)
  }
}

// Sync order from edge chains (scenario → step1 → step2 → ...)
const syncOrderFromEdges = async (): Promise<number> => {
  let patchCount = 0

  const parentTypes = [
    { parentType: 'scenario', endpoint: '/scenario-steps', orderField: 'order' }
  ]

  for (const { parentType, endpoint, orderField } of parentTypes) {
    const parentNodes = nodes.value.filter(n => n.data.entityType === parentType && n.data.entityId)

    for (const parentNode of parentNodes) {
      const firstChildEdge = edges.value.find(e => {
        if (e.source !== parentNode.id) return false
        const targetNode = nodes.value.find(n => n.id === e.target)
        return targetNode?.data?.entityType && STEP_NODE_TYPES.includes(targetNode.data.entityType)
      })

      if (!firstChildEdge) continue

      const orderedChildren: any[] = []
      let currentNodeId: string | null = firstChildEdge.target

      while (currentNodeId) {
        const currentNode = nodes.value.find(n => n.id === currentNodeId)
        if (!currentNode) break
        orderedChildren.push(currentNode)

        const nextEdge = edges.value.find(e => {
          if (e.source !== currentNodeId) return false
          const targetNode = nodes.value.find(n => n.id === e.target)
          return targetNode?.data?.entityType && STEP_NODE_TYPES.includes(targetNode.data.entityType)
        })

        currentNodeId = nextEdge ? nextEdge.target : null
      }

      for (let i = 0; i < orderedChildren.length; i++) {
        const child = orderedChildren[i]
        const newOrder = i + 1
        const currentOrder = child.data.order ?? 0

        if (child.data.entityId && !child.data.isNew && currentOrder !== newOrder) {
          try {
            await axios.patch(`${endpoint}/${child.data.entityId}`, {
              [orderField]: newOrder
            })
            child.data.order = newOrder
            patchCount++
          } catch (err) {
            console.error(`Failed to update order for step ${child.data.entityId}:`, err)
          }
        }
      }
    }
  }

  return patchCount
}

// Save/Reset handlers
const handleSave = async () => {
  saveNodePositions()

  const patchCount = await syncOrderFromEdges()

  if (patchCount > 0) {
    notification.showSuccess(t('scenarioEditor.orderSynced', { count: String(patchCount) }))
  } else {
    notification.showSuccess(t('scenarioEditor.saveSuccess'))
  }
}

const handleReset = () => {
  if (currentScenario.value) {
    if (selectedScenarioId.value) {
      const storageKey = `scenarioEditor_positions_${selectedScenarioId.value}`
      localStorage.removeItem(storageKey)
    }
    convertScenarioToNodes(currentScenario.value)
  }
}

// Position persistence
const saveNodePositions = () => {
  if (!selectedScenarioId.value) return

  const nodePositions = nodes.value.map(node => ({
    id: node.id,
    entityId: node.data.entityId,
    position: node.position
  }))

  const storageKey = `scenarioEditor_positions_${selectedScenarioId.value}`
  localStorage.setItem(storageKey, JSON.stringify(nodePositions))
}

const loadNodePositions = () => {
  if (!selectedScenarioId.value) return

  const storageKey = `scenarioEditor_positions_${selectedScenarioId.value}`
  const saved = localStorage.getItem(storageKey)

  if (!saved) return

  try {
    const savedPositions = JSON.parse(saved)
    const positionMap = new Map(savedPositions.map((p: any) => [p.id, p.position]))

    nodes.value.forEach(node => {
      const savedPosition = positionMap.get(node.id)
      if (savedPosition) {
        node.position = savedPosition
      }
    })
  } catch (err) {
    console.error('Failed to load node positions:', err)
  }
}

// Panel resize handlers
const startResize = (event: MouseEvent) => {
  isResizing.value = true
  resizeStartX.value = event.clientX
  resizeStartWidth.value = treePanelWidth.value
  event.preventDefault()
}

const handleResize = (event: MouseEvent) => {
  if (!isResizing.value) return

  const deltaX = resizeStartX.value - event.clientX
  const newWidth = resizeStartWidth.value + deltaX

  if (newWidth >= 200 && newWidth <= 600) {
    treePanelWidth.value = newWidth
  }
}

const stopResize = () => {
  if (isResizing.value) {
    isResizing.value = false
    localStorage.setItem('scenarioEditor_treePanelWidth', treePanelWidth.value.toString())
  }
}
</script>

<style scoped>
.scenario-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-background);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  gap: 2rem;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.editor-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-text-primary);
}

.scenario-selector {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.scenario-select {
  flex: 1;
  max-width: 500px;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.scenario-select:hover {
  border-color: var(--color-primary);
}

.scenario-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.btn-create {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  background: var(--color-success);
  color: white;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-create:hover {
  background: var(--color-success-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.btn-import {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  background: var(--color-surface);
  color: var(--color-text-primary);
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.btn-import:hover:not(:disabled) {
  background: var(--color-surface-hover);
  border-color: var(--color-primary);
}

.btn-import:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.debug-info {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  padding: 0.25rem 0.5rem;
  background: var(--color-surface-variant);
  border-radius: 4px;
  white-space: nowrap;
}

.editor-actions {
  display: flex;
  gap: 0.75rem;
}

.editor-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.panel {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 2px solid var(--color-border);
  overflow: hidden;
  position: relative;
}

.library-panel {
  width: 180px;
  min-width: 150px;
  max-width: 300px;
  flex-shrink: 0;
}

.canvas-panel {
  flex: 1;
  border-right: 2px solid var(--color-border);
  min-width: 400px;
}

.tree-panel {
  min-width: 200px;
  max-width: 600px;
  border-right: none;
  flex-shrink: 0;
}

/* Resize handle for tree panel */
.resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: ew-resize;
  background: transparent;
  transition: background 0.2s;
  z-index: 10;
}

.resize-handle:hover,
.resize-handle.resizing {
  background: var(--color-primary);
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-surface-variant);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-surface-hover);
}

/* Modal form styles */
/* Scenario modal tabs */
.scenario-modal-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--color-border);
  margin-bottom: 1rem;
}

.scenario-modal-tab {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.scenario-modal-tab:hover {
  color: var(--color-text-primary);
}

.scenario-modal-tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

.script-editor {
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  tab-size: 4;
  resize: vertical;
}

.checkbox-group {
  flex-direction: row !important;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500 !important;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-primary);
}

.form-control {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.form-control::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.6;
}

textarea.form-control {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

/* Org context badge */
.scenario-org-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.org-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  background: var(--color-surface-variant);
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

/* Copy to org button */
.btn-copy-org {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  background: var(--color-surface);
  color: var(--color-text-primary);
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-copy-org:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-primary);
}
</style>
