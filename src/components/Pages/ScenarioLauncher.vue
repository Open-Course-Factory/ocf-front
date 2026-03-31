<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Scenario launcher page: browse and launch available scenarios.
 */
-->

<template>
  <div class="scenario-launcher">
    <div class="page-header">
      <h2>{{ t('launcher.title') }}</h2>
      <p class="page-subtitle">{{ t('launcher.subtitle') }}</p>
    </div>

    <div v-if="isLoading" class="loading-section">
      <i class="fas fa-spinner fa-spin"></i>
      <span>{{ t('launcher.loading') }}</span>
    </div>

    <div v-else-if="error" class="error-section">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadScenarios">{{ t('launcher.retry') }}</button>
    </div>

    <div v-else-if="scenarios.length === 0" class="empty-section">
      <i class="fas fa-flask"></i>
      <p>{{ t('launcher.empty') }}</p>
    </div>

    <div v-else class="scenario-grid">
      <div v-for="scenario in scenarios" :key="scenario.id" class="scenario-card">
        <div class="card-header">
          <h3 class="card-title">{{ scenario.title }}</h3>
          <span v-if="scenario.difficulty" class="difficulty-badge" :class="'difficulty-' + scenario.difficulty">
            {{ translateDifficulty(scenario.difficulty) }}
          </span>
        </div>
        <p v-if="scenario.description" class="card-description">{{ scenario.description }}</p>
        <div class="card-meta">
          <span v-if="scenario.estimated_time" class="meta-item">
            <i class="fas fa-clock"></i> {{ scenario.estimated_time }}
          </span>
          <div v-if="scenario.compatible_instance_types?.length" class="os-badges">
            <span v-for="cit in scenario.compatible_instance_types" :key="cit.id" class="os-badge">
              {{ cit.instance_type }}
            </span>
          </div>
          <span v-else-if="scenario.instance_type" class="os-badge">
            {{ scenario.instance_type }}
          </span>
        </div>
        <div class="card-actions">
          <button
            class="btn btn-primary launch-btn"
            :disabled="!scenario.launchable || isLaunching"
            @click="handleLaunchScenario(scenario)"
          >
            <i :class="isLaunching && launchingScenarioId === scenario.id ? 'fas fa-spinner fa-spin' : 'fas fa-rocket'"></i>
            {{ scenario.launchable ? t('launcher.launch') : t('launcher.unavailable') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Provisioning overlay -->
    <div v-if="provisioningMessage" class="provisioning-overlay">
      <div class="provisioning-content">
        <i class="fas fa-cog fa-spin provisioning-icon"></i>
        <h3>{{ t('launcher.provisioning') }}</h3>
        <p>{{ provisioningMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { scenarioSessionService } from '../../services/domain/scenario'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'

const router = useRouter()
const { showError } = useNotification()

const { t } = useTranslations({
  en: {
    launcher: {
      title: 'Scenarios',
      subtitle: 'Browse and launch available scenarios',
      loading: 'Loading scenarios...',
      empty: 'No scenarios available. Ask your trainer to assign some.',
      retry: 'Retry',
      launch: 'Launch',
      unavailable: 'Unavailable',
      provisioning: 'Setting up your environment...',
      provisioningDetail: 'Creating terminal and preparing scenario. This may take a few minutes.',
      launchError: 'Failed to launch scenario.',
      difficultyBeginner: 'Beginner',
      difficultyIntermediate: 'Intermediate',
      difficultyAdvanced: 'Advanced'
    }
  },
  fr: {
    launcher: {
      title: 'Scenarios',
      subtitle: 'Parcourir et lancer les scenarios disponibles',
      loading: 'Chargement des scenarios...',
      empty: 'Aucun scenario disponible. Demandez a votre formateur d\'en assigner.',
      retry: 'Reessayer',
      launch: 'Lancer',
      unavailable: 'Indisponible',
      provisioning: 'Preparation de votre environnement...',
      provisioningDetail: 'Creation du terminal et preparation du scenario. Cela peut prendre quelques minutes.',
      launchError: 'Echec du lancement du scenario.',
      difficultyBeginner: 'Debutant',
      difficultyIntermediate: 'Intermediaire',
      difficultyAdvanced: 'Avance'
    }
  }
})

const scenarios = ref<any[]>([])
const isLoading = ref(false)
const error = ref('')
const isLaunching = ref(false)
const launchingScenarioId = ref('')
const provisioningMessage = ref('')

function translateDifficulty(difficulty: string): string {
  const map: Record<string, string> = {
    beginner: t('launcher.difficultyBeginner'),
    intermediate: t('launcher.difficultyIntermediate'),
    advanced: t('launcher.difficultyAdvanced')
  }
  return map[difficulty] || difficulty
}

async function loadScenarios() {
  isLoading.value = true
  error.value = ''
  try {
    scenarios.value = await scenarioSessionService.listScenarios()
  } catch (err: any) {
    error.value = err.response?.data?.error_message || t('launcher.loading')
  } finally {
    isLoading.value = false
  }
}

async function handleLaunchScenario(scenario: any) {
  isLaunching.value = true
  launchingScenarioId.value = scenario.id
  provisioningMessage.value = t('launcher.provisioningDetail')
  try {
    const result = await scenarioSessionService.launchScenario(scenario.id)
    provisioningMessage.value = ''
    router.push({ name: 'TerminalSessionView', params: { sessionId: result.terminal_session_id } })
  } catch (err: any) {
    provisioningMessage.value = ''
    showError(err.response?.data?.error_message || t('launcher.launchError'))
  } finally {
    isLaunching.value = false
    launchingScenarioId.value = ''
  }
}

onMounted(loadScenarios)
</script>

<style scoped>
.scenario-launcher {
  padding: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

.page-header {
  margin-bottom: var(--spacing-lg);
}

.page-header h2 {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.page-subtitle {
  margin: var(--spacing-xs) 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* Loading, error, empty states */
.loading-section,
.error-section,
.empty-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
  text-align: center;
}

.loading-section i,
.error-section i,
.empty-section i {
  font-size: var(--font-size-2xl);
}

.error-section i {
  color: var(--color-danger);
}

.error-section p {
  color: var(--color-danger-text);
}

/* Scenario grid */
.scenario-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-md);
}

/* Scenario card */
.scenario-card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.scenario-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

.card-title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.difficulty-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  flex-shrink: 0;
}

.difficulty-beginner {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.difficulty-intermediate {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.difficulty-advanced {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.card-description {
  padding: var(--spacing-sm) var(--spacing-md) 0;
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  flex: 1;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.os-badges {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.os-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.card-actions {
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-md);
}

.launch-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  width: 100%;
  justify-content: center;
}

/* Provisioning overlay */
.provisioning-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
}

.provisioning-content {
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-2xl);
  text-align: center;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
}

.provisioning-icon {
  font-size: 3rem;
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
}

.provisioning-content h3 {
  margin: 0 0 var(--spacing-sm);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.provisioning-content p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* Responsive */
@media (max-width: 768px) {
  .scenario-launcher {
    padding: var(--spacing-md);
  }

  .scenario-grid {
    grid-template-columns: 1fr;
  }
}
</style>
