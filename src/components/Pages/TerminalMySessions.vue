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
  <div class="my-sessions-page">
    <div class="page-header">
      <h2>{{ t('terminalMySessions.title') }}</h2>
      <div class="sync-info" v-if="lastSyncTime">
        <small class="text-muted">
          <i class="fas fa-sync"></i>
          {{ t('terminalMySessions.lastSync') }}: {{ formatSyncTime(lastSyncTime) }}
        </small>
      </div>
    </div>

    <div class="sessions-section">
      <div class="section-header">
        <h3>{{ t('terminalMySessions.activeSessions') }} ({{ activeSessionsCount }})</h3>
        <div class="header-actions">
          <!-- Bouton de synchronisation globale -->
          <button
            class="btn btn-info"
            @click="syncAllSessions"
            :disabled="isSyncing"
            :title="t('terminalMySessions.tooltipSyncAll')"
          >
            <i :class="isSyncing ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
            {{ isSyncing ? t('terminalMySessions.buttonSyncing') : t('terminalMySessions.buttonSync') }}
          </button>
          <button class="btn btn-secondary" @click="loadSessions">
            <i class="fas fa-sync" :class="{ 'fa-spin': isLoading }"></i>
            {{ t('terminalMySessions.buttonRefresh') }}
          </button>
          <router-link to="/terminal-creation" class="btn btn-primary">
            <i class="fas fa-plus"></i>
            {{ t('terminalMySessions.buttonNewSession') }}
          </router-link>
          <!-- Bouton global pour masquer toutes les sessions inactives -->
          <button
            class="btn btn-warning"
            @click="hideAllInactiveSessions"
            :disabled="inactiveSessionsCount === 0"
            :title="t('terminalMySessions.tooltipHideAll')"
          >
            <i class="fas fa-eye-slash"></i>
            {{ t('terminalMySessions.buttonHideAllInactive') }}
          </button>
        </div>
      </div>

      <div v-if="isLoading && sessions.length === 0" class="loading-section">
        <i class="fas fa-spinner fa-spin"></i> {{ t('terminalMySessions.loadingSessions') }}
      </div>

      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
        <button class="btn btn-sm btn-outline-danger" @click="error = ''; loadSessions()">
          {{ t('terminalMySessions.errorRetry') }}
        </button>
      </div>

      <div v-if="sessions.length > 0" class="sessions-grid">
        <template v-for="(session, index) in sortedSessions" :key="session.id || session.session_id">
          <!-- Separator between active and inactive sessions -->
          <div
            v-if="index > 0 && !isTerminalInactive(sortedSessions[index - 1].status) && isTerminalInactive(session.status)"
            class="sessions-separator"
          >
            <div class="separator-line"></div>
            <span class="separator-label">{{ t('terminalMySessions.inactiveSessions') }}</span>
            <div class="separator-line"></div>
          </div>

          <div :class="['session-card', { 'inactive-terminal': isTerminalInactive(session.status) }]">

          <!-- En-tête avec indicateur de sync -->
          <div class="card-header">
            <div class="session-title-container">
              <div v-if="!editingNames.has(session.id)" class="session-title-display">
                <h5 class="session-id">{{ getTerminalDisplayName(session) }}</h5>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  icon="fas fa-pencil-alt"
                  @click="startEditingName(session.id, session.name)"
                  :title="t('terminals.editName')"
                  class="btn-edit-name"
                />
              </div>
              <div v-else class="session-title-edit">
                <div class="name-input-wrapper">
                  <div class="name-input-container">
                    <input
                      v-model="editingNames.get(session.id)!.value"
                      type="text"
                      class="name-input"
                      :placeholder="t('terminals.namePlaceholder')"
                      maxlength="255"
                      @keyup.enter="saveName(session.id)"
                      @keyup.esc="cancelEditingName(session.id)"
                      :disabled="savingNames.has(session.id)"
                    />
                    <small class="char-counter">{{ (editingNames.get(session.id)?.value || '').length }}/255</small>
                  </div>
                  <div class="name-edit-actions">
                    <Button
                      variant="primary"
                      size="sm"
                      icon="fas fa-check"
                      @click="saveName(session.id)"
                      :disabled="savingNames.has(session.id)"
                      :loading="savingNames.has(session.id)"
                      :title="t('terminals.saveName')"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      icon="fas fa-times"
                      @click="cancelEditingName(session.id)"
                      :disabled="savingNames.has(session.id)"
                      :title="t('terminals.cancelEdit')"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="status-group">
              <span
                :class="['status-indicator', getStatusClass(session.status)]"
                :title="session.status || 'unknown'"
              >
                <i class="fas fa-circle"></i>
              </span>
              <!-- Indicateur de sync -->
              <div v-if="getSyncResultForSession(session.session_id)" class="sync-indicator">
                <span v-if="getSyncResultForSession(session.session_id).updated"
                      class="sync-badge updated"
                      :title="t('terminalMySessions.synchronized')">
                  <i class="fas fa-arrow-up"></i>
                  {{ t('terminalMySessions.synchronized') }}
                </span>
                <span v-else
                      class="sync-badge current"
                      :title="t('terminalMySessions.upToDate')">
                  <i class="fas fa-check"></i>
                  {{ t('terminalMySessions.upToDate') }}
                </span>
              </div>
            </div>
          </div>

          <div class="card-body">
            <div class="session-details">
              <div class="detail-row">
                <span class="label">{{ t('terminalMySessions.terminalId') }}:</span>
                <span class="value">{{ session.id }}</span>
              </div>
              <div class="detail-row">
                <span class="label">{{ t('terminalMySessions.sessionId') }}:</span>
                <span class="value">{{ session.session_id }}</span>
              </div>
              <div class="detail-row" v-if="session.created_at">
                <span class="label">{{ t('terminalMySessions.createdAt') }}:</span>
                <span class="value">{{ formatDate(session.created_at) }}</span>
              </div>
              <div class="detail-row" v-if="session.expires_at">
                <span class="label">{{ t('terminalMySessions.expiresAt') }}:</span>
                <span class="value">{{ formatDate(session.expires_at) }}</span>
              </div>
              <div class="detail-row" v-if="session.user_id">
                <span class="label">{{ t('terminalMySessions.userId') }}:</span>
                <span class="value">{{ session.user_id }}</span>
              </div>
              <div class="detail-row" v-if="session.instance_type">
                <span class="label">{{ t('terminalMySessions.instanceType') }}:</span>
                <span class="value instance-type">
                  {{ getInstanceName(session.instance_type) }}
                  <i class="fas fa-server" :title="t('terminalMySessions.instanceType')"></i>
                </span>
              </div>
            </div>

            <div v-if="getSyncResultForSession(session.session_id)" class="sync-details">
              <h6 class="sync-title">
                <i class="fas fa-sync-alt"></i>
                {{ t('terminalMySessions.lastSynchronization') }}
              </h6>
              <div class="sync-info-grid">
                <div class="sync-info-item">
                  <span class="label">{{ t('terminalMySessions.previousStatus') }}:</span>
                  <span class="value">{{ getSyncResultForSession(session.session_id).previous_status }}</span>
                </div>
                <div class="sync-info-item">
                  <span class="label">{{ t('terminalMySessions.currentStatus') }}:</span>
                  <span class="value">{{ getSyncResultForSession(session.session_id).current_status }}</span>
                </div>
                <div class="sync-info-item">
                  <span class="label">{{ t('terminalMySessions.syncTime') }}:</span>
                  <span class="value">{{ formatSyncTime(getSyncResultForSession(session.session_id).last_sync_at) }}</span>
                </div>
              </div>
            </div>

            <!-- Section intégration iframe -->
            <div class="iframe-section" v-if="session.status === 'active'">
              <h6 class="iframe-title">
                <i class="fas fa-external-link-alt"></i>
                {{ t('terminalMySessions.terminalAccess') }}
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
                    :title="t('terminalMySessions.copyLink')"
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
                    {{ t('terminalMySessions.buttonOpen') }}
                  </button>

                  <button
                    class="btn btn-info btn-sm"
                    @click="toggleIframePreview(session.session_id)"
                  >
                    <i :class="showPreviews.has(session.session_id) ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    {{ showPreviews.has(session.session_id) ? t('terminalMySessions.buttonHide') : t('terminalMySessions.buttonShow') }}
                  </button>

                  <button
                    class="btn btn-warning btn-sm"
                    @click="copyIframeCode(session.session_id)"
                    :title="t('terminalMySessions.iframeCodeTitle')"
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
                  {{ t('terminalMySessions.iframePreviewInfo') }}
                </p>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <button
              v-if="!isTerminalInactive(session.status)"
              class="btn btn-info btn-sm"
              @click="syncSession(session.session_id)"
              :title="t('terminalMySessions.tooltipSync')"
            >
              <i class="fas fa-sync-alt"></i>
              {{ t('terminalMySessions.buttonSyncSession') }}
            </button>
            <button
              v-if="!isTerminalInactive(session.status)"
              class="btn btn-success btn-sm"
              @click="openSharingModal(session.session_id)"
              :title="t('terminalMySessions.tooltipShare')"
            >
              <i class="fas fa-share-alt"></i>
              {{ t('terminalMySessions.buttonShare') }}
            </button>
            <button
              v-if="!isTerminalInactive(session.status)"
              class="btn btn-warning btn-sm"
              @click="openAccessModal(session.session_id)"
              :title="t('terminalMySessions.tooltipAccess')"
            >
              <i class="fas fa-users-cog"></i>
              {{ t('terminalMySessions.buttonAccess') }}
            </button>
            <button
              v-if="session.status === 'active'"
              class="btn btn-danger btn-sm"
              @click="stopSession(session.session_id)"
            >
              <i class="fas fa-stop"></i>
              {{ t('terminalMySessions.buttonStop') }}
            </button>
            <button
              v-if="isTerminalInactive(session.status)"
              class="btn btn-warning btn-sm"
              @click="discardTerminal(session.id)"
              :title="t('terminalMySessions.tooltipHide')"
            >
              <i class="fas fa-eye-slash"></i>
              {{ t('terminalMySessions.buttonHideSession') }}
            </button>
          </div>
          </div>
        </template>
      </div>

      <div v-else class="empty-section">
        <i class="fas fa-terminal fa-3x"></i>
        <h4>{{ t('terminalMySessions.noActiveSessions') }}</h4>
        <p>{{ t('terminalMySessions.noActiveSessionsDesc') }}</p>
        <router-link to="/terminal-creation" class="btn btn-primary">
          <i class="fas fa-plus"></i>
          {{ t('terminalMySessions.createNewSession') }}
        </router-link>
      </div>
    </div>

    <!-- Modal pour le code iframe -->
    <div v-if="showIframeModal" class="modal-overlay" @click="showIframeModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ t('terminalMySessions.iframeCodeTitle') }}</h3>
          <button class="modal-close" @click="showIframeModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>{{ t('terminalMySessions.iframeCodeDesc') }}</p>
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
              {{ t('terminalMySessions.buttonCopyCode') }}
            </button>
            <button class="btn btn-secondary" @click="showIframeModal = false">
              <i class="fas fa-times"></i>
              {{ t('terminalMySessions.buttonClose') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de résultats de sync -->
    <div v-if="showSyncModal" class="modal-overlay" @click="showSyncModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-sync-alt"></i>
            {{ t('terminalMySessions.syncResultsTitle') }}
          </h3>
          <button class="modal-close" @click="showSyncModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="syncAllResults">
          <div class="sync-summary">
            <div class="summary-item">
              <span class="label">{{ t('terminalMySessions.totalSessions') }}:</span>
              <span class="value">{{ syncAllResults.total_sessions }}</span>
            </div>
            <div class="summary-item">
              <span class="label">{{ t('terminalMySessions.syncedSessions') }}:</span>
              <span class="value">{{ syncAllResults.synced_sessions }}</span>
            </div>
            <div class="summary-item">
              <span class="label">{{ t('terminalMySessions.updatedSessions') }}:</span>
              <span class="value">{{ syncAllResults.updated_sessions || 0 }}</span>
            </div>
            <div class="summary-item" v-if="syncAllResults.error_count > 0">
              <span class="label">{{ t('terminalMySessions.errors') }}:</span>
              <span class="value text-danger">{{ syncAllResults.error_count }}</span>
            </div>
          </div>

          <div v-if="syncAllResults.errors && syncAllResults.errors.length > 0" class="sync-errors">
            <h4>{{ t('terminalMySessions.encounterededErrors') }}</h4>
            <ul>
              <li v-for="error in syncAllResults.errors" :key="error" class="text-danger">
                {{ error }}
              </li>
            </ul>
          </div>

          <div class="modal-actions">
            <button class="btn btn-primary" @click="showSyncModal = false">
              <i class="fas fa-check"></i>
              {{ t('terminalMySessions.buttonOK') }}
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
import { ref, onMounted, defineAsyncComponent, computed } from 'vue'
import axios from 'axios'
import { terminalService } from '../../services/terminalService'
import { useNotification } from '../../composables/useNotification'
import { useI18n } from 'vue-i18n'
import Button from '../UI/Button.vue'

const { showConfirm } = useNotification()
const i18n = useI18n()
const { t } = i18n

// Import dynamique des composants
const TerminalSharingModal = defineAsyncComponent(() => import('../Terminal/TerminalSharingModal.vue'))
const TerminalAccessModal = defineAsyncComponent(() => import('../Terminal/TerminalAccessModal.vue'))

const sessions = ref([])
const isLoading = ref(false)
const error = ref('')

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
const syncResults = ref(new Map())
const showSyncModal = ref(false)
const syncAllResults = ref(null)

const instanceTypes = ref([])

// États pour les fonctionnalités de partage
const showSharingModal = ref(false)
const showAccessModal = ref(false)
const selectedTerminalId = ref<string | null>(null)
const accessModalRefreshTrigger = ref(0)

// États pour l'édition des noms
const editingNames = ref(new Map<string, { value: string }>())
const savingNames = ref(new Set<string>())

// Helper function to check if terminal is inactive
function isTerminalInactive(status: string): boolean {
  return ['expired', 'stopped', 'terminated'].includes(status?.toLowerCase())
}

// Computed property to count only active sessions
const activeSessionsCount = computed(() => {
  return sessions.value.filter(session => !isTerminalInactive(session.status)).length
})

// Computed property to count inactive sessions
const inactiveSessionsCount = computed(() => {
  return sessions.value.filter(session => isTerminalInactive(session.status)).length
})

// Computed property to sort sessions with active ones at the top
const sortedSessions = computed(() => {
  return [...sessions.value].sort((a, b) => {
    const aActive = !isTerminalInactive(a.status)
    const bActive = !isTerminalInactive(b.status)

    // Active sessions first
    if (aActive && !bActive) return -1
    if (!aActive && bActive) return 1

    // Within the same status group, sort by creation date (most recent first)
    const aDate = new Date(a.created_at || 0).getTime()
    const bDate = new Date(b.created_at || 0).getTime()
    return bDate - aDate
  })
})

onMounted(() => {
  console.log('MySessions mounted')

  // Add translations
  i18n.mergeLocaleMessage('en', {
    terminalMySessions: {
      title: 'My Terminal Sessions',
      lastSync: 'Last sync',
      activeSessions: 'Active Sessions',
      inactiveSessions: 'Inactive Sessions',
      buttonSync: 'Sync All',
      buttonSyncing: 'Syncing...',
      buttonRefresh: 'Refresh',
      buttonNewSession: 'New Session',
      buttonHideAllInactive: 'Hide All Inactive',
      loadingSessions: 'Loading sessions...',
      errorRetry: 'Retry',
      synchronized: 'Synchronized',
      upToDate: 'Up to date',
      terminalId: 'Terminal ID',
      sessionId: 'Session ID',
      createdAt: 'Created on',
      expiresAt: 'Expires on',
      userId: 'User',
      instanceType: 'Instance type',
      lastSynchronization: 'Last synchronization',
      previousStatus: 'Previous status',
      currentStatus: 'Current status',
      syncTime: 'Sync time',
      terminalAccess: 'Terminal Access',
      copyLink: 'Copy link',
      buttonOpen: 'Open',
      buttonHide: 'Hide',
      buttonShow: 'Show',
      preview: 'Preview',
      iframePreviewInfo: 'Embeddable terminal preview - Size: 100% x 300px',
      buttonSyncSession: 'Sync',
      buttonShare: 'Share',
      buttonAccess: 'Access',
      buttonStop: 'Stop',
      buttonHideSession: 'Hide',
      tooltipSync: 'Sync this session with the Terminal Trainer API',
      tooltipSyncAll: 'Sync all sessions with the Terminal Trainer API',
      tooltipShare: 'Share this terminal',
      tooltipAccess: 'Manage access',
      tooltipHide: 'Hide this inactive session',
      tooltipHideAll: 'Hide all inactive sessions',
      noActiveSessions: 'No active sessions',
      noActiveSessionsDesc: 'You have no active terminal sessions at the moment.',
      createNewSession: 'Create a new session',
      iframeCodeTitle: 'iframe integration code',
      iframeCodeDesc: 'Copy this code to embed the terminal in your page:',
      buttonCopyCode: 'Copy code',
      buttonClose: 'Close',
      syncResultsTitle: 'Synchronization Results',
      totalSessions: 'Total sessions',
      syncedSessions: 'Synced sessions',
      updatedSessions: 'Updated sessions',
      errors: 'Errors',
      encounterededErrors: 'Encountered errors:',
      buttonOK: 'OK',
      confirmHide: 'Are you sure you want to hide this inactive session?',
      confirmHideTitle: 'Hide session',
      confirmHideAll: 'Are you sure you want to hide all inactive sessions ({count})?',
      confirmHideAllTitle: 'Hide all inactive sessions',
      errorHiding: 'Error hiding the terminal',
      errorHidingAll: 'Error hiding inactive terminals',
      errorLoading: 'Error loading sessions',
      errorStopping: 'Error stopping the session'
    }
  })

  i18n.mergeLocaleMessage('fr', {
    terminalMySessions: {
      title: 'Mes Sessions Terminal',
      lastSync: 'Dernière sync',
      activeSessions: 'Sessions Actives',
      inactiveSessions: 'Sessions Inactives',
      buttonSync: 'Tout synchroniser',
      buttonSyncing: 'Synchronisation...',
      buttonRefresh: 'Actualiser',
      buttonNewSession: 'Nouvelle Session',
      buttonHideAllInactive: 'Masquer toutes les inactives',
      loadingSessions: 'Chargement des sessions...',
      errorRetry: 'Réessayer',
      synchronized: 'Synchronisé',
      upToDate: 'À jour',
      terminalId: 'Terminal ID',
      sessionId: 'Session ID',
      createdAt: 'Créée le',
      expiresAt: 'Expire le',
      userId: 'Utilisateur',
      instanceType: 'Type d\'instance',
      lastSynchronization: 'Dernière synchronisation',
      previousStatus: 'Statut précédent',
      currentStatus: 'Statut actuel',
      syncTime: 'Heure de sync',
      terminalAccess: 'Accès Terminal',
      copyLink: 'Copier le lien',
      buttonOpen: 'Ouvrir',
      buttonHide: 'Masquer',
      buttonShow: 'Aperçu',
      preview: 'Aperçu',
      iframePreviewInfo: 'Aperçu du terminal intégrable - Taille: 100% x 300px',
      buttonSyncSession: 'Sync',
      buttonShare: 'Partager',
      buttonAccess: 'Accès',
      buttonStop: 'Arrêter',
      buttonHideSession: 'Masquer',
      tooltipSync: 'Synchroniser cette session avec l\'API Terminal Trainer',
      tooltipSyncAll: 'Synchroniser toutes les sessions avec l\'API Terminal Trainer',
      tooltipShare: 'Partager ce terminal',
      tooltipAccess: 'Gérer les accès',
      tooltipHide: 'Masquer cette session inactive',
      tooltipHideAll: 'Masquer toutes les sessions inactives',
      noActiveSessions: 'Aucune session active',
      noActiveSessionsDesc: 'Vous n\'avez aucune session terminal active pour le moment.',
      createNewSession: 'Créer une nouvelle session',
      iframeCodeTitle: 'Code d\'intégration iframe',
      iframeCodeDesc: 'Copiez ce code pour intégrer le terminal dans votre page :',
      buttonCopyCode: 'Copier le code',
      buttonClose: 'Fermer',
      syncResultsTitle: 'Résultats de la synchronisation',
      totalSessions: 'Sessions totales',
      syncedSessions: 'Sessions synchronisées',
      updatedSessions: 'Sessions mises à jour',
      errors: 'Erreurs',
      encounterededErrors: 'Erreurs rencontrées:',
      buttonOK: 'OK',
      confirmHide: 'Êtes-vous sûr de vouloir masquer cette session inactive ?',
      confirmHideTitle: 'Masquer la session',
      confirmHideAll: 'Êtes-vous sûr de vouloir masquer toutes les sessions inactives ({count}) ?',
      confirmHideAllTitle: 'Masquer toutes les sessions inactives',
      errorHiding: 'Erreur lors du masquage du terminal',
      errorHidingAll: 'Erreur lors du masquage des terminaux inactifs',
      errorLoading: 'Erreur lors du chargement des sessions',
      errorStopping: 'Erreur lors de l\'arrêt de la session'
    }
  })

  loadSessions()
  loadInstanceTypes()

  // Rafraîchir les sessions toutes les 30 secondes
  const interval = setInterval(() => {
    loadSessions()
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
    error.value = err.response?.data?.error_message || t('terminalMySessions.errorLoading')
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
    error.value = err.response?.data?.error_message || t('terminalMySessions.errorStopping')
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

    syncResults.value.set(sessionId, {
      ...response.data,
      timestamp: new Date()
    })

    await loadSessions()

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

// Fonctions pour gérer les noms de terminaux
function getTerminalDisplayName(session: any): string {
  if (session.name && session.name.trim()) {
    return session.name
  }
  // Fallback: show "Terminal {prefix}" using first 8 chars of session_id
  const prefix = session.session_id ? session.session_id.substring(0, 8) : 'unknown'
  return `Terminal ${prefix}`
}

function startEditingName(terminalId: string, currentName: string | undefined) {
  editingNames.value.set(terminalId, { value: currentName || '' })
}

function cancelEditingName(terminalId: string) {
  editingNames.value.delete(terminalId)
}

async function saveName(terminalId: string) {
  const editData = editingNames.value.get(terminalId)
  if (!editData) return

  const newName = editData.value.trim()

  // Optimistic update
  const session = sessions.value.find(s => s.id === terminalId)
  const previousName = session?.name

  if (session) {
    session.name = newName
  }

  savingNames.value.add(terminalId)

  try {
    await axios.patch(`/terminals/${terminalId}`, { name: newName })
    editingNames.value.delete(terminalId)
  } catch (err: any) {
    console.error('Erreur lors de la mise à jour du nom:', err)
    error.value = err.response?.data?.error_message || 'Erreur lors de la mise à jour du nom'

    // Rollback on error
    if (session) {
      session.name = previousName
    }
  } finally {
    savingNames.value.delete(terminalId)
  }
}

// Fonctions pour les fonctionnalités de partage
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
  loadSessions()
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

async function discardTerminal(terminalId: string) {
  const confirmed = await showConfirm(
    t('terminalMySessions.confirmHide'),
    t('terminalMySessions.confirmHideTitle')
  )
  if (!confirmed) {
    return
  }

  try {
    console.log('Hiding terminal:', terminalId)
    await axios.post(`/terminal-sessions/${terminalId}/hide`)

    // Remove from local display after successful API call
    sessions.value = sessions.value.filter(session => session.id !== terminalId)
    console.log('Terminal successfully hidden:', terminalId)
  } catch (err: any) {
    console.error('Erreur lors du masquage du terminal:', err)
    error.value = err.response?.data?.error_message || t('terminalMySessions.errorHiding')
  }
}

async function hideAllInactiveSessions() {
  const inactive = sessions.value.filter(session => isTerminalInactive(session.status))
  if (inactive.length === 0) return

  const confirmed = await showConfirm(
    t('terminalMySessions.confirmHideAll').replace('{count}', inactive.length.toString()),
    t('terminalMySessions.confirmHideAllTitle')
  )
  if (!confirmed) return

  try {
    for (const session of inactive) {
      await axios.post(`/terminal-sessions/${session.id}/hide`)
    }
    // Remove all inactive from local display
    sessions.value = sessions.value.filter(session => !isTerminalInactive(session.status))
    console.log('All inactive terminals successfully hidden')
  } catch (err: any) {
    console.error('Erreur lors du masquage global:', err)
    error.value = err.response?.data?.error_message || t('terminalMySessions.errorHidingAll')
  }
}
</script>

<style scoped>
/* ===== TerminalMySessions Design System Migration ===== */

/* Page Layout */
.my-sessions-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
  min-height: 600px;
}

.page-header {
  margin-bottom: var(--spacing-2xl);
  text-align: center;
}

.page-header h2 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
}

.sessions-section {
  width: 100%;
}

/* Section Headers */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.section-header h3 {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

/* Loading & Empty States */
.loading-section {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
}

.empty-state,
.empty-section {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
  color: var(--color-text-muted);
}

.empty-section i {
  margin-bottom: var(--spacing-lg);
  opacity: 0.5;
  color: var(--color-text-muted);
}

.empty-section h4 {
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.empty-section .btn {
  margin-top: var(--spacing-md);
}

/* Session Grid */
.sessions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: var(--spacing-lg);
}

/* Separator between active and inactive sessions */
.sessions-separator {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin: var(--spacing-lg) 0;
  padding: 0 var(--spacing-sm);
}

.separator-line {
  flex: 1;
  height: var(--border-width-medium);
  background: linear-gradient(to right, transparent, var(--color-border-light), transparent);
}

.separator-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-full);
  border: var(--border-width-medium) solid var(--color-border-light);
}

/* Session Cards */
.session-card {
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  background: var(--color-bg-primary);
  overflow: hidden;
  transition: box-shadow var(--transition-base);
}

.session-card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-id {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

/* Status Indicator - Compact colored dot */
.status-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  cursor: help;
  transition: transform var(--transition-fast);
}

.status-indicator:hover {
  transform: scale(1.2);
}

.status-indicator i {
  font-size: 12px;
}

/* Card Body & Details */
.card-body {
  padding: var(--spacing-lg);
}

.session-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-row .label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.detail-row .value {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  word-break: break-all;
}

/* Iframe Section Styles */
.iframe-section {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-light);
}

.iframe-title {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.iframe-controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.url-display {
  display: flex;
  gap: var(--spacing-xs);
}

.url-input {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  border: var(--border-width-thin) solid var(--color-border-medium);
  border-radius: var(--border-radius-sm);
  background-color: var(--color-bg-primary);
  font-family: var(--font-family-monospace);
  color: var(--color-text-primary);
}

.iframe-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.iframe-preview {
  margin-top: var(--spacing-md);
}

.iframe-container {
  border: var(--border-width-medium) solid var(--color-border-light);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
}

.iframe-info {
  margin: var(--spacing-sm) 0 0 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* Card Actions Footer */
.card-actions {
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-top: var(--border-width-thin) solid var(--color-border-light);
  text-align: right;
}

/* Modal Styles */
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
  z-index: var(--z-index-modal);
}

.modal-content {
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-lg);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: auto;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

.modal-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  color: var(--color-text-muted);
  padding: var(--spacing-xs);
  transition: color var(--transition-fast);
}

.modal-close:hover {
  color: var(--color-text-primary);
}

.modal-body {
  padding: var(--spacing-lg);
}

.iframe-code {
  width: 100%;
  font-family: var(--font-family-monospace);
  font-size: var(--font-size-xs);
  padding: var(--spacing-sm);
  border: var(--border-width-thin) solid var(--color-border-medium);
  border-radius: var(--border-radius-sm);
  resize: vertical;
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
  margin-top: var(--spacing-md);
}

/* Alert Styles */
.alert {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  margin: var(--spacing-md) 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
}

.alert-danger {
  background-color: rgba(220, 53, 69, 0.1);
  color: var(--color-danger);
  border: var(--border-width-thin) solid var(--color-danger);
}

/* Buttons - Using Design System Classes */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  border: var(--border-width-medium) solid transparent;
  border-radius: var(--border-radius-md);
  text-decoration: none;
  transition: all var(--transition-base);
  font-family: var(--font-family-primary);
}

.btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  border-radius: var(--border-radius-sm);
}

.btn-primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.btn-secondary {
  background-color: var(--color-secondary);
  border-color: var(--color-secondary);
  color: var(--color-white);
}

.btn-info {
  background-color: var(--color-info);
  border-color: var(--color-info);
  color: var(--color-white);
}

.btn-warning {
  background-color: var(--color-warning);
  border-color: var(--color-warning);
  color: var(--color-gray-900);
}

.btn-danger {
  background-color: var(--color-danger);
  border-color: var(--color-danger);
  color: var(--color-white);
}

.btn-success {
  background-color: var(--color-success);
  border-color: var(--color-success);
  color: var(--color-white);
}

.btn-outline-secondary {
  background-color: transparent;
  border-color: var(--color-secondary);
  color: var(--color-secondary);
}

.btn-outline-danger {
  background-color: transparent;
  border-color: var(--color-danger);
  color: var(--color-danger);
}

/* Header & Status Groups */
.header-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.status-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* Sync Indicators */
.sync-indicator {
  font-size: var(--font-size-xs);
}

.sync-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
}

.sync-badge.updated {
  background-color: rgba(23, 162, 184, 0.1);
  color: var(--color-info);
}

.sync-badge.current {
  background-color: rgba(40, 167, 69, 0.1);
  color: var(--color-success);
}

.sync-details {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-sm);
  border-left: var(--border-width-thick) solid var(--color-info);
}

.sync-title {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.sync-info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-xs);
}

.sync-info-item {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
}

.sync-info-item .label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
}

.sync-info-item .value {
  color: var(--color-text-secondary);
}

.sync-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.summary-item .label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.summary-item .value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.sync-errors {
  margin-top: var(--spacing-lg);
}

.sync-errors ul {
  list-style-type: none;
  padding: 0;
}

.sync-errors li {
  padding: var(--spacing-xs) 0;
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

/* Text Color Utilities */
.text-success { color: var(--color-success) !important; }
.text-danger { color: var(--color-danger) !important; }
.text-warning { color: var(--color-warning) !important; }
.text-muted { color: var(--color-text-muted) !important; }

/* Inactive Terminal Styles */
.inactive-terminal {
  opacity: 0.7;
  background-color: var(--color-bg-secondary);
}

.inactive-terminal .card-header {
  background-color: var(--color-bg-tertiary) !important;
  color: var(--color-text-muted);
}

/* Instance Type Badge */
.instance-type {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-info);
}

.instance-type i {
  color: var(--color-text-muted);
  opacity: 0.7;
}

/* Terminal Name Editing Styles */
.session-title-container {
  flex: 1;
  min-width: 0;
  min-height: 32px; /* Prevent height changes */
  display: flex;
  align-items: center;
}

.session-title-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  min-height: 32px; /* Match container height */
}

.session-title-display .session-id {
  margin: 0;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 32px; /* Match height for vertical centering */
}

.btn-edit-name {
  opacity: 0;
  transition: opacity var(--transition-base);
  flex-shrink: 0;
}

.session-title-display:hover .btn-edit-name,
.btn-edit-name:focus-visible {
  opacity: 1;
}

.session-title-edit {
  display: flex;
  width: 100%;
  min-height: 32px; /* Match display mode height */
  align-items: center;
}

.name-input-wrapper {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
  width: 100%;
}

.name-input-container {
  position: relative;
  flex: 1;
  min-height: 32px; /* Consistent height */
  display: flex;
  align-items: center;
}

.name-input {
  width: 100%;
  height: 32px; /* Fixed height to match display */
  padding: 0 50px 0 var(--spacing-sm); /* Compact padding */
  border: var(--border-width-medium) solid var(--color-border-medium);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  transition: all var(--transition-base);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  line-height: 1;
}

.name-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus-primary);
}

.name-input:disabled {
  background-color: var(--color-bg-secondary);
  opacity: 0.6;
  cursor: not-allowed;
}

.name-edit-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.char-counter {
  position: absolute;
  right: var(--spacing-sm);
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-style: italic;
  pointer-events: none;
  background-color: var(--color-bg-primary);
  padding: 0 var(--spacing-xs);
}

/* Responsive Design */
@media (max-width: 768px) {
  .my-sessions-page {
    padding: var(--spacing-sm);
  }

  .page-header h2 {
    font-size: var(--font-size-2xl);
  }

  .section-header {
    flex-direction: column;
    gap: var(--spacing-md);
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

  .header-actions {
    flex-direction: column;
  }

  .header-actions .btn {
    width: 100%;
  }

  .name-input-wrapper {
    flex-direction: column;
  }

  .name-edit-actions {
    width: 100%;
  }

  .name-edit-actions .btn {
    flex: 1;
  }
}
</style>