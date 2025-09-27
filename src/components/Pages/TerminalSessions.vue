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
  <div class="terminals-page">
    <div class="page-header">
      <h2>Gestion des Sessions Terminal</h2>
      <div class="sync-info" v-if="lastSyncTime">
        <small class="text-muted">
          <i class="fas fa-sync"></i>
          Dernière sync: {{ formatSyncTime(lastSyncTime) }}
        </small>
      </div>
    </div>

    <!-- Navigation par onglets -->
    <div class="tabs-navigation">
      <button
        :class="['tab-btn', { active: activeTab === 'starter' }]"
        @click="activeTab = 'starter'"
      >
        <i class="fas fa-play"></i>
        Nouvelle Session
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'sessions' }]"
        @click="activeTab = 'sessions'; loadSessions()"
      >
        <i class="fas fa-list"></i>
        Mes Sessions ({{ sessions.length }})
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'shared' }]"
        @click="activeTab = 'shared'; loadSharedSessions()"
      >
        <i class="fas fa-share-alt"></i>
        Partagées avec moi ({{ sharedSessions.length }})
      </button>
    </div>

    <!-- Contenu des onglets -->
    <div class="tab-content">
      <!-- Onglet Nouvelle Session -->
      <div v-if="activeTab === 'starter'" class="tab-pane active">
        <div class="starter-container">
          <Suspense>
            <template #default>
              <TerminalStarter @session-started="onSessionStarted" />
            </template>
            <template #fallback>
              <div class="loading-fallback">
                <i class="fas fa-spinner fa-spin"></i>
                Chargement du terminal...
              </div>
            </template>
          </Suspense>
        </div>
      </div>

      <!-- Onglet Sessions Actives -->
      <div v-if="activeTab === 'sessions'" class="tab-pane active">
        <div class="sessions-section">
          <div class="section-header">
            <h3>Mes Sessions Terminal</h3>
            <div class="header-actions">
              <!-- Bouton de synchronisation globale -->
              <button
                class="btn btn-info"
                @click="syncAllSessions"
                :disabled="isSyncing"
                title="Synchroniser toutes les sessions avec l'API Terminal Trainer"
              >
                <i :class="isSyncing ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
                {{ isSyncing ? 'Synchronisation...' : 'Tout synchroniser' }}
              </button>
              <button class="btn btn-secondary" @click="loadSessions">
                <i class="fas fa-sync" :class="{ 'fa-spin': isLoading }"></i>
                Actualiser
              </button>
            </div>
          </div>

          <div v-if="isLoading && sessions.length === 0" class="loading-section">
            <i class="fas fa-spinner fa-spin"></i> Chargement des sessions...
          </div>

          <div v-else-if="error" class="alert alert-danger">
            {{ error }}
            <button class="btn btn-sm btn-outline-danger" @click="error = ''; loadSessions()">
              Réessayer
            </button>
          </div>

          <div v-if="sessions.length > 0" class="sessions-grid">
            <div v-for="session in sessions" :key="session.id || session.session_id" class="session-card">
              
              <!-- En-tête avec indicateur de sync -->
              <div class="card-header">
                <h5 class="session-id">{{ session.session_id }}</h5>
                <div class="status-group">
                  <span :class="['status-badge', getStatusClass(session.status)]">
                    <i class="fas fa-circle"></i>
                    {{ session.status || 'unknown' }}
                  </span>
                  <!-- NOUVEAU: Indicateur de sync -->
                  <div v-if="getSyncResultForSession(session.session_id)" class="sync-indicator">
                    <span v-if="getSyncResultForSession(session.session_id).updated" 
                          class="sync-badge updated" 
                          title="Statut mis à jour par la synchronisation">
                      <i class="fas fa-arrow-up"></i>
                      Synchronisé
                    </span>
                    <span v-else 
                          class="sync-badge current" 
                          title="Statut à jour">
                      <i class="fas fa-check"></i>
                      À jour
                    </span>
                  </div>
                </div>
              </div>

              <div class="card-body">
                <div class="session-details">
                  <div class="detail-row">
                    <span class="label">Terminal ID:</span>
                    <span class="value">{{ session.id }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Session ID:</span>
                    <span class="value">{{ session.session_id }}</span>
                  </div>
                  <div class="detail-row" v-if="session.created_at">
                    <span class="label">Créée le:</span>
                    <span class="value">{{ formatDate(session.created_at) }}</span>
                  </div>
                  <div class="detail-row" v-if="session.expires_at">
                    <span class="label">Expire le:</span>
                    <span class="value">{{ formatDate(session.expires_at) }}</span>
                  </div>
                  <div class="detail-row" v-if="session.user_id">
                    <span class="label">Utilisateur:</span>
                    <span class="value">{{ session.user_id }}</span>
                  </div>
                  <div class="detail-row" v-if="session.instance_type">
                    <span class="label">Type d'instance:</span>
                    <span class="value instance-type">
                      {{ getInstanceName(session.instance_type) }}
                      <i class="fas fa-server" title="Instance type"></i>
                    </span>
                  </div>
                </div>

                <div v-if="getSyncResultForSession(session.session_id)" class="sync-details">
                  <h6 class="sync-title">
                    <i class="fas fa-sync-alt"></i>
                    Dernière synchronisation
                  </h6>
                  <div class="sync-info-grid">
                    <div class="sync-info-item">
                      <span class="label">Statut précédent:</span>
                      <span class="value">{{ getSyncResultForSession(session.session_id).previous_status }}</span>
                    </div>
                    <div class="sync-info-item">
                      <span class="label">Statut actuel:</span>
                      <span class="value">{{ getSyncResultForSession(session.session_id).current_status }}</span>
                    </div>
                    <div class="sync-info-item">
                      <span class="label">Heure de sync:</span>
                      <span class="value">{{ formatSyncTime(getSyncResultForSession(session.session_id).last_sync_at) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Section intégration iframe -->
                <div class="iframe-section" v-if="session.status === 'active'">
                  <h6 class="iframe-title">
                    <i class="fas fa-external-link-alt"></i>
                    Accès Terminal
                  </h6>
                  
                  <div class="iframe-controls">
                    <div class="url-display">
                      <input 
                        :value="getTerminalUrl(session.session_id)"
                        readonly
                        class="url-input"
                        ref="urlInput"
                      />
                      <button 
                        class="btn btn-outline-secondary btn-sm"
                        @click="copyUrlToClipboard(session.session_id)"
                        :title="'Copier le lien'"
                      >
                        <i :class="copiedSessions.has(session.session_id) ? 'fas fa-check' : 'fas fa-copy'"></i>
                      </button>
                    </div>
                    
                    <div class="iframe-actions">
                      <button 
                        class="btn btn-primary btn-sm"
                        @click="openTerminalInNewTab(session.session_id)"
                      >
                        <i class="fas fa-external-link-alt"></i>
                        Ouvrir
                      </button>
                      
                      <button 
                        class="btn btn-info btn-sm"
                        @click="toggleIframePreview(session.session_id)"
                      >
                        <i :class="showPreviews.has(session.session_id) ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                        {{ showPreviews.has(session.session_id) ? 'Masquer' : 'Aperçu' }}
                      </button>
                      
                      <button 
                        class="btn btn-warning btn-sm"
                        @click="copyIframeCode(session.session_id)"
                        :title="'Copier le code iframe'"
                      >
                        <i :class="copiedIframes.has(session.session_id) ? 'fas fa-check' : 'fas fa-code'"></i>
                        iframe
                      </button>
                    </div>
                  </div>

                  <!-- Aperçu iframe -->
                  <div v-if="showPreviews.has(session.session_id)" class="iframe-preview">
                    <div class="iframe-container">
                      <iframe 
                        :src="getTerminalUrl(session.session_id)"
                        width="100%"
                        height="300"
                        frameborder="0"
                        :title="`Terminal ${session.session_id}`"
                      ></iframe>
                    </div>
                    <p class="iframe-info">
                      <i class="fas fa-info-circle"></i>
                      Aperçu du terminal intégrable - Taille: 100% x 300px
                    </p>
                  </div>
                </div>
              </div>

              <div class="card-actions">
                <button
                  class="btn btn-info btn-sm"
                  @click="syncSession(session.session_id)"
                  title="Synchroniser cette session avec l'API Terminal Trainer"
                >
                  <i class="fas fa-sync-alt"></i>
                  Sync
                </button>
                <button
                  class="btn btn-success btn-sm"
                  @click="openSharingModal(session.session_id)"
                  title="Partager ce terminal"
                >
                  <i class="fas fa-share-alt"></i>
                  Partager
                </button>
                <button
                  class="btn btn-warning btn-sm"
                  @click="openAccessModal(session.session_id)"
                  title="Gérer les accès"
                >
                  <i class="fas fa-users-cog"></i>
                  Accès
                </button>
                <button
                  class="btn btn-danger btn-sm"
                  @click="stopSession(session.session_id)"
                  :disabled="session.status !== 'active'"
                >
                  <i class="fas fa-stop"></i>
                  Arrêter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Onglet Sessions Partagées -->
      <div v-if="activeTab === 'shared'" class="tab-pane active">
        <div class="sessions-section">
          <div class="section-header">
            <h3>Sessions Partagées avec Moi</h3>
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
          </div>
        </div>
      </div>
    </div>

    <!-- Modal pour le code iframe -->
    <div v-if="showIframeModal" class="modal-overlay" @click="showIframeModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Code d'intégration iframe</h3>
          <button class="modal-close" @click="showIframeModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Copiez ce code pour intégrer le terminal dans votre page :</p>
          <textarea 
            :value="currentIframeCode" 
            readonly 
            class="iframe-code"
            rows="4"
            ref="iframeCodeRef"
          ></textarea>
          <div class="modal-actions">
            <button class="btn btn-primary" @click="copyIframeCodeToClipboard">
              <i class="fas fa-copy"></i>
              Copier le code
            </button>
            <button class="btn btn-secondary" @click="showIframeModal = false">
              <i class="fas fa-times"></i>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSyncModal" class="modal-overlay" @click="showSyncModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-sync-alt"></i>
            Résultats de la synchronisation
          </h3>
          <button class="modal-close" @click="showSyncModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="syncAllResults">
          <div class="sync-summary">
            <div class="summary-item">
              <span class="label">Sessions totales:</span>
              <span class="value">{{ syncAllResults.total_sessions }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Sessions synchronisées:</span>
              <span class="value">{{ syncAllResults.synced_sessions }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Sessions mises à jour:</span>
              <span class="value">{{ syncAllResults.updated_sessions || 0 }}</span>
            </div>
            <div class="summary-item" v-if="syncAllResults.error_count > 0">
              <span class="label">Erreurs:</span>
              <span class="value text-danger">{{ syncAllResults.error_count }}</span>
            </div>
          </div>
          
          <div v-if="syncAllResults.errors && syncAllResults.errors.length > 0" class="sync-errors">
            <h4>Erreurs rencontrées:</h4>
            <ul>
              <li v-for="error in syncAllResults.errors" :key="error" class="text-danger">
                {{ error }}
              </li>
            </ul>
          </div>
          
          <div class="modal-actions">
            <button class="btn btn-primary" @click="showSyncModal = false">
              <i class="fas fa-check"></i>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals de partage -->
    <TerminalSharingModal
      :show="showSharingModal"
      :terminal-id="selectedTerminalId"
      @close="closeSharingModal"
      @shared="onTerminalShared"
    />

    <TerminalAccessModal
      :show="showAccessModal"
      :terminal-id="selectedTerminalId"
      :refresh-trigger="accessModalRefreshTrigger"
      @close="closeAccessModal"
      @open-sharing="openSharingModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue'
import axios from 'axios'
import { terminalService, type SharedTerminalInfo } from '../../services/terminalService'
import { userService, type User } from '../../services/userService'

// Import dynamique des composants
const TerminalStarter = defineAsyncComponent(() => import('../Terminal/TerminalStarter.vue'))
const TerminalSharingModal = defineAsyncComponent(() => import('../Terminal/TerminalSharingModal.vue'))
const TerminalAccessModal = defineAsyncComponent(() => import('../Terminal/TerminalAccessModal.vue'))

const sessions = ref([])
const isLoading = ref(false)
const error = ref('')
const activeTab = ref('starter')

// États pour les fonctionnalités iframe
const showPreviews = ref(new Set())
const copiedSessions = ref(new Set())
const copiedIframes = ref(new Set())
const showIframeModal = ref(false)
const currentIframeCode = ref('')
const urlInput = ref(null)
const iframeCodeRef = ref(null)

const isSyncing = ref(false)
const lastSyncTime = ref(null)
const syncResults = ref(new Map()) // Map<sessionId, syncResult>
const showSyncModal = ref(false)
const syncAllResults = ref(null)

const instanceTypes = ref([])

// États pour les fonctionnalités de partage
const sharedSessions = ref<SharedTerminalInfo[]>([])
const isLoadingShared = ref(false)
const users = ref<Map<string, User>>(new Map()) // Cache for user data
const showSharingModal = ref(false)
const showAccessModal = ref(false)
const selectedTerminalId = ref<string | null>(null)
const accessModalRefreshTrigger = ref(0)

onMounted(() => {
  console.log('TerminalsSimple mounted')
  loadSessions()
  loadInstanceTypes()

  // Rafraîchir les sessions toutes les 30 secondes si on est sur l'onglet sessions
  const interval = setInterval(() => {
    if (activeTab.value === 'sessions') {
      loadSessions()
    }
  }, 30000)

  // Cleanup
  return () => clearInterval(interval)
})

async function loadSessions() {
  if (isLoading.value) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    console.log('Loading sessions...')
    const response = await axios.get('/terminal-sessions/user-sessions')
    sessions.value = response.data || []
    console.log('Sessions loaded:', sessions.value)
  } catch (err: any) {
    console.error('Erreur lors du chargement des sessions:', err)
    error.value = err.response?.data?.error_message || 'Erreur lors du chargement des sessions'
    sessions.value = []
  } finally {
    isLoading.value = false
  }
}

async function stopSession(sessionId: string) {
  if (!sessionId) {
    console.error('Session ID manquant')
    return
  }
  
  try {
    console.log('Stopping session:', sessionId)
    await axios.post(`/terminal-sessions/${sessionId}/stop`)
    await loadSessions()
    console.log('Session stopped successfully')
  } catch (err: any) {
    console.error('Erreur lors de l\'arrêt:', err)
    error.value = err.response?.data?.error_message || 'Erreur lors de l\'arrêt de la session'
  }
}

function onSessionStarted() {
  console.log('Session started, switching to sessions tab')
  activeTab.value = 'sessions'
  loadSessions()
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
    // Fallback pour les navigateurs qui ne supportent pas navigator.clipboard
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

function copyIframeCode(sessionId: string) {
  const url = getTerminalUrl(sessionId)
  currentIframeCode.value = `<iframe src="${url}" width="100%" height="600" frameborder="0" title="Terminal OCF"></iframe>`
  
  copyIframeCodeToClipboard()
  
  copiedIframes.value.add(sessionId)
  setTimeout(() => {
    copiedIframes.value.delete(sessionId)
  }, 2000)
}

async function copyIframeCodeToClipboard() {
  try {
    await navigator.clipboard.writeText(currentIframeCode.value)
  } catch (err) {
    console.error('Erreur lors de la copie:', err)
    fallbackCopyTextToClipboard(currentIframeCode.value)
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

// Synchroniser une session spécifique
async function syncSession(sessionId: string) {
  try {
    console.log('Syncing session:', sessionId)
    const response = await axios.post(`/terminal-sessions/${sessionId}/sync`)
    
    // Stocker le résultat de la sync
    syncResults.value.set(sessionId, {
      ...response.data,
      timestamp: new Date()
    })
    
    // Recharger les sessions pour voir les changements
    await loadSessions()
    
    // Afficher un message si le statut a changé
    if (response.data.updated) {
      console.log(`Session ${sessionId} synchronized: ${response.data.previous_status} -> ${response.data.current_status}`)
    }
    
    return response.data
  } catch (err: any) {
    console.error('Erreur lors de la synchronisation:', err)
    error.value = err.response?.data?.error_message || 'Erreur lors de la synchronisation'
    throw err
  }
}

// Synchroniser toutes les sessions
async function syncAllSessions() {
  isSyncing.value = true
  try {
    console.log('Syncing all sessions...')
    const response = await axios.post('/terminal-sessions/sync-all')
    
    syncAllResults.value = response.data
    showSyncModal.value = true
    lastSyncTime.value = new Date()
    
    // Recharger les sessions
    await loadSessions()
    
    console.log('All sessions synchronized:', response.data)
    return response.data
  } catch (err: any) {
    console.error('Erreur lors de la synchronisation globale:', err)
    error.value = err.response?.data?.error_message || 'Erreur lors de la synchronisation globale'
    throw err
  } finally {
    isSyncing.value = false
  }
}

// Utilitaires pour l'affichage
function getSyncResultForSession(sessionId: string) {
  return syncResults.value.get(sessionId)
}

function formatSyncTime(time: Date | string) {
  if (!time) return ''
  return new Date(time).toLocaleTimeString('fr-FR')
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

// Fonctions pour les fonctionnalités de partage
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

function openSharingModal(terminalId: string) {
  selectedTerminalId.value = terminalId
  showSharingModal.value = true
}

function closeSharingModal() {
  showSharingModal.value = false
  selectedTerminalId.value = null
}

function onTerminalShared(terminalId: string) {
  console.log('Terminal shared:', terminalId)
  // Reload sessions to reflect changes and trigger access modal refresh
  loadSessions()
  // Trigger access modal refresh if it's currently open for this terminal
  if (showAccessModal.value && selectedTerminalId.value === terminalId) {
    accessModalRefreshTrigger.value++
  }
}

function openAccessModal(terminalId: string) {
  selectedTerminalId.value = terminalId
  showAccessModal.value = true
}

function closeAccessModal() {
  showAccessModal.value = false
  selectedTerminalId.value = null
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

</script>

<style scoped>
.terminals-page {
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
  margin: 0;
  color: #333;
}

.tabs-navigation {
  display: flex;
  border-bottom: 2px solid #e9ecef;
  margin-bottom: 30px;
}

.tab-btn {
  padding: 12px 24px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: #6c757d;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn:hover {
  color: #495057;
  background-color: #f8f9fa;
}

.tab-btn.active {
  color: #007bff;
  border-bottom-color: #007bff;
  background-color: #fff;
}

.tab-content {
  min-height: 500px;
}

.tab-pane {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease;
}

.tab-pane.active {
  opacity: 1;
  visibility: visible;
  animation: fadeIn 0.3s ease-in-out;
}

.starter-container {
  width: 100%;
  min-height: 400px;
}

.loading-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  font-size: 18px;
  color: #6c757d;
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

.empty-section .btn {
  margin-top: 15px;
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

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
}

.modal-header h3 {
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  padding: 20px;
}

.iframe-code {
  width: 100%;
  font-family: monospace;
  font-size: 12px;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 15px;
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

.btn-warning {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #212529;
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
  align-items: center;
  gap: 10px;
}

.sync-indicator {
  font-size: 0.75rem;
}

.sync-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.7rem;
}

.sync-badge.updated {
  background-color: #e1f5fe;
  color: #01579b;
}

.sync-badge.current {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.sync-details {
  margin-top: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #17a2b8;
}

.sync-title {
  margin: 0 0 10px 0;
  font-size: 0.9rem;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 5px;
}

.sync-info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 5px;
}

.sync-info-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.sync-info-item .label {
  font-weight: 600;
  color: #6c757d;
}

.sync-info-item .value {
  color: #495057;
}

.sync-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.summary-item .label {
  font-size: 0.9rem;
  color: #6c757d;
}

.summary-item .value {
  font-size: 1.2rem;
  font-weight: 600;
}

.sync-errors {
  margin-top: 20px;
}

.sync-errors ul {
  list-style-type: none;
  padding: 0;
}

.sync-errors li {
  padding: 5px 0;
  border-bottom: 1px solid #eee;
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 768px) {
  .terminals-page {
    padding: 10px;
  }
  
  .tabs-navigation {
    flex-direction: column;
  }
  
  .tab-btn {
    justify-content: center;
    padding: 15px;
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
}

/* Styles pour les fonctionnalités de partage */
.shared-terminal {
  border-left: 4px solid #17a2b8;
}

.shared-terminal .card-header {
  background-color: #e1f5fe;
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

.btn-success {
  background-color: #28a745;
  border-color: #28a745;
  color: #fff;
}

.btn-success:hover {
  background-color: #218838;
  border-color: #1e7e34;
}

/* Indicateurs de statut pour les accès partagés */
.status-group {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

@media (max-width: 768px) {
  .status-group {
    align-items: flex-start;
  }
}
</style>