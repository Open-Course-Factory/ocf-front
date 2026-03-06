<template>
  <div class="empty-state-page">
    <div class="empty-state-page-content">
      <!-- Icon or Illustration -->
      <div class="empty-state-page-icon">
        <i :class="iconClass"></i>
      </div>

      <!-- Title -->
      <h3 class="empty-state-page-title">{{ title }}</h3>

      <!-- Description -->
      <p class="empty-state-page-description">{{ description }}</p>

      <!-- Primary Action Button -->
      <button
        v-if="actionText"
        class="btn btn-primary empty-state-page-action"
        @click="handleAction"
      >
        <i v-if="actionIcon" :class="actionIcon"></i>
        {{ actionText }}
      </button>

      <!-- Optional Help Link -->
      <a
        v-if="helpText && helpUrl"
        :href="helpUrl"
        class="empty-state-page-help"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i class="fas fa-question-circle"></i>
        {{ helpText }}
      </a>

      <!-- Optional router-link for internal help -->
      <router-link
        v-else-if="helpText && helpRoute"
        :to="helpRoute"
        class="empty-state-page-help"
      >
        <i class="fas fa-question-circle"></i>
        {{ helpText }}
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  iconClass?: string
  title: string
  description: string
  actionText?: string
  actionIcon?: string
  helpText?: string
  helpUrl?: string
  helpRoute?: string | object
}

interface Emits {
  (e: 'action'): void
}

withDefaults(defineProps<Props>(), {
  iconClass: 'fas fa-inbox',
  actionIcon: ''
})

const emit = defineEmits<Emits>()

const handleAction = () => {
  emit('action')
}
</script>

<style scoped>
@keyframes empty-state-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-state-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: var(--spacing-xl);
}

.empty-state-page-content {
  max-width: 420px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  animation: empty-state-fade-in 0.4s ease-out both;
}

.empty-state-page-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--border-radius-full);
  background: var(--color-bg-tertiary);
  border: 1.5px dashed var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-xs);
}

.empty-state-page-icon i {
  font-size: 1.75rem;
  color: var(--color-text-muted);
  opacity: 0.7;
}

.empty-state-page-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-medium);
  letter-spacing: -0.01em;
}

.empty-state-page-description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: 1.6;
  max-width: 360px;
}

.empty-state-page-action {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.empty-state-page-action i {
  margin-right: var(--spacing-xs);
}

.empty-state-page-help {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: var(--font-size-sm);
  transition: color var(--transition-fast);
}

.empty-state-page-help:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.empty-state-page-help i {
  font-size: var(--font-size-sm);
}

/* Responsive Design */
@media (max-width: 768px) {
  .empty-state-page {
    min-height: 240px;
    padding: var(--spacing-lg);
  }

  .empty-state-page-icon {
    width: 64px;
    height: 64px;
  }

  .empty-state-page-icon i {
    font-size: 1.4rem;
  }

  .empty-state-page-title {
    font-size: var(--font-size-lg);
  }

  .empty-state-page-description {
    font-size: var(--font-size-sm);
  }

  .empty-state-page-action {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
  }
}
</style>
