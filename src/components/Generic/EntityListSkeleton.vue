<template>
  <div class="entity-list-skeleton">
    <div v-for="n in count" :key="n" class="entity-skeleton-item">
      <div class="skeleton-card-content">
        <div class="skeleton-main">
          <LoadingSkeleton variant="text" width="40%" height="20px" />
          <LoadingSkeleton variant="text" width="60%" height="16px" style="margin-top: 8px" />
          <LoadingSkeleton variant="text" width="30%" height="14px" style="margin-top: 6px" />
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
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  background: #fafafa;
  min-height: 80px;
}

.skeleton-card-content {
  flex: 1;
  padding-right: 20px;
}

.skeleton-main {
  display: flex;
  flex-direction: column;
}

.skeleton-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
