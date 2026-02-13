<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div v-if="showBanner" :class="['demo-mode-banner', bannerClass]">
    <div class="banner-content">
      <i class="fas fa-flask"></i>
      <span class="banner-text">{{ bannerText }}</span>
      <button class="close-btn" @click="hideBanner" title="Hide demo banner">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { demoConfig } from '../../services/demo'

const showBanner = ref(false)
const bannerText = ref('')
const bannerClass = ref('')

onMounted(() => {
  const indicator = demoConfig.getDemoIndicator()
  if (indicator.show) {
    showBanner.value = true
    bannerText.value = indicator.text
    bannerClass.value = indicator.class
  }
})

function hideBanner() {
  showBanner.value = false
}
</script>

<style scoped>
.demo-mode-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-index-modal);
  background: linear-gradient(135deg, var(--color-accent-coral) 0%, var(--color-accent-coral-dark) 100%);
  color: var(--color-white);
  padding: var(--spacing-sm) var(--spacing-lg);
  box-shadow: var(--shadow-md);
  animation: slideUp var(--transition-slow) ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

.banner-text {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.close-btn {
  position: absolute;
  right: 0;
  background: transparent;
  border: none;
  color: var(--color-white);
  font-size: var(--font-size-base);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  transition: background-color var(--transition-base);
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .demo-mode-banner {
    padding: var(--spacing-md) var(--spacing-md);
  }

  .banner-text {
    font-size: var(--font-size-xs);
  }

  .close-btn {
    position: static;
    margin-left: auto;
  }
}
</style>