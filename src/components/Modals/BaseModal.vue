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
  animation: fadeIn 0.3s ease-in-out;
  z-index: 1000;
}

.modal-body {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  width: 90%;
  max-width: 800px;
  height: auto;
  animation: slideIn 0.3s ease-in-out;
  overflow-y: auto;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  transition: color 0.3s;
}

.close-button:hover {
  color: #dc3545;
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
  font-size: 1.2em;
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
