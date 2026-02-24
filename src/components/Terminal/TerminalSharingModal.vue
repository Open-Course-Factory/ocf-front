<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <BaseModal
    :visible="show"
    :title="t('terminalSharing.title')"
    title-icon="fas fa-share-alt"
    size="medium"
    :is-loading="isSharing"
    :loading-text="t('terminalSharing.buttonSharing')"
    :error-message="error"
    :close-on-overlay-click="true"
    @close="closeModal"
  >
    <template #default>
        <div v-if="terminalInfo" class="terminal-info">
          <h4>{{ t('terminalSharing.terminalLabel') }}: {{ terminalInfo.terminal.session_id }}</h4>
          <p class="text-muted">
            <i class="fas fa-server"></i>
            {{ t('terminalSharing.instance') }}: {{ terminalInfo.terminal.instance_type }} |
            {{ t('terminalSharing.status') }}: <span :class="getStatusClass(terminalInfo.terminal.status)">{{ terminalInfo.terminal.status }}</span>
          </p>
        </div>

        <form @submit.prevent="shareTerminal" class="sharing-form">
          <!-- Share Type Selector (only if groups feature is enabled) -->
          <div v-if="canShareWithGroups" class="form-group">
            <label for="shareType">{{ t('terminalSharing.shareType') }}</label>
            <select
              id="shareType"
              v-model="shareType"
              class="form-control"
            >
              <option value="user">{{ t('terminalSharing.shareTypeUser') }}</option>
              <option value="group">{{ t('terminalSharing.shareTypeGroup') }}</option>
            </select>
          </div>

          <!-- User Search (shown when shareType is 'user') -->
          <div v-if="shareType === 'user'" class="form-group">
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

          <!-- Group Search (shown when shareType is 'group') -->
          <div v-else-if="shareType === 'group'" class="form-group">
            <label for="groupSearch">{{ t('terminalSharing.groupToAdd') }}</label>
            <div class="user-search-container">
              <input
                id="groupSearch"
                v-model="groupSearchQuery"
                type="text"
                class="form-control"
                :placeholder="t('terminalSharing.groupSearchPlaceholder')"
                @focus="showSearchDropdown = true"
                @blur="onSearchBlur"
                required
              />
              <div v-if="showSearchDropdown && filteredGroups.length > 0" class="search-dropdown">
                <div v-if="filteredGroups.length === 0 && groupSearchQuery.trim()" class="search-empty">
                  {{ t('terminalSharing.noGroupFound') }}
                </div>
                <div
                  v-for="group in filteredGroups"
                  :key="group.id"
                  class="search-result"
                  @click="selectGroup(group)"
                >
                  <div class="user-info">
                    <div class="user-name">{{ group.display_name || group.name }}</div>
                    <div class="user-email" v-if="group.description">{{ group.description }}</div>
                  </div>
                </div>
              </div>
            </div>
            <small class="form-text text-muted">
              {{ t('terminalSharing.groupSearchHelp') }}
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
              <option value="owner">{{ t('terminalSharing.ownerAccess') }}</option>
            </select>
            <small class="form-text text-muted">
              {{ shareType === 'group' ? t('terminalSharing.groupAccessLevelHelp') : t('terminalSharing.accessLevelHelp') }}
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

        </form>
    </template>

    <template #footer>
      <button type="submit" class="btn btn-primary" @click="shareTerminal" :disabled="isSharing || !isFormValid">
        <i v-if="isSharing" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-share-alt"></i>
        {{ isSharing ? t('terminalSharing.buttonSharing') : t('terminalSharing.buttonShare') }}
      </button>
      <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="isSharing">
        <i class="fas fa-times"></i>
        {{ t('terminalSharing.buttonCancel') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import { useFeatureFlags } from '../../composables/useFeatureFlags'
import { useClassGroupsStore } from '../../stores/classGroups'
import { terminalService, type ShareTerminalRequest, type SharedTerminalInfo } from '../../services/domain/terminal'
import { userService, type User } from '../../services/domain/user'
import BaseModal from '../Modals/BaseModal.vue'

const { t } = useTranslations({
  en: {
    terminalSharing: {
      title: 'Share Terminal',
      terminalLabel: 'Terminal',
      instance: 'Instance',
      status: 'Status',
      shareType: 'Share with',
      shareTypeUser: 'Individual User',
      shareTypeGroup: 'Group',
      userToAdd: 'User to Add',
      groupToAdd: 'Group to Add',
      searchPlaceholder: 'Search by name or email...',
      groupSearchPlaceholder: 'Search groups...',
      searchInProgress: 'Searching...',
      noUserFound: 'No user found',
      noGroupFound: 'No group found',
      userSearchHelp: 'Search and select the user to share this terminal with.',
      groupSearchHelp: 'Search and select the group to share this terminal with.',
      accessLevel: 'Access Level',
      readAccess: 'Read (View only)',
      writeAccess: 'Write (Can execute commands)',
      ownerAccess: 'Owner (Full control)',
      accessLevelHelp: 'Select the permission level for this user.',
      groupAccessLevelHelp: 'Select the permission level for all group members.',
      expirationDate: 'Expiration Date (Optional)',
      expirationHelp: 'Leave empty for permanent access (until terminal is stopped).',
      buttonSharing: 'Sharing...',
      buttonShare: 'Share',
      buttonCancel: 'Cancel',
      successMessage: 'Terminal successfully shared!',
      successTitle: 'Success',
      errorLoading: 'Error loading terminal information',
      errorSharing: 'Error sharing the terminal',
      errorNoUserSelected: 'Please select a user to share the terminal with',
      errorNoGroupSelected: 'Please select a group to share the terminal with'
    }
  },
  fr: {
    terminalSharing: {
      title: 'Partager le Terminal',
      terminalLabel: 'Terminal',
      instance: 'Instance',
      status: 'Statut',
      shareType: 'Partager avec',
      shareTypeUser: 'Utilisateur individuel',
      shareTypeGroup: 'Groupe',
      userToAdd: 'Utilisateur à ajouter',
      groupToAdd: 'Groupe à ajouter',
      searchPlaceholder: 'Rechercher par nom ou email...',
      groupSearchPlaceholder: 'Rechercher des groupes...',
      searchInProgress: 'Recherche...',
      noUserFound: 'Aucun utilisateur trouvé',
      noGroupFound: 'Aucun groupe trouvé',
      userSearchHelp: 'Recherchez et sélectionnez l\'utilisateur avec qui partager ce terminal.',
      groupSearchHelp: 'Recherchez et sélectionnez le groupe avec qui partager ce terminal.',
      accessLevel: 'Niveau d\'accès',
      readAccess: 'Lecture (Visualisation uniquement)',
      writeAccess: 'Écriture (Peut exécuter des commandes)',
      ownerAccess: 'Propriétaire (Contrôle total)',
      accessLevelHelp: 'Sélectionnez le niveau d\'autorisation pour cet utilisateur.',
      groupAccessLevelHelp: 'Sélectionnez le niveau d\'autorisation pour tous les membres du groupe.',
      expirationDate: 'Date d\'expiration (Optionnel)',
      expirationHelp: 'Laissez vide pour un accès permanent (jusqu\'à l\'arrêt du terminal).',
      buttonSharing: 'Partage...',
      buttonShare: 'Partager',
      buttonCancel: 'Annuler',
      successMessage: 'Terminal partagé avec succès!',
      successTitle: 'Succès',
      errorLoading: 'Erreur lors du chargement des informations du terminal',
      errorSharing: 'Erreur lors du partage du terminal',
      errorNoUserSelected: 'Veuillez sélectionner un utilisateur avec qui partager le terminal',
      errorNoGroupSelected: 'Veuillez sélectionner un groupe avec qui partager le terminal'
    }
  }
})

const { showSuccess } = useNotification()
const { isEnabled } = useFeatureFlags()
const groupStore = useClassGroupsStore()

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
const shareType = ref<'user' | 'group'>('user')
const shareData = ref<ShareTerminalRequest>({
  shared_with_user_id: '',
  access_level: 'read',
  expires_at: ''
})

const isSharing = ref(false)
const error = ref('')
const userSearchQuery = ref('')
const groupSearchQuery = ref('')
const searchResults = ref<User[]>([])
const isSearching = ref(false)
const showSearchDropdown = ref(false)

// Feature flag check for group sharing
const canShareWithGroups = computed(() => isEnabled('class_groups'))

// Filtered groups based on search
const filteredGroups = computed(() => {
  if (!groupSearchQuery.value.trim()) {
    return groupStore.entities
  }
  const query = groupSearchQuery.value.toLowerCase()
  return groupStore.entities.filter(group =>
    group.display_name?.toLowerCase().includes(query) ||
    group.name?.toLowerCase().includes(query) ||
    group.description?.toLowerCase().includes(query)
  )
})

// Check if form is valid (user or group selected)
const isFormValid = computed(() => {
  if (shareType.value === 'user') {
    return !!shareData.value.shared_with_user_id
  } else {
    return !!shareData.value.shared_with_group_id
  }
})

watch(() => props.show, async (newShow) => {
  if (newShow && props.terminalId) {
    await loadTerminalInfo()
    // Load groups if feature flag is enabled
    if (canShareWithGroups.value && groupStore.entities.length === 0) {
      await groupStore.loadEntities()
    }
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

  // Validate that a user or group has been selected
  if (shareType.value === 'user' && !shareData.value.shared_with_user_id) {
    error.value = t('terminalSharing.errorNoUserSelected')
    return
  }

  if (shareType.value === 'group' && !shareData.value.shared_with_group_id) {
    error.value = t('terminalSharing.errorNoGroupSelected')
    return
  }

  isSharing.value = true
  error.value = ''

  try {
    // Prepare the data based on share type
    const requestData: ShareTerminalRequest = {
      access_level: shareData.value.access_level,
      // Only include expires_at if it's provided, and format it properly
      ...(shareData.value.expires_at && {
        expires_at: new Date(shareData.value.expires_at).toISOString()
      })
    }

    // Add user_id or group_id based on share type
    if (shareType.value === 'user') {
      requestData.shared_with_user_id = shareData.value.shared_with_user_id
    } else {
      requestData.shared_with_group_id = shareData.value.shared_with_group_id
    }

    await terminalService.shareTerminal(props.terminalId, requestData)

    // Close modal immediately
    closeModal()

    // Show success notification
    showSuccess(
      t('terminalSharing.successMessage'),
      t('terminalSharing.successTitle')
    )

    emit('shared', props.terminalId)
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

function selectGroup(group: any) {
  shareData.value.shared_with_group_id = group.id
  groupSearchQuery.value = group.display_name || group.name
  showSearchDropdown.value = false
}

function onSearchBlur() {
  // Delay hiding dropdown to allow click events to fire
  setTimeout(() => {
    showSearchDropdown.value = false
  }, 200)
}

function resetForm() {
  shareType.value = 'user'
  shareData.value = {
    shared_with_user_id: '',
    shared_with_group_id: '',
    access_level: 'read',
    expires_at: ''
  }
  userSearchQuery.value = ''
  groupSearchQuery.value = ''
  searchResults.value = []
  showSearchDropdown.value = false
  error.value = ''
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

.terminal-info {
  margin-bottom: 20px;
  padding: 15px;
  background-color: var(--color-gray-50);
  border-radius: 6px;
  border-left: 4px solid var(--color-primary);
}

.terminal-info h4 {
  margin: 0 0 8px 0;
  color: var(--color-gray-700);
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
  color: var(--color-gray-700);
  font-size: 14px;
}

.form-control {
  padding: 10px 12px;
  border: 2px solid var(--color-gray-400);
  border-radius: 6px;
  font-size: 14px;
  color: var(--color-gray-700);
  background-color: var(--color-white);
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  outline: 0;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-text {
  font-size: 12px;
  color: var(--color-gray-600);
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
  background: var(--color-bg-primary);
  border: 1px solid var(--color-gray-400);
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
  color: var(--color-gray-600);
  font-size: 14px;
}

.search-result {
  padding: 10px 15px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-gray-50);
  transition: background-color 0.2s;
}

.search-result:hover {
  background-color: var(--color-gray-50);
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
  color: var(--color-gray-700);
  font-size: 14px;
}

.search-result .user-email {
  font-size: 12px;
  color: var(--color-gray-600);
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
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.btn-secondary {
  background-color: var(--color-gray-600);
  border-color: var(--color-gray-600);
  color: var(--color-white);
}

.text-success { color: var(--color-success) !important; }
.text-danger { color: var(--color-danger) !important; }
.text-warning { color: var(--color-warning) !important; }
.text-muted { color: var(--color-gray-600) !important; }

</style>