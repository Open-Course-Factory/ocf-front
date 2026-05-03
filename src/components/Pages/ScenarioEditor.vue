<template>
  <div class="scenario-editor">
    <ScenarioEditorHeader
      v-model:selectedScenarioId="selectedScenarioId"
      :scenarios="allScenarios"
      :current-scenario="currentScenario"
      :scenario-org-name="currentScenario ? getScenarioOrgName(currentScenario) : null"
      :can-create-scenario="canCreateScenario"
      :can-edit-scenario="canEditScenario"
      :can-copy-to-org="!!canCopyToOrg"
      :is-importing="isImporting"
      :is-admin="isAdmin"
      :node-count="nodes.length"
      :edge-count="edges.length"
      @select-change="handleScenarioSelect"
      @create-new="handleCreateNew"
      @import="handleImport"
      @export-json="handleExportJSON"
      @export-killercoda="handleExportKillerCoda"
      @copy-to-org="openCopyModal"
      @reset="handleReset"
      @save="handleSave"
    />

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

      <!-- Right Panel: Scenario Step List (foldable) -->
      <div class="panel tree-panel" :class="{ collapsed: isRightPanelCollapsed }" :style="!isRightPanelCollapsed ? { width: treePanelWidth + 'px' } : {}">
        <button
          class="panel-collapse-toggle"
          @click="isRightPanelCollapsed = !isRightPanelCollapsed"
          :title="isRightPanelCollapsed ? t('scenarioEditor.expandPanel') : t('scenarioEditor.collapsePanel')"
        >
          <i :class="isRightPanelCollapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right'"></i>
        </button>
        <template v-if="!isRightPanelCollapsed">
          <div
            class="resize-handle"
            :class="{ resizing: isResizing }"
            @mousedown="startResize"
          ></div>
          <ScenarioStepListPanel
            :scenarios="allScenarios"
          />
        </template>
      </div>
    </div>

    <!-- Edit Scenario Modal -->
    <ScenarioEditModal
      :visible="showScenarioEditModal"
      :editing-scenario="editingScenario"
      :title="scenarioEditModalTitle"
      :is-saving="isSaving"
      :error-message="modalError"
      :org-scopes="orgScopes"
      :group-scopes="groupScopes"
      :platform-scope-available="platformScopeAvailable"
      :available-create-scopes="availableCreateScopes"
      :scope-hint="scopeHint"
      :current-scenario-org-label="currentScenarioOrgLabel"
      :aria-label="t('scenarioEditor.title')"
      @close="closeScenarioEditModal"
      @save="handleSaveScenario"
    />

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
import { ref, onMounted, computed, markRaw, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useScenariosStore } from '../../stores/scenarios'
import { useScenarioStepsStore } from '../../stores/scenarioSteps'
import { useOrganizationsStore } from '../../stores/organizations'
import { useClassGroupsStore } from '../../stores/classGroups'
import { useUserMembershipsStore } from '../../stores/userMemberships'
import { useCurrentUserStore } from '../../stores/currentUser'
import { useTranslations } from '../../composables/useTranslations'
import { useAdminViewMode } from '../../composables/useAdminViewMode'
import { useNotification } from '../../composables/useNotification'
import { useScenarioGraph, STEP_NODE_TYPES } from '../../composables/useScenarioGraph'
import { useResizablePanel } from '../../composables/useResizablePanel'
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
import ScenarioEditModal from '../ScenarioEditor/ScenarioEditModal.vue'
import ScenarioEditorHeader from '../ScenarioEditor/ScenarioEditorHeader.vue'
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
      nodeLibraryTitle: 'Nodes',
      nodeLibraryHelp: 'Drag a node type onto the canvas to create a new entity',
      nodeTypes: {
        scenario: 'Scenario',
        step: 'Step',
        scenarioDescription: 'Root scenario container',
        stepDescription: 'Individual scenario step',
        terminalStep: 'Terminal',
        terminalStepDescription: 'Verify work via terminal script',
        flagStep: 'Flag',
        flagStepDescription: 'CTF-style flag capture',
        infoStep: 'Info',
        infoStepDescription: 'Read-only informational content',
        quizStep: 'Quiz',
        quizStepDescription: 'Multiple choice or free text questions'
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
      createScope: 'Where to create',
      scopePlatform: 'Platform',
      scopeOrganizations: 'Organizations',
      scopeGroups: 'Groups',
      scopeHintPlatform: 'Visible to all platform users (admin only).',
      scopeHintOrg: 'Available to all members of {name}.',
      scopeHintGroup: 'Auto-assigned to {name}; lives in the group\'s organization.',
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
      isPublic: 'Public (available to all users)',
      // Export
      exportJSON: 'Export as JSON',
      exportKillerCoda: 'Export as KillerCoda archive',
      exportError: 'Failed to export scenario',
      // Panel
      expandPanel: 'Expand panel',
      collapsePanel: 'Collapse panel',
      readOnly: 'Read only',
      readOnlyWarning: 'This scenario is read-only. Copy it to your organization to edit.'
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
      nodeLibraryTitle: 'Noeuds',
      nodeLibraryHelp: 'Glissez un type de nœud sur le canevas pour créer une nouvelle entité',
      nodeTypes: {
        scenario: 'Scénario',
        step: 'Étape',
        scenarioDescription: 'Conteneur de scénario principal',
        stepDescription: 'Étape individuelle du scénario',
        terminalStep: 'Terminal',
        terminalStepDescription: 'Vérification via script terminal',
        flagStep: 'Drapeau',
        flagStepDescription: 'Capture de drapeau CTF',
        infoStep: 'Info',
        infoStepDescription: 'Contenu informatif en lecture seule',
        quizStep: 'Quiz',
        quizStepDescription: 'Questions à choix multiples ou texte libre'
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
      createScope: 'Emplacement de création',
      scopePlatform: 'Plateforme',
      scopeOrganizations: 'Organisations',
      scopeGroups: 'Groupes',
      scopeHintPlatform: 'Visible par tous les utilisateurs de la plateforme (admin uniquement).',
      scopeHintOrg: 'Disponible pour tous les membres de {name}.',
      scopeHintGroup: 'Auto-assigné à {name} ; rattaché à l\'organisation du groupe.',
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
      isPublic: 'Public (disponible pour tous les utilisateurs)',
      // Export
      exportJSON: 'Exporter en JSON',
      exportKillerCoda: 'Exporter au format KillerCoda',
      exportError: 'Échec de l\'exportation du scénario',
      // Panneau
      expandPanel: 'Déplier le panneau',
      collapsePanel: 'Replier le panneau',
      readOnly: 'Lecture seule',
      readOnlyWarning: 'Ce scénario est en lecture seule. Copiez-le dans votre organisation pour le modifier.'
    }
  }
})

const scenariosStore = useScenariosStore()
const scenarioStepsStore = useScenarioStepsStore()
const organizationsStore = useOrganizationsStore()
const classGroupsStore = useClassGroupsStore()
const membershipsStore = useUserMembershipsStore()
const currentUser = useCurrentUserStore()
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
const draggedNodeType = ref<string | null>(null)
const selectedScenarioId = ref<string | null>(null)
const currentScenario = ref<any>(null)

// Graph state + pure helpers (composable owns nodes/edges and conversion logic)
const {
  nodes,
  edges,
  convertScenarioToNodes,
  syncOrderFromEdges,
  saveNodePositions,
  loadNodePositions,
  clearNodePositions,
  handleEdgeConnect,
  deserializeQuestion
} = useScenarioGraph({
  selectedScenarioId,
  onInvalidConnection: (sourceType, targetType) => {
    notification.showWarning(t('scenarioEditor.invalidConnection', { source: sourceType, target: targetType }))
  }
})
const allScenarios = computed(() => scenariosStore.entities)
const isImporting = ref(false)
const isRightPanelCollapsed = ref(false)

// Modal state
const showScenarioEditModal = ref(false)
const showStepEditModal = ref(false)
const showDeleteModal = ref(false)
const editingScenario = ref<any>({})
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

// Permission: can the current user edit the loaded scenario?
// Admin can edit anything. Non-admin can only edit scenarios in their orgs.
// Platform scenarios (no org) are admin-only.
const canEditScenario = computed(() => {
  if (!currentScenario.value) return false
  if (isAdmin.value) return true
  const scenarioOrgId = currentScenario.value.organization_id
  if (!scenarioOrgId) return false // platform scenario = admin only
  return organizationsStore.userOrganizations.some(org => org.id === scenarioOrgId)
})

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

// Scope picker for creating new scenarios.
// A scope describes where the new scenario lives. Endpoints are selected accordingly:
//   - platform → POST /scenarios            (admin only)
//   - org      → POST /organizations/:id/scenarios  (org manager+)
//   - group    → POST /groups/:id/scenarios         (group manager+, auto-assigns)
type CreateScope =
  | { kind: 'platform' }
  | { kind: 'org', id: string, name: string }
  | { kind: 'group', id: string, name: string }

const allGroups = computed<any[]>(() => {
  // classGroupsStore.entities (from useBaseStore) holds the loaded list
  const anyStore = classGroupsStore as any
  return (anyStore.entities || []) as any[]
})

// Derive create scopes from data that's already loaded by the auth flow:
//   - currentUser.userId (owner check)
//   - currentUser.userRoles (Casbin bindings: `organization_manager:<id>`,
//     `class-group_manager:<id>`)
//   - membershipsStore.orgMemberships / groupMemberships (DB-backed, may
//     come from a separate /me/memberships endpoint when available)
//
// Union of all three so a manageable scope shows up via whichever signal
// was successful. Robust against an outage of any single source.
const orgScopes = computed<Array<{ id: string; name: string }>>(() => {
  const out: Array<{ id: string; name: string }> = []
  const seen = new Set<string>()
  const userId = currentUser.userId
  const roles = currentUser.userRoles || []

  const add = (id: string, name?: string) => {
    if (seen.has(id)) return
    seen.add(id)
    out.push({ id, name: name || `Organization ${id.slice(0, 8)}` })
  }

  // Source 1: owner of the organization (sync — userOrgs already loaded)
  for (const org of organizationsStore.userOrganizations) {
    if (org.owner_user_id === userId) {
      add(org.id, org.display_name || org.name)
    }
  }
  // Source 2: Casbin role binding `organization_manager:<orgId>`
  for (const role of roles) {
    if (role.startsWith('organization_manager:')) {
      const orgId = role.slice('organization_manager:'.length)
      const org = organizationsStore.userOrganizations.find(o => o.id === orgId)
      add(orgId, org?.display_name || org?.name)
    }
  }
  // Source 3: /me/memberships (best-effort — may 404)
  for (const m of membershipsStore.orgMemberships) {
    if (m.role !== 'manager' && m.role !== 'owner') continue
    const org = organizationsStore.userOrganizations.find(o => o.id === m.organization_id)
    add(m.organization_id, org?.display_name || org?.name)
  }
  return out
})

const groupScopes = computed<Array<{ id: string; name: string }>>(() => {
  const out: Array<{ id: string; name: string }> = []
  const seen = new Set<string>()
  const userId = currentUser.userId
  const roles = currentUser.userRoles || []

  const add = (id: string, name?: string) => {
    if (seen.has(id)) return
    seen.add(id)
    out.push({ id, name: name || `Group ${id.slice(0, 8)}` })
  }

  for (const group of allGroups.value) {
    if ((group as any).owner_user_id === userId) {
      add(group.id, group.display_name || group.name)
    }
  }
  for (const role of roles) {
    if (role.startsWith('class-group_manager:')) {
      const gid = role.slice('class-group_manager:'.length)
      const g = allGroups.value.find((x: any) => x.id === gid)
      add(gid, g?.display_name || g?.name)
    }
  }
  for (const m of membershipsStore.groupMemberships) {
    if (m.role !== 'manager' && m.role !== 'owner') continue
    const g = allGroups.value.find((x: any) => x.id === m.group_id)
    add(m.group_id, g?.display_name || g?.name)
  }
  return out
})

const platformScopeAvailable = computed(() => isAdmin.value)

const availableCreateScopes = computed<CreateScope[]>(() => {
  const scopes: CreateScope[] = []
  if (platformScopeAvailable.value) scopes.push({ kind: 'platform' })
  for (const s of orgScopes.value) scopes.push({ kind: 'org', id: s.id, name: s.name })
  for (const s of groupScopes.value) scopes.push({ kind: 'group', id: s.id, name: s.name })
  return scopes
})

const canCreateScenario = computed(() => availableCreateScopes.value.length > 0)

const parseScopeKey = (key: string | undefined | null): CreateScope | null => {
  if (!key) return null
  const idx = key.indexOf(':')
  if (idx === -1) return null
  const kind = key.slice(0, idx)
  const id = key.slice(idx + 1)
  if (kind === 'platform') return { kind: 'platform' }
  if (kind === 'org') {
    const org = organizationsStore.userOrganizations.find(o => o.id === id)
    return { kind: 'org', id, name: org?.display_name || org?.name || id }
  }
  if (kind === 'group') {
    const group = allGroups.value.find((g: any) => g.id === id)
    return { kind: 'group', id, name: group?.display_name || group?.name || id }
  }
  return null
}

const pickDefaultScopeKey = (): string => {
  // 1. currentOrganization if user can manage it
  const currentOrgId = organizationsStore.currentOrganization?.id
  if (currentOrgId && membershipsStore.canManageOrg(currentOrgId)) {
    return `org:${currentOrgId}`
  }
  // 2. first available org scope
  if (orgScopes.value.length > 0) {
    return `org:${orgScopes.value[0].id}`
  }
  // 3. first available group scope
  if (groupScopes.value.length > 0) {
    return `group:${groupScopes.value[0].id}`
  }
  // 4. platform if admin
  if (platformScopeAvailable.value) return 'platform:*'
  return ''
}

const scopeHint = computed(() => {
  const scope = parseScopeKey(editingScenario.value?._scopeKey)
  if (!scope) return ''
  if (scope.kind === 'platform') return t('scenarioEditor.scopeHintPlatform')
  if (scope.kind === 'org') {
    return t('scenarioEditor.scopeHintOrg').replace('{name}', scope.name)
  }
  return t('scenarioEditor.scopeHintGroup').replace('{name}', scope.name)
})

const currentScenarioOrgLabel = computed<string | null>(() => {
  if (!currentScenario.value) return null
  if (!currentScenario.value.organization_id) {
    return isAdmin.value ? t('scenarioEditor.platformOnly') : null
  }
  const org = organizationsStore.getOrganizationById(currentScenario.value.organization_id)
  return org?.display_name || org?.name || null
})

// Resize state (composable owns mousemove/mouseup listeners)
const { panelWidth: treePanelWidth, isResizing, startResize } = useResizablePanel({
  storageKey: 'scenarioEditor_treePanelWidth'
})

const scenarioEditModalTitle = computed(() => {
  return editingScenario.value?.isNew
    ? t('scenarioEditor.createScenario')
    : t('scenarioEditor.editScenario')
})

// Load all scenarios
onMounted(async () => {
  // Fire scenarios + scope-picker prerequisites in parallel.
  // Memberships and groups are required to render the create-scope picker;
  // organizations are required to resolve org names. All three are independent.
  await Promise.all([
    scenariosStore.loadEntities('/scenarios?include=steps'),
    organizationsStore.loadOrganizations().catch(() => null),
    classGroupsStore.loadEntities().catch(() => null),
    membershipsStore.ensureLoaded().catch(() => null),
  ])

  // Check if scenarioId is in URL query params
  const scenarioIdFromUrl = route.query.scenarioId as string | undefined
  if (scenarioIdFromUrl) {
    selectedScenarioId.value = scenarioIdFromUrl
    await handleScenarioSelect()
  }
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

// (graph helpers — convertScenarioToNodes, deserializeQuestion — moved to useScenarioGraph)

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
    _scopeKey: pickDefaultScopeKey(),
    isNew: true
  }
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

// Export handlers
const handleExportJSON = async () => {
  if (!selectedScenarioId.value) return
  try {
    const response = await axios.get(`/scenarios/${selectedScenarioId.value}/export`, { params: { format: 'json' } })
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentScenario.value?.name || 'scenario'}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Export JSON failed:', err)
    notification.showError(t('scenarioEditor.exportError'))
  }
}

const handleExportKillerCoda = async () => {
  if (!selectedScenarioId.value) return
  try {
    const response = await axios.get(`/scenarios/${selectedScenarioId.value}/export`, {
      params: { format: 'killerkoda' },
      responseType: 'blob'
    })
    const url = URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentScenario.value?.name || 'scenario'}.tar.gz`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Export KillerCoda failed:', err)
    notification.showError(t('scenarioEditor.exportError'))
  }
}

// Drag handlers
const handleNodeDragStart = (nodeType: string) => {
  draggedNodeType.value = nodeType
}

// Node added handler
const handleNodeAdded = (node: any) => {
  if (!canEditScenario.value) {
    // Remove the node that was just dropped — read-only mode
    nodes.value = nodes.value.filter(n => n.id !== node.id)
    notification.showWarning(t('scenarioEditor.readOnlyWarning'))
    return
  }
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

// (VALID_CONNECTIONS + handleEdgeConnect — moved to useScenarioGraph)

// Modal handlers - Scenario
const openEditModal = async (node: any) => {
  // Block editing for read-only scenarios (non-admin viewing platform/other-org scenarios)
  if (!canEditScenario.value && !node.data.isNew) {
    notification.showWarning(t('scenarioEditor.readOnlyWarning'))
    return
  }

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
        node.data.show_immediate_feedback = fullStep.show_immediate_feedback ?? node.data.show_immediate_feedback ?? false
        node.data.questions = Array.isArray(fullStep.questions)
          ? fullStep.questions.map(deserializeQuestion)
          : (Array.isArray(node.data.questions) ? node.data.questions : [])
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
      // Dispatch on scope: platform / organization / group → distinct endpoints.
      const scope = parseScopeKey(editingScenario.value._scopeKey)
      let result: any = null

      if (!scope) {
        modalError.value = t('scenarioEditor.saveError')
        isSaving.value = false
        return
      }

      if (scope.kind === 'platform') {
        // Admin-only platform scenario (no org)
        result = await scenariosStore.createEntity('/scenarios', entityData)
      } else if (scope.kind === 'org') {
        // Org-scoped: org_id is in the URL path; strip from body
        const body = { ...entityData }
        delete body.organization_id
        const response = await axios.post(`/organizations/${scope.id}/scenarios`, body)
        result = response.data?.data || response.data
      } else if (scope.kind === 'group') {
        // Group-scoped: group_id is in the URL path; auto-creates assignment
        const body = { ...entityData }
        delete body.organization_id
        const response = await axios.post(`/groups/${scope.id}/scenarios`, body)
        result = response.data?.data || response.data
      }

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

// Sync the quiz questions of a step against the dedicated
// /scenario-step-questions endpoint. Diff strategy: match by `id`.
//   - new (no id)             → POST
//   - existing, kept          → PATCH (always; cheap, avoids deep diff)
//   - existing, removed       → DELETE
// Independent calls run in parallel via Promise.all. Failures bubble up.
const syncStepQuestions = async (
  stepId: string,
  oldQuestions: any[],
  newQuestions: any[]
): Promise<void> => {
  const oldList = Array.isArray(oldQuestions) ? oldQuestions : []
  const newList = Array.isArray(newQuestions) ? newQuestions : []
  const newIds = new Set(newList.map(q => q?.id).filter(Boolean))

  const ops: { kind: 'delete' | 'patch' | 'post'; label: string; promise: Promise<any> }[] = []

  // DELETE: questions that had an id but are no longer present
  oldList.forEach(oldQ => {
    if (oldQ?.id && !newIds.has(oldQ.id)) {
      ops.push({
        kind: 'delete',
        label: `delete ${oldQ.id}`,
        promise: axios.delete(`/scenario-step-questions/${oldQ.id}`)
      })
    }
  })

  // CREATE / UPDATE
  newList.forEach((q, idx) => {
    const order = idx + 1 // 1-based, matches backend convention
    const optionsJson = JSON.stringify(Array.isArray(q.options) ? q.options : [])
    const body = {
      order,
      question_text: q.question_text || '',
      question_type: q.question_type || 'multiple_choice',
      options: optionsJson,
      correct_answer: q.correct_answer ?? '',
      explanation: q.explanation || '',
      points: q.points || 1
    }
    const label = `Q${order} "${(q.question_text || '').slice(0, 30)}"`
    if (q?.id) {
      ops.push({ kind: 'patch', label, promise: axios.patch(`/scenario-step-questions/${q.id}`, body) })
    } else {
      ops.push({ kind: 'post', label, promise: axios.post('/scenario-step-questions', { step_id: stepId, ...body }) })
    }
  })

  if (ops.length === 0) return

  const results = await Promise.allSettled(ops.map(o => o.promise))
  const failures: string[] = []
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const op = ops[i]
      const reason = r.reason?.response?.data?.error_message
        || r.reason?.response?.data?.message
        || r.reason?.message
        || 'unknown error'
      console.error(`[syncStepQuestions] ${op.kind} ${op.label} failed:`, reason, r.reason?.response?.data)
      failures.push(`${op.label}: ${reason}`)
    }
  })
  if (failures.length > 0) {
    throw new Error(failures.join(' • '))
  }
}

const handleSaveStep = async (formData: any) => {
  try {
    // The /scenario-steps endpoint has no Questions field — extract them
    // and persist via the dedicated /scenario-step-questions endpoint instead.
    const { questions: newQuestions, ...stepFields } = formData
    const stepData: Record<string, any> = { ...stepFields }

    // Include step_type from the editing step's data
    if (editingStep.value?.step_type) {
      stepData.step_type = editingStep.value.step_type
    }

    // Capture pre-save questions for the diff (existing IDs come from the server)
    const oldQuestions: any[] = Array.isArray(editingStep.value?.questions)
      ? editingStep.value.questions
      : []

    let stepId: string | undefined

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

      const created = await scenarioStepsStore.createEntity('/scenario-steps', stepData)
      stepId = created?.id || created?.data?.id
    } else {
      stepId = editingStep.value?.entityId || editingStep.value?.id
      if (stepId) {
        await scenarioStepsStore.updateEntity('/scenario-steps', stepId, stepData)
      }
    }

    // Sync quiz questions only when this is a quiz step and we resolved the step id
    const isQuizStep = (editingStep.value?.step_type === 'quiz') ||
      (Array.isArray(newQuestions) && newQuestions.length > 0)
    if (stepId && isQuizStep) {
      await syncStepQuestions(stepId, oldQuestions, newQuestions || [])
    }

    // Reload scenario to get fresh data — both for the canvas
    // (handleScenarioSelect rebuilds nodes from a single-scenario fetch)
    // and for the right-side step list panel (which reads from the
    // scenarios store, not from currentScenario).
    if (selectedScenarioId.value) {
      await Promise.all([
        handleScenarioSelect(),
        scenariosStore.loadEntities('/scenarios?include=steps')
      ])
    }

    closeStepEditModal()
  } catch (err: any) {
    console.error('Save step failed:', err)
    const detail = err.response?.data?.error_message || err.message || t('scenarioEditor.saveError')
    notification.showError(detail)
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
  if (!canEditScenario.value) {
    notification.showWarning(t('scenarioEditor.readOnlyWarning'))
    return
  }
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

// (syncOrderFromEdges + saveNodePositions/loadNodePositions — moved to useScenarioGraph)

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
      clearNodePositions(selectedScenarioId.value)
    }
    convertScenarioToNodes(currentScenario.value)
  }
}

// (panel resize — moved to useResizablePanel)
</script>

<style scoped>
.scenario-editor {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background: var(--color-background);
}

/* Header styles live in ScenarioEditorHeader.vue */

.editor-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.library-panel {
  width: 140px;
  min-width: 120px;
  max-width: 200px;
  flex-shrink: 0;
  background: var(--color-bg-tertiary);
  border-right: 1px solid var(--color-border-light);
}

.canvas-panel {
  flex: 1;
  background: var(--color-background);
  border-right: 1px solid var(--color-border-light);
  min-width: 400px;
}

.tree-panel {
  min-width: 200px;
  max-width: 600px;
  border-right: none;
  flex-shrink: 0;
  position: relative;
  transition: width 0.2s, min-width 0.2s;
  background: var(--color-bg-secondary);
  border-left: 1px solid var(--color-border-light);
}

.tree-panel.collapsed {
  min-width: 2rem;
  max-width: 2rem;
  width: 2rem !important;
  overflow: hidden;
}

.panel-collapse-toggle {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-left: none;
  border-radius: 0 4px 4px 0;
  padding: 0.5rem 0.25rem;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all 0.15s;
}

.panel-collapse-toggle:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.tree-panel.collapsed .panel-collapse-toggle {
  left: 0;
  right: 0;
  margin: 0 auto;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  width: 1.5rem;
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

/* Modal form styles — only what's needed for the Copy-to-org modal.
   Scenario edit modal styles live in ScenarioEditModal.vue */
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

</style>
