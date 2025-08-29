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

const sessions = ref([]);
const isLoading = ref(false);
const error = ref('');

onMounted(() => {
  loadSessions();
});

async function loadSessions() {
  isLoading.value = true;
  try {
    const response = await axios.get('/terminals/user-sessions');
    sessions.value = response.data || [];
  } catch (err) {
    error.value = 'Erreur lors du chargement des sessions';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
}

async function stopSession(sessionId: string) {
  try {
    await axios.post(`/terminals/${sessionId}/stop`);
    await loadSessions(); // Recharger la liste
  } catch (err) {
    console.error('Erreur lors de l\'arrêt:', err);
  }
}
</script>

<template>
  <div class="wrapper">
    <div class="content">
      <h2>Sessions Terminal</h2>
      
      <div v-if="isLoading" class="loading">
        <i class="fas fa-spinner fa-spin"></i> Chargement...
      </div>
      
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      
      <div v-else-if="sessions.length === 0" class="empty-state">
        <p>Aucune session terminal active</p>
      </div>
      
      <div v-else class="sessions-list">
        <div v-for="session in sessions" :key="session.id" class="session-card">
          <div class="session-info">
            <h4>{{ session.session_id }}</h4>
            <p>Statut: {{ session.status }}</p>
            <p>Expire le: {{ new Date(session.expires_at).toLocaleString() }}</p>
          </div>
          <div class="session-actions">
            <button 
              class="btn btn-danger"
              @click="stopSession(session.id)"
            >
              Arrêter
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

.loading {
  text-align: center;
  padding: 40px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.sessions-list {
  display: grid;
  gap: 15px;
}

.session-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-info h4 {
  margin: 0 0 10px 0;
}

.session-info p {
  margin: 5px 0;
  color: #6c757d;
}

.session-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.alert {
  padding: 12px;
  border-radius: 4px;
  margin: 15px 0;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>