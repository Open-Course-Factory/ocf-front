<template>
  <div class="validation-results">
    <div class="results-header">
      <div class="status-icon" :class="hasErrors ? 'error' : 'success'">
        {{ hasErrors ? '❌' : '✓' }}
      </div>
      <h3>
        {{ hasErrors ? t('validation.validationFailed') : t('validation.validationComplete') }}
      </h3>
    </div>

    <div class="results-summary">
      <h4>{{ t('validation.summary') }}</h4>
      <ul class="summary-list">
        <li v-if="results.summary.users_created > 0">
          {{ t('validation.usersWillBeCreated', { count: results.summary.users_created }) }}
        </li>
        <li v-if="results.summary.users_updated > 0">
          {{ t('validation.usersWillBeUpdated', { count: results.summary.users_updated }) }}
        </li>
        <li v-if="results.summary.users_skipped > 0">
          {{ t('validation.usersWillBeSkipped', { count: results.summary.users_skipped }) }}
        </li>
        <li v-if="results.summary.groups_created > 0">
          {{ t('validation.groupsWillBeCreated', { count: results.summary.groups_created }) }}
        </li>
        <li v-if="results.summary.memberships_created > 0">
          {{ t('validation.membershipsWillBeCreated', { count: results.summary.memberships_created }) }}
        </li>
      </ul>
    </div>

    <div v-if="results.warnings.length > 0" class="warnings-section">
      <div class="section-header warning">
        <span class="icon">⚠️</span>
        <h4>{{ t('validation.warnings', { count: results.warnings.length }) }}</h4>
      </div>
      <ul class="issue-list">
        <li v-for="(warning, index) in results.warnings" :key="index" class="issue-item warning">
          <div class="issue-header">
            <span class="issue-location">
              {{ t('validation.row') }} {{ warning.row }} ({{ warning.file }})
            </span>
          </div>
          <div class="issue-message">{{ warning.message }}</div>
        </li>
      </ul>
    </div>

    <div v-if="results.errors.length > 0" class="errors-section">
      <div class="section-header error">
        <span class="icon">❌</span>
        <h4>{{ t('validation.errors', { count: results.errors.length }) }}</h4>
      </div>
      <ul class="issue-list">
        <li v-for="(error, index) in results.errors" :key="index" class="issue-item error">
          <div class="issue-header">
            <span class="issue-location">
              {{ t('validation.row') }} {{ error.row }} ({{ error.file }})
            </span>
            <span v-if="error.field" class="issue-field">
              {{ t('validation.field') }}: {{ error.field }}
            </span>
          </div>
          <div class="issue-message">{{ error.message }}</div>
          <div v-if="error.code" class="issue-code">{{ error.code }}</div>
        </li>
      </ul>
    </div>

    <div class="results-actions">
      <button class="btn btn-secondary" @click="$emit('back')">
        {{ t('validation.back') }}
      </button>
      <button
        v-if="!hasErrors"
        class="btn btn-primary"
        @click="$emit('proceed')"
      >
        {{ t('validation.proceedWithImport') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ImportResponse } from '../../services/domain/bulkImport'
import { useTranslations } from '../../composables/useTranslations'

const translations = {
  en: {
    validation: {
      validationComplete: 'Validation Complete',
      validationFailed: 'Validation Failed',
      summary: 'Summary:',
      usersWillBeCreated: '{count} users will be created',
      usersWillBeUpdated: '{count} users will be updated',
      usersWillBeSkipped: '{count} users will be skipped',
      groupsWillBeCreated: '{count} groups will be created',
      membershipsWillBeCreated: '{count} memberships will be created',
      warnings: 'Warnings: {count}',
      errors: 'Errors: {count}',
      row: 'Row',
      field: 'Field',
      back: 'Back',
      proceedWithImport: 'Proceed with Import'
    }
  },
  fr: {
    validation: {
      validationComplete: 'Validation terminée',
      validationFailed: 'Échec de la validation',
      summary: 'Résumé :',
      usersWillBeCreated: '{count} utilisateurs seront créés',
      usersWillBeUpdated: '{count} utilisateurs seront mis à jour',
      usersWillBeSkipped: '{count} utilisateurs seront ignorés',
      groupsWillBeCreated: '{count} groupes seront créés',
      membershipsWillBeCreated: '{count} adhésions seront créées',
      warnings: 'Avertissements : {count}',
      errors: 'Erreurs : {count}',
      row: 'Ligne',
      field: 'Champ',
      back: 'Retour',
      proceedWithImport: 'Procéder à l\'importation'
    }
  }
}

const { t } = useTranslations(translations)

interface Props {
  results: ImportResponse
}

const props = defineProps<Props>()

defineEmits<{
  'back': []
  'proceed': []
}>()

const hasErrors = computed(() => props.results.errors.length > 0)
</script>

<style scoped>
.validation-results {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.results-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.status-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.status-icon.success {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.status-icon.error {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.results-header h3 {
  margin: 0;
  color: var(--color-text-primary);
}

.results-summary {
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.results-summary h4 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-text-primary);
}

.summary-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.summary-list li {
  padding-left: var(--spacing-md);
  position: relative;
  color: var(--color-text-secondary);
}

.summary-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-primary);
}

.warnings-section,
.errors-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
}

.section-header.warning {
  background: var(--color-warning-bg);
}

.section-header.error {
  background: var(--color-danger-bg);
}

.section-header h4 {
  margin: 0;
  color: var(--color-text-primary);
}

.section-header .icon {
  font-size: 1.25rem;
}

.issue-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.issue-item {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border-left: 4px solid;
}

.issue-item.warning {
  background: var(--color-warning-bg);
  border-color: var(--color-warning);
}

.issue-item.error {
  background: var(--color-danger-bg);
  border-color: var(--color-danger);
}

.issue-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
}

.issue-location {
  font-weight: 600;
  color: var(--color-text-primary);
}

.issue-field {
  color: var(--color-text-secondary);
}

.issue-message {
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.issue-code {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-family: monospace;
}

.results-actions {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border-medium);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: 500;
  transition: opacity 0.2s ease;
}

.btn:hover {
  opacity: 0.8;
}

.btn-secondary {
  background: var(--color-secondary);
  color: var(--color-white);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
}
</style>
