<template>
  <template v-if="step">
    <!-- Transparency notice for hint tracking -->
    <div v-if="hasProgressiveHints && !isReviewing" class="hint-transparency-notice">
      <i class="fas fa-eye"></i>
      <span>{{ t('scenarioPanel.hintTransparency') }}</span>
    </div>

    <!-- Progressive hints section -->
    <div v-if="hasProgressiveHints" class="hint-section">
      <!-- Hint counter -->
      <div class="hint-header">
        <i class="fas fa-lightbulb hint-icon"></i>
        <span class="hint-counter">
          {{ t('scenarioPanel.hintsAvailable', { used: revealedHints.length, total: step.hints_total_count }) }}
        </span>
      </div>

      <!-- Already revealed hints (always visible, stacked) -->
      <div v-for="hint in revealedHints" :key="hint.level" class="hint-item">
        <div class="hint-level-label">{{ t('scenarioPanel.hintLevel', { level: hint.level }) }}</div>
        <div class="hint-content markdown-content" v-html="renderHintMarkdown(hint.content)"></div>
      </div>

      <!-- Reveal next hint button -->
      <button
        v-if="revealedHints.length < step.hints_total_count"
        class="hint-toggle"
        :class="{ 'hint-nudge': hintNudgeActive }"
        :disabled="isRevealingHint"
        @click="$emit('reveal-next')"
      >
        <i :class="isRevealingHint ? 'fas fa-spinner fa-spin' : 'fas fa-lightbulb'"></i>
        {{ isRevealingHint
          ? t('scenarioPanel.revealingHint')
          : t('scenarioPanel.revealNextHint', { level: revealedHints.length + 1 })
        }}
      </button>

      <!-- All hints used -->
      <div v-if="revealedHints.length > 0 && revealedHints.length >= step.hints_total_count" class="hints-exhausted">
        <i class="fas fa-check-circle"></i>
        {{ t('scenarioPanel.allHintsRevealed') }}
      </div>
    </div>

    <!-- Legacy single hint (backward compat for old scenarios without progressive hints) -->
    <div v-else-if="step.hint" class="hint-section">
      <button class="hint-toggle" @click="$emit('toggle-hint')" :aria-expanded="showHint">
        <i :class="showHint ? 'fas fa-eye-slash' : 'fas fa-lightbulb'"></i>
        {{ showHint ? t('scenarioPanel.hideHint') : t('scenarioPanel.showHint') }}
      </button>
      <div v-if="showHint" class="hint-content markdown-content" v-html="renderHintMarkdown(step.hint)"></div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useTranslations } from '../../composables/useTranslations'
import { renderKillercodaMarkdown } from '../../utils/killercodaMarkdown'
import type { CurrentStepResponse } from '../../services/domain/scenario'

defineProps<{
  step: CurrentStepResponse | null
  hasProgressiveHints: boolean
  revealedHints: Array<{ level: number; content: string }>
  isRevealingHint: boolean
  showHint: boolean
  hintNudgeActive: boolean
  isReviewing: boolean
}>()

defineEmits<{
  'reveal-next': []
  'toggle-hint': []
}>()

const { t } = useTranslations({
  en: {
    scenarioPanel: {
      hintTransparency: 'Your instructor can see how many hints you use.',
      hintsAvailable: 'Hints: {used}/{total}',
      hintLevel: 'Hint {level}',
      revealNextHint: 'Show Hint {level}',
      revealingHint: 'Loading...',
      allHintsRevealed: 'All hints used',
      showHint: 'Show Hint',
      hideHint: 'Hide Hint'
    }
  },
  fr: {
    scenarioPanel: {
      hintTransparency: 'Votre formateur peut voir combien d\'indices vous utilisez.',
      hintsAvailable: 'Indices : {used}/{total}',
      hintLevel: 'Indice {level}',
      revealNextHint: 'Révéler l\'indice {level}',
      revealingHint: 'Chargement...',
      allHintsRevealed: 'Tous les indices utilisés',
      showHint: 'Afficher l\'indice',
      hideHint: 'Masquer l\'indice'
    }
  }
})

function renderHintMarkdown(content: string): string {
  return renderKillercodaMarkdown(content)
}
</script>

<style scoped>
/* Hint section */
.hint-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.hint-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
  align-self: flex-start;
}

.hint-toggle:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-secondary);
  border-color: var(--color-border-medium);
}

.hint-toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.hint-toggle i {
  color: var(--color-warning);
}

.hint-content {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-warning-bg);
  border: var(--border-width-thin) solid var(--color-warning-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-warning-text);
  line-height: var(--line-height-relaxed);
}

.hint-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.hint-icon {
  color: var(--color-warning);
}

.hint-counter {
  font-weight: var(--font-weight-medium);
}

.hint-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xs);
}

.hint-level-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-warning);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hints-exhausted {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-style: italic;
}

.hints-exhausted i {
  color: var(--color-success);
}

.hint-transparency-notice {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-style: italic;
}

.hint-transparency-notice i {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

/* Hint-nudge pulse on the hint button (after 90s of inactivity on a terminal step) */
.hint-toggle.hint-nudge {
  animation: hint-nudge-pulse 2.4s ease-in-out infinite;
  border-color: var(--color-primary);
  color: var(--color-primary);
}

@keyframes hint-nudge-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 var(--color-primary-light);
  }
  50% {
    box-shadow: 0 0 0 6px var(--color-primary-light);
  }
}
</style>
