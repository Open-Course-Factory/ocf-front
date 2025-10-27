<template>
  <div class="course-tree-panel">
    <div class="panel-header">
      <h3>{{ t('courseTree.title') }}</h3>
      <button @click="refreshCourses" class="btn-refresh" :disabled="isLoading">
        <span class="refresh-icon">🔄</span>
      </button>
    </div>

    <div class="panel-content">
      <div v-if="isLoading" class="loading-state">
        <span class="loading-spinner">⏳</span>
        <p>{{ t('courseTree.loading') }}</p>
      </div>

      <div v-else-if="courses.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>{{ t('courseTree.noCourses') }}</p>
      </div>

      <div v-else class="tree-container">
        <div
          v-for="course in courses"
          :key="course.id"
          class="tree-item course-item"
        >
          <CourseTreeNode
            :entity="course"
            entity-type="course"
            :level="0"
            @entity-drag-start="handleEntityDragStart"
            @duplicate="handleDuplicate"
            @move="handleMove"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCoursesStore } from '../../stores/courses'
import { useTranslations } from '../../composables/useTranslations'
import CourseTreeNode from './CourseTreeNode.vue'
import type { Course } from '../../types/entities'

const { t } = useTranslations({
  en: {
    courseTree: {
      title: 'Course Tree',
      loading: 'Loading courses...',
      noCourses: 'No courses available',
      refresh: 'Refresh courses'
    }
  },
  fr: {
    courseTree: {
      title: 'Arbre de Cours',
      loading: 'Chargement des cours...',
      noCourses: 'Aucun cours disponible',
      refresh: 'Actualiser les cours'
    }
  }
})

interface Props {
  courses?: Course[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'entity-drag-start', entity: any, entityType: string): void
  (e: 'duplicate-entity', entity: any, entityType: string): void
  (e: 'move-entity', entity: any, targetParent: any, entityType: string): void
}>()

const coursesStore = useCoursesStore()
const isLoading = ref(false)

const courses = computed(() => {
  return props.courses || coursesStore.entities
})

onMounted(async () => {
  if (!props.courses && coursesStore.entities.length === 0) {
    await refreshCourses()
  }
})

const refreshCourses = async () => {
  isLoading.value = true
  try {
    await coursesStore.loadEntities('/courses?include=chapters.sections.pages')
  } finally {
    isLoading.value = false
  }
}

const handleEntityDragStart = (entity: any, entityType: string) => {
  emit('entity-drag-start', entity, entityType)
}

const handleDuplicate = (entity: any, entityType: string) => {
  emit('duplicate-entity', entity, entityType)
}

const handleMove = (entity: any, targetParent?: any, entityType?: string) => {
  emit('move-entity', entity, targetParent, entityType || 'unknown')
}
</script>

<style scoped>
.course-tree-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-surface);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.btn-refresh {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 1.25rem;
  display: inline-block;
}

.btn-refresh:not(:disabled):hover .refresh-icon {
  animation: spin 0.6s linear;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.loading-spinner,
.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.loading-state p,
.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

.tree-container {
  padding: 0.5rem 0;
}

.tree-item {
  border-bottom: 1px solid var(--color-border);
}

.tree-item:last-child {
  border-bottom: none;
}
</style>
