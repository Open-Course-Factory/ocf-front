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
      <h2>Sessions Partagées avec Moi</h2>
      <p class="page-description">
        Accédez aux terminaux que d'autres utilisateurs ont partagés avec vous.
        Votre niveau d'accès détermine les actions que vous pouvez effectuer.
      </p>
    </div>

    <div class="sessions-section">
      <div class="section-header">
        <h3>Terminaux Partagés ({{ sharedSessions.length }})</h3>
        <div class="header-actions">
          <button class="btn btn-secondary" @click="loadSharedSessions">
            <i class="fas fa-sync" :class="{ 'fa-spin': isLoadingShared }"></i>
            Actualiser
          </button>
        </div>
      </div>

      <div v-if="isLoadingShared && sharedSessions.length === 0" class="loading-section">
        <i class="fas fa-spinner fa-spin"></i> Chargement des sessions partagées...
      </div>

      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
        <button class="btn btn-sm btn-outline-danger" @click="error = ''; loadSharedSessions()">
          Réessayer
        </button>
      </div>

      <div v-if="sharedSessions.length > 0" class="sessions-grid">
        <div v-for="sharedSession in sharedSessions" :key="sharedSession.terminal.id" class="session-card shared-terminal">

          <!-- En-tête avec indicateur de partage -->
          <div class="card-header">
            <h5 class="session-id">{{ sharedSession.terminal.session_id }}</h5>
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
                <span class="label">Terminal ID:</span>
                <span class="value">{{ sharedSession.terminal.id }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Session ID:</span>
                <span class="value">{{ sharedSession.terminal.session_id }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Partagé par:</span>
                <span class="value">{{ getUserDisplayName(sharedSession.shared_by) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Partagé le:</span>
                <span class="value">{{ formatDate(sharedSession.shared_at) }}</span>
              </div>
              <div class="detail-row" v-if="sharedSession.expires_at">
                <span class="label">Expire le:</span>
                <span class="value">{{ formatDate(sharedSession.expires_at) }}</span>
              </div>
              <div class="detail-row" v-if="sharedSession.terminal.instance_type">
                <span class="label">Type d'instance:</span>
                <span class="value instance-type">
                  {{ getInstanceName(sharedSession.terminal.instance_type) }}
                  <i class="fas fa-server" title="Instance type"></i>
                </span>
              </div>
            </div>

            <!-- Section intégration iframe pour les sessions actives -->
            <div class="iframe-section" v-if="sharedSession.terminal.status === 'active' && ['write', 'admin'].includes(sharedSession.access_level)">
              <h6 class="iframe-title">
                <i class="fas fa-external-link-alt"></i>
                Accès Terminal
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
                    :title="'Copier le lien'"
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
                    Ouvrir
                  </button>

                  <button
                    class="btn btn-info btn-sm"
                    @click="toggleIframePreview(sharedSession.terminal.session_id)"
                  >
                    <i :class="showPreviews.has(sharedSession.terminal.session_id) ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    {{ showPreviews.has(sharedSession.terminal.session_id) ? 'Masquer' : 'Aperçu' }}
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
                  Aperçu du terminal partagé - Niveau d'accès: {{ getAccessLabel(sharedSession.access_level) }}
                </p>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <button
              v-if="sharedSession.terminal.status === 'active' && sharedSession.access_level === 'admin'"
              class="btn btn-danger btn-sm"
              @click="stopSession(sharedSession.terminal.session_id)"
              title="Arrêter le terminal (accès admin requis)"
            >
              <i class="fas fa-stop"></i>
              Arrêter
            </button>
            <span v-else-if="sharedSession.access_level === 'read'" class="access-note">
              <i class="fas fa-eye"></i>
              Accès lecture seule
            </span>
          </div>
        </div>
      </div>

      <div v-else class="empty-section">
        <i class="fas fa-share-alt fa-3x"></i>
        <h4>Aucune session partagée</h4>
        <p>Aucun terminal n'est actuellement partagé avec vous.</p>
        <p class="text-muted">
          <small>
            Demandez à un collègue de partager un terminal avec vous ou
            <router-link to="/terminal-creation">créez votre propre session</router-link>.
          </small>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { terminalService, type SharedTerminalInfo } from '../../services/terminalService'
import { userService, type User } from '../../services/userService'
import axios from 'axios'

// États pour les sessions partagées
const sharedSessions = ref<SharedTerminalInfo[]>([])
const isLoadingShared = ref(false)
const users = ref<Map<string, User>>(new Map())
const error = ref('')

// États pour les fonctionnalités iframe
const showPreviews = ref(new Set())
const copiedSessions = ref(new Set())

const instanceTypes = ref([])

onMounted(() => {
  console.log('SharedSessions mounted')
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
    console.log('Loading shared sessions...')
    sharedSessions.value = await terminalService.getSharedTerminals()
    console.log('Shared sessions loaded:', sharedSessions.value)

    // Load user information for shared sessions
    if (sharedSessions.value.length > 0) {
      await loadUserInfoForSharedSessions(sharedSessions.value)
    }
  } catch (err: any) {
    console.error('Erreur lors du chargement des sessions partagées:', err)
    error.value = err.response?.data?.error_message || 'Erreur lors du chargement des sessions partagées'
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
    console.log('Stopping session:', sessionId)
    await axios.post(`/terminal-sessions/${sessionId}/stop`)
    await loadSharedSessions()
    console.log('Session stopped successfully')
  } catch (err: any) {
    console.error('Erreur lors de l\'arrêt:', err)
    error.value = err.response?.data?.error_message || 'Erreur lors de l\'arrêt de la session'
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
    case 'admin': return 'fas fa-cog'
    case 'owner': return 'fas fa-crown'
    default: return 'fas fa-question'
  }
}

function getAccessLabel(level: string) {
  switch (level) {
    case 'read': return 'Lecture'
    case 'write': return 'Écriture'
    case 'admin': return 'Admin'
    case 'owner': return 'Propriétaire'
    default: return level
  }
}

function getAccessBadgeClass(level: string) {
  switch (level) {
    case 'read': return 'read-badge'
    case 'write': return 'write-badge'
    case 'admin': return 'admin-badge'
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
    console.log('Instance types loaded:', instanceTypes.value)
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
  margin: 0 0 15px 0;
  color: #333;
  font-size: 2rem;
}

.page-description {
  color: #6c757d;
  font-size: 1.1rem;
  line-height: 1.6;
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
  color: #495057;
}

.loading-section {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-size: 16px;
}

.empty-section {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
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
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: white;
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.session-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Styles pour les fonctionnalités de partage */
.shared-terminal {
  border-left: 4px solid #17a2b8;
}

.shared-terminal .card-header {
  background-color: #e1f5fe;
}

.card-header {
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-id {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #495057;
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
  color: #6c757d;
  font-size: 14px;
}

.detail-row .value {
  color: #495057;
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
  background-color: #cce7ff;
  color: #004085;
  border: 1px solid #b3d7ff;
}

.write-badge {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.admin-badge {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.owner-badge {
  background-color: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}

.access-note {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6c757d;
  font-size: 12px;
  font-style: italic;
}

/* Styles spécifiques pour les fonctionnalités iframe */
.iframe-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.iframe-title {
  margin: 0 0 15px 0;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
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
  border: 1px solid #ced4da;
  border-radius: 4px;
  background-color: #fff;
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
  border: 2px solid #dee2e6;
  border-radius: 4px;
  overflow: hidden;
}

.iframe-info {
  margin: 10px 0 0 0;
  font-size: 12px;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 5px;
}

.card-actions {
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
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
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
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
  background-color: #007bff;
  border-color: #007bff;
  color: #fff;
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: #fff;
}

.btn-info {
  background-color: #17a2b8;
  border-color: #17a2b8;
  color: #fff;
}

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
}

.btn-outline-secondary {
  background-color: transparent;
  border-color: #6c757d;
  color: #6c757d;
}

.btn-outline-danger {
  background-color: transparent;
  border-color: #dc3545;
  color: #dc3545;
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

.text-success { color: #28a745 !important; }
.text-danger { color: #dc3545 !important; }
.text-warning { color: #ffc107 !important; }
.text-muted { color: #6c757d !important; }

.instance-type {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #17a2b8;
}

.instance-type i {
  color: #6c757d;
  opacity: 0.7;
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