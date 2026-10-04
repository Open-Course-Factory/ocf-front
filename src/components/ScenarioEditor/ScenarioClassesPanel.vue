<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Where a scenario is assigned, among the classes the user manages, and the way
 * to assign it to one more. Reads the teacher-groups cache (GET /teacher/groups)
 * the class console uses, so the two never disagree about an assignment.
 */
-->

<template>
  <section v-if="teacherGroups.groups.length" class="ocf-rail-section" data-testid="rail-classes">
    <h3 class="ocf-rail-heading"><i class="fas fa-users" aria-hidden="true"></i> {{ t('scenarioEditor.railClasses') }}</h3>
    <ul v-if="assignedClasses.length" class="ocf-rail-classes">
      <li v-for="group in assignedClasses" :key="group.group_id">
        <span class="ocf-rail-class-name">{{ group.display_name || group.name }}</span>
        <span class="ocf-rail-class-meta">
          {{ t('scenarioEditor.classLearners', { count: String(classLearnerCount(group)) }) }}
          · {{ t('scenarioEditor.classStarted', { count: String(startedCount(group)) }) }}
        </span>
      </li>
    </ul>
    <p v-else class="ocf-rail-empty">{{ t('scenarioEditor.notAssigned') }}</p>
    <button
      v-if="assignableClasses.length"
      type="button"
      class="ocf-rail-btn"
      data-testid="rail-assign"
      @click="showAssign = true"
    >
      <i class="fas fa-user-plus" aria-hidden="true"></i> {{ t('scenarioEditor.assignToClass') }}
    </button>

    <AssignScenarioModal
      :visible="showAssign"
      :scenarios="[{ id: scenario.id, name: scenario.name, title: scenario.title, difficulty: scenario.difficulty, source: 'org' } as any]"
      :groups="assignableClasses"
      @close="showAssign = false"
      @assign="assign"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AssignScenarioModal from '../Groups/modals/AssignScenarioModal.vue'
import { useTeacherGroupsStore } from '../../stores/teacherGroups'
import { classLearnerCount, isInactiveClass, teacherService, type TeacherGroupSummary } from '../../services/domain/scenario/teacherService'
import { useScenarioEditorI18n } from '../../composables/useScenarioEditorI18n'
import { useNotification } from '../../composables/useNotification'

const props = defineProps<{
  scenario: any
}>()

const { t } = useScenarioEditorI18n()
const notification = useNotification()
const teacherGroups = useTeacherGroupsStore()

onMounted(() => teacherGroups.ensureLoaded())

const assignmentOf = (group: TeacherGroupSummary) =>
  group.assignments.find(a => a.scenario_id === props.scenario.id)

const assignedClasses = computed(() => teacherGroups.groups.filter(group => assignmentOf(group)))

const startedCount = (group: TeacherGroupSummary) => assignmentOf(group)?.started_count ?? 0

const assignableClasses = computed(() =>
  teacherGroups.groups
    .filter(group => !isInactiveClass(group) && !assignmentOf(group))
    .map(group => ({ id: group.group_id, name: group.display_name || group.name }))
)

const showAssign = ref(false)

async function assign(payload: { scenarioId: string; startDate: string; deadline: string; groupId?: string }) {
  if (!payload.groupId) return
  try {
    await teacherService.assignScenarioToGroup(payload.groupId, payload.scenarioId, {
      start_date: payload.startDate || undefined,
      deadline: payload.deadline || undefined
    })
    showAssign.value = false
    notification.showSuccess(t('scenarioEditor.assignSuccess'))
    teacherGroups.markStale()
    await teacherGroups.ensureLoaded()
  } catch (err: any) {
    notification.showError(err.response?.data?.error_message || t('scenarioEditor.assignError'))
  }
}
</script>
