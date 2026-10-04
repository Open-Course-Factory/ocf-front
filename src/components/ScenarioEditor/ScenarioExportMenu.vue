<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * "Export" button with its format menu (KillerCoda archive / JSON). Emits the
 * chosen format; the caller downloads (see useScenarioExport). Always rendered
 * and disabled with a reason when export is not possible, so the button never
 * appears or disappears under the user's pointer.
 */
-->

<template>
  <div class="ocf-export-menu" ref="rootRef">
    <button
      type="button"
      class="ocf-btn-outline"
      data-testid="scenario-export-btn"
      :disabled="disabled"
      :title="disabled ? disabledReason : t('scenarioExportMenu.export')"
      aria-haspopup="true"
      :aria-expanded="open"
      @click.stop="open = !open"
    >
      <i class="fas fa-file-export" aria-hidden="true"></i>
      <span>{{ t('scenarioExportMenu.export') }}</span>
      <i class="fas fa-caret-down" aria-hidden="true"></i>
    </button>
    <div v-if="open" class="ocf-export-menu-list" role="menu" @click.stop>
      <button
        type="button"
        role="menuitem"
        class="ocf-export-menu-item"
        data-testid="scenario-export-killercoda"
        @click="choose('killercoda')"
      >
        <i class="fas fa-file-archive" aria-hidden="true"></i>
        <span>{{ t('scenarioExportMenu.killercoda') }}</span>
      </button>
      <button
        type="button"
        role="menuitem"
        class="ocf-export-menu-item"
        data-testid="scenario-export-json"
        @click="choose('json')"
      >
        <i class="fas fa-file-code" aria-hidden="true"></i>
        <span>{{ t('scenarioExportMenu.json') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import type { ScenarioExportFormat } from '../../composables/useScenarioExport'

defineProps<{
  disabled?: boolean
  /** Tooltip explaining why the button is disabled. */
  disabledReason?: string
}>()

const emit = defineEmits<{
  (e: 'export', format: ScenarioExportFormat): void
}>()

const { t } = useTranslations({
  en: {
    scenarioExportMenu: {
      export: 'Export',
      killercoda: 'KillerCoda archive (.zip)',
      json: 'OCF JSON (.json)'
    }
  },
  fr: {
    scenarioExportMenu: {
      export: 'Exporter',
      killercoda: 'Archive KillerCoda (.zip)',
      json: 'JSON OCF (.json)'
    }
  }
})

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

function choose(format: ScenarioExportFormat) {
  open.value = false
  emit('export', format)
}

const closeOnOutsideClick = (event: MouseEvent) => {
  if (open.value && rootRef.value && !rootRef.value.contains(event.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', closeOnOutsideClick))
onUnmounted(() => document.removeEventListener('click', closeOnOutsideClick))
</script>

<style scoped>
.ocf-export-menu {
  position: relative;
}

.ocf-export-menu-list {
  position: absolute;
  top: calc(100% + 0.25rem);
  right: 0;
  min-width: 220px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md, 6px);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  padding: 0.25rem 0;
}

.ocf-export-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem 0.85rem;
  background: none;
  border: none;
  text-align: left;
  color: var(--color-text-primary);
  font-size: 0.8rem;
  cursor: pointer;
}

.ocf-export-menu-item:hover,
.ocf-export-menu-item:focus-visible {
  background: var(--color-bg-secondary);
  color: var(--color-primary);
}

.ocf-export-menu-item i {
  width: 1rem;
  text-align: center;
}
</style>
