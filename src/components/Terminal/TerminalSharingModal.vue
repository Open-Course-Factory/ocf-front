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
          <i class="fas fa-share-alt"></i>
          {{ t('terminalSharing.title') }}
        </h3>
        <button class="modal-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="terminalInfo" class="terminal-info">
          <h4>{{ t('terminalSharing.terminalLabel') }}: {{ terminalInfo.terminal.session_id }}</h4>
          <p class="text-muted">
            <i class="fas fa-server"></i>
            {{ t('terminalSharing.instance') }}: {{ terminalInfo.terminal.instance_type }} |
            {{ t('terminalSharing.status') }}: <span :class="getStatusClass(terminalInfo.terminal.status)">{{ terminalInfo.terminal.status }}</span>
          </p>
        </div>

        <form @submit.prevent="shareTerminal" class="sharing-form">
          <div class="form-group">
            <label for="userSearch">{{ t('terminalSharing.userToAdd') }}</label>
            <div class="user-search-container">
              <input
                id="userSearch"
                v-model="userSearchQuery"
                type="text"
                class="form-control"
                :placeholder="t('terminalSharing.searchPlaceholder')"
                @input="onSearchInput"
                @focus="showSearchDropdown = true"
                @blur="onSearchBlur"
                required
              />
              <div v-if="showSearchDropdown && (searchResults.length > 0 || isSearching)" class="search-dropdown">
                <div v-if="isSearching" class="search-loading">
                  <i class="fas fa-spinner fa-spin"></i>
                  {{ t('terminalSharing.searchInProgress') }}
                </div>
                <div v-else-if="searchResults.length === 0 && userSearchQuery.trim()" class="search-empty">
                  {{ t('terminalSharing.noUserFound') }}
                </div>
                <div
                  v-for="user in searchResults"
                  :key="user.id"
                  class="search-result"
                  @click="selectUser(user)"
                >
                  <div class="user-info">
                    <div class="user-name">{{ user.name }}</div>
                    <div class="user-email" v-if="user.email">{{ user.email }}</div>
                  </div>
                </div>
              </div>
            </div>
            <small class="form-text text-muted">
              {{ t('terminalSharing.userSearchHelp') }}
            </small>
          </div>

          <div class="form-group">
            <label for="accessLevel">{{ t('terminalSharing.accessLevel') }}</label>
            <select
              id="accessLevel"
              v-model="shareData.access_level"
              class="form-control"
              required
            >
              <option value="read">{{ t('terminalSharing.readAccess') }}</option>
              <option value="write">{{ t('terminalSharing.writeAccess') }}</option>
              <option value="admin">{{ t('terminalSharing.adminAccess') }}</option>
            </select>
            <small class="form-text text-muted">
              {{ t('terminalSharing.accessLevelHelp') }}
            </small>
          </div>

          <div class="form-group">
            <label for="expiresAt">{{ t('terminalSharing.expirationDate') }}</label>
            <input
              id="expiresAt"
              v-model="shareData.expires_at"
              type="datetime-local"
              class="form-control"
            />
            <small class="form-text text-muted">
              {{ t('terminalSharing.expirationHelp') }}
            </small>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="isSharing">
              <i v-if="isSharing" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-share-alt"></i>
              {{ isSharing ? t('terminalSharing.buttonSharing') : t('terminalSharing.buttonShare') }}
            </button>
            <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="isSharing">
              <i class="fas fa-times"></i>
              {{ t('terminalSharing.buttonCancel') }}
            </button>
          </div>
        </form>

        <div v-if="successMessage" class="alert alert-success">
          <i class="fas fa-check-circle"></i>
          {{ successMessage }}
        </div>

        <div v-if="error" class="alert alert-danger">
          <i class="fas fa-exclamation-triangle"></i>
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { terminalService, type ShareTerminalRequest, type SharedTerminalInfo } from '../../services/terminalService'
import { userService, type User } from '../../services/userService'

const i18n = useI18n()
const { t } = i18n

interface Props {
  show: boolean
  terminalId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  shared: [terminalId: string]
}>()

const terminalInfo = ref<SharedTerminalInfo | null>(null)
const shareData = ref<ShareTerminalRequest>({
  shared_with_user_id: '',
  access_level: 'read',
  expires_at: ''
})

const isSharing = ref(false)
const error = ref('')
const successMessage = ref('')
const userSearchQuery = ref('')
const searchResults = ref<User[]>([])
const isSearching = ref(false)
const showSearchDropdown = ref(false)

onMounted(() => {
  // Add translations
  i18n.mergeLocaleMessage('en', {
    terminalSharing: {
      title: 'Share Terminal',
      terminalLabel: 'Terminal',
      instance: 'Instance',
      status: 'Status',
      userToAdd: 'User to Add',
      searchPlaceholder: 'Search by name or email...',
      searchInProgress: 'Searching...',
      noUserFound: 'No user found',
      userSearchHelp: 'Search and select the user to share this terminal with.',
      accessLevel: 'Access Level',
      readAccess: 'Read (View only)',
      writeAccess: 'Write (Can execute commands)',
      adminAccess: 'Admin (Full control)',
      accessLevelHelp: 'Select the permission level for this user.',
      expirationDate: 'Expiration Date (Optional)',
      expirationHelp: 'Leave empty for permanent access (until terminal is stopped).',
      buttonSharing: 'Sharing...',
      buttonShare: 'Share',
      buttonCancel: 'Cancel',
      successMessage: 'Terminal successfully shared!',
      errorLoading: 'Error loading terminal information',
      errorSharing: 'Error sharing the terminal'
    }
  })

  i18n.mergeLocaleMessage('fr', {
    terminalSharing: {
      title: 'Partager le Terminal',
      terminalLabel: 'Terminal',
      instance: 'Instance',
      status: 'Statut',
      userToAdd: 'Utilisateur à ajouter',
      searchPlaceholder: 'Rechercher par nom ou email...',
      searchInProgress: 'Recherche...',
      noUserFound: 'Aucun utilisateur trouvé',
      userSearchHelp: 'Recherchez et sélectionnez l\'utilisateur avec qui partager ce terminal.',
      accessLevel: 'Niveau d\'accès',
      readAccess: 'Lecture (Visualisation uniquement)',
      writeAccess: 'Écriture (Peut exécuter des commandes)',
      adminAccess: 'Admin (Contrôle total)',
      accessLevelHelp: 'Sélectionnez le niveau d\'autorisation pour cet utilisateur.',
      expirationDate: 'Date d\'expiration (Optionnel)',
      expirationHelp: 'Laissez vide pour un accès permanent (jusqu\'à l\'arrêt du terminal).',
      buttonSharing: 'Partage...',
      buttonShare: 'Partager',
      buttonCancel: 'Annuler',
      successMessage: 'Terminal partagé avec succès!',
      errorLoading: 'Erreur lors du chargement des informations du terminal',
      errorSharing: 'Erreur lors du partage du terminal'
    }
  })
})

watch(() => props.show, async (newShow) => {
  if (newShow && props.terminalId) {
    await loadTerminalInfo()
    resetForm()
  }
})

async function loadTerminalInfo() {
  if (!props.terminalId) return

  try {
    terminalInfo.value = await terminalService.getTerminalInfo(props.terminalId)
  } catch (err: any) {
    console.error('Error loading terminal info:', err)
    error.value = err.response?.data?.error_message || t('terminalSharing.errorLoading')
  }
}

async function shareTerminal() {
  if (!props.terminalId) return

  isSharing.value = true
  error.value = ''

  try {
    // Prepare the data with proper datetime formatting
    const requestData = {
      shared_with_user_id: shareData.value.shared_with_user_id,
      access_level: shareData.value.access_level,
      // Only include expires_at if it's provided, and format it properly
      ...(shareData.value.expires_at && {
        expires_at: new Date(shareData.value.expires_at).toISOString()
      })
    }

    await terminalService.shareTerminal(props.terminalId, requestData)
    successMessage.value = t('terminalSharing.successMessage')
    emit('shared', props.terminalId)

    // Show success message briefly before closing
    setTimeout(() => {
      closeModal()
    }, 1500)
  } catch (err: any) {
    console.error('Error sharing terminal:', err)
    error.value = err.response?.data?.error_message || t('terminalSharing.errorSharing')
  } finally {
    isSharing.value = false
  }
}

async function onSearchInput() {
  const query = userSearchQuery.value.trim()

  if (query.length < 2) {
    searchResults.value = []
    return
  }

  isSearching.value = true

  try {
    searchResults.value = await userService.searchUsers(query)
  } catch (err: any) {
    console.error('Error searching users:', err)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

function selectUser(user: User) {
  shareData.value.shared_with_user_id = user.id
  userSearchQuery.value = `${user.name}${user.email ? ` (${user.email})` : ''}`
  showSearchDropdown.value = false
}

function onSearchBlur() {
  // Delay hiding dropdown to allow click events to fire
  setTimeout(() => {
    showSearchDropdown.value = false
  }, 200)
}

function resetForm() {
  shareData.value = {
    shared_with_user_id: '',
    access_level: 'read',
    expires_at: ''
  }
  userSearchQuery.value = ''
  searchResults.value = []
  showSearchDropdown.value = false
  error.value = ''
  successMessage.value = ''
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
  max-width: 500px;
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
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.terminal-info h4 {
  margin: 0 0 8px 0;
  color: #495057;
  font-size: 16px;
}

.terminal-info p {
  margin: 0;
  font-size: 14px;
}

.sharing-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.form-control {
  padding: 10px 12px;
  border: 2px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  color: #495057;
  background-color: #fff;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  outline: 0;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-text {
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
}

.user-search-container {
  position: relative;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ced4da;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-loading,
.search-empty {
  padding: 12px 15px;
  text-align: center;
  color: #6c757d;
  font-size: 14px;
}

.search-result {
  padding: 10px 15px;
  cursor: pointer;
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.2s;
}

.search-result:hover {
  background-color: #f8f9fa;
}

.search-result:last-child {
  border-bottom: none;
}

.search-result .user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.search-result .user-name {
  font-weight: 500;
  color: #495057;
  font-size: 14px;
}

.search-result .user-email {
  font-size: 12px;
  color: #6c757d;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px solid #dee2e6;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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

.alert {
  padding: 12px 15px;
  border-radius: 6px;
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
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

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>