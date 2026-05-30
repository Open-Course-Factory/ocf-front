<template>
  <div class="flag-section">
    <div class="flag-input-row">
      <input
        :value="modelValue"
        type="text"
        class="flag-input"
        :placeholder="t('scenarioPanel.flagPlaceholder')"
        :disabled="isSubmitting || !isActive"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keyup.enter="$emit('submit')"
      />
      <button
        class="flag-submit-btn"
        :disabled="!modelValue.trim() || isSubmitting || !isActive"
        @click="$emit('submit')"
      >
        <i :class="isSubmitting ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'"></i>
        {{ isSubmitting ? t('scenarioPanel.submitting') : t('scenarioPanel.submitFlag') }}
      </button>
    </div>
    <p class="flag-hint">{{ t('scenarioPanel.flagHint') }}</p>
    <div v-if="result" class="flag-result" role="status" aria-live="polite" :class="{ correct: result.correct, incorrect: !result.correct }">
      <i :class="result.correct ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
      <span>{{ result.correct ? t('scenarioPanel.flagCorrect') : t('scenarioPanel.flagIncorrect') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslations } from '../../composables/useTranslations'
import type { SubmitFlagResponse } from '../../services/domain/scenario'

withDefaults(defineProps<{
  modelValue: string
  isActive: boolean
  isSubmitting: boolean
  result?: SubmitFlagResponse | null
}>(), {
  result: null
})

defineEmits<{
  'update:modelValue': [value: string]
  submit: []
}>()

const { t } = useTranslations({
  en: {
    scenarioPanel: {
      flagPlaceholder: 'Enter flag...',
      submitFlag: 'Submit Flag',
      submitting: 'Submitting...',
      flagHint: "Flags look like FLAG{'{'} abc123...{'}'}. Find it in the terminal to submit.",
      flagCorrect: 'Correct!',
      flagIncorrect: 'Incorrect flag. Try again.'
    }
  },
  fr: {
    scenarioPanel: {
      flagPlaceholder: 'Entrez le flag...',
      submitFlag: 'Soumettre le flag',
      submitting: 'Envoi...',
      flagHint: "Les flags sont au format FLAG{'{'} abc123...{'}'}. Trouvez-le dans le terminal pour le soumettre.",
      flagCorrect: 'Correct !',
      flagIncorrect: 'Flag incorrect. Réessayez.'
    }
  }
})
</script>

<style scoped>
.flag-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.flag-input-row {
  display: flex;
  gap: var(--spacing-sm);
}

.flag-hint {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: var(--line-height-relaxed);
}

.flag-input {
  flex: 1;
  min-width: 0;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: var(--border-width-thin) solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-monospace);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
}

.flag-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus-primary);
}

.flag-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.flag-submit-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.flag-submit-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.flag-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.flag-submit-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.flag-result {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.flag-result.correct {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.flag-result.correct i {
  color: var(--color-success);
}

.flag-result.incorrect {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.flag-result.incorrect i {
  color: var(--color-danger);
}
</style>
