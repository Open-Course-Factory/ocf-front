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
    <!-- Opened from a scenario rather than a class: the class is what is chosen. -->
    <div v-if="groups" class="form-group">
      <label for="assign-class">{{ t('groupScenarios.selectClass') }}</label>
      <select id="assign-class" v-model="selectedGroupId" class="form-control" data-testid="assign-class-select">
        <option value="" disabled>{{ t('groupScenarios.selectClass') }}</option>
        <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
      </select>
    </div>
    <div v-else class="form-group">
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
        <optgroup v-if="publicScenarios.length > 0" :label="t('groupScenarios.publicScenarios')">
          <option v-for="s in publicScenarios" :key="s.id" :value="s.id">
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
  // When set, the scenario is already chosen (the first of `scenarios`) and
  // the modal asks for one of these classes instead.
  groups?: Array<{ id: string; name: string }>
}>()

const emit = defineEmits<{
  close: []
  assign: [payload: { scenarioId: string; startDate: string; deadline: string; groupId?: string }]
}>()

const { t } = useTranslations({
  en: {
    groupScenarios: {
      assignScenario: 'Assign Scenario',
      selectScenario: 'Select a Scenario',
      selectClass: 'Select a class',
      searchScenarios: 'Search scenarios...',
      orgLibrary: 'Organization Library',
      groupScenarios: 'Group Scenarios',
      publicScenarios: 'Public scenarios',
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
      selectClass: 'Sélectionner une classe',
      searchScenarios: 'Rechercher des scénarios...',
      orgLibrary: 'Bibliothèque de l\'organisation',
      groupScenarios: 'Scénarios du groupe',
      publicScenarios: 'Scénarios publics',
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
const selectedGroupId = ref('')
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
// `source` is assigned once per scenario by GET /groups/{id}/scenarios (org > group > public),
// so the three sections are disjoint without any de-duplication here.
const publicScenarios = computed(() => filtered.value.filter(s => s.source === 'public'))

function onConfirm() {
  emit('assign', {
    scenarioId: selectedScenarioId.value,
    startDate: startDate.value,
    deadline: deadline.value,
    groupId: props.groups ? selectedGroupId.value : undefined
  })
}

// Reset the form each time the modal opens.
watch(() => props.visible, (visible) => {
  if (visible) {
    selectedScenarioId.value = props.groups ? props.scenarios[0]?.id || '' : ''
    selectedGroupId.value = ''
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
