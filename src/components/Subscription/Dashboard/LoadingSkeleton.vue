<template>
  <div :class="['skeleton', variantClass]" :style="skeletonStyle"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'text' | 'card' | 'circle' | 'button'
  width?: string
  height?: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text',
  width: '100%',
  height: '20px',
  count: 1
})

const variantClass = computed(() => {
  return `skeleton-${props.variant}`
})

const skeletonStyle = computed(() => ({
  width: props.width,
  height: props.height
}))
</script>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-gray-200) 0%,
    var(--color-gray-300) 20%,
    var(--color-gray-200) 40%,
    var(--color-gray-200) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--border-radius-sm);
  opacity: 0.7;
}

.skeleton-text {
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--spacing-sm);
}

.skeleton-card {
  border-radius: var(--border-radius-lg);
  min-height: 100px;
}

.skeleton-circle {
  border-radius: var(--border-radius-full);
}

.skeleton-button {
  border-radius: var(--border-radius-sm);
  height: 36px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Alternative blur effect (can be toggled) */
.skeleton.blur-effect {
  background: rgba(0, 0, 0, 0.03);
  backdrop-filter: blur(4px);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.3;
  }
}
</style>
