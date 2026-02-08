<template>
  <div class="empty-state">
    <div class="empty-state-content">
      <!-- Icon or Illustration -->
      <div class="empty-state-icon">
        <i :class="iconClass"></i>
      </div>

      <!-- Title -->
      <h3 class="empty-state-title">{{ title }}</h3>

      <!-- Description -->
      <p class="empty-state-description">{{ description }}</p>

      <!-- Primary Action Button -->
      <button
        v-if="actionText"
        class="btn btn-primary empty-state-action"
        @click="handleAction"
      >
        <i v-if="actionIcon" :class="actionIcon"></i>
        {{ actionText }}
      </button>

      <!-- Optional Help Link -->
      <a
        v-if="helpText && helpUrl"
        :href="helpUrl"
        class="empty-state-help"
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
        class="empty-state-help"
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
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: var(--spacing-xl);
}

.empty-state-content {
  max-width: 500px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
}

.empty-state-icon {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-md);
}

.empty-state-icon i {
  font-size: 3.5rem;
  color: var(--color-white);
}

.empty-state-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
}

.empty-state-description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  line-height: 1.6;
}

.empty-state-action {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-2xl);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.empty-state-action i {
  margin-right: var(--spacing-sm);
}

.empty-state-help {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-primary);
  text-decoration: none;
  font-size: var(--font-size-base);
  transition: color var(--transition-fast);
}

.empty-state-help:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.empty-state-help i {
  font-size: var(--font-size-base);
}

/* Responsive Design */
@media (max-width: 768px) {
  .empty-state {
    min-height: 300px;
    padding: var(--spacing-lg);
  }

  .empty-state-icon {
    width: 90px;
    height: 90px;
  }

  .empty-state-icon i {
    font-size: 2.5rem;
  }

  .empty-state-title {
    font-size: var(--font-size-xl);
  }

  .empty-state-description {
    font-size: var(--font-size-base);
  }

  .empty-state-action {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
  }
}
</style>
