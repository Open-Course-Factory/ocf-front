<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <SettingsCard title="Session Information">
    <div class="session-header">
      <span class="session-title">
        <i class="fas fa-terminal"></i>
        Session Terminal: {{ sessionInfo?.session_id }}
      </span>
      <div class="session-actions">
        <span class="time-remaining" :class="urgencyClass" v-if="timeRemaining > 0">
          <i class="fas fa-clock"></i>
          {{ t('terminalStarter.timeRemaining') }}: {{ formattedTime }}
        </span>
        <Button
          variant="danger"
          size="sm"
          :icon="isStopping ? 'fas fa-spinner fa-spin' : 'fas fa-stop'"
          :disabled="isStopping"
          :loading="isStopping"
          @click="$emit('stop')"
        >
          {{ t('terminalStarter.stop') }}
        </Button>
      </div>
    </div>

    <div class="session-details">
      <div class="detail-item" v-if="instanceInfo">
        <strong>
          <i class="fas fa-server"></i> {{ t('terminalStarter.instanceType') }}
        </strong>
        <span class="instance-info">
          {{ translatedInstanceName }} - {{ translatedInstanceDescription }}
          <small class="text-muted">({{ instanceInfo.prefix }})</small>
        </span>
      </div>
      <div class="detail-item">
        <strong>
          <i class="fas fa-info-circle"></i> {{ t('terminalStarter.status') }}
        </strong>
        <span :class="statusClass">
          {{ sessionInfo?.status }}
        </span>
      </div>
    </div>

    <div class="session-nav-hint">
      <i class="fas fa-bookmark"></i>
      <span>
        {{ t('terminalStarter.sessionSavedHint') }}
        <router-link :to="{ name: 'TerminalSessions' }">
          {{ t('terminalStarter.mySessionsLink') }}
        </router-link>
        ·
        <router-link :to="{ name: 'TerminalSessionView', params: { sessionId: sessionInfo?.session_id } }">
          {{ t('terminalStarter.openDedicatedView') }}
        </router-link>
      </span>
    </div>
  </SettingsCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import SettingsCard from '../UI/SettingsCard.vue'
import Button from '../UI/Button.vue'
import type { InstanceType } from '../../types'

interface SessionInfo {
  session_id: string
  console_url?: string
  expires_at?: string
  status?: string
}

interface Props {
  sessionInfo: SessionInfo | null
  instanceInfo: InstanceType | null
  timeRemaining: number
  isStopping: boolean
}

const props = defineProps<Props>()

defineEmits<{
  stop: []
}>()

const { t } = useTranslations({
  en: {
    terminalStarter: {
      timeRemaining: 'Time remaining',
      stop: 'Stop',
      instanceType: 'Instance Type',
      status: 'Status',
      sessionSavedHint: 'This session is saved. You can find it anytime in',
      mySessionsLink: 'My Sessions',
      openDedicatedView: 'Open dedicated view'
    }
  },
  fr: {
    terminalStarter: {
      timeRemaining: 'Temps restant',
      stop: 'Arrêter',
      instanceType: 'Type d\'Instance',
      status: 'Statut',
      sessionSavedHint: 'Cette session est sauvegardée. Vous pouvez la retrouver à tout moment dans',
      mySessionsLink: 'Mes Sessions',
      openDedicatedView: 'Ouvrir la vue dédiée'
    }
  }
})

const formattedTime = computed(() => {
  const seconds = props.timeRemaining
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
})

const translatedInstanceName = computed(() => {
  if (!props.instanceInfo) return ''
  const key = `terminals.instances.${props.instanceInfo.name.toLowerCase()}.name`
  const translated = t(key)
  return translated === key
    ? (props.instanceInfo.name.charAt(0).toUpperCase() + props.instanceInfo.name.slice(1))
    : translated
})

const translatedInstanceDescription = computed(() => {
  if (!props.instanceInfo) return ''
  const key = `terminals.instances.${props.instanceInfo.name.toLowerCase()}.description`
  const translated = t(key)
  return translated === key ? props.instanceInfo.description : translated
})

const statusClass = computed(() => {
  const status = props.sessionInfo?.status?.toLowerCase()
  switch (status) {
    case 'running':
    case 'active':
      return 'text-success'
    case 'stopped':
    case 'inactive':
      return 'text-danger'
    case 'starting':
    case 'pending':
      return 'text-warning'
    default:
      return 'text-muted'
  }
})

const urgencyClass = computed(() => {
  if (props.timeRemaining <= 60) return 'time-danger'
  if (props.timeRemaining <= 300) return 'time-warning'
  return ''
})
</script>

<style scoped>
.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.session-title {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.session-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.time-remaining {
  font-weight: var(--font-weight-semibold);
  color: var(--color-info-text);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.time-remaining.time-warning {
  color: var(--color-warning);
}

.time-remaining.time-danger {
  color: var(--color-danger);
  animation: pulse-danger 1.5s ease-in-out infinite;
}

@keyframes pulse-danger {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.session-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-sm);
  border-left: var(--border-width-thick) solid var(--color-info);
}

.detail-item strong {
  min-width: 140px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.instance-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
}

.instance-info small {
  background-color: var(--color-gray-200);
  padding: 2px 6px;
  border-radius: var(--border-radius-sm);
  font-family: var(--font-family-monospace);
}

.session-nav-hint {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-info-bg);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-info-text);
}

.session-nav-hint i {
  color: var(--color-info);
  flex-shrink: 0;
}

.session-nav-hint a {
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

.session-nav-hint a:hover {
  text-decoration: underline;
}

.text-success {
  color: var(--color-success);
}

.text-danger {
  color: var(--color-danger);
}

.text-warning {
  color: var(--color-warning-text);
}

.text-muted {
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .session-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
