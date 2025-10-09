<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <SettingsCard :title="t('sshkeys.pageTitle')">
    <template #headerActions>
      <button class="btn btn-primary" @click="openAddModal">
        <i class="fas fa-plus"></i> {{ t('sshkeys.add') }}
      </button>
    </template>

    <p class="section-description">{{ t('sshkeys.description') }}</p>

    <!-- SSH Keys List -->
    <div v-if="sshKeysStore.isLoading" class="loading">
      <div class="spinner"></div>
      Loading...
    </div>
    <div v-else-if="sshKeysStore.entities.length === 0" class="empty-state">
      <i class="fas fa-key"></i>
      <p>{{ t('sshkeys.noKeys') }}</p>
    </div>
    <ul v-else class="ssh-keys-list list-unstyled">
      <li v-for="key in sshKeysStore.entities" :key="key.id" class="ssh-key-item">
        <div class="key-info">
          <h4>{{ key.name }}</h4>
          <p class="key-date text-muted">{{ t('created_at') }}: {{ formatDate(key.created_at) }}</p>
        </div>
        <div class="key-actions d-flex gap-sm">
          <button class="btn btn-sm btn-secondary" @click="openEditModal(key)">
            <i class="fas fa-edit"></i>
          </button>
          <button
            class="btn btn-sm btn-danger"
            @click="deleteKey(key.id)"
            :disabled="sshKeysStore.preventLastObjectDeletion && sshKeysStore.entities.length <= 1"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </li>
    </ul>

    <!-- Modal for Add/Edit -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingKey ? t('sshkeys.modify') : t('sshkeys.add') }}</h3>
          <button class="close-button" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>{{ t('sshkeys.name') }}</label>
            <input
              type="text"
              v-model="keyForm.name"
              class="form-control"
              required
            />
          </div>
          <div v-if="!editingKey" class="form-group">
            <label>{{ t('sshkeys.value') }}</label>
            <textarea
              v-model="keyForm.private_key"
              class="form-control"
              rows="8"
              required
              placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">
            {{ t('cancel') }}
          </button>
          <button class="btn btn-primary" @click="saveKey" :disabled="sshKeysStore.isLoading">
            {{ sshKeysStore.isLoading ? 'Saving...' : t('save') }}
          </button>
        </div>
      </div>
    </div>
  </SettingsCard>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSshKeysStore } from '../../stores/sshKeys'
import SettingsCard from '../UI/SettingsCard.vue'
import { useNotification } from '../../composables/useNotification'

const { t } = useI18n()
const sshKeysStore = useSshKeysStore()
const { showConfirm } = useNotification()

// Add missing translations
useI18n().mergeLocaleMessage('en', {
  sshkeys: {
    ...useI18n().getLocaleMessage('en').sshkeys,
    description: 'Manage your SSH keys for terminal access',
    noKeys: 'No SSH keys configured yet'
  }
})

useI18n().mergeLocaleMessage('fr', {
  sshkeys: {
    ...useI18n().getLocaleMessage('fr').sshkeys,
    description: 'Gérez vos clés SSH pour l\'accès aux terminaux',
    noKeys: 'Aucune clé SSH configurée pour le moment'
  }
})

const showModal = ref(false)
const editingKey = ref<any>(null)
const keyForm = ref({
  name: '',
  private_key: ''
})

onMounted(async () => {
  await sshKeysStore.loadEntities()
})

function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString()
}

function openAddModal() {
  editingKey.value = null
  keyForm.value = {
    name: '',
    private_key: ''
  }
  showModal.value = true
}

function openEditModal(key: any) {
  editingKey.value = key
  keyForm.value = {
    name: key.name,
    private_key: '' // Don't show private key for security
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingKey.value = null
  keyForm.value = {
    name: '',
    private_key: ''
  }
}

async function saveKey() {
  try {
    if (editingKey.value) {
      await sshKeysStore.update(editingKey.value.id, { name: keyForm.value.name })
    } else {
      await sshKeysStore.create(keyForm.value)
    }
    await sshKeysStore.loadEntities()
    closeModal()
  } catch (error) {
    console.error('Error saving SSH key:', error)
  }
}

async function deleteKey(id: string) {
  const confirmed = await showConfirm(t('confirmDelete'), t('delete'))
  if (confirmed) {
    try {
      await sshKeysStore.delete(id)
      await sshKeysStore.loadEntities()
    } catch (error) {
      console.error('Error deleting SSH key:', error)
    }
  }
}
</script>

<style scoped>
.section-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-lg);
}

.ssh-keys-list {
  margin-top: var(--spacing-lg);
}

.ssh-key-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border-left: 3px solid var(--color-primary);
  transition: all var(--transition-base);
}

.ssh-key-item:hover {
  background-color: var(--color-bg-tertiary);
  box-shadow: var(--shadow-sm);
}

.key-info h4 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.key-date {
  margin: 0;
  font-size: var(--font-size-xs);
}

.close-button {
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  cursor: pointer;
  padding: 0;
  opacity: 0.7;
  transition: opacity var(--transition-base);
}

.close-button:hover {
  opacity: 1;
}

textarea.form-control {
  resize: vertical;
  min-height: 150px;
  font-family: var(--font-family-monospace);
}
</style>
