/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Scenario-editor graph logic — a thin preset over the shared useGraphEditor
 * (topology, edge-connect/insert, order sync, position persistence). This file
 * keeps the scenario-specific bits: the linear step-chain connection rules, the
 * scenario_id foreign-key sync, and convertScenarioToNodes.
 *
 * Extracted from ScenarioEditor.vue during the Wave 12 split; generalized onto
 * useGraphEditor during the FRONT-2 de-duplication (#280). The public API is
 * unchanged so callers and tests are unaffected.
 */

import { type Ref } from 'vue'
import axios from 'axios'
import { useGraphEditor } from './useGraphEditor'

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

function isStepType(type: string): boolean {
  return (STEP_NODE_TYPES as readonly string[]).includes(type)
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
  // Hook called when a node cannot be auto-rewired on delete because it has
  // multiple incoming/outgoing edges (unexpected in the linear chain model).
  onMultiEdgeRewireBlocked?: () => void
}

export function useScenarioGraph(options: UseScenarioGraphOptions) {
  const graph = useGraphEditor({
    selectedId: options.selectedScenarioId,
    storagePrefix: 'scenarioEditor',
    isValidConnection: (sourceType, targetType) =>
      VALID_CONNECTIONS[sourceType]?.includes(targetType) ?? false,
    isValidInsertion: (sourceType, newType, targetType) =>
      (VALID_CONNECTIONS[sourceType]?.includes(newType) ?? false) &&
      (VALID_CONNECTIONS[newType]?.includes(targetType) ?? false),
    insertSecondEdgeSourceHandle: 'right-source',
    // Only a scenario → existing-step connection carries a foreign key to patch.
    syncConnection: async (sourceNode, targetNode) => {
      if (targetNode.data.entityId && !targetNode.data.isNew && sourceNode.data.entityType === 'scenario') {
        try {
          await axios.patch(`/scenario-steps/${targetNode.data.entityId}`, {
            scenario_id: sourceNode.data.entityId
          })
        } catch (err) {
          console.error('Failed to sync edge connection:', err)
          return true // undo the edge on failure
        }
      }
      return false
    },
    orderLevels: [
      { parentType: 'scenario', isChild: isStepType, endpoint: '/scenario-steps', orderField: 'order' }
    ],
    onInvalidConnection: options.onInvalidConnection,
    onMultiEdgeRewireBlocked: options.onMultiEdgeRewireBlocked
  })

  const { nodes, edges } = graph

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
      const nodeType = step.step_type && isStepType(step.step_type) ? step.step_type : 'terminal'

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

  return {
    nodes,
    edges,
    convertScenarioToNodes,
    syncOrderFromEdges: graph.syncOrderFromEdges,
    saveNodePositions: graph.saveNodePositions,
    loadNodePositions: graph.loadNodePositions,
    clearNodePositions: graph.clearNodePositions,
    handleEdgeConnect: graph.handleEdgeConnect,
    insertNodeOnEdge: graph.insertNodeOnEdge,
    rewireEdgesAroundDeletedNode: graph.rewireEdgesAroundDeletedNode,
    deserializeQuestion
  }
}
