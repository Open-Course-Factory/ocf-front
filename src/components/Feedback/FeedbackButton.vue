<template>
  <div class="feedback-button-wrapper">
    <button
      class="feedback-button"
      :title="t('feedback.tooltip')"
      @click="showModal = true"
    >
      <i class="fas fa-comment-dots"></i>
      <span class="feedback-label">{{ t('feedback.label') }}</span>
    </button>

    <FeedbackModal
      :visible="showModal"
      @close="showModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import FeedbackModal from './FeedbackModal.vue'

const showModal = ref(false)

const { t } = useTranslations({
  en: {
    feedback: {
      label: 'Feedback',
      tooltip: 'Send feedback'
    }
  },
  fr: {
    feedback: {
      label: 'Feedback',
      tooltip: 'Envoyer un retour'
    }
  }
})
</script>

<style scoped>
.feedback-button-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1020;
}

.feedback-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 500;
  box-shadow: var(--shadow-md);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.feedback-button:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-lg);
  background-color: var(--color-primary-hover);
}

.feedback-button:active {
  transform: scale(0.98);
}

.feedback-button i {
  font-size: var(--font-size-md);
}

@media (max-width: 768px) {
  .feedback-button-wrapper {
    bottom: 16px;
    right: 16px;
  }

  .feedback-button {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
  }

  .feedback-label {
    display: none;
  }
}
</style>
