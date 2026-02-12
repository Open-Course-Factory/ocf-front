<template>
  <div class="group-card" @click="navigateToDetail">
    <!-- Card Header -->
    <div class="group-card-header">
      <div class="group-icon">
        <i class="fas fa-users"></i>
      </div>
      <div class="group-title-section">
        <h3 class="group-title">{{ entity.display_name || entity.name }}</h3>
        <p v-if="entity.description" class="group-description">
          {{ truncate(entity.description, 80) }}
        </p>
      </div>
      <div class="group-badges">
        <span v-if="!entity.is_active" class="badge badge-inactive">
          <i class="fas fa-times-circle"></i>
          {{ t('classGroups.statusInactive') }}
        </span>
        <span v-if="entity.is_expired" class="badge badge-expired">
          <i class="fas fa-exclamation-triangle"></i>
          {{ t('classGroups.statusExpired') }}
        </span>
        <span v-if="entity.is_full" class="badge badge-full">
          <i class="fas fa-users"></i>
          {{ t('classGroups.statusFull') }}
        </span>
        <span v-if="entity.is_active && !entity.is_expired && !entity.is_full" class="badge badge-active">
          <i class="fas fa-check-circle"></i>
          {{ t('classGroups.statusActive') }}
        </span>
      </div>
    </div>

    <!-- Card Body -->
    <div class="group-card-body">
      <!-- Members Progress -->
      <div class="members-section">
        <div class="members-info">
          <i class="fas fa-user-friends"></i>
          <span class="members-label">{{ t('classGroups.member_count') }}</span>
          <span class="members-count">{{ entity.member_count ?? 0 }} / {{ entity.max_members ?? '?' }}</span>
        </div>
        <div v-if="entity.max_members" class="members-progress">
          <div
            class="members-progress-bar"
            :class="progressClass"
            :style="{ width: progressPercent + '%' }"
          ></div>
        </div>
      </div>

      <!-- Meta Info -->
      <div class="group-meta">
        <div v-if="entity.organization_id" class="meta-item">
          <i class="fas fa-building"></i>
          <span>{{ t('classGroups.organization_id') }}</span>
        </div>
        <div v-if="entity.parent_group_id" class="meta-item">
          <i class="fas fa-sitemap"></i>
          <span>{{ t('classGroups.parent_group_id') }}</span>
        </div>
        <div v-if="entity.expires_at" class="meta-item" :class="{ 'meta-warning': isExpiringSoon }">
          <i class="fas fa-clock"></i>
          <span>{{ formatDate(entity.expires_at) }}</span>
        </div>
        <div v-if="entity.created_at" class="meta-item meta-date">
          <i class="far fa-calendar"></i>
          <span>{{ formatDate(entity.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { formatDateTime } from '../../utils/formatters'

const { t } = useI18n()
const router = useRouter()

const props = defineProps<{
  entity: any
}>()

const progressPercent = computed(() => {
  if (!props.entity.max_members || props.entity.max_members <= 0) return 0
  const percent = ((props.entity.member_count ?? 0) / props.entity.max_members) * 100
  return Math.min(percent, 100)
})

const progressClass = computed(() => {
  if (progressPercent.value >= 100) return 'progress-full'
  if (progressPercent.value >= 80) return 'progress-warning'
  return 'progress-normal'
})

const isExpiringSoon = computed(() => {
  if (!props.entity.expires_at) return false
  const expiry = new Date(props.entity.expires_at)
  const now = new Date()
  const daysLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return daysLeft <= 7 && daysLeft > 0
})

function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function formatDate(dateString: string): string {
  return formatDateTime(dateString)
}

function navigateToDetail() {
  if (props.entity.id) {
    router.push({ name: 'GroupDetails', params: { id: props.entity.id } })
  }
}
</script>

<style scoped>
.group-card {
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-base);
  width: 100%;
}

.group-card:hover {
  box-shadow: var(--shadow-md);
}

/* === HEADER === */
.group-card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
}

.group-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: var(--border-radius-md);
  background: var(--color-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-size: var(--font-size-lg);
}

.group-title-section {
  flex: 1;
  min-width: 0;
}

.group-title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-description {
  margin: var(--spacing-xs) 0 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-badges {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.badge-active {
  color: var(--color-success);
  background: var(--color-success-bg, rgba(16, 185, 129, 0.1));
}

.badge-inactive {
  color: var(--color-text-muted);
  background: var(--color-bg-tertiary);
}

.badge-expired {
  color: var(--color-danger);
  background: var(--color-danger-bg, rgba(239, 68, 68, 0.1));
}

.badge-full {
  color: var(--color-warning);
  background: var(--color-warning-bg, rgba(245, 158, 11, 0.1));
}

/* === BODY === */
.group-card-body {
  padding: var(--spacing-md) var(--spacing-lg);
}

/* Members Section */
.members-section {
  margin-bottom: var(--spacing-md);
}

.members-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
}

.members-info i {
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  width: 16px;
  text-align: center;
}

.members-label {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.members-count {
  margin-left: auto;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.members-progress {
  height: 6px;
  background: var(--color-bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.members-progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width var(--transition-slow);
}

.progress-normal {
  background: var(--color-primary);
}

.progress-warning {
  background: var(--color-warning);
}

.progress-full {
  background: var(--color-danger);
}

/* Meta Info */
.group-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm) var(--spacing-lg);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.meta-item i {
  width: 14px;
  text-align: center;
}

.meta-warning {
  color: var(--color-warning);
  font-weight: var(--font-weight-medium);
}

.meta-date {
  margin-left: auto;
}

/* === RESPONSIVE === */
@media (max-width: 768px) {
  .group-card-header {
    flex-wrap: wrap;
  }

  .group-badges {
    width: 100%;
    margin-top: var(--spacing-xs);
  }

  .meta-date {
    margin-left: 0;
  }
}
</style>
