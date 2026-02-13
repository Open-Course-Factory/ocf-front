<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <BaseModal
    :visible="show"
    :title="`${t('access.manageAccess')} - ${terminalInfo?.terminal.session_id || ''}`"
    title-icon="fas fa-users-cog"
    size="large"
    :close-on-overlay-click="true"
    :no-padding="false"
    @close="closeModal"
  >
    <template #default>
      <div class="access-modal-wrapper">
        <div v-if="terminalInfo" class="terminal-info">
          <div class="info-item">
            <strong><i class="fas fa-terminal"></i> {{ ti18n('terminals.terminal') }}</strong>
            <span>{{ terminalInfo.terminal.session_id }}</span>
          </div>
          <div class="info-item">
            <strong><i class="fas fa-server"></i> {{ ti18n('terminals.instance') }}</strong>
            <span>{{ terminalInfo.terminal.instance_type }}</span>
          </div>
          <div class="info-item">
            <strong><i class="fas fa-info-circle"></i> {{ ti18n('terminals.status') }}</strong>
            <span :class="getStatusClass(terminalInfo.terminal.status)">
              {{ terminalInfo.terminal.status }}
            </span>
          </div>
        </div>

        <div class="access-section">
          <div class="section-header">
            <h4>
              <i class="fas fa-crown"></i>
              {{ t('access.owner') }}
            </h4>
          </div>
          <div class="access-item owner">
            <div class="user-info">
              <div class="user-name">{{ getUserDisplayName(terminalInfo?.terminal.user_id || '') }}</div>
              <div class="access-badge owner-badge">
                <i class="fas fa-crown"></i>
                {{ t('access.ownerBadge') }}
              </div>
            </div>
            <div class="user-meta">
              <small class="text-muted">{{ ti18n('terminals.fullControl') }}</small>
            </div>
          </div>
        </div>

        <div v-if="shares && shares.length > 0" class="access-section">
          <div class="section-header">
            <h4>
              <i class="fas fa-users"></i>
              {{ t('access.sharedUsers') }} ({{ shares ? shares.length : 0 }})
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
                    {{ t('access.sharedAt') }} {{ formatDate(share.created_at) }}
                  </small>
                  <small v-if="share.expires_at" class="text-warning">
                    <i class="fas fa-clock"></i>
                    {{ t('access.expiresAt') }} {{ formatDate(share.expires_at) }}
                  </small>
                </div>
                <div class="meta-row">
                  <small :class="share.is_active ? 'text-success' : 'text-danger'">
                    <i :class="share.is_active ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                    {{ share.is_active ? t('access.active') : t('access.inactive') }}
                  </small>
                </div>
              </div>
              <div class="user-actions">
                <button
                  class="btn btn-danger btn-sm"
                  @click="revokeUserAccess(share.shared_with_user_id)"
                  :disabled="isRevoking"
                  :title="t('access.revokeAccess')"
                >
                  <i v-if="isRevoking" class="fas fa-spinner fa-spin"></i>
                  <i v-else class="fas fa-user-times"></i>
                  {{ t('access.revoke') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="!shares || shares.length === 0" class="access-section">
          <div class="empty-state">
            <i class="fas fa-users fa-3x"></i>
            <h5>{{ ti18n('terminals.noActiveSharing') }}</h5>
            <p class="text-muted">{{ ti18n('terminals.notSharedWithUsers') }}</p>
          </div>
        </div>

        <div v-if="error" class="alert alert-danger">
          <i class="fas fa-exclamation-triangle"></i>
          {{ error }}
        </div>
      </div>
    </template>

    <template #footer>
      <button class="btn btn-primary" @click="openSharingModal">
        <i class="fas fa-plus"></i>
        {{ t('access.addUser') }}
      </button>
      <button class="btn btn-secondary" @click="closeModal">
        <i class="fas fa-times"></i>
        {{ t('access.close') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { terminalService, type TerminalShareOutput, type SharedTerminalInfo } from '../../services/domain/terminal'
import { userService, type User } from '../../services/domain/user'
import { useTranslations } from '../../composables/useTranslations'
import BaseModal from '../Modals/BaseModal.vue'

const { t: ti18n } = useI18n()
const { t } = useTranslations({
  en: {
    access: {
      manageAccess: 'Manage Access',
      owner: 'Owner',
      ownerBadge: 'Owner',
      sharedUsers: 'Shared users',
      sharedAt: 'Shared at:',
      expiresAt: 'Expires at:',
      active: 'Active',
      inactive: 'Inactive',
      revokeAccess: 'Revoke access',
      revoke: 'Revoke',
      addUser: 'Add a user',
      close: 'Close',
      accessRead: 'Read',
      accessWrite: 'Write',
      accessAdmin: 'Admin',
      loadError: 'Error loading access data',
      revokeError: 'Error revoking access'
    }
  },
  fr: {
    access: {
      manageAccess: 'Gérer les Accès',
      owner: 'Propriétaire',
      ownerBadge: 'Propriétaire',
      sharedUsers: 'Utilisateurs partagés',
      sharedAt: 'Partagé le :',
      expiresAt: 'Expire le :',
      active: 'Actif',
      inactive: 'Inactif',
      revokeAccess: 'Révoquer l\'accès',
      revoke: 'Révoquer',
      addUser: 'Ajouter un utilisateur',
      close: 'Fermer',
      accessRead: 'Lecture',
      accessWrite: 'Écriture',
      accessAdmin: 'Admin',
      loadError: 'Erreur lors du chargement des données d\'accès',
      revokeError: 'Erreur lors de la révocation de l\'accès'
    }
  }
})

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
        error.value = sharesErr.response?.data?.error_message || t('access.loadError')
      }
    }

  } catch (err: any) {
    console.error('Error loading terminal access data:', err)
    error.value = err.response?.data?.error_message || t('access.loadError')
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
    error.value = err.response?.data?.error_message || t('access.revokeError')
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
    case 'read': return t('access.accessRead')
    case 'write': return t('access.accessWrite')
    case 'admin': return t('access.accessAdmin')
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
.access-modal-wrapper {
  width: 100%;
}

.terminal-info {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg-tertiary);
  border-radius: var(--border-radius-md);
  border-left: 4px solid var(--color-primary);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item strong {
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.access-section {
  margin-bottom: var(--spacing-lg);
}

.section-header {
  margin-bottom: var(--spacing-md);
}

.section-header h4 {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.access-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.access-item {
  padding: var(--spacing-md);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  background-color: var(--color-bg-primary);
  transition: box-shadow var(--transition-base);
}

.access-item:hover {
  box-shadow: var(--shadow-md);
}

.access-item.owner {
  background-color: var(--color-warning-bg);
  border-color: var(--color-warning-bg);
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.user-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
}

.access-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.owner-badge {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
  border: 1px solid var(--color-warning-bg);
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

.admin-badge {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
  border: 1px solid var(--color-warning-bg);
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-md);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
  color: var(--color-text-muted);
}

.empty-state i {
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-state h5 {
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-secondary);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
  border: var(--border-width-thin) solid transparent;
  border-radius: var(--border-radius-sm);
  text-decoration: none;
  transition: all var(--transition-base);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
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

.btn-danger {
  background-color: var(--color-danger);
  border-color: var(--color-danger);
  color: var(--color-white);
}

.alert {
  padding: var(--spacing-md) var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.alert-danger {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: var(--border-width-thin) solid var(--color-danger-border);
}

.text-success { color: var(--color-success) !important; }
.text-danger { color: var(--color-danger) !important; }
.text-warning { color: var(--color-warning) !important; }
.text-muted { color: var(--color-text-muted) !important; }

/* Responsive */
@media (max-width: 768px) {
  .user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .meta-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
}
</style>