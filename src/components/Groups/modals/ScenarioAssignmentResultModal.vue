<template>
  <BaseModal
    :visible="visible"
    :title="t('groupScenarios.bulkStartTitle')"
    size="medium"
    :show-default-footer="true"
    :confirm-text="t('groupScenarios.close')"
    @confirm="$emit('close')"
    @close="$emit('close')"
  >
    <p class="result-message">
      <i class="fas fa-check-circle result-icon"></i>
      {{ message }}
    </p>
    <div v-if="noKeyUsers.length > 0" class="no-key-warning">
      <p class="no-key-title">
        <i class="fas fa-exclamation-triangle"></i>
        {{ t('groupScenarios.noKeyWarning') }}
      </p>
      <ul class="no-key-list">
        <li v-for="(user, idx) in noKeyUsers" :key="idx">
          {{ user.user_name || user.user_email || user.user_id }}
          <span v-if="user.user_email && user.user_name" class="no-key-email">
            ({{ user.user_email }})
          </span>
        </li>
      </ul>
    </div>
    <div v-if="errors.length > 0" class="no-key-warning">
      <p class="no-key-title">
        <i class="fas fa-exclamation-triangle"></i>
        {{ t('groupScenarios.terminalErrors') }}
      </p>
      <ul class="no-key-list">
        <li v-for="(err, idx) in errors" :key="idx">
          {{ err.user_id }}: {{ err.error }}
        </li>
      </ul>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { useTranslations } from '../../../composables/useTranslations'
import BaseModal from '../../Modals/BaseModal.vue'
import type { NoKeyUser, AssignmentResultError } from '../../../types/groupScenarios'

withDefaults(defineProps<{
  visible: boolean
  message: string
  noKeyUsers?: NoKeyUser[]
  errors?: AssignmentResultError[]
}>(), {
  noKeyUsers: () => [],
  errors: () => []
})

defineEmits<{
  close: []
}>()

const { t } = useTranslations({
  en: {
    groupScenarios: {
      bulkStartTitle: 'Sessions Started',
      close: 'Close',
      noKeyWarning: 'The following learners couldn\'t get a terminal key provisioned:',
      terminalErrors: 'Some terminals could not be created:'
    }
  },
  fr: {
    groupScenarios: {
      bulkStartTitle: 'Sessions démarrées',
      close: 'Fermer',
      noKeyWarning: 'Les apprenants suivants n\'ont pas pu recevoir de clé terminal :',
      terminalErrors: 'Certains terminaux n\'ont pas pu être créés :'
    }
  }
})
</script>

<style scoped>
.result-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-primary);
  margin: 0;
}

.result-icon {
  color: var(--color-success);
  font-size: var(--font-size-lg);
}

.no-key-warning {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  border-radius: var(--border-radius-md);
}

.no-key-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-warning-text);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  margin: 0 0 var(--spacing-xs) 0;
}

.no-key-list {
  margin: 0;
  padding-left: var(--spacing-lg);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.no-key-list li {
  margin-bottom: 2px;
}

.no-key-email {
  color: var(--color-text-muted);
}
</style>
