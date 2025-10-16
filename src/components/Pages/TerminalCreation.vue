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
  <div class="terminal-creation-page">
    <div class="page-header">
      <h2>{{ t('terminalCreation.title') }}</h2>
      <p class="page-description">
        {{ t('terminalCreation.description') }}
      </p>
    </div>

    <div class="creation-container">
      <Suspense>
        <template #default>
          <TerminalStarter @session-started="onSessionStarted" />
        </template>
        <template #fallback>
          <div class="loading-fallback">
            <i class="fas fa-spinner fa-spin"></i>
            {{ t('terminalCreation.loading') }}
          </div>
        </template>
      </Suspense>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useTranslations } from '../../composables/useTranslations'

const router = useRouter()

const { t } = useTranslations({
  en: {
    terminalCreation: {
      title: 'Create a New Terminal Session',
      description: 'Start a new terminal for your practical work. Choose the instance type according to your needs.',
      loading: 'Loading terminal...'
    }
  },
  fr: {
    terminalCreation: {
      title: 'Créer une Nouvelle Session Terminal',
      description: 'Démarrez un nouveau terminal pour vos travaux pratiques. Choisissez le type d\'instance selon vos besoins.',
      loading: 'Chargement du terminal...'
    }
  }
})

// Import dynamique du composant
const TerminalStarter = defineAsyncComponent(() => import('../Terminal/TerminalStarter.vue'))

function onSessionStarted() {
  console.log('Session started, redirecting to sessions page')
  router.push({ name: 'TerminalSessions' })
}
</script>

<style scoped>
.terminal-creation-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 600px;
}

.page-header {
  margin-bottom: var(--spacing-2xl);
  text-align: center;
}

.page-header h2 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-3xl);
}

.page-description {
  color: var(--color-text-muted);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  max-width: 600px;
  margin: 0 auto;
}

.creation-container {
  width: 100%;
  min-height: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.loading-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  font-size: 18px;
  color: var(--color-gray-600);
}

.loading-fallback i {
  margin-right: 10px;
}

/* Responsive */
@media (max-width: 768px) {
  .terminal-creation-page {
    padding: 10px;
  }

  .page-header h2 {
    font-size: 1.5rem;
  }

  .page-description {
    font-size: 1rem;
  }
}
</style>