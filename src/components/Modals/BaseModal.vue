<template>
  <div v-if="props.visible" class="modal-overlay">
    <div class="modal-body">
      <button v-if="!isLoading" class="close-button" @click="closeModal">
        <i class="fas fa-times"></i>
      </button>
      <div class="modal-content">
        <div v-if="isLoading" class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i> Chargement en cours...
        </div>
        <slot v-else></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import { computed } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const isLoading = computed(() => props.isLoading);

function closeModal() {
  emit('close');
}
</script>

<style scoped>
.modal-overlay {
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

.modal-body {
  background-color: var(--color-bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  position: relative;
  width: 90%;
  max-width: 800px;
  height: auto;
  animation: slideIn var(--transition-slow) ease-in-out;
  overflow-y: auto;
}

.close-button {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  cursor: pointer;
  transition: color var(--transition-slow);
  color: var(--color-text-primary);
}

.close-button:hover {
  color: var(--color-danger);
}

.modal-content {
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  overflow-y: auto;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: var(--font-size-lg);
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
    transform: translateY(-10px);
  }
  to {
    transform: translateY(0);
  }
}
</style>
