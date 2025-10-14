<template>
  <div v-if="visible" class="base-modal-overlay" @click="handleOverlayClick">
    <div
      class="base-modal-container"
      :class="[`base-modal-${size}`, { 'base-modal-no-padding': noPadding }]"
      @click.stop
    >
      <!-- Close Button -->
      <button
        v-if="showClose && !isLoading"
        class="base-modal-close"
        @click="closeModal"
        :aria-label="closeLabel || 'Close'"
      >
        <i class="fas fa-times"></i>
      </button>

      <!-- Header Slot (optional) -->
      <div v-if="$slots.header || title" class="base-modal-header">
        <slot name="header">
          <h2 class="base-modal-title">
            <i v-if="titleIcon" :class="titleIcon"></i>
            {{ title }}
          </h2>
        </slot>
      </div>

      <!-- Content Area -->
      <div class="base-modal-content">
        <!-- Loading State -->
        <div v-if="isLoading" class="base-modal-loading">
          <i class="fas fa-spinner fa-spin"></i>
          {{ loadingText || 'Loading...' }}
        </div>

        <!-- Success Message -->
        <div v-else-if="successMessage" class="alert alert-success">
          <i class="fas fa-check-circle"></i>
          {{ successMessage }}
        </div>

        <!-- Error Message -->
        <div v-else-if="errorMessage" class="alert alert-danger">
          <i class="fas fa-exclamation-triangle"></i>
          {{ errorMessage }}
        </div>

        <!-- Main Content Slot -->
        <slot v-else></slot>
      </div>

      <!-- Footer Slot (optional) -->
      <div v-if="$slots.footer || showDefaultFooter" class="base-modal-footer">
        <slot name="footer">
          <button
            v-if="showDefaultFooter && confirmText"
            class="btn btn-primary"
            @click="handleConfirm"
            :disabled="confirmDisabled"
          >
            <i v-if="confirmIcon" :class="confirmIcon"></i>
            {{ confirmText }}
          </button>
          <button
            v-if="showDefaultFooter && cancelText"
            class="btn btn-secondary"
            @click="closeModal"
          >
            <i v-if="cancelIcon" :class="cancelIcon"></i>
            {{ cancelText }}
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

interface Props {
  visible: boolean
  isLoading?: boolean
  loadingText?: string
  successMessage?: string
  errorMessage?: string
  title?: string
  titleIcon?: string
  showClose?: boolean
  closeLabel?: string
  closeOnOverlayClick?: boolean
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  noPadding?: boolean
  showDefaultFooter?: boolean
  confirmText?: string
  confirmIcon?: string
  confirmDisabled?: boolean
  cancelText?: string
  cancelIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  loadingText: '',
  successMessage: '',
  errorMessage: '',
  title: '',
  titleIcon: '',
  showClose: true,
  closeLabel: '',
  closeOnOverlayClick: true,
  size: 'medium',
  noPadding: false,
  showDefaultFooter: false,
  confirmText: '',
  confirmIcon: '',
  confirmDisabled: false,
  cancelText: '',
  cancelIcon: ''
});

const emit = defineEmits<{
  close: []
  confirm: []
}>();

function closeModal() {
  emit('close');
}

function handleConfirm() {
  emit('confirm');
}

function handleOverlayClick() {
  if (props.closeOnOverlayClick && !props.isLoading) {
    closeModal();
  }
}
</script>

<style scoped>
.base-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn var(--transition-slow) ease-in-out;
  z-index: var(--z-index-modal);
}

.base-modal-container {
  background-color: var(--color-bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  position: relative;
  height: auto;
  max-height: 90vh;
  animation: slideIn var(--transition-slow) ease-in-out;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Size variants control width */
.base-modal-small {
  width: min(400px, 90vw);
}

.base-modal-medium {
  width: min(600px, 90vw);
}

.base-modal-large {
  width: min(800px, 90vw);
}

.base-modal-xlarge {
  width: min(1200px, 90vw);
}

.base-modal-no-padding .base-modal-content {
  padding: 0;
}

.base-modal-close {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  cursor: pointer;
  transition: color var(--transition-slow);
  color: var(--color-text-primary);
  z-index: 10;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm);
}

.base-modal-close:hover {
  color: var(--color-danger);
  background-color: var(--color-bg-secondary);
}

.base-modal-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg-secondary);
  flex-shrink: 0;
}

.base-modal-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
}

.base-modal-title i {
  font-size: var(--font-size-lg);
}

.base-modal-content {
  padding: var(--spacing-lg);
  overflow-y: auto;
  flex: 1;
  -ms-overflow-style: none;  /* IE 10+ */
  scrollbar-width: none;  /* Firefox */
}

.base-modal-content::-webkit-scrollbar {
  display: none;  /* WebKit */
}

.base-modal-footer {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.base-modal-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  gap: var(--spacing-md);
}

.alert {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-base);
}

.alert-success {
  background-color: var(--color-success-bg, #d4edda);
  color: var(--color-success-text, #155724);
  border: 1px solid var(--color-success-border, #c3e6cb);
}

.alert-danger {
  background-color: var(--color-danger-bg, #f8d7da);
  color: var(--color-danger-text, #721c24);
  border: 1px solid var(--color-danger-border, #f5c6cb);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--btn-padding-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark, #0056b3);
}

.btn-secondary {
  background-color: var(--color-secondary, #6c757d);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-secondary-dark, #5a6268);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .base-modal-small,
  .base-modal-medium,
  .base-modal-large,
  .base-modal-xlarge {
    width: 95vw;
  }

  .base-modal-container {
    max-height: 95vh;
  }

  .base-modal-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
