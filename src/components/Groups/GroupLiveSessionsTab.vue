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
-->

<template>
  <div class="live-sessions-tab">
    <!-- Focused viewer: one learner session, full-size, with the take-hand button -->
    <div v-if="focusedSession" class="live-sessions-focused">
      <button class="btn btn-secondary btn-back" @click="focusedSessionId = null">
        <i class="fas fa-arrow-left"></i>
        {{ t('liveSessions.backToWall') }}
      </button>
      <SupervisionViewer
        :key="focusedSession.session_id"
        :session-id="focusedSession.session_id"
        :learner-name="learnerLabel(focusedSession)"
        class="live-sessions-focused-viewer"
      />
    </div>

    <!-- Wall of read-only tiles -->
    <template v-else>
      <div class="live-sessions-header">
        <div>
          <h3 class="live-sessions-title">{{ t('liveSessions.title') }}</h3>
          <p class="live-sessions-subtitle">{{ t('liveSessions.subtitle') }}</p>
        </div>
        <button class="btn btn-secondary btn-sm" :disabled="isLoading" @click="loadSessions">
          <i :class="isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-sync'"></i>
          {{ t('liveSessions.refresh') }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="isLoading && sessions.length === 0" class="live-sessions-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>{{ t('liveSessions.loading') }}</p>
      </div>

      <!-- Error (includes backend 403 when the plan/role does not allow supervision) -->
      <div v-else-if="error" class="live-sessions-state live-sessions-error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button class="btn btn-primary btn-sm" @click="loadSessions">
          {{ t('liveSessions.retry') }}
        </button>
      </div>

      <!-- Empty -->
      <div v-else-if="sessions.length === 0" class="live-sessions-state">
        <i class="fas fa-desktop"></i>
        <p>{{ t('liveSessions.empty') }}</p>
      </div>

      <!-- Wall grid -->
      <div v-else class="live-sessions-grid">
        <div
          v-for="session in sessions"
          :key="session.session_id"
          class="live-sessions-tile"
          :class="{ 'live-sessions-tile-active': activeTiles.has(session.session_id) }"
        >
          <SupervisionViewer
            compact
            :session-id="session.session_id"
            :learner-name="learnerLabel(session)"
            @expand="focusedSessionId = session.session_id"
            @activity="markActivity(session.session_id)"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { supervisionService, type LiveSession } from '../../services/domain/terminal/supervisionService'
import SupervisionViewer from '../Terminal/SupervisionViewer.vue'

const props = defineProps<{
  groupId: string
  canSupervise: boolean
}>()

const { t } = useTranslations({
  en: {
    liveSessions: {
      title: 'Live sessions',
      subtitle: 'Watch your learners’ terminals in real time. Click a tile to focus and, if needed, take the hand.',
      loading: 'Loading live sessions…',
      empty: 'No active sessions',
      refresh: 'Refresh',
      retry: 'Retry',
      backToWall: 'Back to the wall',
      unknownLearner: 'Learner',
      loadError: 'Failed to load live sessions',
      permissionError: 'You do not have permission to supervise sessions in this group. Supervision may require a higher plan.'
    }
  },
  fr: {
    liveSessions: {
      title: 'Sessions en direct',
      subtitle: 'Observez les terminaux de vos apprenants en temps réel. Cliquez sur une vignette pour l’agrandir et, si besoin, prendre la main.',
      loading: 'Chargement des sessions en direct…',
      empty: 'Aucune session active',
      refresh: 'Actualiser',
      retry: 'Réessayer',
      backToWall: 'Retour au mur',
      unknownLearner: 'Apprenant',
      loadError: 'Échec du chargement des sessions en direct',
      permissionError: 'Vous n’avez pas la permission de superviser les sessions de ce groupe. La supervision peut nécessiter un forfait supérieur.'
    }
  }
})

const sessions = ref<LiveSession[]>([])
const isLoading = ref(false)
const error = ref('')
const focusedSessionId = ref<string | null>(null)
// Session ids with output within the last ~2s — drives the activity highlight.
const activeTiles = ref<Set<string>>(new Set())
const activityTimers = new Map<string, ReturnType<typeof setTimeout>>()
let pollInterval: ReturnType<typeof setInterval> | null = null

const focusedSession = computed(() =>
  sessions.value.find(s => s.session_id === focusedSessionId.value) || null
)

function learnerLabel(session: LiveSession): string {
  return session.user_name || session.user_id || t('liveSessions.unknownLearner')
}

function markActivity(sessionId: string) {
  const next = new Set(activeTiles.value)
  next.add(sessionId)
  activeTiles.value = next

  const existing = activityTimers.get(sessionId)
  if (existing) clearTimeout(existing)
  activityTimers.set(sessionId, setTimeout(() => {
    const cleared = new Set(activeTiles.value)
    cleared.delete(sessionId)
    activeTiles.value = cleared
    activityTimers.delete(sessionId)
  }, 2000))
}

async function loadSessions() {
  if (!props.canSupervise) {
    error.value = t('liveSessions.permissionError')
    return
  }
  isLoading.value = true
  error.value = ''
  try {
    sessions.value = await supervisionService.getGroupLiveSessions(props.groupId)
  } catch (err: any) {
    if (err?.response?.status === 403) {
      error.value = err.response?.data?.error_message || t('liveSessions.permissionError')
    } else {
      error.value = err?.response?.data?.error_message || t('liveSessions.loadError')
    }
  } finally {
    isLoading.value = false
  }
}

// The parent resolves `canSupervise` from an async members-load, so it is often
// still false on the first render. Re-run once it flips to true so the learner is
// not stuck on the stale permission banner until the next poll.
watch(() => props.canSupervise, (canSupervise) => {
  if (canSupervise) loadSessions()
})

onMounted(() => {
  loadSessions()
  // Refresh the roster periodically so newly-started / ended sessions appear.
  pollInterval = setInterval(loadSessions, 30000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  activityTimers.forEach(timer => clearTimeout(timer))
  activityTimers.clear()
})
</script>

<style scoped>
.live-sessions-tab {
  padding: var(--spacing-sm) 0;
}

.live-sessions-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.live-sessions-title {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
}

.live-sessions-subtitle {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  max-width: 60ch;
}

.live-sessions-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  color: var(--color-text-secondary);
  text-align: center;
}

.live-sessions-state i {
  font-size: var(--font-size-2xl);
  color: var(--color-primary);
}

.live-sessions-error i {
  color: var(--color-danger);
}

.live-sessions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-md);
}

.live-sessions-tile {
  border-radius: var(--border-radius-md);
  transition: box-shadow var(--transition-base);
}

/* Highlight a tile that just produced output (recent activity). */
.live-sessions-tile-active {
  box-shadow: 0 0 0 2px var(--color-success);
}

.live-sessions-focused {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.btn-back {
  align-self: flex-start;
}

.live-sessions-focused-viewer {
  height: 70vh;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  border: var(--border-width-thin) solid transparent;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.btn-secondary {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-color: var(--color-border-medium);
}

.btn:not(:disabled):hover {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .live-sessions-grid {
    grid-template-columns: 1fr;
  }

  .live-sessions-focused-viewer {
    height: 60vh;
  }
}
</style>
