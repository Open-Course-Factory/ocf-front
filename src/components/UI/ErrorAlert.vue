<template>
  <div
    v-if="message"
    class="alert alert-danger"
    role="alert"
  >
    <i class="fas fa-exclamation-triangle"></i>
    <span class="alert-message">{{ message }}</span>
    <button
      v-if="dismissible"
      class="btn btn-sm btn-outline-danger"
      type="button"
      @click="handleDismiss"
      :aria-label="dismissLabel"
    >
      <i class="fas fa-times"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * Reusable error alert component
 * Standardizes error display across the application
 *
 * @example
 * <ErrorAlert
 *   :message="error"
 *   @dismiss="error = ''"
 * />
 *
 * @example
 * // Non-dismissible error
 * <ErrorAlert
 *   :message="criticalError"
 *   :dismissible="false"
 * />
 */

interface Props {
  /** Error message to display */
  message: string
  /** Whether the alert can be dismissed (default: true) */
  dismissible?: boolean
  /** Aria label for dismiss button (default: 'Dismiss error') */
  dismissLabel?: string
}

withDefaults(defineProps<Props>(), {
  dismissible: true,
  dismissLabel: 'Dismiss error'
})

interface Emits {
  /** Emitted when user clicks dismiss button */
  (e: 'dismiss'): void
}

const emit = defineEmits<Emits>()

const handleDismiss = () => {
  emit('dismiss')
}
</script>

<style scoped>
.alert {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  border: var(--border-width-thin) solid var(--color-danger);
  border-radius: var(--border-radius-md);
  background-color: var(--color-danger-bg);
  color: var(--color-danger);
}

.alert-danger {
  border-color: var(--color-danger);
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.alert i.fa-exclamation-triangle {
  flex-shrink: 0;
  font-size: var(--font-size-lg);
}

.alert-message {
  flex: 1;
  word-break: break-word;
}

.alert .btn {
  flex-shrink: 0;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  line-height: 1;
  border: var(--border-width-thin) solid var(--color-danger);
  border-radius: var(--border-radius-sm);
  background-color: transparent;
  color: var(--color-danger);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.alert .btn:hover {
  background-color: var(--color-danger);
  color: var(--color-white);
}

.alert .btn:focus {
  outline: 2px solid var(--color-danger);
  outline-offset: 2px;
}
</style>
