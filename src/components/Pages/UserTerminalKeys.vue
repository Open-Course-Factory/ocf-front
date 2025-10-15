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

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useNotification } from '../../composables/useNotification';
import BaseModal from '../Modals/BaseModal.vue';

const { showSuccess, showError } = useNotification();

const currentKey = ref(null);
const isLoading = ref(false);
const error = ref('');
const isRegenerating = ref(false);
const showConfirm = ref(false);

onMounted(() => {
  loadKey();
});

async function loadKey() {
  isLoading.value = true;
  try {
    const response = await axios.get('/user-terminal-keys/my-key');
    currentKey.value = response.data;
  } catch (err: any) {
    if (err.response?.status !== 404) {
      error.value = 'Erreur lors du chargement de la clé';
    }
  } finally {
    isLoading.value = false;
  }
}

function confirmRegenerate() {
  showConfirm.value = true;
}

async function regenerateKey() {
  isRegenerating.value = true;
  try {
    await axios.post('/user-terminal-keys/regenerate');
    await loadKey();
    showConfirm.value = false;
    showSuccess('Clé régénérée avec succès');
  } catch (err) {
    showError('Erreur lors de la régénération', 'Erreur');
  } finally {
    isRegenerating.value = false;
  }
}

function formatDate(dateString: string) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}
</script>

<template>
  <div class="wrapper">
    <div class="content">
      <div class="header">
        <h2>Clés d'accès Terminal</h2>
        <button 
          class="btn btn-warning" 
          @click="confirmRegenerate"
          :disabled="isRegenerating"
        >
          <i v-if="isRegenerating" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-sync"></i>
          Régénérer la clé
        </button>
      </div>

      <div v-if="isLoading" class="loading">
        <i class="fas fa-spinner fa-spin"></i> Chargement...
      </div>

      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>

      <div v-else-if="currentKey" class="key-details">
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          Gardez votre clé terminal sécurisée. Elle donne accès aux sessions terminal.
        </div>

        <div class="key-card">
          <h3>Détails de la clé</h3>
          <div class="details-grid">
            <div class="detail-item">
              <label>ID:</label>
              <span>{{ currentKey.id }}</span>
            </div>
            <div class="detail-item">
              <label>Nom de la clé:</label>
              <span>{{ currentKey.key_name }}</span>
            </div>
            <div class="detail-item">
              <label>Statut:</label>
              <span :class="['badge', currentKey.is_active ? 'active' : 'inactive']">
                {{ currentKey.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <div class="detail-item">
              <label>Sessions max:</label>
              <span>{{ currentKey.max_sessions === -1 ? '∞' : currentKey.max_sessions }}</span>
            </div>
            <div class="detail-item">
              <label>Créée le:</label>
              <span>{{ formatDate(currentKey.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="no-key">
        <i class="fas fa-key fa-3x"></i>
        <h4>Aucune clé terminal trouvée</h4>
        <p>Cliquez sur "Régénérer la clé" pour en créer une.</p>
      </div>

      <!-- Modal de confirmation simple -->
      <BaseModal
        :visible="showConfirm"
        title="Confirmation"
        title-icon="fas fa-exclamation-triangle"
        size="small"
        :show-default-footer="true"
        confirm-text="Confirmer"
        confirm-icon="fas fa-check"
        :confirm-disabled="isRegenerating"
        cancel-text="Annuler"
        @close="showConfirm = false"
        @confirm="regenerateKey"
      >
        <p>Êtes-vous sûr de vouloir régénérer votre clé terminal ? Cela invalidera la clé actuelle.</p>
      </BaseModal>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  width: 100%;
  padding: var(--spacing-lg);
}

.content {
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.header h2 {
  color: var(--color-text-primary);
}

.loading {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}

.alert {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  margin: var(--spacing-md) 0;
}

.alert-info {
  background-color: var(--color-info-bg);
  border: var(--border-width-thin) solid var(--color-info);
  color: var(--color-info-text);
}

.alert-danger {
  background-color: var(--color-danger-bg);
  border: var(--border-width-thin) solid var(--color-danger);
  color: var(--color-danger-text);
}

.key-card {
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.key-card h3 {
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
}

.details-grid {
  display: grid;
  gap: var(--spacing-md);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

.detail-item label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.detail-item span {
  color: var(--color-text-primary);
}

.badge {
  padding: 0.25em 0.5em;
  font-size: var(--font-size-xs);
  border-radius: var(--border-radius-full);
  color: var(--color-white);
}

.badge.active {
  background-color: var(--color-success);
}

.badge.inactive {
  background-color: var(--color-danger);
}

.no-key {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
  color: var(--color-text-muted);
}

.no-key i {
  color: var(--color-text-muted);
  opacity: 0.5;
  margin-bottom: var(--spacing-lg);
}

.no-key h4 {
  color: var(--color-text-primary);
}

.no-key p {
  color: var(--color-text-muted);
}

.btn {
  padding: var(--btn-padding-sm);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-base);
}

.btn-warning {
  background-color: var(--color-warning);
  color: var(--color-black);
}

.btn-warning:hover:not(:disabled) {
  background-color: var(--color-warning-hover);
}

.btn-secondary {
  background-color: var(--color-secondary);
  color: var(--color-white);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-secondary-hover);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>