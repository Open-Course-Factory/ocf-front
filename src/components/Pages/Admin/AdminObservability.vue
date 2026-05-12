<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
-->

<template>
  <div class="admin-observability">
    <header class="page-header">
      <div class="header-text">
        <h1>
          <i class="fas fa-heart-pulse"></i>
          {{ t('adminObservability.title') }}
        </h1>
        <p class="page-subtitle">{{ t('adminObservability.subtitle') }}</p>
      </div>
      <button
        type="button"
        class="refresh-btn"
        data-testid="refresh-button"
        :disabled="loading"
        @click="refresh"
      >
        <i class="fas" :class="loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'"></i>
        {{ t('adminObservability.refresh') }}
      </button>
    </header>

    <p v-if="loading && !metrics" class="status-message">
      {{ t('adminObservability.loading') }}
    </p>

    <p v-else-if="error" class="status-message error-message">
      <i class="fas fa-exclamation-triangle"></i>
      {{ error }}
    </p>

    <section v-if="metrics" class="metrics-sections">
      <!-- Stripe sync -->
      <article class="metrics-card">
        <header class="card-header">
          <h2>
            <i class="fab fa-stripe-s"></i>
            {{ t('adminObservability.stripe.title') }}
          </h2>
        </header>
        <div class="counter-grid">
          <div
            v-for="op in stripeOperations"
            :key="op.key"
            class="counter-cell"
            :class="{ 'failure-nonzero': op.failure > 0 }"
          >
            <span class="counter-label">{{ op.label }}</span>
            <div class="counter-pair">
              <span class="counter-value success">
                <i class="fas fa-check"></i>
                {{ op.success }}
                <small>{{ t('adminObservability.stripe.success') }}</small>
              </span>
              <span class="counter-value" :class="{ failure: op.failure > 0 }">
                <i class="fas fa-times"></i>
                {{ op.failure }}
                <small>{{ t('adminObservability.stripe.failure') }}</small>
              </span>
            </div>
          </div>
          <div
            class="counter-cell"
            :class="{ 'failure-nonzero': metrics.stripe.panics > 0 }"
          >
            <span class="counter-label">{{ t('adminObservability.stripe.panics') }}</span>
            <span class="counter-value-large">{{ metrics.stripe.panics }}</span>
          </div>
        </div>
      </article>

      <!-- Scenarios -->
      <article class="metrics-card">
        <header class="card-header">
          <h2>
            <i class="fas fa-flask"></i>
            {{ t('adminObservability.scenarios.title') }}
          </h2>
        </header>
        <div class="counter-grid">
          <div
            class="counter-cell"
            :class="{ 'failure-nonzero': metrics.scenarios.setup_panics > 0 }"
          >
            <span class="counter-label">{{ t('adminObservability.scenarios.setupPanics') }}</span>
            <span class="counter-value-large">{{ metrics.scenarios.setup_panics }}</span>
          </div>
          <div
            class="counter-cell"
            :class="{ 'failure-nonzero': metrics.scenarios.setup_failed_transitions > 0 }"
          >
            <span class="counter-label">{{ t('adminObservability.scenarios.setupFailedTransitions') }}</span>
            <span class="counter-value-large">{{ metrics.scenarios.setup_failed_transitions }}</span>
          </div>
          <div
            class="counter-cell"
            :class="{ 'failure-nonzero': metrics.scenarios.terminal_stop_failures > 0 }"
          >
            <span class="counter-label">{{ t('adminObservability.scenarios.terminalStopFailures') }}</span>
            <span class="counter-value-large">{{ metrics.scenarios.terminal_stop_failures }}</span>
          </div>
        </div>
      </article>

      <!-- Recent hook errors -->
      <article class="metrics-card">
        <header class="card-header">
          <h2>
            <i class="fas fa-bug"></i>
            {{ t('adminObservability.hooks.title') }}
          </h2>
        </header>
        <p
          v-if="metrics.hooks.recent_errors.length === 0"
          class="empty-state"
        >
          <i class="fas fa-check-circle"></i>
          {{ t('adminObservability.hooks.noRecentErrors') }}
        </p>
        <div v-else class="table-wrapper">
          <table class="hooks-table">
            <thead>
              <tr>
                <th>{{ t('adminObservability.hooks.col.timestamp') }}</th>
                <th>{{ t('adminObservability.hooks.col.hookName') }}</th>
                <th>{{ t('adminObservability.hooks.col.entity') }}</th>
                <th>{{ t('adminObservability.hooks.col.hookType') }}</th>
                <th>{{ t('adminObservability.hooks.col.error') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(err, i) in metrics.hooks.recent_errors"
                :key="`${err.timestamp}-${i}`"
              >
                <td class="timestamp-cell">{{ err.timestamp }}</td>
                <td class="hook-name-cell">{{ err.hook_name }}</td>
                <td>{{ err.entity_name }}</td>
                <td>
                  <span class="hook-type-badge">{{ err.hook_type }}</span>
                </td>
                <td class="error-cell">{{ err.error }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTranslations } from '../../../composables/useTranslations'
import {
  observabilityService,
  type ObservabilityMetrics
} from '../../../services/domain/admin/observabilityService'

const { t } = useTranslations({
  en: {
    adminObservability: {
      title: 'Observability',
      subtitle: 'Platform health metrics — Stripe sync, scenario sessions, and recent hook errors.',
      refresh: 'Refresh',
      loading: 'Loading metrics...',
      fetchError: 'Failed to load observability metrics',
      stripe: {
        title: 'Stripe sync',
        create: 'Create',
        update: 'Update',
        archive: 'Archive',
        success: 'Success',
        failure: 'Failure',
        panics: 'Panics'
      },
      scenarios: {
        title: 'Scenario sessions',
        setupPanics: 'Setup panics',
        setupFailedTransitions: 'Setup failed transitions',
        terminalStopFailures: 'Terminal stop failures'
      },
      hooks: {
        title: 'Recent hook errors',
        noRecentErrors: 'No recent hook errors',
        col: {
          timestamp: 'Timestamp',
          hookName: 'Hook',
          entity: 'Entity',
          hookType: 'Type',
          error: 'Error'
        }
      }
    }
  },
  fr: {
    adminObservability: {
      title: 'Observabilité',
      subtitle: 'Métriques de santé de la plateforme — synchronisation Stripe, sessions de scénarios et erreurs de hooks récentes.',
      refresh: 'Actualiser',
      loading: 'Chargement des métriques...',
      fetchError: 'Échec du chargement des métriques d\'observabilité',
      stripe: {
        title: 'Synchronisation Stripe',
        create: 'Création',
        update: 'Mise à jour',
        archive: 'Archivage',
        success: 'Succès',
        failure: 'Échec',
        panics: 'Paniques'
      },
      scenarios: {
        title: 'Sessions de scénarios',
        setupPanics: 'Paniques setup',
        setupFailedTransitions: 'Échecs setup',
        terminalStopFailures: 'Échecs arrêt terminal'
      },
      hooks: {
        title: 'Erreurs de hooks récentes',
        noRecentErrors: 'Aucune erreur de hook récente',
        col: {
          timestamp: 'Horodatage',
          hookName: 'Hook',
          entity: 'Entité',
          hookType: 'Type',
          error: 'Erreur'
        }
      }
    }
  }
})

const metrics = ref<ObservabilityMetrics | null>(null)
const loading = ref(false)
const error = ref('')

const stripeOperations = computed(() => {
  if (!metrics.value) return []
  return [
    {
      key: 'create',
      label: t('adminObservability.stripe.create'),
      success: metrics.value.stripe.create.success,
      failure: metrics.value.stripe.create.failure
    },
    {
      key: 'update',
      label: t('adminObservability.stripe.update'),
      success: metrics.value.stripe.update.success,
      failure: metrics.value.stripe.update.failure
    },
    {
      key: 'archive',
      label: t('adminObservability.stripe.archive'),
      success: metrics.value.stripe.archive.success,
      failure: metrics.value.stripe.archive.failure
    }
  ]
})

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    metrics.value = await observabilityService.getMetrics()
  } catch (err: any) {
    error.value =
      err?.response?.data?.error_message ||
      err?.response?.data?.message ||
      err?.message ||
      t('adminObservability.fetchError')
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
</script>

<style scoped>
.admin-observability {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.header-text {
  flex: 1;
  min-width: 280px;
}

.page-header h1 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-text-primary);
  font-size: 2rem;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.page-header h1 i {
  color: var(--color-primary);
}

.page-subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.refresh-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: var(--color-bg-primary);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-message {
  padding: var(--spacing-lg);
  color: var(--color-text-secondary);
  text-align: center;
}

.error-message {
  color: var(--color-danger-text);
  background: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
  border-radius: var(--border-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.metrics-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.metrics-card {
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card-header {
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

.card-header h2 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.card-header h2 i {
  color: var(--color-primary);
}

.counter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
}

.counter-cell {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
}

.counter-cell.failure-nonzero {
  border-color: var(--color-danger-border);
  background: var(--color-danger-bg);
}

.counter-cell.failure-nonzero .counter-label {
  color: var(--color-danger-text);
  font-weight: var(--font-weight-semibold);
}

.counter-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: var(--font-weight-medium);
}

.counter-pair {
  display: flex;
  gap: var(--spacing-md);
}

.counter-value {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.counter-value small {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.counter-value.success i {
  color: var(--color-success-text);
}

.counter-value.failure {
  color: var(--color-danger-text);
}

.counter-value.failure i {
  color: var(--color-danger-text);
}

.counter-value-large {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.failure-nonzero .counter-value-large {
  color: var(--color-danger-text);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl);
  margin: 0;
  color: var(--color-text-muted);
  font-style: italic;
}

.empty-state i {
  color: var(--color-success-text);
}

.table-wrapper {
  overflow-x: auto;
}

.hooks-table {
  width: 100%;
  border-collapse: collapse;
}

.hooks-table thead {
  background: var(--color-bg-secondary);
}

.hooks-table th {
  padding: var(--spacing-md) var(--spacing-lg);
  text-align: left;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid var(--color-border-light);
  white-space: nowrap;
}

.hooks-table td {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  vertical-align: top;
}

.hooks-table tbody tr:last-child td {
  border-bottom: none;
}

.timestamp-cell {
  font-family: var(--font-family-mono, monospace);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.hook-name-cell {
  font-family: var(--font-family-mono, monospace);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.hook-type-badge {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
  border: 1px solid var(--color-info-border);
}

.error-cell {
  color: var(--color-danger-text);
  font-family: var(--font-family-mono, monospace);
  word-break: break-word;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-observability {
    padding: var(--spacing-md);
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .counter-grid {
    grid-template-columns: 1fr;
  }

  .hooks-table th,
  .hooks-table td {
    padding: var(--spacing-sm) var(--spacing-md);
  }
}
</style>
