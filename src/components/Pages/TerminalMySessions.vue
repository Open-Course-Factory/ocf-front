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

          <div :class="['session-card', { 'inactive-terminal': isTerminalInactive(session.status), 'shared-terminal': session.isShared, 'dropdown-open': openDropdowns.has(session.id || session.session_id) }]">
            <!-- Compact header with all info in one line -->
            <div class="card-header">
              <div class="header-left">
                <!-- Terminal name with inline edit -->
                <div v-if="!editingNames.has(session.id)" class="session-title-display">
                  <h5 class="session-name">{{ getTerminalDisplayName(session) }}</h5>
                  <button
                    v-if="canEditName(session)"
                    class="btn-icon btn-edit-name"
                    @click="startEditingName(session.id, session.name)"
                    :title="t('terminals.editName')"
                  >
                    <i class="fas fa-pencil-alt"></i>
                  </button>
                  <span
                    v-else-if="session.isShared && session.access_level === 'read'"
                    class="read-only-indicator"
                    :title="t('terminalMySessions.readOnlyAccess')"
                  >
                    <i class="fas fa-lock"></i>
                  </span>
                </div>
                <div v-else class="session-title-edit">
                  <input
                    v-model="editingNames.get(session.id)!.value"
                    type="text"
                    class="name-input-compact"
                    :placeholder="t('terminals.namePlaceholder')"
                    maxlength="255"
                    @keyup.enter="saveName(session.id)"
                    @keyup.esc="cancelEditingName(session.id)"
                    :disabled="savingNames.has(session.id)"
                  />
                  <button class="btn-icon" @click="saveName(session.id)" :disabled="savingNames.has(session.id)">
                    <i class="fas fa-check"></i>
                  </button>
                  <button class="btn-icon" @click="cancelEditingName(session.id)" :disabled="savingNames.has(session.id)">
                    <i class="fas fa-times"></i>
                  </button>
                </div>

                <!-- Compact metadata -->
                <div class="session-metadata">
                  <span v-if="session.isShared" class="metadata-item shared-info" :title="`${t('terminalMySessions.sharedBy')}: ${session.shared_by}`">
                    <i class="fas fa-share-alt"></i>
                    {{ session.shared_by }}
                  </span>
                  <span v-if="session.instance_type" class="metadata-item" :title="t('terminalMySessions.instanceType')">
                    <i class="fas fa-server"></i>
                    {{ getInstanceName(session.instance_type) }}
                  </span>
                  <span v-if="session.expires_at" class="metadata-item" :title="t('terminalMySessions.expiresAt')">
                    <i class="fas fa-clock"></i>
                    {{ formatDate(session.expires_at) }}
                  </span>
                </div>
              </div>

              <div class="header-right">
                <!-- Status indicator -->
                <span :class="['status-badge', getStatusClass(session.status)]" :title="session.status">
                  <i class="fas fa-circle"></i>
                  {{ session.status }}
                </span>

                <!-- Action buttons -->
                <div class="card-actions-compact">
                  <button
                    v-if="session.status === 'active'"
                    class="btn-icon btn-primary"
                    @click="openTerminalInNewTab(session.session_id)"
                    :title="t('terminalMySessions.buttonOpen')"
                  >
                    <i class="fas fa-external-link-alt"></i>
                  </button>
                  <button
                    v-if="!isTerminalInactive(session.status) && !session.isShared"
                    class="btn-icon btn-share"
                    @click="openSharingModal(session.session_id)"
                    :title="t('terminalMySessions.tooltipShare')"
                  >
                    <i class="fas fa-share-alt"></i>
                  </button>
                  <button
                    v-if="session.status === 'active' && !session.isShared"
                    class="btn-icon btn-stop"
                    @click="stopSession(session.session_id)"
                    :title="t('terminalMySessions.buttonStop')"
                  >
                    <i class="fas fa-stop"></i>
                  </button>
                  <button
                    v-if="isTerminalInactive(session.status)"
                    class="btn-icon"
                    @click="discardTerminal(session.id)"
                    :title="t('terminalMySessions.tooltipHide')"
                  >
                    <i class="fas fa-eye-slash"></i>
                  </button>

                  <!-- Dropdown menu for additional actions -->
                  <div class="dropdown-container" :ref="(el) => dropdownRefs.set(session.id || session.session_id, el as HTMLElement)">
                    <button
                      class="btn-icon"
                      @click.stop="toggleDropdown(session.id || session.session_id)"
                      :title="t('terminalMySessions.moreActions')"
                    >
                      <i class="fas fa-ellipsis-v"></i>
                    </button>

                    <div v-if="openDropdowns.has(session.id || session.session_id)" class="dropdown-menu" @click.stop>
                      <!-- Copy URL -->
                      <button class="dropdown-item" @click="copyUrlToClipboard(session.session_id); closeDropdown(session.id || session.session_id)">
                        <i class="fas fa-link"></i>
                        <span>{{ copiedSessions.has(session.session_id) ? t('terminalMySessions.copied') : t('terminalMySessions.copyLink') }}</span>
                      </button>

                      <!-- Copy iframe code -->
                      <button class="dropdown-item" @click="copyIframeCode(session.session_id); closeDropdown(session.id || session.session_id)">
                        <i class="fas fa-code"></i>
                        <span>{{ copiedIframes.has(session.session_id) ? t('terminalMySessions.copiedIframe') : t('terminalMySessions.copyIframeCode') }}</span>
                      </button>

                      <!-- Manage access (only for owned terminals) -->
                      <button
                        v-if="!session.isShared"
                        class="dropdown-item"
                        @click="openAccessModal(session.session_id); closeDropdown(session.id || session.session_id)"
                      >
                        <i class="fas fa-users-cog"></i>
                        <span>{{ t('terminalMySessions.manageAccess') }}</span>
                      </button>

                      <!-- Divider -->
                      <div v-if="!session.isShared" class="dropdown-divider"></div>

                      <!-- Sync session -->
                      <button
                        v-if="!session.isShared"
                        class="dropdown-item"
                        @click="syncSession(session.session_id); closeDropdown(session.id || session.session_id)"
                        :title="t('terminalMySessions.tooltipSync')"
                      >
                        <i class="fas fa-sync"></i>
                        <span>{{ t('terminalMySessions.buttonSyncSession') }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
    <BaseModal
      :visible="showIframeModal"
      :title="t('terminalMySessions.iframeCodeTitle')"
      title-icon="fas fa-code"
      size="medium"
      @close="showIframeModal = false"
    >
      <p>{{ t('terminalMySessions.iframeCodeDesc') }}</p>
      <textarea
        :value="currentIframeCode"
        readonly
        class="iframe-code"
        rows="4"
        ref="iframeCodeRef"
      ></textarea>

      <template #footer>
        <button class="btn btn-primary" @click="copyIframeCodeToClipboard">
          <i class="fas fa-copy"></i>
          {{ t('terminalMySessions.buttonCopyCode') }}
        </button>
        <button class="btn btn-secondary" @click="showIframeModal = false">
          <i class="fas fa-times"></i>
          {{ t('terminalMySessions.buttonClose') }}
        </button>
      </template>
    </BaseModal>

    <!-- Modal de résultats de sync -->
    <BaseModal
      :visible="showSyncModal"
      :title="t('terminalMySessions.syncResultsTitle')"
      title-icon="fas fa-sync-alt"
      size="medium"
      :show-default-footer="true"
      :confirm-text="t('terminalMySessions.buttonOK')"
      confirm-icon="fas fa-check"
      @close="showSyncModal = false"
      @confirm="showSyncModal = false"
    >
      <div v-if="syncAllResults">
        <p v-if="syncAllResults.updated_sessions > 0" class="sync-description">
          {{ t('terminalMySessions.syncDescription') }}
        </p>
        <p v-else class="sync-description">
          {{ t('terminalMySessions.syncDescriptionNoChanges') }}
        </p>

        <div class="sync-summary">
          <div class="summary-item" v-if="syncAllResults.updated_sessions > 0">
            <span class="label">{{ t('terminalMySessions.updatedOwnedSessions') }}:</span>
            <span class="value highlight-success">{{ syncAllResults.updated_sessions }}</span>
          </div>
          <div class="summary-item" v-if="syncAllResults.error_count > 0">
            <span class="label">{{ t('terminalMySessions.errors') }}:</span>
            <span class="value highlight-danger">{{ syncAllResults.error_count }}</span>
          </div>
        </div>

        <!-- Shared sessions info note -->
        <div v-if="syncAllResults.shared_sessions_added > 0 || syncAllResults.shared_sessions_removed > 0" class="sync-info-note">
          <i class="fas fa-info-circle"></i>
          <span v-if="syncAllResults.shared_sessions_added > 0 && syncAllResults.shared_sessions_removed > 0">
            {{ t('terminalMySessions.sharedSessionsAddedAndRemoved', {
              added: syncAllResults.shared_sessions_added,
              removed: syncAllResults.shared_sessions_removed
            }) }}
          </span>
          <span v-else-if="syncAllResults.shared_sessions_added > 0">
            {{ t('terminalMySessions.sharedSessionsAdded', { count: syncAllResults.shared_sessions_added }) }}
          </span>
          <span v-else-if="syncAllResults.shared_sessions_removed > 0">
            {{ t('terminalMySessions.sharedSessionsRemoved', { count: syncAllResults.shared_sessions_removed }) }}
          </span>
        </div>

        <div v-if="syncAllResults.errors && syncAllResults.errors.length > 0" class="sync-errors">
          <h4>{{ t('terminalMySessions.encounterededErrors') }}</h4>
          <ul>
            <li v-for="error in syncAllResults.errors" :key="error" class="text-danger">
              {{ error }}
            </li>
          </ul>
        </div>
      </div>
    </BaseModal>

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
import { ref, onMounted, onUnmounted, defineAsyncComponent, computed } from 'vue'
import axios from 'axios'
import { terminalService } from '../../services/domain/terminal'
import { useNotification } from '../../composables/useNotification'
import { useTranslations } from '../../composables/useTranslations'
import { useFormatters } from '../../composables/useFormatters'

const { showConfirm } = useNotification()
const { formatDateTime: formatDateTimeTz } = useFormatters()
const { t } = useTranslations({
  en: {
    terminalMySessions: {
      title: 'Terminal Sessions',
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
      syncResultsTitle: 'Synchronization Complete',
      syncDescription: 'Some owned sessions have been updated with their latest status from the server.',
      syncDescriptionNoChanges: 'All owned sessions are already up to date. No changes detected.',
      updatedOwnedSessions: 'Owned sessions updated',
      updatedSessions: 'Sessions updated',
      sharedSessionsRefreshed: 'Shared sessions have also been refreshed ({count} session(s)).',
      sharedSessionsAdded: '{count} new shared session(s) added.',
      sharedSessionsRemoved: '{count} shared session(s) removed.',
      sharedSessionsAddedAndRemoved: '{added} shared session(s) added, {removed} removed.',
      errors: 'Errors',
      encounterededErrors: 'Encountered errors:',
      buttonOK: 'OK',
      confirmHide: 'Are you sure you want to hide this inactive session?',
      confirmHideTitle: 'Hide session',
      confirmHideAll: 'Are you sure you want to hide all inactive sessions ({count}) ?',
      confirmHideAllTitle: 'Hide all inactive sessions',
      errorHiding: 'Error hiding the terminal',
      errorHidingAll: 'Error hiding inactive terminals',
      errorLoading: 'Error loading sessions',
      errorStopping: 'Error stopping the session',
      sharedWithMe: 'Shared with me',
      sharedSessions: 'Shared Sessions',
      sharedBy: 'Shared by',
      accessLevel: 'Access level',
      moreActions: 'More actions',
      copied: 'Copied!',
      copiedIframe: 'Iframe code copied!',
      copyIframeCode: 'Copy iframe code',
      manageAccess: 'Manage access',
      readOnlyAccess: 'Read-only access - cannot edit name'
    }
  },
  fr: {
    terminalMySessions: {
      title: 'Sessions Terminal',
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
      syncResultsTitle: 'Synchronisation terminée',
      syncDescription: 'Certaines sessions possédées ont été mises à jour avec leur dernier statut depuis le serveur.',
      syncDescriptionNoChanges: 'Toutes les sessions possédées sont déjà à jour. Aucun changement détecté.',
      updatedOwnedSessions: 'Sessions possédées mises à jour',
      updatedSessions: 'Sessions mises à jour',
      sharedSessionsRefreshed: 'Les sessions partagées ont également été actualisées ({count} session(s)).',
      sharedSessionsAdded: '{count} nouvelle(s) session(s) partagée(s) ajoutée(s).',
      sharedSessionsRemoved: '{count} session(s) partagée(s) supprimée(s).',
      sharedSessionsAddedAndRemoved: '{added} session(s) partagée(s) ajoutée(s), {removed} supprimée(s).',
      errors: 'Erreurs',
      encounterededErrors: 'Erreurs rencontrées:',
      buttonOK: 'OK',
      confirmHide: 'Êtes-vous sûr de vouloir masquer cette session inactive\u00A0?',
      confirmHideTitle: 'Masquer la session',
      confirmHideAll: 'Êtes-vous sûr de vouloir masquer toutes les sessions inactives ({count})\u00A0?',
      confirmHideAllTitle: 'Masquer toutes les sessions inactives',
      errorHiding: 'Erreur lors du masquage du terminal',
      errorHidingAll: 'Erreur lors du masquage des terminaux inactifs',
      errorLoading: 'Erreur lors du chargement des sessions',
      errorStopping: 'Erreur lors de l\'arrêt de la session',
      sharedWithMe: 'Partagé avec moi',
      sharedSessions: 'Sessions Partagées',
      sharedBy: 'Partagé par',
      accessLevel: 'Niveau d\'accès',
      moreActions: 'Plus d\'actions',
      copied: 'Copié !',
      copiedIframe: 'Code iframe copié !',
      copyIframeCode: 'Copier le code iframe',
      manageAccess: 'Gérer les accès',
      readOnlyAccess: 'Accès en lecture seule - impossible de modifier le nom'
    }
  }
})

// Import dynamique des composants
import BaseModal from '../Modals/BaseModal.vue'
const TerminalSharingModal = defineAsyncComponent(() => import('../Terminal/TerminalSharingModal.vue'))
const TerminalAccessModal = defineAsyncComponent(() => import('../Terminal/TerminalAccessModal.vue'))

const sessions = ref([])
const sharedSessions = ref([])
const isLoading = ref(false)
const error = ref('')

// Snapshot of shared session IDs for tracking changes
const sharedSessionIdsSnapshot = ref(new Set<string>())

// États pour les fonctionnalités iframe
const showPreviews = ref(new Set())
const copiedSessions = ref(new Set())
const copiedIframes = ref(new Set())
const showIframeModal = ref(false)
const currentIframeCode = ref('')
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

// États pour les dropdowns
const openDropdowns = ref(new Set<string>())
const dropdownRefs = ref(new Map<string, HTMLElement>())

// Helper function to check if terminal is inactive
function isTerminalInactive(status: string): boolean {
  return ['expired', 'stopped', 'terminated'].includes(status?.toLowerCase())
}

// Computed property for all sessions (owned + shared)
const allSessions = computed(() => {
  // Mark owned sessions
  const ownedWithFlag = sessions.value.map(s => ({ ...s, isShared: false }))

  // Mark shared sessions and extract terminal data
  const sharedWithFlag = sharedSessions.value.map(shared => ({
    ...shared.terminal,
    isShared: true,
    shared_by: shared.shared_by_display_name || shared.shared_by, // Use display name, fallback to ID
    access_level: shared.access_level
  }))

  return [...ownedWithFlag, ...sharedWithFlag]
})

// Computed property to count only active sessions
const activeSessionsCount = computed(() => {
  return allSessions.value.filter(session => !isTerminalInactive(session.status)).length
})

// Computed property to count inactive sessions
const inactiveSessionsCount = computed(() => {
  return allSessions.value.filter(session => isTerminalInactive(session.status)).length
})

// Computed property to sort sessions with active ones at the top
const sortedSessions = computed(() => {
  return [...allSessions.value].sort((a, b) => {
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

// Dropdown management functions
function toggleDropdown(sessionId: string) {
  if (openDropdowns.value.has(sessionId)) {
    openDropdowns.value.delete(sessionId)
  } else {
    // Close all other dropdowns
    openDropdowns.value.clear()
    openDropdowns.value.add(sessionId)
  }
}

function closeDropdown(sessionId: string) {
  openDropdowns.value.delete(sessionId)
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  let clickedInside = false

  // Check if click was inside any dropdown
  dropdownRefs.value.forEach((ref) => {
    if (ref && ref.contains(target)) {
      clickedInside = true
    }
  })

  if (!clickedInside) {
    openDropdowns.value.clear()
  }
}

onMounted(() => {
  console.log('MySessions mounted')

  // Add click outside listener for dropdowns
  document.addEventListener('click', handleClickOutside)

  loadSessions()
  loadSharedSessions()
  loadInstanceTypes()

  // Rafraîchir les sessions toutes les 30 secondes et vérifier les expirations
  const interval = setInterval(() => {
    checkExpiredSessions()
    loadSessions()
    loadSharedSessions()
  }, 30000)

  // Cleanup on unmount
  onUnmounted(() => {
    clearInterval(interval)
    document.removeEventListener('click', handleClickOutside)
  })
})

async function loadSessions() {
  if (isLoading.value) return

  isLoading.value = true
  error.value = ''

  try {
    console.log('Loading sessions...')
    const response = await axios.get('/terminals/user-sessions')
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

async function loadSharedSessions() {
  try {
    const data = await terminalService.getSharedTerminals()
    sharedSessions.value = data || []

    // Update snapshot for change tracking (only if not in the middle of a sync)
    const validTerminalIds = sharedSessions.value.map(s => s.terminal?.id).filter(id => id)
    if (!isSyncing.value) {
      sharedSessionIdsSnapshot.value = new Set(validTerminalIds)
    }
  } catch (err: any) {
    console.error('Erreur lors du chargement des sessions partagées:', err)
    // Don't show error for shared sessions as they're optional
    sharedSessions.value = []
    if (!isSyncing.value) {
      sharedSessionIdsSnapshot.value = new Set()
    }
  }
}

async function stopSession(sessionId: string) {
  if (!sessionId) {
    console.error('Session ID manquant')
    return
  }

  try {
    console.log('Stopping session:', sessionId)
    await axios.post(`/terminals/${sessionId}/stop`)
    await loadSessions()
    console.log('Session stopped successfully')
  } catch (err: any) {
    console.error('Erreur lors de l\'arrêt:', err)
    error.value = err.response?.data?.error_message || t('terminalMySessions.errorStopping')
  }
}

function formatDate(dateString: string) {
  if (!dateString) return '-'
  return formatDateTimeTz(dateString)
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

// Function temporarily unused but may be needed for future iframe preview feature
// @ts-expect-error - Function reserved for future iframe preview feature
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
    const response = await axios.post(`/terminals/${sessionId}/sync`)

    syncResults.value.set(sessionId, {
      ...response.data,
      timestamp: new Date()
    })

    // Reload both owned and shared sessions (in case the synced session is shared)
    await Promise.all([
      loadSessions(),
      loadSharedSessions()
    ])

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
    // Use the snapshot from the last MANUAL sync (or initial load)
    // This represents the state from the last time the user clicked sync
    const sharedSessionIdsBefore = new Set(sharedSessionIdsSnapshot.value)

    const response = await axios.post('/terminals/sync-all')

    syncAllResults.value = response.data
    lastSyncTime.value = new Date()

    // Reload both owned and shared sessions
    // loadSharedSessions will NOT update snapshot during sync (isSyncing.value = true)
    await Promise.all([
      loadSessions(),
      loadSharedSessions()
    ])

    // Calculate shared sessions changes (only new additions or removals)
    const sharedSessionIdsAfter = new Set(
      sharedSessions.value.map(s => s.terminal?.id).filter(id => id)
    )

    // Find sessions that were added (in after but not in before snapshot)
    const addedSessions = [...sharedSessionIdsAfter].filter(id => !sharedSessionIdsBefore.has(id))

    // Find sessions that were removed (in before snapshot but not in after)
    const removedSessions = [...sharedSessionIdsBefore].filter(id => !sharedSessionIdsAfter.has(id))

    const sharedSessionsAdded = addedSessions.length
    const sharedSessionsRemoved = removedSessions.length

    // Add shared sessions info to results
    syncAllResults.value = {
      ...response.data,
      shared_sessions_count: sharedSessionIdsAfter.size,
      shared_sessions_added: sharedSessionsAdded,
      shared_sessions_removed: sharedSessionsRemoved
    }

    // Update snapshot AFTER we've calculated the changes
    // This becomes the baseline for the NEXT manual sync
    sharedSessionIdsSnapshot.value = sharedSessionIdsAfter

    showSyncModal.value = true

    return response.data
  } catch (err: any) {
    console.error('Erreur lors de la synchronisation globale:', err)
    error.value = err.response?.data?.error_message || 'Erreur lors de la synchronisation globale'
    throw err
  } finally {
    isSyncing.value = false
  }
}

// Vérifier et synchroniser automatiquement les sessions expirées
async function checkExpiredSessions() {
  if (isSyncing.value || isLoading.value) return

  const now = new Date()
  const expiredSessions = sessions.value.filter(session => {
    // Skip already inactive sessions
    if (isTerminalInactive(session.status)) return false

    // Check if session has an expiration date
    if (!session.expires_at) return false

    try {
      const expiresAt = new Date(session.expires_at)
      // Check if expired (with 1 minute buffer to avoid timing issues)
      return expiresAt <= now
    } catch (e) {
      return false
    }
  })

  if (expiredSessions.length > 0) {
    console.log(`Found ${expiredSessions.length} expired session(s), auto-syncing...`)

    // Sync each expired session silently
    for (const session of expiredSessions) {
      try {
        await syncSession(session.session_id)
        console.log(`Auto-synced expired session: ${session.session_id}`)
      } catch (err) {
        console.error(`Failed to auto-sync session ${session.session_id}:`, err)
      }
    }
  }
}

// Utilitaires pour l'affichage
// Function temporarily unused but may be needed for sync results display
// @ts-expect-error - Function reserved for future sync results display
function getSyncResultForSession(sessionId: string) {
  return syncResults.value.get(sessionId)
}

function formatSyncTime(time: Date | string) {
  if (!time) return ''
  return formatDateTimeTz(time.toString())
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

function canEditName(session: any): boolean {
  // Owner can always edit
  if (!session.isShared) {
    return true
  }

  // For shared sessions, only 'write' and 'admin' access levels can edit
  return ['write', 'admin'].includes(session.access_level)
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

  // Optimistic update - update both owned and shared sessions
  const ownedSession = sessions.value.find(s => s.id === terminalId)
  const sharedSession = sharedSessions.value.find(s => s.terminal.id === terminalId)

  const previousNameOwned = ownedSession?.name
  const previousNameShared = sharedSession?.terminal?.name

  if (ownedSession) {
    ownedSession.name = newName
  }

  if (sharedSession?.terminal) {
    sharedSession.terminal.name = newName
  }

  savingNames.value.add(terminalId)

  try {
    const response = await axios.patch(`/terminals/${terminalId}`, { name: newName })

    // Update with server response to ensure consistency
    if (response.data && response.data.name !== undefined) {
      if (ownedSession) {
        ownedSession.name = response.data.name
      }
      if (sharedSession?.terminal) {
        sharedSession.terminal.name = response.data.name
      }
    }

    editingNames.value.delete(terminalId)
  } catch (err: any) {
    console.error('Erreur lors de la mise à jour du nom:', err)
    error.value = err.response?.data?.error_message || 'Erreur lors de la mise à jour du nom'

    // Rollback on error
    if (ownedSession) {
      ownedSession.name = previousNameOwned
    }
    if (sharedSession?.terminal) {
      sharedSession.terminal.name = previousNameShared
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
    await axios.post(`/terminals/${terminalId}/hide`)

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
    t('terminalMySessions.confirmHideAll', { count: inactive.length }),
    t('terminalMySessions.confirmHideAllTitle')
  )
  if (!confirmed) return

  try {
    for (const session of inactive) {
      await axios.post(`/terminals/${session.id}/hide`)
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

/* Session Grid - Compact layout */
.sessions-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  overflow: visible;
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

/* Compact Session Cards */
.session-card {
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
  transition: all var(--transition-base);
  position: relative;
  overflow: visible;
  z-index: 1;
}

.session-card.dropdown-open {
  z-index: 10000 !important;
}

.session-card:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--color-border-medium);
}

/* Shared terminal - subtle background difference */
.session-card.shared-terminal {
  background: linear-gradient(to right, rgba(108, 117, 125, 0.03), var(--color-bg-primary));
  border-left: 3px solid var(--color-secondary);
}

.card-header {
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  overflow: visible;
}

.header-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.session-name {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

/* Compact metadata row */
.session-metadata {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.metadata-item i {
  font-size: var(--font-size-xs);
  opacity: 0.7;
}

.metadata-item.shared-info {
  color: var(--color-secondary);
  font-weight: var(--font-weight-medium);
}

/* Status Badge */
.status-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: capitalize;
}

.status-badge i {
  font-size: 8px;
}

.status-badge.text-success {
  background-color: rgba(40, 167, 69, 0.1);
  color: var(--color-success);
}

.status-badge.text-danger {
  background-color: rgba(220, 53, 69, 0.1);
  color: var(--color-danger);
}

.status-badge.text-warning {
  background-color: rgba(255, 193, 7, 0.1);
  color: var(--color-warning);
}

.status-badge.text-muted {
  background-color: rgba(108, 117, 125, 0.1);
  color: var(--color-text-muted);
}

/* Compact action buttons */
.card-actions-compact {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon:hover:not(:disabled) {
  background-color: var(--color-bg-secondary);
  color: var(--color-primary);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.btn-icon.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary);
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-icon.btn-danger {
  color: var(--color-danger);
}

.btn-icon.btn-danger:hover:not(:disabled) {
  background-color: rgba(220, 53, 69, 0.1);
  color: var(--color-danger);
}

.btn-icon.btn-stop {
  background-color: var(--color-danger);
  color: var(--color-white);
  border-radius: var(--border-radius-sm);
}

.btn-icon.btn-stop:hover:not(:disabled) {
  background-color: var(--color-danger);
  opacity: 0.85;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn-icon.btn-share {
  background-color: var(--color-info);
  color: var(--color-white);
  border-radius: var(--border-radius-sm);
}

.btn-icon.btn-share:hover:not(:disabled) {
  background-color: var(--color-info);
  opacity: 0.85;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* iframe code textarea - specific style for modal content */
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


.sync-description {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-left: 3px solid var(--color-info);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}

.sync-info-note {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: rgba(23, 162, 184, 0.1);
  border-left: 3px solid var(--color-info);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.sync-info-note i {
  color: var(--color-info);
  font-size: var(--font-size-base);
}

.sync-summary {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.sync-summary:has(.summary-item:nth-child(2)) {
  grid-template-columns: 1fr 1fr;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-light);
}

.summary-item .label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-medium);
}

.summary-item .value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.summary-item .value.highlight-success {
  color: var(--color-success);
}

.summary-item .value.highlight-danger {
  color: var(--color-danger);
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

/* Compact Terminal Name Editing */
.session-title-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.btn-edit-name {
  opacity: 0;
  transition: opacity var(--transition-base);
}

.session-title-display:hover .btn-edit-name {
  opacity: 1;
}

.read-only-indicator {
  display: inline-flex;
  align-items: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  opacity: 0.6;
  margin-left: var(--spacing-xs);
  cursor: help;
}

.read-only-indicator i {
  font-size: var(--font-size-xs);
}

.session-title-edit {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex: 1;
}

.name-input-compact {
  flex: 1;
  min-width: 200px;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: var(--border-width-medium) solid var(--color-border-medium);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: all var(--transition-base);
}

.name-input-compact:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus-primary);
}

.name-input-compact:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

  .header-actions {
    flex-direction: column;
  }

  .header-actions .btn {
    width: 100%;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .session-metadata {
    flex-wrap: wrap;
  }
}

/* Dropdown Menu Styles */
.dropdown-container {
  position: relative;
}

.dropdown-menu {
  position: absolute !important;
  top: calc(100% + var(--spacing-xs)) !important;
  right: 0 !important;
  min-width: 200px;
  background-color: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  overflow: visible;
  z-index: 10001 !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.dropdown-item:hover {
  background-color: var(--color-bg-secondary);
  color: var(--color-primary);
}

.dropdown-item i {
  width: 18px;
  text-align: center;
  font-size: var(--font-size-base);
  opacity: 0.7;
}

.dropdown-item:hover i {
  opacity: 1;
}

.dropdown-divider {
  height: 1px;
  background-color: var(--color-border-light);
  margin: var(--spacing-xs) 0;
}
</style>