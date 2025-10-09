<template>
  <div class="entity-list-skeleton">
    <div v-for="n in count" :key="n" class="entity-skeleton-item">
      <div class="skeleton-card-content">
        <div class="skeleton-main">
          <LoadingSkeleton variant="text" width="40%" height="20px" />
          <LoadingSkeleton variant="text" width="60%" height="16px" class="mt-2" />
          <LoadingSkeleton variant="text" width="30%" height="14px" class="mt-1" />
        </div>
      </div>
      <div class="skeleton-actions">
        <LoadingSkeleton variant="button" width="80px" height="38px" />
        <LoadingSkeleton variant="button" width="80px" height="38px" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoadingSkeleton from '../Subscription/Dashboard/LoadingSkeleton.vue'

interface Props {
  count?: number
}

withDefaults(defineProps<Props>(), {
  count: 5
})
</script>

<style scoped>
.entity-list-skeleton {
  width: 100%;
}

.entity-skeleton-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-tertiary);
  min-height: 80px;
}

.skeleton-card-content {
  flex: 1;
  padding-right: var(--spacing-lg);
}

.skeleton-main {
  display: flex;
  flex-direction: column;
}

.skeleton-actions {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}
</style>
