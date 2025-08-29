<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2024 Solution Libre
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
  <div class="generation-actions">
    <!-- Statut avec indicateur visuel -->
    <div class="status-display">
      <span class="status-badge" :class="statusClass">
        <i :class="statusIcon"></i>
        {{ getStatusText() }}
      </span>
      <div v-if="showProgress" class="progress-bar">
        <div class="progress-fill" :style="{ width: `${entity.progress || 0}%` }"></div>
        <span class="progress-text">{{ entity.progress || 0 }}%</span>
      </div>
    </div>

    <!-- Actions selon le statut -->
    <div class="action-buttons">
      <!-- Bouton de vérification du statut -->
      <button 
        v-if="canCheckStatus"
        class="btn btn-info btn-sm"
        @click="checkStatus"
        :disabled="isChecking"
        :title="t('generations.checkStatus')"
      >
        <i :class="isChecking ? 'fas fa-spinner fa-spin' : 'fas fa-sync'"></i>
        <br>
        {{ t('generations.checkStatus') }}
      </button>

      <!-- Bouton de téléchargement -->
      <button 
        v-if="canDownload"
        class="btn btn-success btn-sm"
        @click="downloadResults"
        :disabled="isDownloading"
        :title="t('generations.download')"
      >
        <i :class="isDownloading ? 'fas fa-spinner fa-spin' : 'fas fa-download'"></i>
        <br>
        {{ t('generations.download') }}
      </button>

      <!-- Bouton de retry -->
      <button 
        v-if="canRetry"
        class="btn btn-warning btn-sm"
        @click="retryGeneration"
        :disabled="isRetrying"
        :title="t('generations.retry')"
      >
        <i :class="isRetrying ? 'fas fa-spinner fa-spin' : 'fas fa-redo'"></i>
        <br>
        {{ t('generations.retry') }}
      </button>
    </div>

    <!-- Modal pour les erreurs -->
    <Modal :visible="showErrorModal" @close="showErrorModal = false">
      <div>
        <h3><i class="fas fa-exclamation-triangle text-warning"></i> Erreur</h3>
        <p>{{ errorMessage }}</p>
        <div v-if="entity.error_message" class="error-details">
          <h4>Détails de l'erreur :</h4>
          <pre>{{ entity.error_message }}</pre>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useGenerationsStore } from '../../stores/generations';
import Modal from '../Modals/BaseModal.vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';

const props = defineProps<{
  entity: any;
}>();

const { t } = useI18n();
const generationsStore = useGenerationsStore();

const isChecking = ref(false);
const isDownloading = ref(false);
const isRetrying = ref(false);
const showErrorModal = ref(false);
const errorMessage = ref('');

// Computed properties pour l'état
const statusClass = computed(() => {
  switch (props.entity.status?.toLowerCase()) {
    case 'completed': return 'status-success';
    case 'failed': 
    case 'client_error': 
    case 'tunnel_error': return 'status-error';
    case 'connecting': 
    case 'waiting': 
    case 'pending': return 'status-warning';
    default: return 'status-info';
  }
});

const statusIcon = computed(() => {
  switch (props.entity.status?.toLowerCase()) {
    case 'completed': return 'fas fa-check-circle';
    case 'failed': 
    case 'client_error': 
    case 'tunnel_error': return 'fas fa-times-circle';
    case 'connecting': 
    case 'waiting': return 'fas fa-spinner fa-spin';
    default: return 'fas fa-clock';
  }
});

const showProgress = computed(() => {
  return ['connecting', 'waiting', 'pending'].includes(props.entity.status?.toLowerCase()) && 
         props.entity.progress !== undefined;
});

const canCheckStatus = computed(() => {
  return props.entity.id && props.entity.status !== 'completed';
});

const canDownload = computed(() => {
  return props.entity.status === 'completed' && 
         props.entity.result_urls && 
         props.entity.result_urls.length > 0;
});

const canRetry = computed(() => {
  return ['failed', 'client_error', 'tunnel_error'].includes(props.entity.status?.toLowerCase());
});

// Méthodes
const getStatusText = () => {
  const status = props.entity.status?.toLowerCase();
  switch (status) {
    case 'completed': return t('generations.completed');
    case 'failed': 
    case 'client_error': 
    case 'tunnel_error': return t('generations.failed');
    case 'connecting': 
    case 'waiting': 
    case 'pending': return t('generations.generating');
    default: return t('generations.pending');
  }
};

const checkStatus = async () => {
  isChecking.value = true;
  try {
    await generationsStore.checkGenerationStatus(props.entity.id);
  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error);
    errorMessage.value = 'Impossible de vérifier le statut de la génération';
    showErrorModal.value = true;
  } finally {
    isChecking.value = false;
  }
};

const downloadResults = async () => {
  isDownloading.value = true;
  try {
    const response = await axios.get(
      `/generations/${props.entity.id}/download`,
      {
        responseType: 'blob' // Important pour télécharger un fichier
      }
    );

    // Créer un lien de téléchargement
    const blob = new Blob([response.data], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `generation-${props.entity.id}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    errorMessage.value = 'Impossible de télécharger les fichiers générés';
    showErrorModal.value = true;
  } finally {
    isDownloading.value = false;
  }
};

const retryGeneration = async () => {
  isRetrying.value = true;
  try {
    const response = await axios.post(`/generations/${props.entity.id}/retry`, {});

    // Démarrer le polling pour suivre la nouvelle génération
    if (response.status === 202) {
      generationsStore.startStatusPolling(props.entity.id);
    }
  } catch (error) {
    console.error('Erreur lors du retry:', error);
    errorMessage.value = 'Impossible de relancer la génération';
    showErrorModal.value = true;
  } finally {
    isRetrying.value = false;
  }
};

// Lifecycle
onMounted(() => {
  // Démarrer le polling si la génération est en cours
  if (['connecting', 'waiting', 'pending'].includes(props.entity.status?.toLowerCase())) {
    generationsStore.startStatusPolling(props.entity.id);
  }
});

onUnmounted(() => {
  // Arrêter le polling quand le composant est détruit
  generationsStore.stopStatusPolling(props.entity.id);
});
</script>

<style scoped>
.generation-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 200px;
}

.status-display {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-info {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.progress-bar {
  position: relative;
  height: 20px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  color: #212529;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.action-buttons .btn {
  flex: 1;
  min-width: 80px;
}

.error-details {
  margin-top: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.error-details pre {
  white-space: pre-wrap;
  font-size: 0.875rem;
  margin: 0;
}
</style>