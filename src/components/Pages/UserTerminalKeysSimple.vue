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
    alert('Clé régénérée avec succès');
  } catch (err) {
    alert('Erreur lors de la régénération');
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
      <div v-if="showConfirm" class="modal-overlay" @click="showConfirm = false">
        <div class="modal-content" @click.stop>
          <h3>Confirmation</h3>
          <p>Êtes-vous sûr de vouloir régénérer votre clé terminal ? Cela invalidera la clé actuelle.</p>
          <div class="modal-actions">
            <button class="btn btn-warning" @click="regenerateKey" :disabled="isRegenerating">
              Confirmer
            </button>
            <button class="btn btn-secondary" @click="showConfirm = false">
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  width: 100%;
  padding: 20px;
}

.content {
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
}

.alert {
  padding: 12px 15px;
  border-radius: 4px;
  margin: 15px 0;
}

.alert-info {
  background-color: #d1ecf1;
  border: 1px solid #bee5eb;
  color: #0c5460;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.key-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.key-card h3 {
  margin-bottom: 20px;
  color: #495057;
}

.details-grid {
  display: grid;
  gap: 15px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.detail-item label {
  font-weight: 600;
  color: #495057;
}

.badge {
  padding: 0.25em 0.5em;
  font-size: 0.75em;
  border-radius: 0.25rem;
  color: white;
}

.badge.active {
  background-color: #28a745;
}

.badge.inactive {
  background-color: #dc3545;
}

.no-key {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.no-key i {
  color: #dee2e6;
  margin-bottom: 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn-warning {
  background-color: #ffc107;
  color: #212529;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

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
  padding: 20px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}
</style>