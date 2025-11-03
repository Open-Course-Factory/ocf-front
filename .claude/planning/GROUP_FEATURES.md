# Group Features - Planning & Proposals

**Last Updated:** 2025-11-02
**Status:** Various stages (see each section)

This document consolidates all planning and proposals for group-related features including hierarchy editing, subgroup creation, and member display enhancements.

---

## Table of Contents

1. [Group Hierarchy Editor](#1-group-hierarchy-editor)
2. [Subgroup Creation Workflows](#2-subgroup-creation-workflows)
3. [Subgroup Members Display](#3-subgroup-members-display)

---

## 1. Group Hierarchy Editor

**Status:** 🟡 Proposed - Architecture analysis complete
**Question:** Should we mutualize code with the Course Editor?
**Short Answer:** Partial mutualization is good, but NOT full component reuse.

### Current Course Editor Architecture

The course editor uses:
1. **Vue Flow** - Visual flowchart library for node-based editing
2. **CourseTreePanel** - Right-side panel showing hierarchical tree view
3. **CourseTreeNode** - Recursive component for rendering tree nodes
4. **Drag & Drop** - Between flow canvas and tree panel

### Course Structure (Fixed 4 Levels)

```
Course
  ├── Chapter
  │     ├── Section
  │     │     └── Page
```

**CourseTreeNode Component:**
- ✅ Expand/collapse functionality
- ✅ Visual indentation by level
- ✅ Drag-and-drop support
- ✅ Actions (duplicate, move)
- ❌ Hardcoded to 4 specific entity types
- ❌ Sequential ordering logic (order/number fields)
- ❌ Color-coded by fixed entity types

### Group Hierarchy Requirements (Unlimited Nesting)

```
Organization
  ├── Math Department
  │     ├── Algebra Class
  │     │     ├── Section A
  │     │     └── Section B
  │     └── Geometry Class
  └── Science Department
        └── Physics Class
```

### Key Differences

| Aspect | Course Editor | Group Hierarchy |
|--------|---------------|-----------------|
| **Nesting Levels** | Fixed 4 levels | Unlimited depth |
| **Entity Types** | 4 types (course/chapter/section/page) | 1 type (group) |
| **Ordering** | Sequential (order, number fields) | Alphabetical (name-based) |
| **Relations** | 1-to-many only | Many-to-many (shared groups) |
| **Actions** | Duplicate, move between parents | Create subgroup, move, link |
| **Visual** | Node graph + tree | Tree only (simpler) |

### Code Mutualization Strategy

#### ✅ CAN Reuse

1. **useTreeExpansion composable** - Expand/collapse state management
   ```typescript
   // Generic tree expansion logic
   const expandedNodes = ref<Set<string>>(new Set())
   const toggleNode = (nodeId: string) => { ... }
   const expandAll = () => { ... }
   const collapseAll = () => { ... }
   ```

2. **Drag-and-drop logic** - If needed (generic implementation)
   ```typescript
   // Generic drag-and-drop handlers
   const handleDragStart = (item: any) => { ... }
   const handleDrop = (target: any, position: 'before' | 'after' | 'inside') => { ... }
   ```

3. **CSS styles** - Tree indentation, visual hierarchy
   ```css
   .tree-node {
     padding-left: calc(var(--level) * 24px);
   }
   ```

#### ❌ CANNOT Reuse (Must Create New)

1. **CourseTreeNode component** - Too specific to course structure
   - **Instead:** Create `GenericTreeNode.vue` with props for entity type

2. **Sequential ordering logic** - Groups use alphabetical sorting
   - **Instead:** Sort by `display_name` or `name` field

3. **Fixed-level color coding** - Not applicable to unlimited nesting
   - **Instead:** Use role-based or single color scheme

### Recommended Approach

**Create a new `GroupTreeEditor.vue` component:**

```vue
<template>
  <div class="group-tree-editor">
    <div class="tree-header">
      <button @click="expandAll">Expand All</button>
      <button @click="collapseAll">Collapse All</button>
      <button @click="createRootGroup">+ New Root Group</button>
    </div>

    <div class="tree-container">
      <GenericTreeNode
        v-for="rootGroup in rootGroups"
        :key="rootGroup.id"
        :node="rootGroup"
        :level="0"
        :expanded="expandedNodes.has(rootGroup.id)"
        @toggle="toggleNode"
        @create-child="createSubgroup"
        @move="moveGroup"
        @delete="deleteGroup"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GenericTreeNode from './GenericTreeNode.vue'
import { useTreeExpansion } from '../composables/useTreeExpansion'

const { expandedNodes, toggleNode, expandAll, collapseAll } = useTreeExpansion()

// Load groups with parent_group_id IS NULL for root
const rootGroups = ref([])
const loadGroups = async () => { ... }
</script>
```

**GenericTreeNode.vue (Reusable):**

```vue
<template>
  <div class="tree-node" :style="{ '--level': level }">
    <div class="node-header">
      <button v-if="hasChildren" @click="emit('toggle', node.id)">
        <i :class="expanded ? 'fa-chevron-down' : 'fa-chevron-right'" />
      </button>

      <span class="node-label">{{ node.display_name || node.name }}</span>

      <div class="node-actions">
        <button @click="emit('create-child', node)" title="Add subgroup">
          <i class="fa fa-plus" />
        </button>
        <button @click="emit('delete', node)" title="Delete">
          <i class="fa fa-trash" />
        </button>
      </div>
    </div>

    <!-- Recursive children -->
    <div v-if="expanded && node.children" class="node-children">
      <GenericTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :expanded="expandedNodes.has(child.id)"
        @toggle="emit('toggle', $event)"
        @create-child="emit('create-child', $event)"
        @move="emit('move', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
  </div>
</template>
```

### Database Schema

```sql
-- Groups table (already exists)
class_groups (
  id UUID PRIMARY KEY,
  parent_group_id UUID REFERENCES class_groups(id),  -- Self-referencing FK
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  owner_user_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Index for hierarchy queries
CREATE INDEX idx_class_groups_parent ON class_groups(parent_group_id);
CREATE INDEX idx_class_groups_organization ON class_groups(organization_id);
```

### API Requirements

```typescript
// Get root groups (no parent)
GET /class-groups?parent_group_id=null&organization_id={orgId}

// Get children of a group
GET /class-groups?parent_group_id={groupId}

// Get full hierarchy (recursive query)
GET /class-groups/hierarchy?organization_id={orgId}
// Returns tree structure with nested children arrays

// Move group to new parent
PATCH /class-groups/{id}
{
  "parent_group_id": "{newParentId}" // or null for root level
}
```

### Conclusion

**Recommendation:** Create new `GroupTreeEditor` component that:
- ✅ Reuses generic tree expansion logic
- ✅ Reuses generic drag-and-drop (if needed)
- ✅ Reuses CSS styling patterns
- ❌ Does NOT extend CourseTreeNode directly
- ✅ Uses new `GenericTreeNode` for flexibility

**Benefits:**
- Cleaner separation of concerns
- No coupling to course-specific logic
- Reusable for other hierarchical entities in future
- Easier to maintain

---

## 2. Subgroup Creation Workflows

**Status:** ✅ Implemented
**Implementation Date:** 2025-10-17

### Overview

Two workflows for creating subgroups:
1. **Batch creation during parent group creation**
2. **Manual creation from parent group detail page**

### Workflow 1: Batch Subgroup Creation

**Location:** Create Group Modal (`EntityModal.vue` with `classGroups` store)

**How it works:**
- When creating a new group, a `subgroup_names` textarea field appears
- User can enter multiple subgroup names, one per line
- After the parent group is created, subgroups are automatically created via `afterCreateHook`

**Field Configuration** (`src/stores/classGroups.ts:172-177`):

```typescript
field('subgroup_names', t('classGroups.subgroupNames'))
  .textarea()
  .visible()
  .creatable()  // Only shows during creation, not editing
  .placeholder(t('classGroups.subgroupNamesHelp'))
  .hint(t('classGroups.subgroupNamesHelp'))
```

**Hook Implementation** (`src/stores/classGroups.ts:198-223`):

```typescript
base.setAfterCreateHook(async (createdGroup: any, originalData: any) => {
  if (originalData.subgroup_names && typeof originalData.subgroup_names === 'string') {
    const subgroupNames = originalData.subgroup_names
      .split('\n')
      .map((name: string) => name.trim())
      .filter((name: string) => name.length > 0)

    for (const displayName of subgroupNames) {
      try {
        await base.createEntity('/class-groups', {
          display_name: displayName,
          name: generateSlug(displayName),
          parent_group_id: createdGroup.id,
          parentGroupID: createdGroup.id,
          max_members: originalData.max_members || 30,
          is_active: true
        })
      } catch (error) {
        console.error(`Failed to create subgroup "${displayName}":`, error)
      }
    }
  }
})
```

**Example Usage:**

```
Parent Group: "CS101 Fall 2025"
Subgroups (one per line):
Section A
Section B
Section C
Lab Group 1
Lab Group 2
```

**Result:**
- Parent group "CS101 Fall 2025" is created
- 5 subgroups created automatically with `parent_group_id` set to parent

**Translations:**

```typescript
// English
subgroupNames: 'Subgroups (optional)',
subgroupNamesHelp: 'Enter subgroup names, one per line (e.g., "Section A", "Team Red")',

// French
subgroupNames: 'Sous-groupes (optionnel)',
subgroupNamesHelp: 'Entrez les noms des sous-groupes, un par ligne (ex: "Section A", "Équipe Rouge")',
```

### Workflow 2: Manual Subgroup Creation

**Location:** GroupDetails Members tab

**Implementation:**
- "Create Subgroup" button in Members tab header
- Opens standard EntityModal with `parent_group_id` pre-filled
- Uses regular group creation flow

**Code Reference:** `src/components/Pages/GroupDetails.vue`

### Error Handling

**Partial Failures:**
- If some subgroups fail to create, others still succeed
- Errors logged to console
- No UI error shown (silent failure for non-critical operation)

**Validation:**
- Empty lines ignored
- Leading/trailing whitespace trimmed
- Slug auto-generated from display name
- `max_members` inherited from parent group

### Future Enhancements

1. **Error Reporting:** Show toast notification with count of successful/failed subgroups
2. **Bulk Import:** Support CSV upload for large-scale subgroup creation
3. **Templates:** Pre-defined templates (e.g., "A-Z sections", "Team 1-10")
4. **Preview:** Show list of subgroups to be created before confirmation

---

## 3. Subgroup Members Display

**Status:** ✅ Implemented
**Implementation Date:** 2025-10-17

### Overview

Enhances the group members page to display members from the current group AND all its subgroups, with badge indicators showing member origin.

### Updated Group Member Interface

**Location:** `/src/composables/useGroupMembers.ts:27-43`

Added `source_group` field to track member origin:

```typescript
export interface GroupMember {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'assistant' | 'member'
  joined_at?: string
  user?: {
    id: string
    email: string
    username?: string
    display_name?: string
  }
  source_group?: {      // NEW: Tracks member origin
    id: string
    name: string
    display_name: string
  }
}
```

### Enhanced loadMembers Function

**Location:** `/src/composables/useGroupMembers.ts:124-179`

**New Parameters:**
- `includeSubgroups: boolean = false` - Whether to include subgroup members
- `subgroups: any[] = []` - Array of subgroup objects

**How it works:**

1. **Fetch main group members** with `source_group: null`
2. **If includeSubgroups is true:**
   - Fetch members from each subgroup in parallel using `Promise.all()`
   - Add `source_group` metadata to each subgroup member
   - Handle errors gracefully (logs to console, continues with other subgroups)
3. **Combine results:** Main group members + all subgroup members

```typescript
const loadMembers = async (
  groupId: string,
  includeSubgroups: boolean = false,
  subgroups: any[] = []
) => {
  // Load main group members
  const mainMembers = await fetchMembers(groupId)
  mainMembers.forEach(m => m.source_group = null)

  // Load subgroup members if requested
  let subgroupMembers: GroupMember[] = []
  if (includeSubgroups && subgroups.length > 0) {
    const subgroupPromises = subgroups.map(async (subgroup) => {
      try {
        const members = await fetchMembers(subgroup.id)
        return members.map(m => ({
          ...m,
          source_group: {
            id: subgroup.id,
            name: subgroup.name,
            display_name: subgroup.display_name
          }
        }))
      } catch (error) {
        console.error(`Failed to load members for subgroup ${subgroup.id}:`, error)
        return []
      }
    })

    const results = await Promise.all(subgroupPromises)
    subgroupMembers = results.flat()
  }

  members.value = [...mainMembers, ...subgroupMembers]
}
```

### UI Integration

**Location:** `src/components/Pages/GroupDetails.vue` (Members tab)

**Toggle Control:**

```vue
<div class="subgroup-toggle">
  <label>
    <input
      type="checkbox"
      v-model="includeSubgroupMembers"
      @change="loadGroupMembers"
    />
    {{ t('groups.includeSubgroupMembers') }}
    <span v-if="subgroups.length > 0" class="subgroup-count">
      ({{ subgroups.length }} {{ t('groups.subgroups') }})
    </span>
  </label>
</div>
```

**Member Display with Badge:**

```vue
<tr v-for="member in members" :key="member.id">
  <td>
    {{ member.user?.display_name || member.user?.email }}

    <!-- Badge for subgroup members -->
    <span v-if="member.source_group" class="subgroup-badge">
      {{ member.source_group.display_name }}
    </span>
  </td>
  <td>{{ member.role }}</td>
  <td>{{ formatDate(member.joined_at) }}</td>
</tr>
```

### Styling

```css
.subgroup-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  margin-left: 0.5rem;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.subgroup-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--color-bg-secondary);
  border-radius: 6px;
  margin-bottom: 1rem;
}

.subgroup-count {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}
```

### Performance Considerations

**Parallel Loading:**
- All subgroup member requests run in parallel using `Promise.all()`
- Reduces total load time vs sequential requests

**Error Tolerance:**
- If one subgroup fails, others still load
- No cascading failures

**Optimization Opportunity:**
Backend could provide a single endpoint:
```
GET /class-groups/{id}/all-members?include_subgroups=true

Response:
{
  "members": [
    {
      "user_id": "...",
      "role": "member",
      "source_group_id": null  // Main group
    },
    {
      "user_id": "...",
      "role": "member",
      "source_group_id": "subgroup-uuid",
      "source_group_name": "Section A"
    }
  ]
}
```

This would reduce frontend complexity and improve performance.

### User Experience

**Benefits:**
- See all members across hierarchy at a glance
- Identify which subgroup each member belongs to
- Toggle between views (main group only vs full hierarchy)
- Clear visual distinction with badges

**Use Cases:**
- **Teachers:** View all students across lab sections
- **Managers:** See team members across departments
- **Administrators:** Audit organization membership

### Future Enhancements

1. **Filter by Subgroup:** Dropdown to show only specific subgroup's members
2. **Member Count Summary:** "15 members (5 in main group, 10 in subgroups)"
3. **Nested Display:** Tree view showing members grouped by subgroup
4. **Export:** CSV export with subgroup column
5. **Bulk Actions:** Select members across subgroups for bulk operations

---

## Summary

**Implemented Features:**
- ✅ Batch subgroup creation during parent group creation
- ✅ Manual subgroup creation from group detail page
- ✅ Subgroup members display with origin badges
- ✅ Toggle to include/exclude subgroup members
- ✅ Parallel loading for performance
- ✅ Error tolerance (partial failures don't break UI)

**Proposed Features:**
- 🟡 Group Hierarchy Editor (visual tree management)
- 🟡 Backend optimization for bulk member loading
- 🟡 Advanced filtering and export capabilities

**Related Documentation:**
- Implementation details: `GROUPS_IMPLEMENTATION_COMPLETE.md`
- Architecture: `GROUPS_ARCHITECTURE_DIAGRAM.md`
- Quick reference: `GROUPS_QUICK_REFERENCE.md`
