<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Copies a scenario into an organization or a class the user manages:
 *   - org   → POST /organizations/:id/scenarios/:scenarioId/duplicate
 *   - class → POST /groups/:id/scenarios/:scenarioId/duplicate
 * Both answer with the copy, which the editor opens: a scenario someone may
 * only read becomes one they can edit.
 */
-->

<template>
  <BaseModal
    :visible="visible"
    :title="t('scenarioEditor.duplicateTitle')"
    size="small"
    :show-default-footer="true"
    :confirm-text="isCopying ? t('scenarioEditor.copying') : t('scenarioEditor.duplicateAction')"
    :cancel-text="t('scenarioEditor.cancel')"
    :is-loading="isCopying"
    :confirm-disabled="!target"
    @close="emit('close')"
    @confirm="duplicate"
  >
    <ScenarioScopeSelect
      id="duplicate-target"
      v-model="targetKey"
      :label="t('scenarioEditor.selectTargetOrg')"
      :empty-hint="t('scenarioEditor.duplicateNowhere')"
      :allow-platform="false"
      :exclude-org-id="scenario?.organization_id || null"
    />
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import axios from 'axios'
import BaseModal from '../Modals/BaseModal.vue'
import ScenarioScopeSelect from './ScenarioScopeSelect.vue'
import { useScenarioEditorI18n } from '../../composables/useScenarioEditorI18n'
import { useScenarioCreateScopes } from '../../composables/useScenarioCreateScopes'
import { useNotification } from '../../composables/useNotification'

const props = defineProps<{
  visible: boolean
  scenario: { id: string; organization_id?: string | null } | null
}>()

const emit = defineEmits<{
  close: []
  duplicated: [copy: { id: string }]
}>()

const { t } = useScenarioEditorI18n()
const { parseScopeKey } = useScenarioCreateScopes()
const notification = useNotification()

const targetKey = ref('')
const isCopying = ref(false)

const target = computed(() => {
  const scope = parseScopeKey(targetKey.value)
  return scope && scope.kind !== 'platform' ? scope : null
})

watch(() => props.visible, visible => { if (visible) targetKey.value = '' })

async function duplicate() {
  if (!target.value || !props.scenario) return
  isCopying.value = true
  try {
    const base = target.value.kind === 'org' ? `/organizations/${target.value.id}` : `/groups/${target.value.id}`
    const response = await axios.post(`${base}/scenarios/${props.scenario.id}/duplicate`)
    notification.showSuccess(t('scenarioEditor.copySuccess'))
    emit('duplicated', response.data?.data || response.data)
  } catch (err: any) {
    notification.showError(
      err.response?.data?.error_message || err.response?.data?.message || t('scenarioEditor.copyError')
    )
  } finally {
    isCopying.value = false
  }
}
</script>
