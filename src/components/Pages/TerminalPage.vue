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

<template>
  <div class="terminal-page">
    <div v-if="!sessionId" class="error-container">
      <div class="error-content">
        <i class="fas fa-exclamation-triangle fa-3x"></i>
        <h2>Session manquante</h2>
        <p>L'ID de session n'a pas été fourni dans l'URL.</p>
        <p>Format attendu: <code>/terminal/SESSION_ID</code></p>
      </div>
    </div>
    
    <TerminalViewer
      v-else
      :session-id="sessionId"
      :show-header="showHeader"
      :show-footer="showFooter"
      :hide-controls="hideControls"
      :auto-connect="autoConnect"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TerminalViewer from '../Terminal/TerminalViewer.vue'

const route = useRoute()

// Récupération des paramètres depuis l'URL
const sessionId = computed(() => {
  const id = route.params.sessionId || route.query.sessionId
  console.log('TerminalPage - sessionId from route:', id)
  return id
})

const showHeader = computed(() => route.query.header !== 'false')
const showFooter = computed(() => route.query.footer === 'true')
const hideControls = computed(() => route.query.controls === 'false')
const autoConnect = computed(() => route.query.autoConnect !== 'false')

// Debug
console.log('TerminalPage mounted with route:', route.path)
console.log('Route params:', route.params)
console.log('Route query:', route.query)
</script>

<style scoped>
.terminal-page {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  background-color: #1e1e1e;
  overflow: hidden;
}

.error-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1e1e1e;
  color: #d4d4d4;
}

.error-content {
  text-align: center;
  padding: 40px;
  max-width: 500px;
}

.error-content i {
  color: #f44336;
  margin-bottom: 20px;
}

.error-content h2 {
  color: #d4d4d4;
  margin: 20px 0;
}

.error-content p {
  color: #aaa;
  margin: 10px 0;
  line-height: 1.5;
}

.error-content code {
  background-color: #2d2d30;
  padding: 4px 8px;
  border-radius: 4px;
  color: #4fc3f7;
  font-family: monospace;
}

/* Supprimer tous les margins/paddings pour l'iframe */
* {
  box-sizing: border-box;
}
</style>