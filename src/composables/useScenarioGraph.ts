/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Pure graph logic for the scenario editor — no rendering.
 *
 * Owns the nodes/edges refs, conversion from a scenario payload to nodes/edges,
 * order synchronization from the visual edge chain, position persistence,
 * and edge-connect validation.
 *
 * Extracted from src/components/Pages/ScenarioEditor.vue during the Wave 12
 * refactor to keep the page component focused on layout and orchestration.
 */

import { ref, type Ref } from 'vue'
import axios from 'axios'

// Step types are first-class node types in the canvas
export const STEP_NODE_TYPES = ['terminal', 'flag', 'info', 'quiz'] as const
export type StepNodeType = typeof STEP_NODE_TYPES[number]

// Valid parent → children edge transitions
export const VALID_CONNECTIONS: Record<string, readonly string[]> = {
  scenario: STEP_NODE_TYPES,
  terminal: STEP_NODE_TYPES,
  flag: STEP_NODE_TYPES,
  info: STEP_NODE_TYPES,
  quiz: STEP_NODE_TYPES
}

// Deserialize a question's `options` field. The backend stores `options` as a
// JSON string (TEXT column); the frontend QuestionData expects `options: string[]`.
// Tolerates payloads that already arrive as arrays (e.g. demo mode) or invalid JSON.
function deserializeQuestion(q: any) {
  const raw = q?.options
  let options: string[] = []
  if (Array.isArray(raw)) {
    options = raw
  } else if (typeof raw === 'string' && raw.length > 0) {
    try {
      const parsed = JSON.parse(raw)
      options = Array.isArray(parsed) ? parsed : []
    } catch {
      options = []
    }
  }
  return { ...q, options }
}

interface UseScenarioGraphOptions {
  // Reactive scenario id used to namespace the localStorage positions key.
  selectedScenarioId: Ref<string | null>
  // Hook called when an invalid edge connection is dropped (read-only message).
  onInvalidConnection?: (sourceType: string, targetType: string) => void
}

export function useScenarioGraph(options: UseScenarioGraphOptions) {
  const nodes = ref<any[]>([])
  const edges = ref<any[]>([])

  // Convert scenario to nodes and edges (vertical layout: scenario top-left,
  // first step below, then a horizontal row of subsequent steps).
  function convertScenarioToNodes(scenario: any) {
    const newNodes: any[] = []
    const newEdges: any[] = []

    const steps = scenario.scenario_steps || scenario.scenarioSteps || scenario.steps || []

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

    const sortedSteps = [...steps].sort((a, b) => (a.order || 0) - (b.order || 0))

    const STEP_SPACING_X = 250
    const LEVEL_SPACING_Y = 200
    const stepRowY = 50 + LEVEL_SPACING_Y
    let currentX = 100
    let previousStepId: string | null = null

    sortedSteps.forEach((step, stepIdx) => {
      const stepId = `step-${step.id}`
      const nodeType = step.step_type && (STEP_NODE_TYPES as readonly string[]).includes(step.step_type) ? step.step_type : 'terminal'

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
          show_immediate_feedback: step.show_immediate_feedback ?? false,
          isNew: false,
          ...step,
          // Deserialize `options` JSON-string → array (overrides the spread above)
          questions: Array.isArray(step.questions) ? step.questions.map(deserializeQuestion) : []
        }
      }
      newNodes.push(stepNode)

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

  // Sync order from edge chains (scenario → step1 → step2 → ...).
  // Walks the chain from each scenario root and patches /scenario-steps/:id with
  // the new `order`. Returns the number of patches issued.
  async function syncOrderFromEdges(): Promise<number> {
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
          return targetNode?.data?.entityType && (STEP_NODE_TYPES as readonly string[]).includes(targetNode.data.entityType)
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
            return targetNode?.data?.entityType && (STEP_NODE_TYPES as readonly string[]).includes(targetNode.data.entityType)
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

  // Position persistence (per-scenario localStorage).
  function saveNodePositions() {
    if (!options.selectedScenarioId.value) return

    const nodePositions = nodes.value.map(node => ({
      id: node.id,
      entityId: node.data.entityId,
      position: node.position
    }))

    const storageKey = `scenarioEditor_positions_${options.selectedScenarioId.value}`
    localStorage.setItem(storageKey, JSON.stringify(nodePositions))
  }

  function loadNodePositions() {
    if (!options.selectedScenarioId.value) return

    const storageKey = `scenarioEditor_positions_${options.selectedScenarioId.value}`
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

  function clearNodePositions(scenarioId: string) {
    const storageKey = `scenarioEditor_positions_${scenarioId}`
    localStorage.removeItem(storageKey)
  }

  // Validate a new edge connection. Removes the edge in-place if invalid;
  // patches the target step's scenario_id on the server when the source is a
  // scenario and the target is an existing (non-new) step.
  async function handleEdgeConnect(connection: any) {
    const sourceNode = nodes.value.find(n => n.id === connection.source)
    const targetNode = nodes.value.find(n => n.id === connection.target)
    if (!sourceNode || !targetNode) return

    const sourceType = sourceNode.data.entityType
    const targetType = targetNode.data.entityType

    if (!VALID_CONNECTIONS[sourceType]?.includes(targetType)) {
      edges.value = edges.value.filter(e =>
        !(e.source === connection.source && e.target === connection.target)
      )
      options.onInvalidConnection?.(sourceType, targetType)
      return
    }

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

  return {
    nodes,
    edges,
    convertScenarioToNodes,
    syncOrderFromEdges,
    saveNodePositions,
    loadNodePositions,
    clearNodePositions,
    handleEdgeConnect,
    deserializeQuestion
  }
}
