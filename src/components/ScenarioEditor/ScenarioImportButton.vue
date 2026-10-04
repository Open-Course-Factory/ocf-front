<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * "Import" button for scenarios: asks for the format (KillerCoda archive or
 * OCF JSON) and the destination (an organization or class the user manages,
 * or the platform for an admin), then hands over to the existing upload
 * modals, which post to the endpoint of that destination. Emits `imported`
 * with the created scenario.
 *
 * The destinations are the editor's create scopes (useScenarioCreateScopes):
 * import and create write to the same places under the same rules.
 */
-->

<template>
  <button
    type="button"
    class="ocf-btn-outline"
    data-testid="scenario-import-btn"
    :title="t('scenarioImport.buttonTitle')"
    @click="openChooser"
  >
    <i class="fas fa-file-import" aria-hidden="true"></i>
    <span>{{ t('scenarioImport.button') }}</span>
  </button>

  <BaseModal
    :visible="showChooser"
    :title="t('scenarioImport.title')"
    title-icon="fas fa-file-import"
    size="small"
    :show-default-footer="true"
    :confirm-text="t('scenarioImport.continue')"
    confirm-icon="fas fa-arrow-right"
    :confirm-disabled="!destination"
    :cancel-text="t('scenarioImport.cancel')"
    :is-loading="isLoadingScopes"
    @close="showChooser = false"
    @confirm="continueToUpload"
  >
    <fieldset class="ocf-import-formats">
      <legend>{{ t('scenarioImport.format') }}</legend>
      <label class="ocf-import-format">
        <input v-model="format" type="radio" value="killercoda" data-testid="scenario-import-format-killercoda" />
        <span>
          <strong>{{ t('scenarioImport.killercoda') }}</strong>
          <small>{{ t('scenarioImport.killercodaHint') }}</small>
        </span>
      </label>
      <label class="ocf-import-format">
        <input v-model="format" type="radio" value="json" data-testid="scenario-import-format-json" />
        <span>
          <strong>{{ t('scenarioImport.json') }}</strong>
          <small>{{ t('scenarioImport.jsonHint') }}</small>
        </span>
      </label>
    </fieldset>

    <ScenarioScopeSelect
      id="import-destination"
      v-model="destinationKey"
      :label="t('scenarioImport.destination')"
      :empty-hint="t('scenarioImport.noDestination')"
    />
  </BaseModal>

  <ScenarioUploadModal
    :visible="showUploadModal"
    :group-id="groupId"
    :organization-id="organizationId"
    @close="showUploadModal = false"
    @uploaded="onImported"
  />
  <ScenarioJSONImportModal
    :visible="showJSONModal"
    :group-id="groupId"
    :organization-id="organizationId"
    @close="showJSONModal = false"
    @imported="onImported"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseModal from '../Modals/BaseModal.vue'
import ScenarioUploadModal from '../Modals/ScenarioUploadModal.vue'
import ScenarioJSONImportModal from '../Modals/ScenarioJSONImportModal.vue'
import ScenarioScopeSelect from './ScenarioScopeSelect.vue'
import { useTranslations } from '../../composables/useTranslations'
import { useScenarioCreateScopes } from '../../composables/useScenarioCreateScopes'

const emit = defineEmits<{
  (e: 'imported', scenario: any): void
}>()

const { t } = useTranslations({
  en: {
    scenarioImport: {
      button: 'Import',
      buttonTitle: 'Import a scenario from a KillerCoda archive or a JSON file',
      title: 'Import a scenario',
      format: 'Format',
      killercoda: 'KillerCoda archive',
      killercodaHint: '.zip or .tar.gz with index.json, steps and assets',
      json: 'OCF JSON',
      jsonHint: 'A .json file exported from OCF',
      destination: 'Import into',
      noDestination: 'You manage no organization or class to import into.',
      continue: 'Choose the file',
      cancel: 'Cancel'
    }
  },
  fr: {
    scenarioImport: {
      button: 'Importer',
      buttonTitle: 'Importer un scénario depuis une archive KillerCoda ou un fichier JSON',
      title: 'Importer un scénario',
      format: 'Format',
      killercoda: 'Archive KillerCoda',
      killercodaHint: '.zip ou .tar.gz avec index.json, étapes et ressources',
      json: 'JSON OCF',
      jsonHint: 'Un fichier .json exporté depuis OCF',
      destination: 'Importer dans',
      noDestination: 'Vous ne gérez aucune organisation ni classe dans laquelle importer.',
      continue: 'Choisir le fichier',
      cancel: 'Annuler'
    }
  }
})

const { parseScopeKey, pickDefaultScopeKey, loadScopeSources } = useScenarioCreateScopes()

const showChooser = ref(false)
const showUploadModal = ref(false)
const showJSONModal = ref(false)
const isLoadingScopes = ref(false)
const format = ref<'killercoda' | 'json'>('killercoda')
const destinationKey = ref('')

const destination = computed(() => parseScopeKey(destinationKey.value))
const organizationId = computed(() => destination.value?.kind === 'org' ? destination.value.id : undefined)
const groupId = computed(() => destination.value?.kind === 'group' ? destination.value.id : undefined)

// The scope lists are loaded on open rather than on mount: the button sits on
// pages (the catalogue) that otherwise never need the user's classes.
async function openChooser() {
  showChooser.value = true
  isLoadingScopes.value = true
  try {
    await loadScopeSources()
  } finally {
    isLoadingScopes.value = false
  }
  if (!parseScopeKey(destinationKey.value)) destinationKey.value = pickDefaultScopeKey()
}

function continueToUpload() {
  if (!destination.value) return
  showChooser.value = false
  if (format.value === 'json') showJSONModal.value = true
  else showUploadModal.value = true
}

function onImported(scenario: any) {
  showUploadModal.value = false
  showJSONModal.value = false
  emit('imported', scenario)
}
</script>

<style scoped>
.ocf-import-formats {
  border: none;
  padding: 0;
  margin: 0 0 var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.ocf-import-formats legend {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.ocf-import-format {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  cursor: pointer;
}

.ocf-import-format:has(input:checked) {
  border-color: var(--color-primary);
  background: var(--color-bg-secondary);
}

.ocf-import-format span {
  display: flex;
  flex-direction: column;
}

.ocf-import-format strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.ocf-import-format small {
  color: var(--color-text-secondary);
}
</style>
