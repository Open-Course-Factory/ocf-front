<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<template>
  <div class="shared-sessions-page">
    <div class="page-header">
      <h2>{{ t('shared.title') }}</h2>
      <p class="page-description">
        {{ t('shared.description') }}
      </p>
    </div>

    <div class="sessions-section">
      <div class="section-header">
        <h3>{{ t('shared.sharedTerminals') }} ({{ sharedSessions?.length || 0 }})</h3>
        <div class="header-actions">
          <button class="btn btn-secondary" @click="loadSharedSessions">
            <i class="fas fa-sync" :class="{ 'fa-spin': isLoadingShared }"></i>
            {{ t('shared.refresh') }}
          </button>
        </div>
      </div>

      <!-- Message d'erreur global (utilise le nouveau composant ErrorAlert) -->
      <ErrorAlert
        :message="error"
        @dismiss="error = ''; loadSharedSessions()"
      />

      <div v-if="isLoadingShared && (sharedSessions?.length || 0) === 0" class="loading-section">
        <i class="fas fa-spinner fa-spin"></i> {{ t('shared.loading') }}
      </div>

      <div v-if="(sharedSessions?.length || 0) > 0" class="sessions-grid">
        <div v-for="sharedSession in (sharedSessions || [])" :key="sharedSession.terminal.id"
             :class="['session-card', 'shared-terminal', { 'inactive-terminal': isTerminalInactive(sharedSession.terminal.status) }]">

          <span v-if="isTerminalInactive(sharedSession.terminal.status)" class="inactive-label">
            {{ t('shared.inactiveLabel') }}
          </span>

          <!-- En-tête avec indicateur de partage -->
          <div class="card-header">
            <h5 class="session-id">{{ getTerminalDisplayName(sharedSession.terminal) }}</h5>
            <div class="status-group">
              <span :class="['status-badge', getStatusClass(sharedSession.terminal.status)]">
                <i class="fas fa-circle"></i>
                {{ sharedSession.terminal.status || 'unknown' }}
              </span>
              <div class="sharing-indicator">
                <span :class="['access-badge', getAccessBadgeClass(sharedSession.access_level)]">
                  <i :class="getAccessIcon(sharedSession.access_level)"></i>
                  {{ getAccessLabel(sharedSession.access_level) }}
                </span>
              </div>
            </div>
          </div>

          <div class="card-body">
            <div class="session-details">
              <div class="detail-row">
                <span class="label">{{ t('shared.terminalId') }}</span>
                <span class="value">{{ sharedSession.terminal.id }}</span>
              </div>
              <div class="detail-row">
                <span class="label">{{ t('shared.sessionId') }}</span>
                <span class="value">{{ sharedSession.terminal.session_id }}</span>
              </div>
              <div class="detail-row">
                <span class="label">{{ t('shared.sharedBy') }}</span>
                <span class="value">{{ getUserDisplayName(sharedSession.shared_by) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">{{ t('shared.sharedAt') }}</span>
                <span class="value">{{ formatDate(sharedSession.shared_at) }}</span>
              </div>
              <div class="detail-row" v-if="sharedSession.expires_at">
                <span class="label">{{ t('shared.expiresAt') }}</span>
                <span class="value">{{ formatDate(sharedSession.expires_at) }}</span>
              </div>
              <div class="detail-row" v-if="sharedSession.terminal.instance_type">
                <span class="label">{{ t('shared.instanceType') }}</span>
                <span class="value instance-type">
                  {{ getInstanceName(sharedSession.terminal.instance_type) }}
                  <i class="fas fa-server" title="Instance type"></i>
                </span>
              </div>
            </div>

            <!-- Section intégration iframe pour les sessions actives -->
            <div class="iframe-section" v-if="sharedSession.terminal.status === 'active' && ['write', 'owner'].includes(sharedSession.access_level)">
              <h6 class="iframe-title">
                <i class="fas fa-external-link-alt"></i>
                {{ t('shared.terminalAccess') }}
              </h6>

              <div class="iframe-controls">
                <div class="url-display">
                  <input
                    :value="getTerminalUrl(sharedSession.terminal.session_id)"
                    readonly
                    class="url-input"
                    ref="urlInput"
                  />
                  <button
                    class="btn btn-outline-secondary btn-sm"
                    @click="copyUrlToClipboard(sharedSession.terminal.session_id)"
                    :title="t('shared.copyLink')"
                  >
                    <i :class="copiedSessions.has(sharedSession.terminal.session_id) ? 'fas fa-check' : 'fas fa-copy'"></i>
                  </button>
                </div>

                <div class="iframe-actions">
                  <button
                    class="btn btn-primary btn-sm"
                    @click="openTerminalInNewTab(sharedSession.terminal.session_id)"
                  >
                    <i class="fas fa-external-link-alt"></i>
                    {{ t('shared.open') }}
                  </button>

                  <button
                    class="btn btn-info btn-sm"
                    @click="toggleIframePreview(sharedSession.terminal.session_id)"
                  >
                    <i :class="showPreviews.has(sharedSession.terminal.session_id) ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    {{ showPreviews.has(sharedSession.terminal.session_id) ? t('shared.hide') : t('shared.preview') }}
                  </button>
                </div>
              </div>

              <!-- Aperçu iframe -->
              <div v-if="showPreviews.has(sharedSession.terminal.session_id)" class="iframe-preview">
                <div class="iframe-container">
                  <iframe
                    :src="getTerminalUrl(sharedSession.terminal.session_id)"
                    width="100%"
                    height="300"
                    frameborder="0"
                    :title="`Terminal ${sharedSession.terminal.session_id}`"
                  ></iframe>
                </div>
                <p class="iframe-info">
                  <i class="fas fa-info-circle"></i>
                  {{ t('shared.previewInfo') }} {{ getAccessLabel(sharedSession.access_level) }}
                </p>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <button
              class="btn btn-outline-secondary btn-sm"
              @click="toggleHistory(sharedSession.terminal.session_id)"
              :title="t('shared.viewHistory')"
            >
              <i :class="expandedHistory.has(sharedSession.terminal.session_id) ? 'fas fa-chevron-up' : 'fas fa-history'"></i>
              {{ expandedHistory.has(sharedSession.terminal.session_id) ? t('shared.hideHistory') : t('shared.viewHistory') }}
            </button>
            <button
              v-if="sharedSession.terminal.status === 'active' && sharedSession.access_level === 'owner'"
              class="btn btn-danger btn-sm"
              @click="stopSession(sharedSession.terminal.session_id)"
              :title="t('shared.stopTerminal')"
            >
              <i class="fas fa-stop"></i>
              {{ t('shared.stop') }}
            </button>
            <button
              v-else-if="isTerminalInactive(sharedSession.terminal.status)"
              class="btn btn-warning btn-sm"
              @click="discardTerminal(sharedSession.terminal.id)"
              :title="t('shared.hideInactive')"
            >
              <i class="fas fa-eye-slash"></i>
              {{ t('shared.hideBtn') }}
            </button>
            <span v-else-if="sharedSession.access_level === 'read'" class="access-note">
              <i class="fas fa-eye"></i>
              {{ t('shared.readOnlyAccess') }}
            </span>
          </div>

          <!-- Command history for shared terminal -->
          <div v-if="expandedHistory.has(sharedSession.terminal.session_id)" class="shared-history-section">
            <CommandHistory
              :session-id="sharedSession.terminal.session_id"
              :is-active="sharedSession.terminal.status === 'active'"
            />
          </div>
        </div>
      </div>

      <div v-else class="empty-section">
        <i class="fas fa-share-alt fa-3x"></i>
        <h4>{{ t('shared.noSharedSessions') }}</h4>
        <p>{{ t('shared.noSharedDescription') }}</p>
        <p class="text-muted">
          <small>
            {{ t('shared.noSharedHelp') }}
            <router-link to="/terminal-creation">{{ t('shared.createOwnSession') }}</router-link>.
          </small>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { terminalService, type SharedTerminalInfo } from '../../services/domain/terminal'
import { userService, type User } from '../../services/domain/user'
import axios from 'axios'
import { useNotification } from '../../composables/useNotification'
import { extractErrorMessage } from '../../utils/formatters'
import { useTranslations } from '../../composables/useTranslations'
import ErrorAlert from '../UI/ErrorAlert.vue'
import CommandHistory from '../Terminal/CommandHistory.vue'

const { t } = useTranslations({
  en: {
    shared: {
      title: 'Sessions Shared with Me',
      description: 'Access terminals that other users have shared with you. Your access level determines the actions you can perform.',
      sharedTerminals: 'Shared Terminals',
      refresh: 'Refresh',
      loading: 'Loading shared sessions...',
      terminalId: 'Terminal ID:',
      sessionId: 'Session ID:',
      sharedBy: 'Shared by:',
      sharedAt: 'Shared at:',
      expiresAt: 'Expires at:',
      instanceType: 'Instance type:',
      terminalAccess: 'Terminal Access',
      copyLink: 'Copy link',
      open: 'Open',
      hide: 'Hide',
      preview: 'Preview',
      previewInfo: 'Shared terminal preview - Access level:',
      stopTerminal: 'Stop terminal (owner access required)',
      stop: 'Stop',
      hideInactive: 'Hide this inactive terminal',
      hideBtn: 'Hide',
      readOnlyAccess: 'Read-only access',
      noSharedSessions: 'No shared sessions',
      noSharedDescription: 'No terminal is currently shared with you.',
      noSharedHelp: 'Ask a colleague to share a terminal with you or',
      createOwnSession: 'create your own session',
      accessRead: 'Read',
      accessWrite: 'Write',
      accessOwner: 'Owner',
      confirmHide: 'Are you sure you want to hide this inactive terminal?',
      confirmHideTitle: 'Hide terminal',
      viewHistory: 'History',
      hideHistory: 'Hide History',
      inactiveLabel: 'INACTIVE',
      loadError: 'Error loading shared sessions',
      stopError: 'Error stopping session',
      hideError: 'Error hiding terminal'
    }
  },
  fr: {
    shared: {
      title: 'Sessions Partagées avec Moi',
      description: 'Accédez aux terminaux que d\'autres utilisateurs ont partagés avec vous. Votre niveau d\'accès détermine les actions que vous pouvez effectuer.',
      sharedTerminals: 'Terminaux Partagés',
      refresh: 'Actualiser',
      loading: 'Chargement des sessions partagées...',
      terminalId: 'Terminal ID :',
      sessionId: 'Session ID :',
      sharedBy: 'Partagé par :',
      sharedAt: 'Partagé le :',
      expiresAt: 'Expire le :',
      instanceType: 'Type d\'instance :',
      terminalAccess: 'Accès Terminal',
      copyLink: 'Copier le lien',
      open: 'Ouvrir',
      hide: 'Masquer',
      preview: 'Aperçu',
      previewInfo: 'Aperçu du terminal partagé - Niveau d\'accès :',
      stopTerminal: 'Arrêter le terminal (accès propriétaire requis)',
      stop: 'Arrêter',
      hideInactive: 'Masquer ce terminal inactif',
      hideBtn: 'Masquer',
      readOnlyAccess: 'Accès lecture seule',
      noSharedSessions: 'Aucune session partagée',
      noSharedDescription: 'Aucun terminal n\'est actuellement partagé avec vous.',
      noSharedHelp: 'Demandez à un collègue de partager un terminal avec vous ou',
      createOwnSession: 'créez votre propre session',
      accessRead: 'Lecture',
      accessWrite: 'Écriture',
      accessOwner: 'Propriétaire',
      confirmHide: 'Êtes-vous sûr de vouloir masquer ce terminal inactif ?',
      confirmHideTitle: 'Masquer le terminal',
      viewHistory: 'Historique',
      hideHistory: 'Masquer l\'historique',
      inactiveLabel: 'INACTIF',
      loadError: 'Erreur lors du chargement des sessions partagées',
      stopError: 'Erreur lors de l\'arrêt de la session',
      hideError: 'Erreur lors du masquage du terminal'
    }
  }
})

const { showConfirm } = useNotification()

// États pour les sessions partagées
const sharedSessions = ref<SharedTerminalInfo[]>([])
const isLoadingShared = ref(false)
const users = ref<Map<string, User>>(new Map())
const error = ref('')

// État pour l'affichage de l'historique des commandes
const expandedHistory = ref(new Set<string>())

// États pour les fonctionnalités iframe
const showPreviews = ref(new Set())
const copiedSessions = ref(new Set())

const instanceTypes = ref([])

onMounted(() => {
  loadSharedSessions()
  loadInstanceTypes()

  // Rafraîchir les sessions toutes les 30 secondes
  const interval = setInterval(() => {
    loadSharedSessions()
  }, 30000)

  // Cleanup
  return () => clearInterval(interval)
})

async function loadSharedSessions() {
  if (isLoadingShared.value) return

  isLoadingShared.value = true
  error.value = ''

  try {
    const result = await terminalService.getSharedTerminals()

    // Ensure we always have an array, even if API returns null/undefined
    sharedSessions.value = Array.isArray(result) ? result : []

    // Load user information for shared sessions
    if (sharedSessions.value && sharedSessions.value.length > 0) {
      await loadUserInfoForSharedSessions(sharedSessions.value)
    }
  } catch (err: any) {
    console.error('Error loading shared sessions:', err)
    error.value = extractErrorMessage(err, t('shared.loadError'))
    sharedSessions.value = []
  } finally {
    isLoadingShared.value = false
  }
}

async function loadUserInfoForSharedSessions(sessions: SharedTerminalInfo[]) {
  try {
    // Get all unique user IDs that we need to fetch
    const userIds = Array.from(new Set([
      ...sessions.map(session => session.shared_by),
      ...sessions.map(session => session.terminal.user_id)
    ]))

    // Only fetch users we don't already have
    const missingUserIds = userIds.filter(id => !users.value.has(id))

    if (missingUserIds.length > 0) {
      const fetchedUsers = await userService.getUsersByIds(missingUserIds)

      // Update the users cache
      fetchedUsers.forEach(user => {
        users.value.set(user.id, user)
      })
    }
  } catch (err: any) {
    console.error('Error loading user information:', err)
    // Don't show error to user, just fallback to showing UUIDs
  }
}

function getUserDisplayName(userId: string): string {
  const user = users.value.get(userId)
  if (user) {
    return user.name || user.email || userId
  }
  return userId
}

async function stopSession(sessionId: string) {
  if (!sessionId) {
    console.error('Session ID manquant')
    return
  }

  try {
    await axios.post(`/terminals/${sessionId}/stop`)
    await loadSharedSessions()
  } catch (err: any) {
    console.error('Error stopping session:', err)
    error.value = extractErrorMessage(err, t('shared.stopError'))
  }
}

function formatDate(dateString: string) {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleString('fr-FR')
  } catch (e) {
    return dateString
  }
}

function getStatusClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'active': return 'text-success'
    case 'expired': return 'text-danger'
    case 'stopped': return 'text-muted'
    default: return 'text-warning'
  }
}

// Fonctions utilitaires pour les niveaux d'accès
function getAccessIcon(level: string) {
  switch (level) {
    case 'read': return 'fas fa-eye'
    case 'write': return 'fas fa-edit'
    case 'owner': return 'fas fa-crown'
    default: return 'fas fa-question'
  }
}

function getAccessLabel(level: string) {
  switch (level) {
    case 'read': return t('shared.accessRead')
    case 'write': return t('shared.accessWrite')
    case 'owner': return t('shared.accessOwner')
    default: return level
  }
}

function getAccessBadgeClass(level: string) {
  switch (level) {
    case 'read': return 'read-badge'
    case 'write': return 'write-badge'
    case 'owner': return 'owner-badge'
    default: return 'default-badge'
  }
}

// Fonctions pour les fonctionnalités iframe
function getTerminalUrl(sessionId: string) {
  const baseUrl = window.location.origin
  return `${baseUrl}/terminal/${sessionId}?header=true&footer=false`
}

function openTerminalInNewTab(sessionId: string) {
  const url = getTerminalUrl(sessionId)
  window.open(url, '_blank', 'width=1000,height=600,menubar=no,toolbar=no,location=no,status=no')
}

async function copyUrlToClipboard(sessionId: string) {
  try {
    const url = getTerminalUrl(sessionId)
    await navigator.clipboard.writeText(url)

    copiedSessions.value.add(sessionId)
    setTimeout(() => {
      copiedSessions.value.delete(sessionId)
    }, 2000)
  } catch (err) {
    console.error('Erreur lors de la copie:', err)
    fallbackCopyTextToClipboard(getTerminalUrl(sessionId))
  }
}

function toggleIframePreview(sessionId: string) {
  if (showPreviews.value.has(sessionId)) {
    showPreviews.value.delete(sessionId)
  } else {
    showPreviews.value.add(sessionId)
  }
}

function toggleHistory(sessionId: string) {
  if (expandedHistory.value.has(sessionId)) {
    expandedHistory.value.delete(sessionId)
  } else {
    expandedHistory.value.add(sessionId)
  }
}

function fallbackCopyTextToClipboard(text: string) {
  const textArea = document.createElement('textarea')
  textArea.value = text
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  try {
    document.execCommand('copy')
  } catch (err) {
    console.error('Fallback: Could not copy text: ', err)
  }
  document.body.removeChild(textArea)
}

async function loadInstanceTypes() {
  try {
    instanceTypes.value = await terminalService.getInstanceTypes()
  } catch (error) {
    console.error('Failed to load instance types:', error)
  }
}

function getInstanceName(prefix: string) {
  if (!prefix || !instanceTypes.value.length) {
    return prefix || 'Unknown'
  }
  const instance = instanceTypes.value.find(type => type.prefix === prefix)
  return instance ? instance.name : prefix
}

function isTerminalInactive(status: string): boolean {
  return ['expired', 'stopped', 'terminated'].includes(status?.toLowerCase())
}

// Fonction pour afficher le nom du terminal
function getTerminalDisplayName(terminal: any): string {
  if (terminal.name && terminal.name.trim()) {
    return terminal.name
  }
  // Fallback: show "Terminal {prefix}" using first 8 chars of session_id
  const prefix = terminal.session_id ? terminal.session_id.substring(0, 8) : 'unknown'
  return `Terminal ${prefix}`
}

async function discardTerminal(terminalId: string) {
  const confirmed = await showConfirm(
    t('shared.confirmHide'),
    t('shared.confirmHideTitle')
  )
  if (!confirmed) {
    return
  }

  try {
    await axios.post(`/terminals/${terminalId}/hide`)

    // Remove from local display after successful API call
    sharedSessions.value = sharedSessions.value.filter(
      session => session.terminal.id !== terminalId
    )
  } catch (err: any) {
    console.error('Error hiding terminal:', err)
    error.value = extractErrorMessage(err, t('shared.hideError'))
  }
}
</script>

<style scoped>
.shared-sessions-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 600px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h2 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-3xl);
}

.page-description {
  color: var(--color-text-muted);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  max-width: 600px;
  margin: 0 auto;
}

.sessions-section {
  width: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  color: var(--color-gray-700);
}

.loading-section {
  text-align: center;
  padding: 40px;
  color: var(--color-gray-600);
  font-size: 16px;
}

.empty-section {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-gray-600);
}

.empty-section i {
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-section h4 {
  margin-bottom: 10px;
}

.sessions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.session-card {
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  background: var(--color-bg-primary);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.session-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Styles pour les fonctionnalités de partage */
.shared-terminal {
  border-left: 4px solid var(--color-info);
}

.shared-terminal .card-header {
  background-color: var(--color-info-bg);
}

/* Styles pour les terminaux inactifs */
.inactive-terminal {
  position: relative;
  opacity: 0.7;
  border-left-color: var(--color-gray-600) !important;
  background-color: var(--color-gray-50);
}

.inactive-terminal .card-header {
  background-color: var(--color-gray-200) !important;
  color: var(--color-gray-600);
}

.inactive-label {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--color-gray-600);
  color: var(--color-white);
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  z-index: 2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.card-header {
  padding: 15px 20px;
  background-color: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-id {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-gray-700);
}

.status-badge {
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
}

.card-body {
  padding: 20px;
}

.session-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-row .label {
  font-weight: 600;
  color: var(--color-gray-600);
  font-size: 14px;
}

.detail-row .value {
  color: var(--color-gray-700);
  font-size: 14px;
  word-break: break-all;
}

.sharing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.access-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
}

.read-badge {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
  border: 1px solid var(--color-info-border);
}

.write-badge {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success-border);
}

.owner-badge {
  background-color: var(--color-gray-200);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
}

.access-note {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-gray-600);
  font-size: 12px;
  font-style: italic;
}

/* Styles spécifiques pour les fonctionnalités iframe */
.iframe-section {
  margin-top: 20px;
  padding: 15px;
  background-color: var(--color-gray-50);
  border-radius: 6px;
  border: 1px solid var(--color-gray-300);
}

.iframe-title {
  margin: 0 0 15px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-gray-700);
  display: flex;
  align-items: center;
  gap: 5px;
}

.iframe-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.url-display {
  display: flex;
  gap: 5px;
}

.url-input {
  flex: 1;
  padding: 6px 10px;
  font-size: 12px;
  border: 1px solid var(--color-gray-400);
  border-radius: 4px;
  background-color: var(--color-white);
  font-family: monospace;
}

.iframe-actions {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.iframe-preview {
  margin-top: 15px;
}

.iframe-container {
  border: 2px solid var(--color-gray-300);
  border-radius: 4px;
  overflow: hidden;
}

.iframe-info {
  margin: 10px 0 0 0;
  font-size: 12px;
  color: var(--color-gray-600);
  display: flex;
  align-items: center;
  gap: 5px;
}

.card-actions {
  padding: 15px 20px;
  background-color: var(--color-gray-50);
  border-top: 1px solid var(--color-gray-200);
  text-align: right;
}

.alert {
  padding: 12px 15px;
  border-radius: 4px;
  margin: 15px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-danger {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: 1px solid var(--color-danger-border);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: normal;
  line-height: 1.42857143;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
  border-radius: 3px;
}

.btn-primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.btn-secondary {
  background-color: var(--color-gray-600);
  border-color: var(--color-gray-600);
  color: var(--color-white);
}

.btn-info {
  background-color: var(--color-info);
  border-color: var(--color-info);
  color: var(--color-white);
}

.btn-danger {
  background-color: var(--color-danger);
  border-color: var(--color-danger);
  color: var(--color-white);
}

.btn-outline-secondary {
  background-color: transparent;
  border-color: var(--color-gray-600);
  color: var(--color-gray-600);
}

.btn-outline-danger {
  background-color: transparent;
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.header-actions {
  display: flex;
  gap: 10px;
}

.status-group {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.text-success { color: var(--color-success) !important; }
.text-danger { color: var(--color-danger) !important; }
.text-warning { color: var(--color-warning) !important; }
.text-muted { color: var(--color-gray-600) !important; }

.instance-type {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: var(--color-info);
}

.instance-type i {
  color: var(--color-gray-600);
  opacity: 0.7;
}

.shared-history-section {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
  background-color: var(--color-bg-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .shared-sessions-page {
    padding: 10px;
  }

  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .sessions-grid {
    grid-template-columns: 1fr;
  }

  .iframe-actions {
    flex-direction: column;
  }

  .iframe-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .status-group {
    align-items: flex-start;
  }
}
</style>