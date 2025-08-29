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
import TerminalStarter from '../Terminal/TerminalStarter.vue';
import axios from 'axios';

const sessions = ref([]);
const isLoading = ref(false);
const error = ref('');
const activeTab = ref('starter'); // 'starter' ou 'sessions'

onMounted(() => {
  loadSessions();
  
  // Rafraîchir les sessions toutes les 30 secondes
  setInterval(loadSessions, 30000);
});

async function loadSessions() {
  try {
    const response = await axios.get('/terminals/user-sessions');
    sessions.value = response.data || [];
  } catch (err) {
    console.error('Erreur lors du chargement des sessions:', err);
    // Ne pas afficher l'erreur si c'est juste un problème de chargement des sessions existantes
  }
}

async function stopSession(sessionId: string) {
  try {
    await axios.post(`/terminals/${sessionId}/stop`);
    await loadSessions(); // Recharger la liste
  } catch (err) {
    console.error('Erreur lors de l\'arrêt:', err);
    alert('Erreur lors de l\'arrêt de la session');
  }
}

function formatDate(dateString: string) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}

function getStatusClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'active': return 'text-success';
    case 'expired': return 'text-danger';
    case 'stopped': return 'text-muted';
    default: return 'text-warning';
  }
}
</script>

<template>
  <div class="terminals-page">
    <div class="page-header">
      <h2>Gestion des Sessions Terminal</h2>
    </div>

    <!-- Navigation par onglets -->
    <div class="tabs-navigation">
      <button 
        :class="['tab-btn', { active: activeTab === 'starter' }]"
        @click="activeTab = 'starter'"
      >
        <i class="fas fa-play"></i>
        Nouvelle Session
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'sessions' }]"
        @click="activeTab = 'sessions'"
      >
        <i class="fas fa-list"></i>
        Sessions Actives ({{ sessions.length }})
      </button>
    </div>

    <!-- Contenu des onglets -->
    <div class="tab-content">
      <!-- Onglet Nouvelle Session -->
      <div v-if="activeTab === 'starter'" class="tab-pane">
        <TerminalStarter />
      </div>

      <!-- Onglet Sessions Actives -->
      <div v-if="activeTab === 'sessions'" class="tab-pane">
        <div class="sessions-section">
          <div class="section-header">
            <h3>Sessions Terminal Actives</h3>
            <button class="btn btn-secondary" @click="loadSessions">
              <i class="fas fa-sync"></i>
              Actualiser
            </button>
          </div>

          <div v-if="isLoading" class="loading-section">
            <i class="fas fa-spinner fa-spin"></i> Chargement des sessions...
          </div>

          <div v-else-if="error" class="alert alert-danger">
            {{ error }}
          </div>

          <div v-else-if="sessions.length === 0" class="empty-section">
            <i class="fas fa-terminal fa-3x text-muted"></i>
            <h4>Aucune session active</h4>
            <p class="text-muted">Démarrez une nouvelle session dans l'onglet "Nouvelle Session"</p>
          </div>

          <div v-else class="sessions-grid">
            <div 
              v-for="session in sessions" 
              :key="session.id" 
              class="session-card"
            >
              <div class="card-header">
                <h5 class="session-id">{{ session.session_id }}</h5>
                <span :class="['status-badge', getStatusClass(session.status)]">
                  <i class="fas fa-circle"></i>
                  {{ session.status }}
                </span>
              </div>

              <div class="card-body">
                <div class="session-details">
                  <div class="detail-row">
                    <span class="label">ID:</span>
                    <span class="value">{{ session.id }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Créée le:</span>
                    <span class="value">{{ formatDate(session.created_at) }}</span>
                  </div>
                  <div class="detail-row" v-if="session.expires_at">
                    <span class="label">Expire le:</span>
                    <span class="value">{{ formatDate(session.expires_at) }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Utilisateur:</span>
                    <span class="value">{{ session.user_id }}</span>
                  </div>
                </div>
              </div>

              <div class="card-actions">
                <button 
                  class="btn btn-danger btn-sm"
                  @click="stopSession(session.id)"
                  :disabled="session.status !== 'active'"
                >
                  <i class="fas fa-stop"></i>
                  Arrêter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.terminals-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.tabs-navigation {
  display: flex;
  border-bottom: 2px solid #e9ecef;
  margin-bottom: 30px;
}

.tab-btn {
  padding: 12px 24px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: #6c757d;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn:hover {
  color: #495057;
  background-color: #f8f9fa;
}

.tab-btn.active {
  color: #007bff;
  border-bottom-color: #007bff;
  background-color: #fff;
}

.tab-content {
  min-height: 500px;
}

.tab-pane {
  animation: fadeIn 0.3s ease-in-out;
}

.sessions-section {
  width: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  color: #495057;
}

.loading-section {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.empty-section {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.empty-section i {
  margin-bottom: 20px;
  opacity: 0.5;
}

.sessions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.session-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: white;
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.session-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-id {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #495057;
}

.status-badge {
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
}

.card-body {
  padding: 20px;
}

.session-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-row .label {
  font-weight: 600;
  color: #6c757d;
  font-size: 14px;
}

.detail-row .value {
  color: #495057;
  font-size: 14px;
}

.card-actions {
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  text-align: right;
}

.alert {
  padding: 12px 15px;
  border-radius: 4px;
  margin: 15px 0;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.btn {
  display: inline-block;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: normal;
  line-height: 1.42857143;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 4px;
  text-decoration: none;
  color: #333;
  background-color: #fff;
  border-color: #ccc;
}

.btn:hover:not(:disabled) {
  opacity: 0.9;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
  border-radius: 3px;
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

.text-success { color: #28a745; }
.text-danger { color: #dc3545; }
.text-warning { color: #ffc107; }
.text-muted { color: #6c757d; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 768px) {
  .terminals-page {
    padding: 10px;
  }
  
  .tabs-navigation {
    flex-direction: column;
  }
  
  .tab-btn {
    justify-content: center;
    padding: 15px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .sessions-grid {
    grid-template-columns: 1fr;
  }
}
</style>