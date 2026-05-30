<template>
  <BaseModal
    :visible="visible"
    :title="t('groupScenarios.assignScenario')"
    size="medium"
    :show-default-footer="true"
    :confirm-text="t('groupScenarios.confirm')"
    :cancel-text="t('groupScenarios.cancel')"
    @confirm="onConfirm"
    @close="$emit('close')"
  >
    <div class="form-group">
      <label>{{ t('groupScenarios.selectScenario') }}</label>
      <input
        v-model="search"
        type="text"
        class="form-control"
        :placeholder="t('groupScenarios.searchScenarios')"
      />
      <select v-model="selectedScenarioId" class="form-control select-scenario">
        <option value="" disabled>{{ t('groupScenarios.selectScenario') }}</option>
        <optgroup v-if="orgScenarios.length > 0" :label="t('groupScenarios.orgLibrary')">
          <option v-for="s in orgScenarios" :key="s.id" :value="s.id">
            {{ s.title }} ({{ translateDifficulty(s.difficulty) }})
          </option>
        </optgroup>
        <optgroup v-if="groupOnlyScenarios.length > 0" :label="t('groupScenarios.groupScenarios')">
          <option v-for="s in groupOnlyScenarios" :key="s.id" :value="s.id">
            {{ s.title }} ({{ translateDifficulty(s.difficulty) }})
          </option>
        </optgroup>
      </select>
    </div>
    <div class="form-group">
      <label>{{ t('groupScenarios.startDate') }}</label>
      <input
        v-model="startDate"
        type="date"
        class="form-control"
      />
    </div>
    <div class="form-group">
      <label>{{ t('groupScenarios.deadline') }}</label>
      <input
        v-model="deadline"
        type="date"
        class="form-control"
      />
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTranslations } from '../../../composables/useTranslations'
import BaseModal from '../../Modals/BaseModal.vue'
import type { Scenario } from '../../../types/groupScenarios'

const props = defineProps<{
  visible: boolean
  scenarios: Scenario[]
}>()

const emit = defineEmits<{
  close: []
  assign: [payload: { scenarioId: string; startDate: string; deadline: string }]
}>()

const { t } = useTranslations({
  en: {
    groupScenarios: {
      assignScenario: 'Assign Scenario',
      selectScenario: 'Select a Scenario',
      searchScenarios: 'Search scenarios...',
      orgLibrary: 'Organization Library',
      groupScenarios: 'Group Scenarios',
      startDate: 'Start Date',
      deadline: 'Deadline',
      confirm: 'Assign',
      cancel: 'Cancel',
      difficultyBeginner: 'Beginner',
      difficultyIntermediate: 'Intermediate',
      difficultyAdvanced: 'Advanced'
    }
  },
  fr: {
    groupScenarios: {
      assignScenario: 'Assigner un scénario',
      selectScenario: 'Sélectionner un scénario',
      searchScenarios: 'Rechercher des scénarios...',
      orgLibrary: 'Bibliothèque de l\'organisation',
      groupScenarios: 'Scénarios du groupe',
      startDate: 'Date de début',
      deadline: 'Date limite',
      confirm: 'Assigner',
      cancel: 'Annuler',
      difficultyBeginner: 'Débutant',
      difficultyIntermediate: 'Intermédiaire',
      difficultyAdvanced: 'Avancé'
    }
  }
})

const selectedScenarioId = ref('')
const startDate = ref('')
const deadline = ref('')
const search = ref('')

function translateDifficulty(difficulty: string): string {
  const difficultyMap: Record<string, string> = {
    beginner: t('groupScenarios.difficultyBeginner'),
    intermediate: t('groupScenarios.difficultyIntermediate'),
    advanced: t('groupScenarios.difficultyAdvanced')
  }
  return difficultyMap[difficulty] || difficulty
}

const filtered = computed(() => {
  if (!search.value.trim()) return props.scenarios
  const q = search.value.toLowerCase()
  return props.scenarios.filter(
    s => s.title.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  )
})

const orgScenarios = computed(() => filtered.value.filter(s => s.source === 'org'))
const groupOnlyScenarios = computed(() => filtered.value.filter(s => s.source === 'group'))

function onConfirm() {
  emit('assign', {
    scenarioId: selectedScenarioId.value,
    startDate: startDate.value,
    deadline: deadline.value
  })
}

// Reset the form each time the modal opens.
watch(() => props.visible, (visible) => {
  if (visible) {
    selectedScenarioId.value = ''
    startDate.value = ''
    deadline.value = ''
    search.value = ''
  }
})
</script>

<style scoped>
.select-scenario {
  margin-top: var(--spacing-sm);
}
</style>
