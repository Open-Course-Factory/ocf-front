<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * "Import ▾" in the editor header: every way a new scenario comes in — a
 * KillerCoda archive, an OCF JSON file, or the answer of the teacher's own AI.
 * The import and AI flows are the existing ones, opened from here. Emits
 * `imported` with the scenario and how it came in.
 */
-->

<template>
  <div ref="rootRef" class="ocf-import-menu">
    <button
      type="button"
      class="ocf-btn-outline"
      data-testid="scenario-import-menu"
      aria-haspopup="true"
      :aria-expanded="open"
      :title="t('scenarioImportMenu.title')"
      @click.stop="open = !open"
    >
      <i class="fas fa-file-import" aria-hidden="true"></i>
      <span>{{ t('scenarioImportMenu.import') }}</span>
      <i class="fas fa-caret-down" aria-hidden="true"></i>
    </button>
    <div v-if="open" class="ocf-import-menu-list" role="menu" @click.stop>
      <button type="button" role="menuitem" class="ocf-import-menu-item" data-testid="scenario-import-menu-killercoda" @click="importFile('killercoda')">
        <i class="fas fa-file-archive" aria-hidden="true"></i>
        <span>{{ t('scenarioImportMenu.killercoda') }}</span>
      </button>
      <button type="button" role="menuitem" class="ocf-import-menu-item" data-testid="scenario-import-menu-json" @click="importFile('json')">
        <i class="fas fa-file-code" aria-hidden="true"></i>
        <span>{{ t('scenarioImportMenu.json') }}</span>
      </button>
      <button type="button" role="menuitem" class="ocf-import-menu-item" data-testid="scenario-import-menu-ai" @click="createWithAi">
        <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>
        <span>{{ t('scenarioImportMenu.ai') }}</span>
      </button>
    </div>

    <ScenarioImportButton ref="importRef" bare @imported="scenario => emit('imported', scenario, 'file')" />
    <ScenarioAiModal
      :visible="showAi"
      mode="create"
      :scenario="null"
      @close="showAi = false"
      @imported="scenario => { showAi = false; emit('imported', scenario, 'ai') }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ScenarioImportButton from './ScenarioImportButton.vue'
import ScenarioAiModal from './ScenarioAiModal.vue'
import { useTranslations } from '../../composables/useTranslations'

const emit = defineEmits<{
  imported: [scenario: { id: string }, source: 'file' | 'ai']
}>()

const { t } = useTranslations({
  en: {
    scenarioImportMenu: {
      import: 'Import',
      title: 'Bring in a scenario: from a file, or from your own AI',
      killercoda: 'KillerCoda archive',
      json: 'OCF JSON',
      ai: 'Create with AI'
    }
  },
  fr: {
    scenarioImportMenu: {
      import: 'Importer',
      title: "Faire entrer un scénario : depuis un fichier, ou depuis votre propre IA",
      killercoda: 'Archive KillerCoda',
      json: 'JSON OCF',
      ai: "Créer avec l'IA"
    }
  }
})

const open = ref(false)
const showAi = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const importRef = ref<InstanceType<typeof ScenarioImportButton> | null>(null)

function importFile(format: 'killercoda' | 'json') {
  open.value = false
  importRef.value?.openChooser(format)
}

function createWithAi() {
  open.value = false
  showAi.value = true
}

const closeOnOutsideClick = (event: MouseEvent) => {
  if (open.value && rootRef.value && !rootRef.value.contains(event.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', closeOnOutsideClick))
onUnmounted(() => document.removeEventListener('click', closeOnOutsideClick))
</script>

<style scoped>
.ocf-import-menu {
  position: relative;
}

.ocf-import-menu-list {
  position: absolute;
  top: calc(100% + 0.25rem);
  right: 0;
  min-width: 220px;
  padding: 0.25rem 0;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-index-dropdown);
}

.ocf-import-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem 0.85rem;
  background: none;
  border: none;
  text-align: left;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.ocf-import-menu-item:hover,
.ocf-import-menu-item:focus-visible {
  background: var(--color-bg-secondary);
  color: var(--color-primary);
}

.ocf-import-menu-item i {
  width: 1rem;
  text-align: center;
}
</style>
