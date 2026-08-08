<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Validated flags panel for scenario sessions.
 * Displays flags the student has already found, with copy-to-clipboard support.
 */
-->

<template>
  <div class="validated-flags">
    <div class="validated-flags-header">
      <button
        class="collapse-toggle"
        @click="toggleCollapse"
        :aria-label="isCollapsed ? t('flags.showFlags') : t('flags.hideFlags')"
        :title="isCollapsed ? t('flags.showFlags') : t('flags.hideFlags')"
      >
        <i class="fas fa-chevron-right collapse-chevron" :class="{ expanded: !isCollapsed }"></i>
        <i class="fas fa-flag"></i>
        <span>{{ t('flags.title') }}</span>
      </button>
    </div>
    <div v-show="!isCollapsed" class="flags-list">
      <div v-if="isLoading && flags.length === 0" class="empty-state">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <div v-else-if="flags.length === 0" class="empty-state">
        <i class="fas fa-flag"></i>
        <p>{{ t('flags.empty') }}</p>
      </div>
      <div v-for="flag in [...flags].reverse()" :key="flag.step_order" class="flag-entry">
        <span class="flag-level" :title="t('flags.levelTitle')">{{ flagLevel(flag) }}</span>
        <code class="flag-value">{{ flag.flag }}</code>
        <button
          class="copy-btn"
          @click="copyFlag(flag.flag)"
          :aria-label="t('flags.copyFlag')"
          :title="t('flags.copyFlag')"
        >
          <i :class="copiedFlag === flag.flag ? 'fas fa-check' : 'fas fa-copy'"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { scenarioSessionService } from '../../services/domain/scenario'
import type { ValidatedFlag } from '../../services/domain/scenario'
import { useTranslations } from '../../composables/useTranslations'

interface Props {
  scenarioSessionId: string
  isActive: boolean
}

const props = defineProps<Props>()

const { t } = useTranslations({
  en: {
    flags: {
      title: 'Found Flags',
      empty: 'No flags found yet. Submit a flag to see it here.',
      level: 'Level',
      levelTitle: 'Level this flag was captured on',
      copied: 'Copied!',
      copyFlag: 'Copy flag',
      showFlags: 'Show flags',
      hideFlags: 'Hide flags',
    }
  },
  fr: {
    flags: {
      title: 'Flags trouvés',
      empty: 'Aucun flag trouvé. Soumettez un flag pour le voir ici.',
      level: 'Niveau',
      levelTitle: 'Niveau où ce flag a été trouvé',
      copied: 'Copié !',
      copyFlag: 'Copier le flag',
      showFlags: 'Afficher les flags',
      hideFlags: 'Masquer les flags',
    }
  }
})

const COLLAPSED_KEY = 'terminal_flags_collapsed'

const flags = ref<ValidatedFlag[]>([])
const isLoading = ref(false)
const isCollapsed = ref(true)
const copiedFlag = ref<string | null>(null)

// Restore collapsed state from localStorage
const savedCollapsed = localStorage.getItem(COLLAPSED_KEY)
if (savedCollapsed !== null) {
  isCollapsed.value = savedCollapsed === 'true'
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem(COLLAPSED_KEY, String(isCollapsed.value))
}

// The level this flag was captured on, matching the number the learner sees in
// the step header. Orders are data-driven — 0-based from a KillerCoda import,
// 1-based from the editor — so the backend-computed position is the only
// reliable answer; showing the raw order numbered the first level 0. The
// arithmetic is the same fallback ScenarioPanel.stepPosition() uses, for an
// older backend that does not send position yet.
function flagLevel(flag: ValidatedFlag): number {
  return flag.position || flag.step_order + 1
}

async function fetchFlags() {
  if (!props.scenarioSessionId) return

  isLoading.value = true
  try {
    flags.value = await scenarioSessionService.getValidatedFlags(props.scenarioSessionId)
  } catch {
    // Silently ignore — empty list is fine
  } finally {
    isLoading.value = false
  }
}

async function copyFlag(flag: string) {
  try {
    await navigator.clipboard.writeText(flag)
    copiedFlag.value = flag
    setTimeout(() => {
      copiedFlag.value = null
    }, 2000)
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = flag
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copiedFlag.value = flag
    setTimeout(() => {
      copiedFlag.value = null
    }, 2000)
  }
}

function refresh() {
  fetchFlags()
}

// Fetch on mount
onMounted(() => {
  fetchFlags()
})

// Re-fetch if session ID changes
watch(() => props.scenarioSessionId, () => {
  flags.value = []
  fetchFlags()
})

defineExpose({ refresh })
</script>

<style scoped>
/* A flex column so the list below can fill whatever height the host gives this
   panel. Inert where the host is a plain block. */
.validated-flags {
  background-color: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.validated-flags-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  min-height: var(--panel-header-min-height);
  background-color: var(--color-bg-secondary);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

.collapse-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  margin: calc(-1 * var(--spacing-xs)) calc(-1 * var(--spacing-sm));
  border-radius: var(--border-radius-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  font-family: inherit;
  white-space: nowrap;
  user-select: none;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.collapse-toggle:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-primary);
}

.collapse-chevron {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  transition: transform var(--transition-base);
}

.collapse-chevron.expanded {
  transform: rotate(90deg);
}

.collapse-toggle:hover .collapse-chevron {
  color: var(--color-primary);
}

/* Sized by the window, same rule and same basis as CommandHistory's list: an
 * unbounded list here would mean the console loses a row every time the learner
 * captures a flag. The shared basis also keeps the two panels aligned when they
 * sit side by side. */
.flags-list {
  flex: 1 1 300px;
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-sm);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
  text-align: center;
}

.empty-state i {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--spacing-sm);
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: var(--font-size-sm);
}

.flag-entry {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  transition: background-color var(--transition-fast);
}

.flag-entry:hover {
  background-color: var(--color-bg-secondary);
}

.flag-level {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  align-self: center;
}

.flag-value {
  font-family: var(--font-family-monospace, monospace);
  font-size: 0.65rem;
  color: var(--color-text-primary);
  background: var(--color-bg-tertiary, rgba(0, 0, 0, 0.1));
  padding: 2px 6px;
  border-radius: var(--border-radius-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: none;
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.copy-btn:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.copy-btn .fa-check {
  color: var(--color-success);
}
</style>
