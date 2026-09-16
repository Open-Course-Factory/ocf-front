<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

 Expose a port from inside the running terminal session to a public URL
 (opt-in backend feature — see ocf-core's exposedPortService). The backend
 owns the rule: the list endpoint runs the same plan/scenario gate as create,
 so a 403 (plan or scenario disallows) or 404 (feature not configured by the
 operator) on load hides the whole panel instead of showing a form that can
 only fail. The parent decides whether to mount it at all.
-->

<template>
  <div v-if="available" class="exposed-ports">
    <div class="exposed-ports-header">
      <i class="fas fa-network-wired"></i>
      <span>{{ t('exposedPorts.title') }}</span>
    </div>

    <form class="exposed-ports-form" @submit.prevent="createExposure">
      <input
        type="number"
        v-model.number="portInput"
        class="port-input"
        :placeholder="t('exposedPorts.portPlaceholder')"
        min="1024"
        max="65535"
        :disabled="!isActive || isCreating"
      />
      <Button
        type="submit"
        variant="primary"
        size="sm"
        :loading="isCreating"
        :disabled="!isActive || !portInput"
      >
        {{ t('exposedPorts.forward') }}
      </Button>
    </form>

    <div class="exposed-ports-list">
      <div v-if="isLoading" class="empty-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>{{ t('exposedPorts.loading') }}</p>
      </div>
      <div v-else-if="exposedPorts.length === 0" class="empty-state">
        <i class="fas fa-network-wired"></i>
        <p>{{ t('exposedPorts.empty') }}</p>
      </div>
      <div v-for="ep in exposedPorts" :key="ep.id" class="exposed-port-entry">
        <span class="exposed-port-number">{{ ep.port }}</span>
        <a :href="ep.url" target="_blank" rel="noopener noreferrer" class="exposed-port-url">
          {{ ep.url }}
        </a>
        <button
          class="stop-btn"
          :disabled="deletingId === ep.id"
          :title="t('exposedPorts.stop')"
          :aria-label="t('exposedPorts.stop')"
          @click="deleteExposure(ep)"
        >
          <i :class="deletingId === ep.id ? 'fas fa-spinner fa-spin' : 'fas fa-trash'"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import Button from '../UI/Button.vue'
import { terminalService } from '../../services/domain/terminal/terminalService'
import type { ExposedPort } from '../../types/terminal'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'

interface Props {
  sessionId?: string
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sessionId: undefined,
  isActive: false
})

const { t } = useTranslations({
  en: {
    exposedPorts: {
      title: 'Exposed ports',
      portPlaceholder: 'Port (e.g. 8000)',
      forward: 'Forward port',
      loading: 'Loading exposed ports...',
      empty: 'No port exposed yet.',
      stop: 'Stop exposing this port',
      createSuccess: 'Port exposed successfully',
      deleteSuccess: 'Port is no longer exposed',
      errorPlanDisabled: 'Your current plan does not allow exposing ports publicly.',
      errorNotConfigured: 'Port exposure is not configured on this server yet.',
      genericCreateError: 'Failed to expose the port',
      genericDeleteError: 'Failed to stop exposing the port',
      invalidPort: 'Port must be between 1024 and 65535'
    }
  },
  fr: {
    exposedPorts: {
      title: 'Ports exposés',
      portPlaceholder: 'Port (ex : 8000)',
      forward: 'Exposer le port',
      loading: 'Chargement des ports exposés...',
      empty: 'Aucun port exposé pour le moment.',
      stop: 'Arrêter d\'exposer ce port',
      createSuccess: 'Port exposé avec succès',
      deleteSuccess: 'Le port n\'est plus exposé',
      errorPlanDisabled: 'Ton plan actuel ne permet pas d\'exposer des ports publiquement.',
      errorNotConfigured: 'L\'exposition de ports n\'est pas encore configurée sur ce serveur.',
      genericCreateError: 'Échec de l\'exposition du port',
      genericDeleteError: 'Échec de l\'arrêt de l\'exposition du port',
      invalidPort: 'Le port doit être compris entre 1024 et 65535'
    }
  }
})

const { showSuccess, showError: showErrorNotification } = useNotification()

const exposedPorts = ref<ExposedPort[]>([])
// False once the list answered 403/404: the feature is not for this session.
const available = ref(true)
const isLoading = ref(false)
const isCreating = ref(false)
const deletingId = ref<string | null>(null)
const portInput = ref<number | null>(null)

async function fetchExposedPorts() {
  if (!props.sessionId) return
  isLoading.value = true
  try {
    exposedPorts.value = await terminalService.getExposedPorts(props.sessionId)
    available.value = true
  } catch (err: any) {
    const status = err?.response?.status
    if (status === 403 || status === 404) {
      available.value = false
      return
    }
    // Any other failure: keep the panel, the user sees the error when they
    // try to forward a port.
  } finally {
    isLoading.value = false
  }
}

function errorMessage(err: any, fallbackKey: string): string {
  const status = err?.response?.status
  if (status === 403) return t('exposedPorts.errorPlanDisabled')
  if (status === 404) return t('exposedPorts.errorNotConfigured')
  return err?.response?.data?.error_message || t(fallbackKey)
}

async function createExposure() {
  if (!props.sessionId || !portInput.value) return
  if (portInput.value < 1024 || portInput.value > 65535) {
    showErrorNotification(t('exposedPorts.invalidPort'))
    return
  }
  isCreating.value = true
  try {
    const created = await terminalService.exposePort(props.sessionId, portInput.value)
    exposedPorts.value.push(created)
    portInput.value = null
    showSuccess(t('exposedPorts.createSuccess'))
  } catch (err: any) {
    showErrorNotification(errorMessage(err, 'exposedPorts.genericCreateError'))
  } finally {
    isCreating.value = false
  }
}

async function deleteExposure(ep: ExposedPort) {
  if (!props.sessionId) return
  deletingId.value = ep.id
  try {
    await terminalService.deleteExposedPort(props.sessionId, ep.id)
    exposedPorts.value = exposedPorts.value.filter(p => p.id !== ep.id)
    showSuccess(t('exposedPorts.deleteSuccess'))
  } catch (err: any) {
    showErrorNotification(errorMessage(err, 'exposedPorts.genericDeleteError'))
  } finally {
    deletingId.value = null
  }
}

watch(
  () => [props.sessionId, props.isActive],
  () => {
    if (props.sessionId && props.isActive) {
      fetchExposedPorts()
    }
  }
)

onMounted(() => {
  if (props.sessionId && props.isActive) {
    fetchExposedPorts()
  }
})
</script>

<style scoped>
.exposed-ports {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  background: var(--color-surface);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm);
  gap: var(--spacing-sm);
}

.exposed-ports-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.exposed-ports-form {
  display: flex;
  gap: var(--spacing-sm);
}

.port-input {
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.exposed-ports-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
  padding: var(--spacing-md);
  text-align: center;
  font-size: var(--font-size-sm);
}

.exposed-port-entry {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 4px var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  background: var(--color-background);
  font-size: var(--font-size-sm);
}

.exposed-port-number {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  flex-shrink: 0;
}

.exposed-port-url {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-primary);
}

.stop-btn {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--color-danger);
  cursor: pointer;
  padding: 2px 4px;
}

.stop-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
