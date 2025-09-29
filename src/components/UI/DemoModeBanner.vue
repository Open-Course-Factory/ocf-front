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
import { demoConfig } from '../../services/demoConfig'

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
  z-index: 9999;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  color: white;
  padding: 8px 20px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.3s ease-out;
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
  gap: 10px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

.banner-text {
  font-weight: 600;
  font-size: 14px;
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
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 5px;
  border-radius: 3px;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .demo-mode-banner {
    padding: 10px 15px;
  }

  .banner-text {
    font-size: 12px;
  }

  .close-btn {
    position: static;
    margin-left: auto;
  }
}
</style>