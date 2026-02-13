<!--
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
-->

<template>
  <div class="tree-node" :class="nodeClasses" :style="indentStyle">
    <!-- Node Header -->
    <div
      class="tree-node-header"
      :draggable="draggable"
      @click="handleHeaderClick"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @dragover.prevent="handleDragOver"
      @drop.prevent="handleDrop"
      @dragleave="handleDragLeave"
    >
      <!-- Expand/Collapse Icon -->
      <span
        v-if="hasChildren"
        class="tree-expand-icon"
        :class="{ expanded: isExpanded }"
        @click.stop="handleToggleExpand"
      >
        ▶
      </span>
      <span v-else class="tree-expand-placeholder"></span>

      <!-- Icon Slot -->
      <slot name="icon" :entity="entity" :level="level" :expanded="isExpanded">
        <span class="tree-node-icon">📁</span>
      </slot>

      <!-- Label Slot -->
      <slot name="label" :entity="entity" :level="level" :expanded="isExpanded">
        <span class="tree-node-label">{{ defaultLabel }}</span>
      </slot>

      <!-- Badge Slot (for counts, status, etc.) -->
      <slot name="badge" :entity="entity" :level="level"></slot>

      <!-- Actions Slot -->
      <div v-if="$slots.actions" class="tree-node-actions" @click.stop>
        <slot name="actions" :entity="entity" :level="level"></slot>
      </div>
    </div>

    <!-- Children -->
    <div v-if="isExpanded && hasChildren" class="tree-node-children">
      <TreeNode
        v-for="child in children"
        :key="getChildKey(child)"
        :entity="child"
        :level="level + 1"
        :children="childrenGetter ? childrenGetter(child) : []"
        :children-getter="childrenGetter"
        :expanded-nodes="expandedNodes"
        :draggable="draggable"
        :droppable="droppable"
        @toggle-expand="$emit('toggle-expand', $event)"
        @click="$emit('click', $event)"
        @drag-start="$emit('drag-start', $event)"
        @drag-end="$emit('drag-end', $event)"
        @drop="$emit('drop', $event)"
      >
        <!-- Forward all slots to children -->
        <template v-for="(_, slot) in $slots" #[slot]="scope">
          <slot :name="slot" v-bind="scope" />
        </template>
      </TreeNode>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  entity: any
  level?: number
  children?: any[]
  childrenGetter?: (entity: any) => any[]
  expandedNodes?: Set<string>
  draggable?: boolean
  droppable?: boolean
  nodeClass?: string | ((entity: any, level: number) => string)
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  children: () => [],
  draggable: false,
  droppable: false
})

const emit = defineEmits<{
  (e: 'toggle-expand', entity: any): void
  (e: 'click', entity: any): void
  (e: 'drag-start', payload: { entity: any, level: number }): void
  (e: 'drag-end', payload: { entity: any, level: number }): void
  (e: 'drop', payload: { entity: any, target: any }): void
}>()

const isDraggingOver = ref(false)

// Computed
const hasChildren = computed(() => {
  if (props.childrenGetter) {
    const children = props.childrenGetter(props.entity)
    return children && children.length > 0
  }
  return props.children && props.children.length > 0
})

const isExpanded = computed(() => {
  if (!props.expandedNodes || !props.entity.id) return false
  return props.expandedNodes.has(props.entity.id)
})

const defaultLabel = computed(() => {
  return props.entity.display_name || props.entity.name || props.entity.title || 'Untitled'
})

const indentStyle = computed(() => {
  return {
    '--tree-level': props.level,
    paddingLeft: `${props.level * 1.25}rem`
  }
})

const nodeClasses = computed(() => {
  const classes: string[] = []

  if (typeof props.nodeClass === 'function') {
    classes.push(props.nodeClass(props.entity, props.level))
  } else if (props.nodeClass) {
    classes.push(props.nodeClass)
  }

  if (isDraggingOver.value) {
    classes.push('dragging-over')
  }

  if (isExpanded.value) {
    classes.push('expanded')
  }

  return classes
})

const children = computed(() => {
  if (props.childrenGetter) {
    return props.childrenGetter(props.entity) || []
  }
  return props.children || []
})

// Methods
const getChildKey = (child: any): string => {
  return child.id || child.name || Math.random().toString()
}

const handleToggleExpand = () => {
  if (hasChildren.value) {
    emit('toggle-expand', props.entity)
  }
}

const handleHeaderClick = () => {
  emit('click', props.entity)
}

const handleDragStart = (event: DragEvent) => {
  if (!props.draggable || !event.dataTransfer) return

  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/json', JSON.stringify({
    entity: props.entity,
    level: props.level
  }))

  emit('drag-start', { entity: props.entity, level: props.level })
}

const handleDragEnd = () => {
  if (!props.draggable) return
  emit('drag-end', { entity: props.entity, level: props.level })
}

const handleDragOver = (event: DragEvent) => {
  if (!props.droppable) return
  event.preventDefault()
  isDraggingOver.value = true
}

const handleDragLeave = () => {
  isDraggingOver.value = false
}

const handleDrop = (event: DragEvent) => {
  if (!props.droppable || !event.dataTransfer) return

  isDraggingOver.value = false

  try {
    const data = JSON.parse(event.dataTransfer.getData('application/json'))
    emit('drop', { entity: data.entity, target: props.entity })
  } catch (err) {
    console.error('Failed to parse drag data:', err)
  }
}
</script>

<style scoped>
.tree-node {
  font-size: var(--font-size-sm, 0.875rem);
}

.tree-node-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
  border-radius: var(--border-radius-sm, 4px);
  margin: 0 var(--spacing-xs, 0.25rem);
}

.tree-node-header:hover {
  background: var(--color-surface-hover, rgba(0, 0, 0, 0.05));
}

.tree-node-header[draggable="true"] {
  cursor: grab;
}

.tree-node-header[draggable="true"]:active {
  cursor: grabbing;
}

.tree-node.dragging-over > .tree-node-header {
  background: var(--color-primary-bg, rgba(66, 153, 225, 0.1));
  border: 2px dashed var(--color-primary);
}

.tree-expand-icon {
  font-size: 0.625rem;
  color: var(--color-text-secondary, #718096);
  transition: transform 0.2s;
  display: inline-block;
  width: 0.75rem;
  text-align: center;
  flex-shrink: 0;
}

.tree-expand-icon.expanded {
  transform: rotate(90deg);
}

.tree-expand-placeholder {
  width: 0.75rem;
  display: inline-block;
  flex-shrink: 0;
}

.tree-node-icon {
  font-size: 1rem;
  line-height: 1;
  flex-shrink: 0;
}

.tree-node-label {
  flex: 1;
  color: var(--color-text-primary, #2d3748);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: var(--font-weight-medium, 500);
}

.tree-node-actions {
  display: flex;
  gap: var(--spacing-xs, 0.25rem);
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.tree-node-header:hover .tree-node-actions {
  opacity: 1;
}

.tree-node-children {
  margin-top: var(--spacing-xs, 0.25rem);
}
</style>
