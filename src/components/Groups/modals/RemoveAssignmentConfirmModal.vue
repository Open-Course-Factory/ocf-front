<template>
  <BaseModal
    :visible="visible"
    :title="t('groupScenarios.confirmRemoveTitle')"
    size="small"
    :show-default-footer="true"
    :confirm-text="t('groupScenarios.remove')"
    :cancel-text="t('groupScenarios.cancel')"
    @confirm="$emit('confirm')"
    @close="$emit('close')"
  >
    <p>{{ t('groupScenarios.confirmRemove') }}</p>
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
      confirmRemoveTitle: 'Remove Assignment',
      confirmRemove: 'Are you sure you want to remove this scenario assignment?',
      remove: 'Remove',
      cancel: 'Cancel'
    }
  },
  fr: {
    groupScenarios: {
      confirmRemoveTitle: 'Supprimer l\'assignation',
      confirmRemove: 'Êtes-vous sûr de vouloir supprimer cette assignation de scénario ?',
      remove: 'Supprimer',
      cancel: 'Annuler'
    }
  }
})
</script>
