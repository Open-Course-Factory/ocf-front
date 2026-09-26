<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * A stopped persistent terminal: Resume starts it again (disk kept), Delete
 * removes it. The parent words it — a bare terminal and a scenario run pause
 * for different reasons and come back to different things.
 */
-->

<template>
  <div class="session-paused-banner" role="status">
    <div class="paused-content">
      <i class="fas fa-pause-circle paused-icon" aria-hidden="true"></i>
      <div class="paused-text">
        <strong>{{ title }}</strong>
        <span>{{ body }}</span>
      </div>
    </div>
    <div class="paused-actions">
      <button
        ref="resumeButton"
        class="btn-resume"
        :disabled="isResuming || isDeleting"
        @click="emit('resume')"
        data-testid="resume-session-cta"
      >
        <i class="fas" :class="isResuming ? 'fa-spinner fa-spin' : 'fa-play'"></i>
        {{ isResuming ? t('pausedBanner.resuming') : resumeLabel }}
      </button>
      <button
        class="btn-trash"
        :disabled="isResuming || isDeleting"
        @click="emit('delete')"
        data-testid="delete-session-cta"
      >
        <i class="fas fa-trash"></i>
        {{ t('pausedBanner.deleteButton') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTranslations } from '../../composables/useTranslations'

defineProps<{
  title: string
  body: string
  resumeLabel: string
  isResuming: boolean
  isDeleting: boolean
}>()

const emit = defineEmits<{
  resume: []
  delete: []
}>()

const resumeButton = ref<HTMLButtonElement | null>(null)

defineExpose({
  focusResume: () => resumeButton.value?.focus()
})

const { t } = useTranslations({
  en: {
    pausedBanner: {
      resuming: 'Resuming…',
      deleteButton: 'Delete permanently'
    }
  },
  fr: {
    pausedBanner: {
      resuming: 'Reprise…',
      deleteButton: 'Supprimer définitivement'
    }
  }
})
</script>

<style scoped>
.session-paused-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  border: var(--border-width-medium) solid var(--color-warning);
  border-radius: var(--border-radius-md);
  background-color: var(--color-bg-secondary);
}

.paused-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
  min-width: 0;
}

.paused-icon {
  font-size: var(--font-size-xl);
  color: var(--color-warning);
  flex-shrink: 0;
}

.paused-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.paused-text strong {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.paused-text span {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.paused-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.btn-resume,
.btn-trash {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: var(--border-width-medium) solid transparent;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.btn-resume {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.btn-resume:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.btn-trash {
  background-color: transparent;
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.btn-trash:hover:not(:disabled) {
  background-color: var(--color-danger);
  color: var(--color-white);
}

.btn-resume:disabled,
.btn-trash:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .session-paused-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .paused-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
