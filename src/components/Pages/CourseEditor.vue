<template>
  <div class="course-editor">
    <div class="editor-header">
      <div class="header-left">
        <h1>{{ t('courseEditor.title') }}</h1>

        <!-- Course Selector -->
        <div class="course-selector">
          <select
            v-model="selectedCourseId"
            @change="handleCourseSelect"
            class="course-select"
          >
            <option :value="null">{{ t('courseEditor.selectCourse') }}</option>
            <option
              v-for="course in courses"
              :key="course.id"
              :value="course.id"
            >
              {{ course.name }} v{{ course.version }} - {{ course.title }}
            </option>
          </select>

          <button @click="handleCreateNew" class="btn-create">
            {{ t('courseEditor.createNew') }}
          </button>

          <!-- Debug info -->
          <span class="debug-info" v-if="nodes.length > 0">
            📊 {{ nodes.length }} nodes, {{ edges.length }} edges
          </span>
        </div>
      </div>

      <div class="editor-actions">
        <button @click="handleSave" class="btn-primary" :disabled="!selectedCourseId && nodes.length === 0">
          {{ t('courseEditor.save') }}
        </button>
        <button @click="handleReset" class="btn-secondary">
          {{ t('courseEditor.reset') }}
        </button>
      </div>
    </div>

    <div class="editor-container">
      <!-- Left Panel: Node Library -->
      <NodeLibraryPanel
        class="panel library-panel"
        @node-drag-start="handleNodeDragStart"
      />

      <!-- Center Panel: Flow Canvas -->
      <FlowCanvas
        class="panel canvas-panel"
        :nodes="nodes"
        :edges="edges"
        :dragged-node-type="draggedNodeType"
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

      <!-- Right Panel: Course Tree -->
      <div class="panel tree-panel" :style="{ width: treePanelWidth + 'px' }">
        <div
          class="resize-handle"
          :class="{ resizing: isResizing }"
          @mousedown="startResize"
        ></div>
        <CourseTreePanel
          :courses="courses"
          @entity-drag-start="handleEntityDragStart"
          @duplicate-entity="handleDuplicateEntity"
          @move-entity="handleMoveEntity"
        />
      </div>
    </div>

    <!-- Edit Entity Modal -->
    <BaseModal
      :visible="showEditModal"
      :title="editModalTitle"
      size="large"
      :show-default-footer="true"
      :confirm-text="t('courseEditor.saveEntity')"
      :cancel-text="t('courseEditor.cancel')"
      :is-loading="isSaving"
      :error-message="modalError"
      @close="closeEditModal"
      @confirm="handleSaveEntity"
    >
      <div class="modal-form">
        <div class="form-group">
          <label>{{ t('courseEditor.entityTitle') }}</label>
          <input
            v-model="editingEntity.title"
            type="text"
            class="form-control"
            :placeholder="t('courseEditor.enterTitle')"
          />
        </div>

        <div v-if="editingEntity.entityType === 'course'" class="form-group">
          <label>{{ t('courseEditor.courseName') }}</label>
          <input
            v-model="editingEntity.name"
            type="text"
            class="form-control"
            :placeholder="t('courseEditor.enterName')"
          />
        </div>

        <div v-if="editingEntity.entityType === 'course'" class="form-group">
          <label>{{ t('courseEditor.version') }}</label>
          <input
            v-model="editingEntity.version"
            type="text"
            class="form-control"
            placeholder="1.0"
          />
        </div>

        <div v-if="editingEntity.entityType === 'page'" class="form-group">
          <label>{{ t('courseEditor.content') }}</label>
          <textarea
            v-model="editingEntity.content"
            class="form-control"
            rows="8"
            :placeholder="t('courseEditor.enterContent')"
          ></textarea>
        </div>

        <div class="form-group">
          <label>{{ t('courseEditor.description') }}</label>
          <textarea
            v-model="editingEntity.description"
            class="form-control"
            rows="3"
            :placeholder="t('courseEditor.enterDescription')"
          ></textarea>
        </div>
      </div>
    </BaseModal>

    <!-- Delete Confirmation Modal -->
    <BaseModal
      :visible="showDeleteModal"
      :title="t('courseEditor.confirmDelete')"
      size="small"
      :show-default-footer="true"
      :confirm-text="t('courseEditor.delete')"
      :cancel-text="t('courseEditor.cancel')"
      confirm-icon="fas fa-trash"
      @close="closeDeleteModal"
      @confirm="confirmDelete"
    >
      <p>{{ t('courseEditor.deleteWarning', { type: deletingNode?.data?.entityType || 'item', name: deletingNode?.data?.label || '' }) }}</p>
      <p v-if="deleteChildCounts" class="cascade-warning">{{ deleteChildCounts }}</p>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCoursesStore } from '../../stores/courses'
import { useChaptersStore } from '../../stores/chapters'
import { useSectionsStore } from '../../stores/sections'
import { usePagesStore } from '../../stores/pages'
import { useTranslations } from '../../composables/useTranslations'
import NodeLibraryPanel from '../CourseEditor/NodeLibraryPanel.vue'
import FlowCanvas from '../CourseEditor/FlowCanvas.vue'
import CourseTreePanel from '../CourseEditor/CourseTreePanel.vue'
import BaseModal from '../Modals/BaseModal.vue'
import { useNotification } from '../../composables/useNotification'
import axios from 'axios'
import type { Course } from '../../types/entities'

const route = useRoute()
const router = useRouter()

const { t } = useTranslations({
  en: {
    courseEditor: {
      title: 'Course Editor',
      selectCourse: 'Select a course to edit...',
      createNew: 'Create New',
      save: 'Save Changes',
      reset: 'Reset Layout',
      saveSuccess: 'Changes saved successfully',
      saveError: 'Failed to save changes',
      loadError: 'Failed to load course',
      nodesCreated: 'Course loaded into canvas',
      courseCreated: 'Course created successfully',
      // Modal
      saveEntity: 'Save',
      cancel: 'Cancel',
      entityTitle: 'Title',
      enterTitle: 'Enter title...',
      courseName: 'Course Name',
      enterName: 'Enter course name...',
      version: 'Version',
      content: 'Content',
      enterContent: 'Enter content...',
      description: 'Description',
      enterDescription: 'Enter description...',
      confirmDelete: 'Confirm Deletion',
      delete: 'Delete',
      deleteWarning: 'Are you sure you want to delete this {type}: "{name}"? This action cannot be undone.',
      editEntity: 'Edit {type}',
      createEntity: 'Create {type}',
      invalidConnection: 'Invalid connection: {source} cannot connect to {target}',
      moveSuccess: 'Entity moved successfully',
      moveError: 'Failed to move entity',
      cascadeChildren: 'This will also delete {count} child entity(ies).'
    }
  },
  fr: {
    courseEditor: {
      title: 'Éditeur de Cours',
      selectCourse: 'Sélectionner un cours à éditer...',
      createNew: 'Créer Nouveau',
      save: 'Enregistrer',
      reset: 'Réinitialiser',
      saveSuccess: 'Modifications enregistrées avec succès',
      saveError: 'Échec de l\'enregistrement',
      loadError: 'Échec du chargement du cours',
      nodesCreated: 'Cours chargé dans le canevas',
      courseCreated: 'Cours créé avec succès',
      // Modal
      saveEntity: 'Enregistrer',
      cancel: 'Annuler',
      entityTitle: 'Titre',
      enterTitle: 'Saisir le titre...',
      courseName: 'Nom du Cours',
      enterName: 'Saisir le nom du cours...',
      version: 'Version',
      content: 'Contenu',
      enterContent: 'Saisir le contenu...',
      description: 'Description',
      enterDescription: 'Saisir la description...',
      confirmDelete: 'Confirmer la Suppression',
      delete: 'Supprimer',
      deleteWarning: 'Êtes-vous sûr de vouloir supprimer ce {type}: "{name}"? Cette action est irréversible.',
      editEntity: 'Modifier {type}',
      createEntity: 'Créer {type}',
      invalidConnection: 'Connexion invalide : {source} ne peut pas se connecter à {target}',
      moveSuccess: 'Entité déplacée avec succès',
      moveError: 'Échec du déplacement de l\'entité',
      cascadeChildren: 'Cela supprimera également {count} entité(s) enfant(s).'
    }
  }
})

const coursesStore = useCoursesStore()
const chaptersStore = useChaptersStore()
const sectionsStore = useSectionsStore()
const pagesStore = usePagesStore()
const notification = useNotification()

// State
const nodes = ref<any[]>([])
const edges = ref<any[]>([])
const draggedNodeType = ref<string | null>(null)
const selectedCourseId = ref<string | null>(null)
const currentCourse = ref<Course | null>(null)
const courses = computed(() => coursesStore.entities)

// Modal state
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingEntity = ref<any>({})
const deletingNode = ref<any>(null)
const isSaving = ref(false)
const modalError = ref('')

// Resize state
const treePanelWidth = ref(280)
const isResizing = ref(false)
const resizeStartX = ref(0)
const resizeStartWidth = ref(0)

const editModalTitle = computed(() => {
  if (!editingEntity.value?.entityType) return ''
  const type = editingEntity.value.entityType
  return editingEntity.value.isNew
    ? t('courseEditor.createEntity', { type })
    : t('courseEditor.editEntity', { type })
})

// Count child entities of the node being deleted
const deleteChildCounts = computed(() => {
  if (!deletingNode.value) return ''
  const nodeData = deletingNode.value.data
  let count = 0
  const countChildren = (data: any, type: string) => {
    const childKey = type === 'course' ? 'chapters' :
                     type === 'chapter' ? 'sections' :
                     type === 'section' ? 'pages' : null
    if (!childKey || !data[childKey]) return
    count += data[childKey].length
    const childType = type === 'course' ? 'chapter' :
                      type === 'chapter' ? 'section' :
                      type === 'section' ? 'page' : null
    if (childType) {
      for (const child of data[childKey]) {
        countChildren(child, childType)
      }
    }
  }
  countChildren(nodeData, nodeData.entityType)
  if (count === 0) return ''
  return t('courseEditor.cascadeChildren', { count: String(count) })
})

// Load all courses with full hierarchy
onMounted(async () => {
  await coursesStore.loadEntities('/courses?include=chapters.sections.pages')

  // Check if courseId is in URL query params
  const courseIdFromUrl = route.query.courseId as string | undefined
  if (courseIdFromUrl) {
    selectedCourseId.value = courseIdFromUrl
    await handleCourseSelect()
  }

  // Load saved panel width from localStorage
  const savedWidth = localStorage.getItem('courseEditor_treePanelWidth')
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

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})

// Handle course selection
const handleCourseSelect = async () => {
  if (!selectedCourseId.value) {
    nodes.value = []
    edges.value = []
    currentCourse.value = null
    // Remove courseId from URL
    router.replace({ query: {} })
    return
  }

  // Update URL with selected course ID
  router.replace({ query: { courseId: selectedCourseId.value } })

  try {
    // Load full course with nested data
    console.log('=== LOADING COURSE ===')
    console.log('Course ID:', selectedCourseId.value)

    const course = await coursesStore.fetchCourseById(selectedCourseId.value)

    console.log('=== RAW COURSE DATA ===')
    console.log('Course object:', course)
    console.log('Course chapters:', course?.chapters)
    console.log('Chapters type:', Array.isArray(course?.chapters))
    console.log('Chapters length:', course?.chapters?.length)

    if (course?.chapters && course.chapters.length > 0) {
      console.log('First chapter:', course.chapters[0])
      console.log('First chapter sections:', course.chapters[0].sections)
      if (course.chapters[0].sections && course.chapters[0].sections.length > 0) {
        console.log('First section:', course.chapters[0].sections[0])
        console.log('First section pages:', course.chapters[0].sections[0].pages)
      }
    }

    if (!course) {
      console.error('Course not found')
      return
    }

    currentCourse.value = course
    convertCourseToNodes(course)
    // Load saved positions from localStorage (do this in next tick after nodes are set)
    setTimeout(() => {
      loadNodePositions()
    }, 0)
  } catch (err) {
    console.error('Error loading course:', err)
  }
}

// Convert course hierarchy to nodes and edges
const convertCourseToNodes = (course: Course) => {
  const newNodes: any[] = []
  const newEdges: any[] = []

  console.log('Converting course to nodes:', course)
  console.log('Course has chapters:', course.chapters?.length)

  // Create course node (root)
  const courseNode = {
    id: `course-${course.id}`,
    type: 'course',
    position: { x: 400, y: 50 },
    data: {
      label: course.title || course.name,
      entityId: course.id,
      entityType: 'course',
      version: course.version,
      chapters: course.chapters,
      isNew: false,
      isExpanded: true, // Course always expanded
      ...course
    }
  }
  newNodes.push(courseNode)

  // Only proceed if we have chapters
  if (!course.chapters || course.chapters.length === 0) {
    console.warn('No chapters found in course')
    nodes.value = newNodes
    edges.value = newEdges
    return
  }

  const chapters = [...course.chapters].sort((a, b) => (a.order || 0) - (b.order || 0))
  console.log('Processing chapters:', chapters.length)

  // Layout configuration - NEW VERTICAL LAYOUT
  const CHAPTER_SPACING_Y = 200      // Chapters stacked vertically (reduced from 250)
  const SECTION_SPACING_X = 250      // Sections spread horizontally (reduced from 350)
  const PAGE_SPACING_Y = 180         // Pages stacked vertically (node height + gap to prevent overlap)
  const LEVEL_SPACING_X = 200        // Horizontal space between levels (reduced from 300)

  let currentY = 250 // Start below course node
  let previousChapterId: string | null = null

  chapters.forEach((chapter, chapterIdx) => {
    const chapterId = `chapter-${chapter.id}`
    const chapterX = 100 // All chapters at same X position (vertical stack)

    const chapterNode = {
      id: chapterId,
      type: 'chapter',
      position: { x: chapterX, y: currentY },
      data: {
        label: chapter.title,
        entityId: chapter.id,
        entityType: 'chapter',
        number: chapter.order || chapterIdx + 1,
        sections: chapter.sections,
        isNew: false,
        isExpanded: false, // Chapters collapsed by default
        ...chapter
      }
    }
    newNodes.push(chapterNode)

    // Connect chapters: all use bottom→top (consistent vertical flow)
    if (chapterIdx === 0) {
      // First chapter connects to course (bottom→top, same as siblings)
      newEdges.push({
        id: `edge-${courseNode.id}-${chapterId}`,
        source: courseNode.id,
        sourceHandle: 'bottom-source',
        target: chapterId,
        targetHandle: 'top',
        type: 'smoothstep',
        animated: false
      })
    } else if (previousChapterId) {
      // Subsequent chapters chain to previous chapter (bottom→top)
      newEdges.push({
        id: `edge-${previousChapterId}-${chapterId}`,
        source: previousChapterId,
        sourceHandle: 'bottom-source',
        target: chapterId,
        targetHandle: 'top',
        type: 'smoothstep',
        animated: false
      })
    }

    console.log(`Chapter ${chapterIdx + 1}: ${chapter.title} (${chapter.sections?.length || 0} sections)`)

    // Process sections (HORIZONTAL layout from chapter)
    if (chapter.sections && chapter.sections.length > 0) {
      const sections = [...chapter.sections].sort((a, b) => (a.order || 0) - (b.order || 0))
      let sectionX = chapterX + LEVEL_SPACING_X // Start to the right of chapter
      let previousSectionId: string | null = null

      sections.forEach((section, sectionIdx) => {
        const sectionId = `section-${section.id}`

        const sectionNode = {
          id: sectionId,
          type: 'section',
          position: { x: sectionX, y: currentY }, // Same Y as parent chapter
          hidden: true, // Sections hidden by default (chapters collapsed)
          data: {
            label: section.title,
            entityId: section.id,
            entityType: 'section',
            number: section.order || sectionIdx + 1,
            pages: section.pages,
            isNew: false,
            isExpanded: false, // Sections collapsed by default
            ...section
          }
        }
        newNodes.push(sectionNode)

        // Connect sections: all use right→left (consistent horizontal flow)
        if (sectionIdx === 0) {
          // First section connects to chapter (right→left, same as siblings)
          newEdges.push({
            id: `edge-${chapterId}-${sectionId}`,
            source: chapterId,
            sourceHandle: 'right-source',
            target: sectionId,
            targetHandle: 'left',
            type: 'smoothstep',
            animated: false,
            hidden: true // Edge hidden by default (chapters collapsed)
          })
        } else if (previousSectionId) {
          // Subsequent sections chain to previous section (right→left)
          newEdges.push({
            id: `edge-${previousSectionId}-${sectionId}`,
            source: previousSectionId,
            sourceHandle: 'right-source',
            target: sectionId,
            targetHandle: 'left',
            type: 'smoothstep',
            animated: false,
            hidden: true
          })
        }

        console.log(`  Section ${sectionIdx + 1}: ${section.title} (${section.pages?.length || 0} pages)`)

        // Process pages (VERTICAL layout from section)
        if (section.pages && section.pages.length > 0) {
          const pages = [...section.pages].sort((a, b) => (a.order || 0) - (b.order || 0))
          const pageX = sectionX // Same X as section (pages stack vertically below)
          let pageY = currentY + 160 // Start below section (offset for section node height)
          let previousPageId: string | null = null

          pages.forEach((page, pageIdx) => {
            // CRITICAL FIX: Handle pages that might not have IDs (use index as fallback)
            const pageId = page.id ? `page-${page.id}` : `page-temp-${sectionId}-${pageIdx}`

            // CRITICAL FIX: Handle content that might be an array
            let contentStr = ''
            if (Array.isArray(page.content)) {
              contentStr = page.content.join('\n')
            } else if (typeof page.content === 'string') {
              contentStr = page.content
            } else if (page.content) {
              contentStr = String(page.content)
            }

            const pageNode = {
              id: pageId,
              type: 'page',
              position: { x: pageX, y: pageY },
              hidden: true, // Pages hidden by default (sections collapsed)
              data: {
                label: page.title || `Page ${pageIdx + 1}`,
                entityId: page.id || null,
                entityType: 'page',
                number: page.order || pageIdx + 1,
                isNew: false,
                ...page,
                // Override content with string version (must be after ...page)
                content: contentStr
              }
            }
            newNodes.push(pageNode)

            // Connect pages: all use bottom→top (consistent vertical flow)
            if (pageIdx === 0) {
              // First page connects to section (bottom→top, same as siblings)
              newEdges.push({
                id: `edge-${sectionId}-${pageId}`,
                source: sectionId,
                sourceHandle: 'bottom-source',
                target: pageId,
                targetHandle: 'top',
                type: 'straight',
                animated: false,
                hidden: true // Edge hidden by default (sections collapsed)
              })
            } else if (previousPageId) {
              // Subsequent pages chain to previous page (bottom→top)
              newEdges.push({
                id: `edge-${previousPageId}-${pageId}`,
                source: previousPageId,
                sourceHandle: 'bottom-source',
                target: pageId,
                targetHandle: 'top',
                type: 'straight',
                animated: false,
                hidden: true
              })
            }

            console.log(`    Page ${pageIdx + 1}: ${page.title} (ID: ${page.id || 'no-id'})`)

            // Move down for next page (vertical stacking)
            pageY += PAGE_SPACING_Y
            previousPageId = pageId
          })
        }

        // Move right for next section (horizontal spreading)
        sectionX += SECTION_SPACING_X
        previousSectionId = sectionId
      })
    }

    // Move down for next chapter (vertical stacking)
    currentY += CHAPTER_SPACING_Y
    previousChapterId = chapterId
  })

  nodes.value = newNodes
  edges.value = newEdges
  console.log('=== FINAL RESULT ===')
  console.log('Total nodes created:', newNodes.length)
  console.log('Total edges created:', newEdges.length)
  console.log('Nodes:', newNodes.map(n => `${n.type}:${n.data.label}`))
  console.log('Edges:', newEdges.map(e => `${e.source}->${e.target}`))
}

// Create new course
const handleCreateNew = () => {
  selectedCourseId.value = null
  currentCourse.value = null
  nodes.value = []
  edges.value = []
  editingEntity.value = {
    nodeId: null,
    entityId: null,
    entityType: 'course',
    title: '',
    name: '',
    version: '1.0',
    content: '',
    description: '',
    isNew: true
  }
  showEditModal.value = true
  modalError.value = ''
}

// Drag handlers
const handleNodeDragStart = (nodeType: string) => {
  draggedNodeType.value = nodeType
}

const handleEntityDragStart = (_entity: any, entityType: string) => {
  draggedNodeType.value = `existing-${entityType}`
  // Store entity data for drop
}

// Node added handler
const handleNodeAdded = (node: any) => {
  console.log('Node added:', node)
  // Node is already added to nodes array by FlowCanvas
  // If it's a new entity, open edit modal
  if (node.data.isNew) {
    openEditModal(node)
  }
}

// Node/Edge change handlers
const handleNodesChange = (changes: any[]) => {
  // Handle node position changes, additions, deletions
  // Vue Flow handles this automatically, we just track it
  console.log('Nodes changed:', changes)

  // Check if any position changes occurred
  const hasPositionChanges = changes.some(change =>
    change.type === 'position' && change.dragging === false
  )

  // Save positions to localStorage when nodes are moved
  if (hasPositionChanges && selectedCourseId.value) {
    saveNodePositions()
  }
}

const handleEdgesChange = (changes: any[]) => {
  // Handle edge changes (connections between nodes)
  console.log('Edges changed:', changes)
}

// Node interaction handlers
const handleNodeClick = (event: any) => {
  console.log('Node clicked:', event)
}

const handlePaneClick = () => {
  console.log('Pane clicked - clearing all selections')
  // Clear all selections when clicking on empty canvas
  nodes.value.forEach(node => {
    node.selected = false
  })
  // Force reactivity update
  nodes.value = [...nodes.value]
}

// Toggle expand/collapse for nodes with children
const handleToggleExpand = (nodeData: any) => {
  console.log('Toggle expand for:', nodeData)

  // Find the node by matching data
  const node = nodes.value.find(n => n.data.entityId === nodeData.entityId)
  if (!node) return

  // Toggle the expanded state
  node.data.isExpanded = !node.data.isExpanded

  // Show/hide child nodes and edges
  toggleChildVisibility(node.id, node.data.entityType, node.data.isExpanded)

  // Force Vue reactivity by creating new array reference
  nodes.value = [...nodes.value]
  edges.value = [...edges.value]
}

// Helper to show/hide child nodes
const toggleChildVisibility = (parentId: string, parentType: string, isVisible: boolean) => {
  const childPrefix = getChildPrefix(parentType)
  if (!childPrefix) return

  // Get the parent node to access its children data
  const parentNode = nodes.value.find(n => n.id === parentId)
  if (!parentNode) return

  // Get child entity IDs from the parent's data structure
  let childEntityIds: string[] = []
  if (parentType === 'course' && parentNode.data.chapters) {
    childEntityIds = parentNode.data.chapters.map((ch: any) => `chapter-${ch.id}`)
  } else if (parentType === 'chapter' && parentNode.data.sections) {
    childEntityIds = parentNode.data.sections.map((sec: any) => `section-${sec.id}`)
  } else if (parentType === 'section' && parentNode.data.pages) {
    // Get the section ID from parent node ID (format: section-XXX)
    const sectionId = parentNode.id
    childEntityIds = parentNode.data.pages.map((page: any, idx: number) =>
      page.id ? `page-${page.id}` : `page-temp-${sectionId}-${idx}`
    )
  }

  // Find all child nodes
  const childNodes = nodes.value.filter(n => childEntityIds.includes(n.id))

  childNodes.forEach((childNode, index) => {
    // Set hidden property (Vue Flow will handle visibility)
    childNode.hidden = !isVisible

    // Hide/show edges connected to this child
    // First child: edge from parent
    // Other children: edge from previous sibling
    if (index === 0) {
      // First child - connected to parent
      const edgeFromParent = edges.value.find(e => e.source === parentId && e.target === childNode.id)
      if (edgeFromParent) {
        edgeFromParent.hidden = !isVisible
      }
    } else {
      // Subsequent children - connected to previous sibling
      const previousChildId = childEntityIds[index - 1]
      const edgeFromSibling = edges.value.find(e => e.source === previousChildId && e.target === childNode.id)
      if (edgeFromSibling) {
        edgeFromSibling.hidden = !isVisible
      }
    }

    // Recursively hide grandchildren if collapsing
    if (!isVisible) {
      toggleChildVisibility(childNode.id, childNode.data.entityType, false)
    } else if (childNode.data.isExpanded) {
      // If expanding and child was previously expanded, show its children too
      toggleChildVisibility(childNode.id, childNode.data.entityType, true)
    }
  })
}

const getChildPrefix = (entityType: string): string | null => {
  const childMap: Record<string, string> = {
    'course': 'chapter',
    'chapter': 'section',
    'section': 'page'
  }
  return childMap[entityType] || null
}

const getParentFieldName = (entityType: string): string | null => {
  const parentFieldMap: Record<string, string> = {
    'chapter': 'courseIDs',
    'section': 'chapterId',
    'page': 'sectionId'
  }
  return parentFieldMap[entityType] || null
}

// Modal handlers
const openEditModal = (node: any) => {
  editingEntity.value = {
    nodeId: node.id,
    entityId: node.data.entityId,
    entityType: node.data.entityType,
    title: node.data.label || node.data.title || '',
    name: node.data.name || '',
    version: node.data.version || '1.0',
    content: node.data.content || '',
    description: node.data.description || '',
    isNew: node.data.isNew || false
  }
  showEditModal.value = true
  modalError.value = ''
}

const closeEditModal = () => {
  showEditModal.value = false
  editingEntity.value = {}
  modalError.value = ''
}

const handleSaveEntity = async () => {
  console.log('=== handleSaveEntity called ===')
  console.log('editingEntity:', editingEntity.value)

  isSaving.value = true
  modalError.value = ''

  try {
    const entityData: Record<string, any> = {
      title: editingEntity.value.title,
      name: editingEntity.value.name,
      version: editingEntity.value.version,
      content: editingEntity.value.content,
      description: editingEntity.value.description
    }

    console.log('Entity data to save:', entityData)

    let result
    const entityType = editingEntity.value.entityType
    console.log('Entity type:', entityType, 'isNew:', editingEntity.value.isNew)

    if (editingEntity.value.isNew) {
      // Create new entity - inject parent ID from graph edges
      console.log('Creating new entity...')
      const nodeId = editingEntity.value.nodeId
      if (entityType !== 'course') {
        // Find incoming edge to determine parent
        const incomingEdge = edges.value.find(e => e.target === nodeId)
        if (incomingEdge) {
          const sourceNode = nodes.value.find(n => n.id === incomingEdge.source)
          if (sourceNode?.data?.entityId) {
            const parentField = getParentFieldName(entityType)
            if (parentField) {
              entityData[parentField] = sourceNode.data.entityId
            }
          }
        }
        // Also inject courseId from current course as fallback
        if (currentCourse.value?.id && !entityData.courseId && entityType !== 'course') {
          entityData.courseId = currentCourse.value.id
          if (entityType === 'chapter') {
            entityData.courseIDs = currentCourse.value.id
          }
        }
      }

      switch (entityType) {
        case 'course':
          result = await coursesStore.createEntity('/courses', entityData)
          break
        case 'chapter':
          result = await chaptersStore.createEntity('/chapters', entityData)
          break
        case 'section':
          result = await sectionsStore.createEntity('/sections', entityData)
          break
        case 'page':
          result = await pagesStore.createEntity('/pages', entityData)
          break
        default:
          throw new Error(`Unknown entity type: ${entityType}`)
      }
    } else {
      // Update existing entity
      const entityId = editingEntity.value.entityId
      console.log('Updating existing entity with ID:', entityId)
      switch (entityType) {
        case 'course':
          result = await coursesStore.updateEntity('/courses', entityId, entityData)
          break
        case 'chapter':
          result = await chaptersStore.updateEntity('/chapters', entityId, entityData)
          break
        case 'section':
          result = await sectionsStore.updateEntity('/sections', entityId, entityData)
          break
        case 'page':
          result = await pagesStore.updateEntity('/pages', entityId, entityData)
          break
        default:
          throw new Error(`Unknown entity type: ${entityType}`)
      }
    }

    console.log('Save successful, result:', result)

    // Handle newly created course: load it into the editor
    if (editingEntity.value.isNew && entityType === 'course' && result) {
      const newCourseId = result.id || result.data?.id
      if (newCourseId) {
        selectedCourseId.value = newCourseId
        const courseData = await coursesStore.fetchCourseById(newCourseId)
        if (courseData) {
          currentCourse.value = courseData
          convertCourseToNodes(courseData)
          router.replace({ query: { courseId: newCourseId } })
        }
        // Reload courses list
        await coursesStore.loadEntities('/courses?include=chapters.sections.pages')
      }
    } else {
      // Update node in canvas
      const nodeIndex = nodes.value.findIndex(n => n.id === editingEntity.value.nodeId)
      if (nodeIndex !== -1) {
        nodes.value[nodeIndex].data = {
          ...nodes.value[nodeIndex].data,
          label: editingEntity.value.title,
          title: editingEntity.value.title,
          name: editingEntity.value.name,
          version: editingEntity.value.version,
          content: editingEntity.value.content,
          description: editingEntity.value.description,
          isNew: false
        }
      }
    }

    closeEditModal()
  } catch (err: any) {
    console.error('=== Save entity error ===', err)
    console.error('Error details:', {
      message: err.message,
      response: err.response,
      stack: err.stack
    })
    modalError.value = err.response?.data?.error_message ||
                       err.response?.data?.message ||
                       err.message ||
                       t('courseEditor.saveError')
  } finally {
    isSaving.value = false
  }
}

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
    // Delete from backend if not new
    if (entityId && !node.data.isNew) {
      switch (entityType) {
        case 'course':
          await coursesStore.delete(entityId)
          break
        case 'chapter':
          await chaptersStore.delete(entityId)
          break
        case 'section':
          await sectionsStore.delete(entityId)
          break
        case 'page':
          await pagesStore.delete(entityId)
          break
      }
    }

    // Remove from canvas
    nodes.value = nodes.value.filter(n => n.id !== node.id)
    // Remove connected edges
    edges.value = edges.value.filter(e => e.source !== node.id && e.target !== node.id)

    closeDeleteModal()
  } catch (err) {
    console.error('Delete failed:', err)
  }
}

// Entity manipulation handlers
const handleDuplicateEntity = async (entity: any, entityType: string) => {
  // Duplicate entity to another course
  console.log('Duplicate entity:', entity, entityType)
  // TODO: Implement duplication logic
}

const handleMoveEntity = async (entity: any, targetParent: any) => {
  console.log('Move entity:', entity, 'to', targetParent)
  try {
    const entityType = entity.entityType || entity.type
    const parentField = getParentFieldName(entityType)
    if (!parentField || !entity.id || !targetParent.id) return

    const endpoint = entityType === 'chapter' ? '/chapters' :
                     entityType === 'section' ? '/sections' :
                     entityType === 'page' ? '/pages' : null
    if (!endpoint) return

    await axios.patch(`${endpoint}/${entity.id}`, { [parentField]: targetParent.id })

    // Refresh course data and rebuild graph
    if (currentCourse.value?.id) {
      const courseData = await coursesStore.fetchCourseById(currentCourse.value.id)
      if (courseData) {
        currentCourse.value = courseData
        convertCourseToNodes(courseData)
      }
    }
    notification.showSuccess(t('courseEditor.moveSuccess'))
  } catch (err) {
    console.error('Move failed:', err)
    notification.showError(t('courseEditor.moveError'))
  }
}

// Valid parent→child type map for edge connections
const VALID_CONNECTIONS: Record<string, string> = {
  'course': 'chapter',
  'chapter': 'section',
  'section': 'page'
}

const handleEdgeConnect = async (connection: any) => {
  const sourceNode = nodes.value.find(n => n.id === connection.source)
  const targetNode = nodes.value.find(n => n.id === connection.target)
  if (!sourceNode || !targetNode) return

  const sourceType = sourceNode.data.entityType
  const targetType = targetNode.data.entityType

  // Validate type compatibility
  if (VALID_CONNECTIONS[sourceType] !== targetType) {
    // Remove the invalid edge
    edges.value = edges.value.filter(e =>
      !(e.source === connection.source && e.target === connection.target)
    )
    notification.showWarning(t('courseEditor.invalidConnection', { source: sourceType, target: targetType }))
    return
  }

  // If target has a real entityId, PATCH the parent foreign key
  if (targetNode.data.entityId && !targetNode.data.isNew) {
    const parentField = getParentFieldName(targetType)
    if (!parentField || !sourceNode.data.entityId) return

    const endpoint = targetType === 'chapter' ? '/chapters' :
                     targetType === 'section' ? '/sections' :
                     targetType === 'page' ? '/pages' : null
    if (!endpoint) return

    try {
      await axios.patch(`${endpoint}/${targetNode.data.entityId}`, {
        [parentField]: sourceNode.data.entityId
      })
    } catch (err) {
      console.error('Failed to sync edge connection:', err)
      // Remove the edge on failure
      edges.value = edges.value.filter(e =>
        !(e.source === connection.source && e.target === connection.target)
      )
      notification.showError(t('courseEditor.moveError'))
    }
  }
}

// Position persistence helpers
const saveNodePositions = () => {
  if (!selectedCourseId.value) return

  const nodePositions = nodes.value.map(node => ({
    id: node.id,
    entityId: node.data.entityId,
    position: node.position
  }))

  const storageKey = `courseEditor_positions_${selectedCourseId.value}`
  localStorage.setItem(storageKey, JSON.stringify(nodePositions))
  console.log('Auto-saved node positions:', nodePositions.length)
}

const loadNodePositions = () => {
  if (!selectedCourseId.value) return

  const storageKey = `courseEditor_positions_${selectedCourseId.value}`
  const saved = localStorage.getItem(storageKey)

  if (!saved) return

  try {
    const savedPositions = JSON.parse(saved)
    const positionMap = new Map(savedPositions.map((p: any) => [p.id, p.position]))

    // Apply saved positions to nodes - directly mutate to preserve Vue Flow state
    nodes.value.forEach(node => {
      const savedPosition = positionMap.get(node.id)
      if (savedPosition) {
        node.position = savedPosition
      }
    })

    console.log('Loaded node positions:', savedPositions.length)
  } catch (err) {
    console.error('Failed to load node positions:', err)
  }
}

// Save/Reset handlers
const handleSave = async () => {
  // Save all node positions
  saveNodePositions()
  alert('Node positions saved!')
}

const handleReset = () => {
  // Reset to default auto-layout
  if (currentCourse.value) {
    // Clear saved positions from localStorage
    if (selectedCourseId.value) {
      const storageKey = `courseEditor_positions_${selectedCourseId.value}`
      localStorage.removeItem(storageKey)
      console.log('Cleared saved positions')
    }

    // Regenerate layout
    convertCourseToNodes(currentCourse.value)
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

  // Calculate new width (resize from left edge, so we subtract)
  const deltaX = resizeStartX.value - event.clientX
  const newWidth = resizeStartWidth.value + deltaX

  // Constrain to min/max
  if (newWidth >= 200 && newWidth <= 600) {
    treePanelWidth.value = newWidth
  }
}

const stopResize = () => {
  if (isResizing.value) {
    isResizing.value = false
    // Save to localStorage
    localStorage.setItem('courseEditor_treePanelWidth', treePanelWidth.value.toString())
  }
}

// Select node and all its descendants
const handleSelectTree = (nodeData: any) => {
  console.log('Select tree for node:', nodeData)

  // Find the parent node
  const parentNode = nodes.value.find(n => n.data.entityId === nodeData.entityId)
  if (!parentNode) return

  // Collect all node IDs to select (parent + all descendants)
  const nodeIdsToSelect: string[] = []

  const collectDescendants = (nodeId: string, entityType: string) => {
    nodeIdsToSelect.push(nodeId)

    // Find the node to get its children
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return

    // Determine child entity key based on type
    let childrenKey: string | null = null
    if (entityType === 'course') childrenKey = 'chapters'
    else if (entityType === 'chapter') childrenKey = 'sections'
    else if (entityType === 'section') childrenKey = 'pages'

    if (!childrenKey || !node.data[childrenKey]) return

    // Get child type
    const childType = getChildType(entityType)
    if (!childType) return

    // Recursively collect all descendants
    const children = node.data[childrenKey]
    children.forEach((child: any, idx: number) => {
      let childNodeId = `${childType}-${child.id}`

      // Handle pages that might not have IDs (same logic as in convertCourseToNodes)
      if (childType === 'page' && !child.id) {
        childNodeId = `page-temp-${nodeId}-${idx}`
      }

      collectDescendants(childNodeId, childType)
    })
  }

  const getChildType = (parentType: string): string | null => {
    const typeMap: Record<string, string> = {
      'course': 'chapter',
      'chapter': 'section',
      'section': 'page'
    }
    return typeMap[parentType] || null
  }

  // Collect all descendants starting from parent
  collectDescendants(parentNode.id, parentNode.data.entityType)

  // Update selected state - directly mutate to preserve positions
  nodes.value.forEach(node => {
    if (nodeIdsToSelect.includes(node.id)) {
      node.selected = true
    }
  })

  // Force reactivity update
  nodes.value = [...nodes.value]

  console.log('Selected nodes:', nodeIdsToSelect)
}
</script>

<style scoped>
.course-editor {
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

.course-selector {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.course-select {
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

.course-select:hover {
  border-color: var(--color-primary);
}

.course-select:focus {
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

.cascade-warning {
  color: var(--color-warning-text);
  background: var(--color-warning-bg);
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}
</style>
