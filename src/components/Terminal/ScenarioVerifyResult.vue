<template>
  <div>
    <button
      class="verify-btn"
      :disabled="isVerifying || !isActive"
      @click="$emit('verify')"
    >
      <i :class="isVerifying ? 'fas fa-spinner fa-spin' : 'fas fa-check-circle'"></i>
      {{ isVerifying ? t('scenarioPanel.verifying') : t('scenarioPanel.verify') }}
    </button>

    <div v-if="result" class="verify-result" role="status" aria-live="polite" :class="{ passed: result.passed, failed: !result.passed }">
      <div class="verify-result-header">
        <i :class="result.passed ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
        <span>{{ result.passed ? t('scenarioPanel.passed') : t('scenarioPanel.failed') }}</span>
      </div>
      <div v-if="result.output" class="verify-output">
        <span class="output-label">{{ t('scenarioPanel.output') }}</span>
        <pre class="output-text">{{ result.output }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslations } from '../../composables/useTranslations'
import type { VerifyStepResponse } from '../../services/domain/scenario'

withDefaults(defineProps<{
  isActive: boolean
  isVerifying: boolean
  result?: VerifyStepResponse | null
}>(), {
  result: null
})

defineEmits<{ verify: [] }>()

const { t } = useTranslations({
  en: {
    scenarioPanel: {
      verify: 'Verify',
      verifying: 'Verifying...',
      passed: 'Step completed!',
      failed: 'Not quite right. Check the output and try again.',
      output: 'Output'
    }
  },
  fr: {
    scenarioPanel: {
      verify: 'Vérifier',
      verifying: 'Vérification...',
      passed: 'Étape validée !',
      failed: 'Pas tout à fait. Vérifiez la sortie et réessayez.',
      output: 'Sortie'
    }
  }
})
</script>
