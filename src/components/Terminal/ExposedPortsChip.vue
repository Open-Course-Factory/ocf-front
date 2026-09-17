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

 Header chip for public port exposure: sits next to the connection and
 internet-access indicators, shows how many ports are published, and opens a
 popover to publish one more or stop one.

 The backend owns the rule: the list endpoint runs the same plan/scenario gate
 as create, so a 403 (platform flag, plan or scenario disallows) or 404
 (feature not configured by the operator) on load keeps the chip hidden. A session
 without the network feature has no address to route to, so the chip stays
 visible but disabled with the reason — the same predicate as the globe next
 to it (sessionHasNetwork), not a second one.
-->

<template>
  <div v-if="available" ref="rootRef" class="exposed-ports-chip">
    <button
      type="button"
      class="ports-chip"
      :class="{ 'ports-chip-active': exposedPorts.length > 0, 'ports-chip-off': !hasNetwork }"
      :title="hasNetwork ? t('exposedPorts.chipTitle') : t('exposedPorts.needsNetwork')"
      :aria-expanded="open"
      data-testid="exposed-ports-chip"
      @click.stop="toggle"
    >
      <i class="fas fa-plug"></i>
      <span class="ports-chip-label">{{ t('exposedPorts.chip') }}</span>
      <span v-if="exposedPorts.length > 0" class="ports-chip-count">{{ exposedPorts.length }}</span>
    </button>

    <div v-if="open" class="ports-popover" data-testid="exposed-ports-popover" @click.stop>
      <div class="ports-popover-header">
        <strong>{{ t('exposedPorts.title') }}</strong>
        <span class="ports-popover-hint">{{ t('exposedPorts.hint') }}</span>
      </div>

      <p v-if="!hasNetwork" class="ports-locked">
        <i class="fas fa-lock"></i> {{ t('exposedPorts.needsNetwork') }}
      </p>

      <form v-else class="ports-form" @submit.prevent="createExposure">
        <input
          id="exposed-port-input"
          v-model.number="portInput"
          type="number"
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

      <div class="ports-list">
        <p v-if="isLoading" class="ports-empty">
          <i class="fas fa-spinner fa-spin"></i> {{ t('exposedPorts.loading') }}
        </p>
        <p v-else-if="exposedPorts.length === 0 && hasNetwork" class="ports-empty">
          {{ t('exposedPorts.empty') }}
        </p>
        <div v-for="ep in exposedPorts" :key="ep.id" class="exposed-port-entry">
          <span class="exposed-port-number">:{{ ep.port }}</span>
          <a :href="ep.url" target="_blank" rel="noopener noreferrer" class="exposed-port-url" :title="ep.url">
            {{ ep.url }}
          </a>
          <span class="exposed-port-expiry" :title="t('exposedPorts.expiresAt', { time: expiryClock(ep) })">
            <i class="fas fa-hourglass-half"></i> {{ remaining(ep) }}
          </span>
          <button
            type="button"
            class="entry-btn"
            :title="copiedId === ep.id ? t('exposedPorts.copied') : t('exposedPorts.copy')"
            :aria-label="t('exposedPorts.copy')"
            @click="copyUrl(ep)"
          >
            <i :class="copiedId === ep.id ? 'fas fa-check' : 'fas fa-copy'"></i>
          </button>
          <button
            type="button"
            class="entry-btn stop-btn"
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import Button from '../UI/Button.vue'
import { terminalService } from '../../services/domain/terminal/terminalService'
import type { ExposedPort } from '../../types/terminal'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'

interface Props {
  sessionId?: string
  isActive?: boolean
  hasNetwork?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sessionId: undefined,
  isActive: false,
  hasNetwork: false
})

const { t } = useTranslations({
  en: {
    exposedPorts: {
      chip: 'Ports',
      chipTitle: 'Publish a port of this session at a public URL',
      title: 'Exposed ports',
      hint: 'A public URL to a port of this session, to look at your work — it dies after a short while or with the session.',
      expiresAt: 'Expires at {time}',
      needsNetwork: 'Start a session with internet access to expose a port.',
      portPlaceholder: 'Port (e.g. 8000)',
      forward: 'Expose',
      loading: 'Loading…',
      empty: 'No port exposed yet.',
      copy: 'Copy the URL',
      copied: 'Copied',
      stop: 'Stop exposing this port',
      createSuccess: 'Port exposed',
      deleteSuccess: 'Port is no longer exposed',
      errorPlanDisabled: 'Your plan or this scenario does not allow exposing ports publicly.',
      errorNotConfigured: 'Port exposure is not configured on this server yet.',
      genericCreateError: 'Failed to expose the port',
      genericDeleteError: 'Failed to stop exposing the port',
      invalidPort: 'Port must be between 1024 and 65535'
    }
  },
  fr: {
    exposedPorts: {
      chip: 'Ports',
      chipTitle: 'Publier un port de cette session sur une URL publique',
      title: 'Ports exposés',
      hint: 'Une URL publique vers un port de cette session, pour voir votre travail — elle meurt au bout d’un moment ou avec la session.',
      expiresAt: 'Expire à {time}',
      needsNetwork: 'Démarrez une session avec accès internet pour exposer un port.',
      portPlaceholder: 'Port (ex : 8000)',
      forward: 'Exposer',
      loading: 'Chargement…',
      empty: 'Aucun port exposé pour le moment.',
      copy: 'Copier l’URL',
      copied: 'Copié',
      stop: 'Arrêter d’exposer ce port',
      createSuccess: 'Port exposé',
      deleteSuccess: 'Le port n’est plus exposé',
      errorPlanDisabled: 'Votre forfait ou ce scénario ne permet pas d’exposer des ports publiquement.',
      errorNotConfigured: 'L’exposition de ports n’est pas encore configurée sur ce serveur.',
      genericCreateError: 'Échec de l’exposition du port',
      genericDeleteError: 'Échec de l’arrêt de l’exposition du port',
      invalidPort: 'Le port doit être compris entre 1024 et 65535'
    }
  }
})

const { showSuccess, showError: showErrorNotification } = useNotification()

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)
const exposedPorts = ref<ExposedPort[]>([])
// True only once the list answered: the backend is the one owner of the
// feature-flag / plan / scenario verdict, and rendering before its answer
// would flash a chip that then disappears.
const available = ref(false)
const isLoading = ref(false)
const isCreating = ref(false)
const deletingId = ref<string | null>(null)
const copiedId = ref<string | null>(null)
const portInput = ref<number | null>(null)
// Ticks once a minute so the remaining time counts down and an expired
// entry drops off without a reload (the backend stops listing it too).
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | undefined

function remaining(ep: ExposedPort): string {
  const minutes = Math.max(0, Math.round((new Date(ep.expires_at).getTime() - now.value) / 60000))
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}` : `${minutes} min`
}

function expiryClock(ep: ExposedPort): string {
  return new Date(ep.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function dropExpired() {
  now.value = Date.now()
  exposedPorts.value = exposedPorts.value.filter(ep => new Date(ep.expires_at).getTime() > now.value)
}

function toggle() {
  open.value = !open.value
}

function onDocClick(e: MouseEvent) {
  if (open.value && rootRef.value && !rootRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

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
  } finally {
    isLoading.value = false
  }
}

function errorMessage(err: any, fallbackKey: string): string {
  if (err?.response?.status === 403) return t('exposedPorts.errorPlanDisabled')
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

async function copyUrl(ep: ExposedPort) {
  try {
    await navigator.clipboard.writeText(ep.url)
    copiedId.value = ep.id
    setTimeout(() => { if (copiedId.value === ep.id) copiedId.value = null }, 1500)
  } catch {
    // Clipboard denied: the link is still selectable in the row.
  }
}

watch(
  () => [props.sessionId, props.isActive],
  () => {
    if (props.sessionId && props.isActive) fetchExposedPorts()
  }
)

onMounted(() => {
  document.addEventListener('click', onDocClick)
  if (props.sessionId && props.isActive) fetchExposedPorts()
  clock = setInterval(dropExpired, 60000)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  if (clock) clearInterval(clock)
})
</script>

<style scoped>
.exposed-ports-chip {
  position: relative;
  display: inline-flex;
}

.ports-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  border: var(--border-width-thin) solid var(--color-border-medium);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ports-chip:hover,
.ports-chip[aria-expanded="true"] {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.ports-chip-active {
  color: var(--color-success);
  border-color: var(--color-success);
}

.ports-chip-off {
  color: var(--color-text-muted);
  border-style: dashed;
}

.ports-chip-count {
  min-width: 1.4em;
  padding: 0 4px;
  border-radius: var(--border-radius-full);
  background: var(--color-success);
  color: var(--color-white);
  font-size: 0.85em;
  text-align: center;
}

.ports-popover {
  position: absolute;
  top: calc(100% + var(--spacing-xs));
  right: 0;
  width: min(26rem, 90vw);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-index-dropdown);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  text-align: left;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  cursor: default;
}

.ports-popover-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ports-popover-hint,
.ports-empty,
.ports-locked {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  margin: 0;
}

.ports-locked {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.ports-form {
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

.ports-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 12rem;
  overflow-y: auto;
}

.exposed-port-entry {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 4px var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-secondary);
}

.exposed-port-number {
  flex-shrink: 0;
  font-family: var(--font-family-mono, monospace);
  font-weight: var(--font-weight-semibold);
}

.exposed-port-expiry {
  flex: none;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.exposed-port-url {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-primary);
}

.entry-btn {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: var(--border-radius-sm);
}

.entry-btn:hover:not(:disabled) {
  background: var(--color-bg-primary);
  color: var(--color-primary);
}

.stop-btn:hover:not(:disabled) {
  color: var(--color-danger);
}

.entry-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .ports-chip-label {
    display: none;
  }
}
</style>
