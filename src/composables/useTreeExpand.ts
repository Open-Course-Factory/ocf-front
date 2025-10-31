/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
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

import { ref, computed } from 'vue'

/**
 * Composable for managing tree node expand/collapse state
 *
 * @param initialExpanded - Array of node IDs that should be expanded by default
 * @param autoExpandLevel - Automatically expand nodes up to this level (0-indexed)
 * @returns Object with state and methods for managing expansion
 *
 * @example
 * const { isExpanded, toggle, expandAll, collapseAll } = useTreeExpand(['node-1', 'node-2'])
 *
 * // Check if a node is expanded
 * if (isExpanded('node-1')) { ... }
 *
 * // Toggle a node's expansion state
 * toggle('node-1')
 *
 * // Expand all nodes
 * expandAll(['node-1', 'node-2', 'node-3'])
 */
export function useTreeExpand(initialExpanded: string[] = [], autoExpandLevel?: number) {
  const expandedNodes = ref<Set<string>>(new Set(initialExpanded))

  /**
   * Check if a node is expanded
   */
  const isExpanded = (nodeId: string): boolean => {
    return expandedNodes.value.has(nodeId)
  }

  /**
   * Toggle a node's expansion state
   */
  const toggle = (nodeId: string) => {
    if (expandedNodes.value.has(nodeId)) {
      expandedNodes.value.delete(nodeId)
    } else {
      expandedNodes.value.add(nodeId)
    }
    // Trigger reactivity
    expandedNodes.value = new Set(expandedNodes.value)
  }

  /**
   * Expand a specific node
   */
  const expand = (nodeId: string) => {
    if (!expandedNodes.value.has(nodeId)) {
      expandedNodes.value.add(nodeId)
      expandedNodes.value = new Set(expandedNodes.value)
    }
  }

  /**
   * Collapse a specific node
   */
  const collapse = (nodeId: string) => {
    if (expandedNodes.value.has(nodeId)) {
      expandedNodes.value.delete(nodeId)
      expandedNodes.value = new Set(expandedNodes.value)
    }
  }

  /**
   * Expand multiple nodes at once
   */
  const expandAll = (nodeIds: string[]) => {
    nodeIds.forEach(id => expandedNodes.value.add(id))
    expandedNodes.value = new Set(expandedNodes.value)
  }

  /**
   * Collapse all nodes
   */
  const collapseAll = () => {
    expandedNodes.value.clear()
    expandedNodes.value = new Set(expandedNodes.value)
  }

  /**
   * Expand nodes recursively up to a certain level
   */
  const expandToLevel = (nodeIds: string[], levels: number) => {
    if (levels > 0) {
      expandAll(nodeIds)
    }
  }

  /**
   * Check if a node should be auto-expanded based on its level
   */
  const shouldAutoExpand = (level: number): boolean => {
    return autoExpandLevel !== undefined && level <= autoExpandLevel
  }

  /**
   * Get the count of expanded nodes
   */
  const expandedCount = computed(() => expandedNodes.value.size)

  /**
   * Get all expanded node IDs as an array
   */
  const expandedList = computed(() => Array.from(expandedNodes.value))

  return {
    // State
    expandedNodes,
    expandedCount,
    expandedList,

    // Methods
    isExpanded,
    toggle,
    expand,
    collapse,
    expandAll,
    collapseAll,
    expandToLevel,
    shouldAutoExpand
  }
}
