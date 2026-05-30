<template>
  <BaseModal
    :visible="visible"
    :title="t('groupScenarios.resetConfirmTitle')"
    size="small"
    :show-default-footer="true"
    :confirm-text="t('groupScenarios.resetSessions')"
    :cancel-text="t('groupScenarios.cancel')"
    @confirm="$emit('confirm')"
    @close="$emit('close')"
  >
    <p>{{ t('groupScenarios.resetConfirm') }}</p>
  </BaseModal>
</template>

<script setup lang="ts">
import { useTranslations } from '../../../composables/useTranslations'
import BaseModal from '../../Modals/BaseModal.vue'
import type { ScenarioAssignment } from '../../../types/groupScenarios'

defineProps<{
  visible: boolean
  assignment: ScenarioAssignment | null
}>()

defineEmits<{
  close: []
  confirm: []
}>()

const { t } = useTranslations({
  en: {
    groupScenarios: {
      resetConfirmTitle: 'Reset Scenario Sessions',
      resetConfirm: 'This will abandon all active sessions for this scenario. Learners will need to restart. Continue?',
      resetSessions: 'Reset Sessions',
      cancel: 'Cancel'
    }
  },
  fr: {
    groupScenarios: {
      resetConfirmTitle: 'Réinitialiser les sessions',
      resetConfirm: 'Ceci va abandonner toutes les sessions actives pour ce scénario. Les apprenants devront recommencer. Continuer ?',
      resetSessions: 'Réinitialiser',
      cancel: 'Annuler'
    }
  }
})
</script>
