<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */
-->

<template>
  <div class="collapsible-section">
    <button
      type="button"
      class="collapsible-header"
      @click="isExpanded = !isExpanded"
    >
      <i class="fas" :class="isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
      {{ t('terminalStarter.advancedOptions') }}
    </button>
    <div v-show="isExpanded" class="collapsible-content">
      <!-- Backend Selector -->
      <BackendSelector
        v-if="showBackendSelector"
        :model-value="selectedBackendId"
        :backends="backends"
        :disabled="disabled"
        @update:model-value="emit('update:selectedBackendId', $event)"
      />

      <FormGroup
        :label="t('terminalStarter.nameOptional')"
        id="terminalName"
        :help-text="t('terminalStarter.nameHelp')"
      >
        <input
          id="terminalName"
          :value="modelValue"
          type="text"
          maxlength="255"
          :placeholder="effectiveNamePlaceholder"
          :disabled="disabled"
          @input="handleInput"
        />
        <small v-if="modelValue.length > 0" class="char-count">
          {{ modelValue.length }}/255
        </small>
      </FormGroup>

      <FormGroup
        :label="t('terminalStarter.hostnameLabel')"
        id="hostname"
        :help-text="t('terminalStarter.hostnameHelp')"
      >
        <input
          id="hostname"
          :value="hostname"
          type="text"
          maxlength="63"
          :placeholder="t('terminalStarter.hostnamePlaceholder')"
          :disabled="disabled"
          @input="handleHostnameInput"
        />
        <small v-if="hostname.length > 0" class="char-count">
          {{ hostname.length }}/63
        </small>
      </FormGroup>

      <FormGroup
        :label="t('terminalStarter.exerciseRefLabel')"
        id="exerciseRef"
        :help-text="t('terminalStarter.exerciseRefHelp')"
      >
        <input
          id="exerciseRef"
          :value="exerciseRef"
          type="text"
          maxlength="255"
          :placeholder="t('terminalStarter.exerciseRefPlaceholder')"
          :disabled="disabled"
          @input="handleExerciseRefInput"
        />
        <small v-if="exerciseRef.length > 0" class="char-count">
          {{ exerciseRef.length }}/255
        </small>
      </FormGroup>

      <FormGroup
        v-if="networkEnabled"
        :label="t('terminalStarter.packagesLabel')"
        id="packages"
        :help-text="t('terminalStarter.packagesHelp')"
      >
        <input
          id="packages"
          :value="packages"
          type="text"
          maxlength="500"
          :placeholder="t('terminalStarter.packagesPlaceholder')"
          :disabled="disabled"
          @input="handlePackagesInput"
        />
        <div v-if="defaultPackages.length > 0" class="default-packages">
          <small class="default-packages-label">{{ t('terminalStarter.preInstalled') }}</small>
          <span v-for="pkg in defaultPackages" :key="pkg" class="package-badge">{{ pkg }}</span>
        </div>
      </FormGroup>

      <!--
        Network (internet egress) toggle. Only rendered when the active plan
        allows network access. Opt-in: machines start with no internet by
        default. Custom startup packages require network ON (enforced
        server-side), so the packages FormGroup above is gated on networkEnabled.
      -->
      <fieldset
        v-if="networkPlanEnabled"
        class="persistence-toggle"
        data-testid="network-toggle"
      >
        <legend class="persistence-legend">
          <i class="fas fa-globe"></i>
          {{ t('terminalStarter.networkLabel') }}
        </legend>
        <div class="persistence-options">
          <label class="persistence-option">
            <input
              type="radio"
              name="network-mode"
              value="off"
              :checked="!networkEnabled"
              :disabled="disabled"
              data-testid="network-off"
              @change="emit('update:networkEnabled', false)"
            />
            <span class="persistence-option-label">{{ t('terminalStarter.networkOff') }}</span>
          </label>
          <label class="persistence-option">
            <input
              type="radio"
              name="network-mode"
              value="on"
              :checked="networkEnabled"
              :disabled="disabled"
              data-testid="network-on"
              @change="emit('update:networkEnabled', true)"
            />
            <span class="persistence-option-label">{{ t('terminalStarter.networkOn') }}</span>
          </label>
        </div>
        <p class="persistence-hint" data-testid="network-hint">
          {{ networkEnabled
            ? t('terminalStarter.networkOnHint')
            : t('terminalStarter.networkOffHint') }}
        </p>
      </fieldset>

      <!--
        Persistence toggle. Only rendered when the active subscription plan
        actually supports persistent sessions. Translation keys live under
        terminalStarter.* (shared with the legacy inline location — kept stable
        to minimise churn for downstream tooling / tests).
      -->
      <fieldset
        v-if="persistencePlanEnabled"
        class="persistence-toggle"
        data-testid="persistence-toggle"
      >
        <legend class="persistence-legend">
          <i class="fas fa-database"></i>
          {{ t('terminalStarter.persistenceLabel') }}
        </legend>
        <div class="persistence-options" :class="{ 'is-disabled': forcedEphemeral }">
          <label class="persistence-option">
            <input
              type="radio"
              name="persistence-mode"
              value="ephemeral"
              :checked="persistenceMode === 'ephemeral'"
              :disabled="forcedEphemeral || disabled"
              data-testid="persistence-ephemeral"
              @change="emit('update:persistenceMode', 'ephemeral')"
            />
            <span class="persistence-option-label">{{ t('terminalStarter.persistenceEphemeral') }}</span>
          </label>
          <label class="persistence-option">
            <input
              type="radio"
              name="persistence-mode"
              value="persistent"
              :checked="persistenceMode === 'persistent'"
              :disabled="forcedEphemeral || disabled"
              data-testid="persistence-persistent"
              @change="emit('update:persistenceMode', 'persistent')"
            />
            <span class="persistence-option-label">{{ t('terminalStarter.persistencePersistent') }}</span>
          </label>
        </div>
        <p v-if="forcedEphemeral" class="persistence-hint persistence-hint-locked" data-testid="persistence-locked-hint">
          <i class="fas fa-lock"></i>
          {{ t('terminalStarter.crashTrapsForcesEphemeral') }}
        </p>
        <p v-else class="persistence-hint" data-testid="persistence-hint">
          {{ persistenceMode === 'persistent'
            ? t('terminalStarter.persistencePersistentHint')
            : t('terminalStarter.persistenceEphemeralHint') }}
        </p>
      </fieldset>

      <div class="form-actions">
        <Button
          type="button"
          variant="secondary"
          icon="fas fa-undo"
          size="sm"
          :disabled="disabled"
          @click="$emit('reset')"
        >
          {{ t('terminalStarter.buttonReset') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import FormGroup from '../UI/FormGroup.vue'
import Button from '../UI/Button.vue'
import BackendSelector from './BackendSelector.vue'
import type { Backend } from '../../types/entities'

type PersistenceMode = 'ephemeral' | 'persistent'

interface Props {
  modelValue: string
  exerciseRef?: string
  hostname?: string
  packages?: string
  defaultPackages?: string[]
  disabled?: boolean
  backends?: Backend[]
  selectedBackendId?: string
  showBackendSelector?: boolean
  /**
   * Optional override for the terminal-name input placeholder.
   * Parent computes a contextual prefill (e.g. distro-size-date) to hint
   * the user about the default name that will be sent if the field stays empty.
   * Falls back to the generic localized placeholder when blank.
   */
  namePlaceholder?: string
  /** Whether the active plan allows network (internet egress) access. */
  networkPlanEnabled?: boolean
  /** Current network (internet egress) selection. Opt-in — defaults to off. */
  networkEnabled?: boolean
  /** Whether the active subscription plan supports persistent sessions. */
  persistencePlanEnabled?: boolean
  /** Current persistence mode selection. */
  persistenceMode?: PersistenceMode
  /**
   * When true (active scenario has crash_traps=true), the radio is forced to
   * 'ephemeral' and disabled. The parent is responsible for emitting the
   * 'ephemeral' value when this flips on.
   */
  forcedEphemeral?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  exerciseRef: '',
  hostname: '',
  packages: '',
  defaultPackages: () => [],
  backends: () => [],
  selectedBackendId: '',
  showBackendSelector: false,
  namePlaceholder: '',
  networkPlanEnabled: false,
  networkEnabled: false,
  persistencePlanEnabled: false,
  persistenceMode: 'ephemeral',
  forcedEphemeral: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:exerciseRef': [value: string]
  'update:hostname': [value: string]
  'update:packages': [value: string]
  'update:selectedBackendId': [value: string]
  'update:networkEnabled': [value: boolean]
  'update:persistenceMode': [value: PersistenceMode]
  reset: []
}>()

const { t } = useTranslations({
  en: {
    terminalStarter: {
      advancedOptions: 'Advanced Options',
      nameOptional: 'Terminal Name (Optional)',
      namePlaceholder: 'My terminal...',
      nameHelp: 'Give your terminal a custom name to easily find it. Maximum 255 characters.',
      exerciseRefLabel: 'Exercise Reference',
      exerciseRefPlaceholder: 'e.g., Lab 3 - Docker Basics',
      exerciseRefHelp: 'Optional tag to identify this terminal session (visible in history exports)',
      buttonReset: 'Reset',
      hostnameLabel: 'Container Hostname (Optional)',
      hostnamePlaceholder: 'e.g., webserver',
      hostnameHelp: "Custom hostname for the terminal prompt (root{'@'}hostname). Lowercase, alphanumeric and hyphens, max 63 chars.",
      packagesLabel: 'Startup Packages (Optional)',
      packagesPlaceholder: 'e.g., git, curl, vim, htop',
      packagesHelp: 'Comma-separated list of packages to install when the terminal starts. These are installed on top of the defaults. Requires internet access (enabled above).',
      preInstalled: 'Pre-installed:',
      networkLabel: 'Internet access',
      networkOff: 'No internet',
      networkOn: 'Allow internet',
      networkOffHint: 'The terminal has no internet access. You cannot download packages or clone external repositories.',
      networkOnHint: 'The terminal can reach the internet — download packages, clone repositories, and fetch external resources.',
      persistenceLabel: 'Save my work between sessions',
      persistenceEphemeral: 'Discard when done',
      persistencePersistent: 'Keep my work',
      persistenceEphemeralHint: 'The container is removed shortly after stop. No saved state.',
      persistencePersistentHint: 'The container disk is preserved for resumption (subject to your plan limits).',
      crashTrapsForcesEphemeral: 'This scenario forces ephemeral sessions — your work is reset between attempts.'
    }
  },
  fr: {
    terminalStarter: {
      advancedOptions: 'Options Avancées',
      nameOptional: 'Nom du Terminal (Optionnel)',
      namePlaceholder: 'Mon terminal...',
      nameHelp: 'Donnez un nom personnalisé à votre terminal pour le retrouver facilement. Maximum 255 caractères.',
      exerciseRefLabel: 'Référence d\'exercice',
      exerciseRefPlaceholder: 'ex. TP 3 - Bases Docker',
      exerciseRefHelp: 'Tag optionnel pour identifier cette session terminal (visible dans les exports)',
      buttonReset: 'Réinitialiser',
      hostnameLabel: 'Nom d\'hôte (Optionnel)',
      hostnamePlaceholder: 'ex. webserver',
      hostnameHelp: "Nom d'hôte personnalisé pour le prompt (root{'@'}hostname). Minuscules, alphanumérique et tirets, 63 caractères max.",
      packagesLabel: 'Paquets de démarrage (Optionnel)',
      packagesPlaceholder: 'ex. git, curl, vim, htop',
      packagesHelp: 'Liste de paquets séparés par des virgules à installer au démarrage du terminal. Installés en plus des paquets par défaut. Nécessite l\'accès internet (activé ci-dessus).',
      preInstalled: 'Pré-installés :',
      networkLabel: 'Accès internet',
      networkOff: 'Sans internet',
      networkOn: 'Autoriser internet',
      networkOffHint: 'Le terminal n\'a pas d\'accès internet. Vous ne pouvez ni installer de paquets ni cloner de dépôts externes.',
      networkOnHint: 'Le terminal peut accéder à internet — installer des paquets, cloner des dépôts et récupérer des ressources externes.',
      persistenceLabel: 'Conserver mon travail entre les sessions',
      persistenceEphemeral: 'Tout effacer à la fin',
      persistencePersistent: 'Conserver mon travail',
      persistenceEphemeralHint: 'Le conteneur est supprimé peu après l\'arrêt. Aucun état conservé.',
      persistencePersistentHint: 'Le disque du conteneur est conservé pour reprise (selon les limites de votre plan).',
      crashTrapsForcesEphemeral: 'Ce scénario impose des sessions éphémères — votre travail est réinitialisé entre les tentatives.'
    }
  }
})

const isExpanded = ref(false)

// Prefer the parent-provided contextual placeholder (e.g. distro-size-date)
// over the generic localized one — the parent signals it by passing a
// non-empty string. Empty string falls back to the i18n default.
const effectiveNamePlaceholder = computed(() =>
  props.namePlaceholder?.trim() || t('terminalStarter.namePlaceholder')
)

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function handleExerciseRefInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:exerciseRef', target.value)
}

function handleHostnameInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:hostname', target.value)
}

function handlePackagesInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:packages', target.value)
}
</script>

<style scoped>
.collapsible-section {
  margin-top: var(--spacing-lg);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background: var(--color-bg-secondary);
}

.collapsible-header {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-secondary);
  border: none;
  text-align: left;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: background-color var(--transition-fast);
}

.collapsible-header:hover {
  background: var(--color-bg-tertiary);
}

.collapsible-header i {
  color: var(--color-primary);
  transition: transform var(--transition-fast);
}

.collapsible-content {
  padding: var(--spacing-lg);
  background: var(--color-bg-primary);
  border-top: var(--border-width-thin) solid var(--color-border-light);
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  margin-top: var(--spacing-md);
}

.char-count {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 4px;
  display: block;
  text-align: right;
}

.default-packages {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
}

.default-packages-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.package-badge {
  display: inline-block;
  padding: 1px var(--spacing-xs);
  font-size: var(--font-size-xs);
  background-color: var(--color-bg-tertiary, var(--color-bg-secondary));
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-secondary);
}

/* Persistence toggle (relocated from TerminalStarter for a cleaner launcher). */
.persistence-toggle {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-secondary);
}

.persistence-legend {
  padding: 0 var(--spacing-xs);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.persistence-legend i {
  color: var(--color-primary);
}

.persistence-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xs);
}

.persistence-options.is-disabled {
  opacity: 0.6;
}

.persistence-option {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
}

.persistence-option input[type="radio"]:disabled {
  cursor: not-allowed;
}

.persistence-option input[type="radio"]:disabled + .persistence-option-label {
  cursor: not-allowed;
  color: var(--color-text-muted);
}

.persistence-option-label {
  user-select: none;
}

.persistence-hint {
  margin: var(--spacing-sm) 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
}

.persistence-hint-locked {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--spacing-xs);
  color: var(--color-warning-text, var(--color-text-secondary));
}

.persistence-hint-locked i {
  margin-top: 2px;
  color: var(--color-warning, var(--color-text-muted));
}

@media (max-width: 768px) {
  .collapsible-header {
    font-size: var(--font-size-sm);
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .collapsible-content {
    padding: var(--spacing-md);
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions :deep(.btn) {
    width: 100%;
    justify-content: center;
  }
}
</style>
