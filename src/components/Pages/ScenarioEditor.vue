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
              {{ scenario.name }} - {{ scenario.title }}
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

          <!-- Debug info -->
          <span class="debug-info" v-if="nodes.length > 0">
            📊 {{ nodes.length }} nodes, {{ edges.length }} edges
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
      <div class="modal-form">
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

        <div class="form-group">
          <label>{{ t('scenarioEditor.description') }}</label>
          <textarea
            v-model="editingScenario.description"
            class="form-control"
            rows="3"
            :placeholder="t('scenarioEditor.enterDescription')"
          ></textarea>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, markRaw, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useScenariosStore } from '../../stores/scenarios'
import { useScenarioStepsStore } from '../../stores/scenarioSteps'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import NodeLibraryPanel from '../GraphEditor/NodeLibraryPanel.vue'
import type { NodeTypeDefinition } from '../GraphEditor/NodeLibraryPanel.vue'
import FlowCanvas from '../GraphEditor/FlowCanvas.vue'
import ScenarioStepListPanel from '../ScenarioEditor/ScenarioStepListPanel.vue'
import ScenarioNode from '../ScenarioEditor/nodes/ScenarioNode.vue'
import StepNode from '../ScenarioEditor/nodes/StepNode.vue'
import ScenarioStepEditModal from '../ScenarioEditor/ScenarioStepEditModal.vue'
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
        stepDescription: 'Individual scenario step'
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
      orderSynced: '{count} step order(s) updated'
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
        stepDescription: 'Étape individuelle du scénario'
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
      orderSynced: '{count} ordre(s) d\'étape mis à jour'
    }
  }
})

const scenariosStore = useScenariosStore()
const scenarioStepsStore = useScenarioStepsStore()
const notification = useNotification()

// Custom node types for VueFlow
const customNodeTypes: Record<string, Component> = {
  scenario: markRaw(ScenarioNode),
  step: markRaw(StepNode)
}

// Node type definitions for the library panel
const scenarioNodeTypeDefinitions = computed((): NodeTypeDefinition[] => [
  {
    type: 'scenario',
    icon: '🧪',
    color: 'var(--scenario-node-scenario)',
    bgColor: 'var(--scenario-node-scenario-bg)',
    label: t('scenarioEditor.nodeTypes.scenario'),
    description: t('scenarioEditor.nodeTypes.scenarioDescription')
  },
  {
    type: 'step',
    icon: '📋',
    color: 'var(--scenario-node-step)',
    bgColor: 'var(--scenario-node-step-bg)',
    label: t('scenarioEditor.nodeTypes.step'),
    description: t('scenarioEditor.nodeTypes.stepDescription')
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
const editingStep = ref<any>(null)
const editingStepIsNew = ref(false)
const editingStepNodeId = ref<string | null>(null)
const deletingNode = ref<any>(null)
const isSaving = ref(false)
const modalError = ref('')

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
  await scenariosStore.loadEntities('/scenarios?include=scenarioSteps')

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
    const response = await axios.get(`/scenarios/${selectedScenarioId.value}?include=scenarioSteps`)
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

  // Create scenario root node at top
  const scenarioNode = {
    id: `scenario-${scenario.id}`,
    type: 'scenario',
    position: { x: 300, y: 50 },
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

  const STEP_SPACING_Y = 180
  let currentY = 250
  let previousStepId: string | null = null

  sortedSteps.forEach((step, stepIdx) => {
    const stepId = `step-${step.id}`

    const stepNode = {
      id: stepId,
      type: 'step',
      position: { x: 300, y: currentY },
      data: {
        label: step.title || `Step ${stepIdx + 1}`,
        entityId: step.id,
        entityType: 'step',
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
        isNew: false,
        ...step
      }
    }
    newNodes.push(stepNode)

    // Connect steps vertically (chain: scenario → step1 → step2 → ...)
    if (stepIdx === 0) {
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
      newEdges.push({
        id: `edge-${previousStepId}-${stepId}`,
        source: previousStepId,
        sourceHandle: 'bottom-source',
        target: stepId,
        targetHandle: 'top',
        type: 'smoothstep',
        animated: false
      })
    }

    currentY += STEP_SPACING_Y
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

// Drag handlers
const handleNodeDragStart = (nodeType: string) => {
  draggedNodeType.value = nodeType
}

// Node added handler
const handleNodeAdded = (node: any) => {
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
    const stepNodes = nodes.value.filter(n => n.data.entityType === 'step')
    stepNodes.forEach(stepNode => {
      stepNode.hidden = !node.data.isExpanded
    })

    // Show/hide edges connected to steps
    edges.value.forEach(edge => {
      const targetNode = nodes.value.find(n => n.id === edge.target)
      if (targetNode?.data?.entityType === 'step') {
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
    // Select all step nodes
    nodes.value
      .filter(n => n.data.entityType === 'step')
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
const VALID_CONNECTIONS: Record<string, string> = {
  'scenario': 'step',
  'step': 'step'
}

const handleEdgeConnect = async (connection: any) => {
  const sourceNode = nodes.value.find(n => n.id === connection.source)
  const targetNode = nodes.value.find(n => n.id === connection.target)
  if (!sourceNode || !targetNode) return

  const sourceType = sourceNode.data.entityType
  const targetType = targetNode.data.entityType

  if (VALID_CONNECTIONS[sourceType] !== targetType) {
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
const openEditModal = (node: any) => {
  if (node.data.entityType === 'scenario') {
    editingScenario.value = {
      nodeId: node.id,
      entityId: node.data.entityId,
      name: node.data.name || '',
      title: node.data.label || node.data.title || '',
      difficulty: node.data.difficulty || 'beginner',
      estimated_time: node.data.estimated_time || '',
      description: node.data.description || '',
      isNew: node.data.isNew || false
    }
    showScenarioEditModal.value = true
    modalError.value = ''
  } else if (node.data.entityType === 'step') {
    editingStep.value = node.data
    editingStepIsNew.value = node.data.isNew || false
    editingStepNodeId.value = node.id
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
      description: editingScenario.value.description
    }

    if (editingScenario.value.isNew) {
      const result = await scenariosStore.createEntity('/scenarios', entityData)

      if (result) {
        const newId = result.id || result.data?.id
        if (newId) {
          selectedScenarioId.value = newId
          // Reload
          await scenariosStore.loadEntities('/scenarios?include=scenarioSteps')
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
      } else if (entityType === 'step') {
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
    { parentType: 'scenario', childType: 'step', endpoint: '/scenario-steps', orderField: 'order' }
  ]

  for (const { parentType, childType, endpoint, orderField } of parentTypes) {
    const parentNodes = nodes.value.filter(n => n.data.entityType === parentType && n.data.entityId)

    for (const parentNode of parentNodes) {
      const firstChildEdge = edges.value.find(e => {
        if (e.source !== parentNode.id) return false
        const targetNode = nodes.value.find(n => n.id === e.target)
        return targetNode?.data?.entityType === childType
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
          return targetNode?.data?.entityType === childType
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
            console.error(`Failed to update order for ${childType} ${child.data.entityId}:`, err)
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
</style>
