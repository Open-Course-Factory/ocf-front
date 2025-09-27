<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>
          <i class="fas fa-users-cog"></i>
          Gérer les Accès - {{ terminalInfo?.terminal.session_id }}
        </h3>
        <button class="modal-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="terminalInfo" class="terminal-info">
          <div class="info-item">
            <strong><i class="fas fa-terminal"></i> Terminal:</strong>
            <span>{{ terminalInfo.terminal.session_id }}</span>
          </div>
          <div class="info-item">
            <strong><i class="fas fa-server"></i> Instance:</strong>
            <span>{{ terminalInfo.terminal.instance_type }}</span>
          </div>
          <div class="info-item">
            <strong><i class="fas fa-info-circle"></i> Statut:</strong>
            <span :class="getStatusClass(terminalInfo.terminal.status)">
              {{ terminalInfo.terminal.status }}
            </span>
          </div>
        </div>

        <div class="access-section">
          <div class="section-header">
            <h4>
              <i class="fas fa-crown"></i>
              Propriétaire
            </h4>
          </div>
          <div class="access-item owner">
            <div class="user-info">
              <div class="user-name">{{ getUserDisplayName(terminalInfo?.terminal.user_id || '') }}</div>
              <div class="access-badge owner-badge">
                <i class="fas fa-crown"></i>
                Propriétaire
              </div>
            </div>
            <div class="user-meta">
              <small class="text-muted">Contrôle total du terminal</small>
            </div>
          </div>
        </div>

        <div v-if="shares && shares.length > 0" class="access-section">
          <div class="section-header">
            <h4>
              <i class="fas fa-users"></i>
              Utilisateurs partagés ({{ shares ? shares.length : 0 }})
            </h4>
          </div>
          <div class="access-list">
            <div v-for="share in shares" :key="share.id" class="access-item">
              <div class="user-info">
                <div class="user-name">{{ getUserDisplayName(share.shared_with_user_id) }}</div>
                <div :class="['access-badge', getAccessBadgeClass(share.access_level)]">
                  <i :class="getAccessIcon(share.access_level)"></i>
                  {{ getAccessLabel(share.access_level) }}
                </div>
              </div>
              <div class="user-meta">
                <div class="meta-row">
                  <small class="text-muted">
                    <i class="fas fa-calendar-alt"></i>
                    Partagé le: {{ formatDate(share.created_at) }}
                  </small>
                  <small v-if="share.expires_at" class="text-warning">
                    <i class="fas fa-clock"></i>
                    Expire le: {{ formatDate(share.expires_at) }}
                  </small>
                </div>
                <div class="meta-row">
                  <small :class="share.is_active ? 'text-success' : 'text-danger'">
                    <i :class="share.is_active ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                    {{ share.is_active ? 'Actif' : 'Inactif' }}
                  </small>
                </div>
              </div>
              <div class="user-actions">
                <button
                  class="btn btn-danger btn-sm"
                  @click="revokeUserAccess(share.shared_with_user_id)"
                  :disabled="isRevoking"
                  title="Révoquer l'accès"
                >
                  <i v-if="isRevoking" class="fas fa-spinner fa-spin"></i>
                  <i v-else class="fas fa-user-times"></i>
                  Révoquer
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="!shares || shares.length === 0" class="access-section">
          <div class="empty-state">
            <i class="fas fa-users fa-3x"></i>
            <h5>Aucun partage actif</h5>
            <p class="text-muted">Ce terminal n'est partagé avec aucun autre utilisateur pour le moment.</p>
          </div>
        </div>

        <div v-if="error" class="alert alert-danger">
          <i class="fas fa-exclamation-triangle"></i>
          {{ error }}
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary" @click="openSharingModal">
            <i class="fas fa-plus"></i>
            Ajouter un utilisateur
          </button>
          <button class="btn btn-secondary" @click="closeModal">
            <i class="fas fa-times"></i>
            Fermer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { terminalService, type TerminalShareOutput, type SharedTerminalInfo } from '../../services/terminalService'
import { userService, type User } from '../../services/userService'

interface Props {
  show: boolean
  terminalId?: string
  refreshTrigger?: number // Add a prop to trigger refresh
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  openSharing: [terminalId: string]
}>()

const terminalInfo = ref<SharedTerminalInfo | null>(null)
const shares = ref<TerminalShareOutput[]>([]) // Initialize as empty array
const users = ref<Map<string, User>>(new Map()) // Cache for user data
const isRevoking = ref(false)
const error = ref('')

watch(() => props.show, async (newShow) => {
  if (newShow && props.terminalId) {
    await loadData()
  }
})

// Watch for refresh trigger changes to reload data
watch(() => props.refreshTrigger, async () => {
  if (props.show && props.terminalId) {
    await loadData()
  }
})

async function loadData() {
  if (!props.terminalId) return

  try {
    error.value = ''

    // Load terminal info and shares separately to handle partial failures
    let info = null
    let sharesList = []

    try {
      info = await terminalService.getTerminalInfo(props.terminalId)
      terminalInfo.value = info
    } catch (infoErr: any) {
      console.error('Error loading terminal info:', infoErr)
      // Continue loading shares even if terminal info fails
    }

    try {
      sharesList = await terminalService.getTerminalShares(props.terminalId)
      shares.value = sharesList || []

      // Load user information for all shared users
      if (sharesList && sharesList.length > 0) {
        await loadUserInfo(sharesList)
      }
    } catch (sharesErr: any) {
      console.error('Error loading terminal shares:', sharesErr)
      shares.value = []
      // Only show error if both API calls fail
      if (!info) {
        error.value = sharesErr.response?.data?.error_message || 'Erreur lors du chargement des données d\'accès'
      }
    }

  } catch (err: any) {
    console.error('Error loading terminal access data:', err)
    error.value = err.response?.data?.error_message || 'Erreur lors du chargement des données d\'accès'
    // Ensure shares is always an array
    shares.value = []
  }
}

async function loadUserInfo(sharesList: TerminalShareOutput[]) {
  try {
    // Get all unique user IDs that we need to fetch
    const userIds = Array.from(new Set([
      ...sharesList.map(share => share.shared_with_user_id),
      ...sharesList.map(share => share.shared_by_user_id)
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

async function revokeUserAccess(userId: string) {
  if (!props.terminalId) return

  isRevoking.value = true
  error.value = ''

  try {
    await terminalService.revokeAccess(props.terminalId, userId)
    await loadData() // Reload data to reflect changes
    console.log(`Access revoked for user ${userId}`)
  } catch (err: any) {
    console.error('Error revoking access:', err)
    error.value = err.response?.data?.error_message || 'Erreur lors de la révocation de l\'accès'
  } finally {
    isRevoking.value = false
  }
}

function openSharingModal() {
  if (props.terminalId) {
    emit('openSharing', props.terminalId)
  }
}

function closeModal() {
  emit('close')
}

function getStatusClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'running':
      return 'text-success'
    case 'stopped':
    case 'expired':
      return 'text-danger'
    case 'starting':
    case 'pending':
      return 'text-warning'
    default:
      return 'text-muted'
  }
}

function getAccessIcon(level: string) {
  switch (level) {
    case 'read': return 'fas fa-eye'
    case 'write': return 'fas fa-edit'
    case 'admin': return 'fas fa-cog'
    default: return 'fas fa-question'
  }
}

function getAccessLabel(level: string) {
  switch (level) {
    case 'read': return 'Lecture'
    case 'write': return 'Écriture'
    case 'admin': return 'Admin'
    default: return level
  }
}

function getAccessBadgeClass(level: string) {
  switch (level) {
    case 'read': return 'read-badge'
    case 'write': return 'write-badge'
    case 'admin': return 'admin-badge'
    default: return 'default-badge'
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

function getUserDisplayName(userId: string): string {
  const user = users.value.get(userId)
  if (user) {
    return user.name || user.email || userId
  }
  return userId
}
</script>

<style scoped>
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
  max-width: 700px;
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
  background-color: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.modal-close:hover {
  background-color: #e9ecef;
}

.modal-body {
  padding: 20px;
}

.terminal-info {
  margin-bottom: 25px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item strong {
  color: #495057;
  display: flex;
  align-items: center;
  gap: 6px;
}

.access-section {
  margin-bottom: 25px;
}

.section-header {
  margin-bottom: 15px;
}

.section-header h4 {
  margin: 0;
  color: #495057;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.access-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.access-item {
  padding: 15px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background-color: #fff;
  transition: box-shadow 0.2s;
}

.access-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.access-item.owner {
  background-color: #fff3cd;
  border-color: #ffeaa7;
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.user-name {
  font-weight: 600;
  color: #495057;
  font-size: 15px;
}

.access-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.owner-badge {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
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

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.empty-state i {
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-state h5 {
  margin-bottom: 8px;
  color: #495057;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 15px;
  border-top: 1px solid #dee2e6;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
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

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
}

.alert {
  padding: 12px 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.text-success { color: #28a745 !important; }
.text-danger { color: #dc3545 !important; }
.text-warning { color: #ffc107 !important; }
.text-muted { color: #6c757d !important; }

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 10px;
  }

  .user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .meta-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>