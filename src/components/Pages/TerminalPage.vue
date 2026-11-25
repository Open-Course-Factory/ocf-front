<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Labinux
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
        <h2>{{ t('terminals.sessionMissing') }}</h2>
        <p>{{ t('terminals.sessionIdNotProvided') }}</p>
        <p>{{ t('terminals.expectedFormat') }} <code>/terminal/SESSION_ID</code></p>
      </div>
    </div>
    
    <TerminalViewer
      v-else-if="!closing"
      :session-id="sessionId"
      :pop-mode="isPopout ? 'in' : undefined"
      :machine="local ? 'local' : 'incus'"
      :relayed="local"
      @pop="closePopout"
      :show-header="showHeader"
      :show-footer="showFooter"
      :hide-controls="hideControls"
      :auto-connect="autoConnect"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import TerminalViewer from '../Terminal/TerminalViewer.vue'
import { POP_IN_MESSAGE, POPOUT_QUERY } from '../../composables/useTerminalPopout'
import { isLocalSessionId } from '../../services/domain/terminal/localMachine'

const route = useRoute()

// Récupération des paramètres depuis l'URL
const sessionId = computed(() => {
  return route.params.sessionId || route.query.sessionId
})

// A machine in the learner's browser lives in its run page's tab: this page
// shows it through that tab, and never boots one of its own.
const local = computed(() => isLocalSessionId(String(sessionId.value || '')))

const showHeader = computed(() => route.query.header !== 'false')
const showFooter = computed(() => route.query.footer === 'true')
const hideControls = computed(() => route.query.controls === 'false')
const autoConnect = computed(() => route.query.autoConnect !== 'false')

// Opened by a page's pop-out button: this window can hand the console back.
const isPopout = !!window.opener && route.query[POPOUT_QUERY] !== undefined
const closing = ref(false)

// Unmount the console first: it closes its connection cleanly and drops its
// leave-page guard, which would otherwise ask before the window closes.
async function closePopout() {
  closing.value = true
  await nextTick()
  window.close()
}

function onMessage(event) {
  if (event.origin === window.location.origin && event.data === POP_IN_MESSAGE) closePopout()
}

onMounted(() => window.addEventListener('message', onMessage))
onBeforeUnmount(() => window.removeEventListener('message', onMessage))

</script>

<style scoped>
.terminal-page {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  background-color: var(--color-bg-dark);
  overflow: hidden;
}

.error-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-dark);
  color: var(--terminal-fg);
}

.error-content {
  text-align: center;
  padding: 40px;
  max-width: 500px;
}

.error-content i {
  color: var(--color-danger);
  margin-bottom: 20px;
}

.error-content h2 {
  color: var(--terminal-fg);
  margin: 20px 0;
}

.error-content p {
  color: var(--terminal-fg);
  margin: 10px 0;
  line-height: 1.5;
}

.error-content code {
  background-color: var(--terminal-bg);
  padding: 4px 8px;
  border-radius: 4px;
  color: var(--color-info);
  font-family: monospace;
}

/* Supprimer tous les margins/paddings pour l'iframe */
* {
  box-sizing: border-box;
}
</style>