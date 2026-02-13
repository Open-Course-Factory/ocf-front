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
  <div class="help-article">
    <div class="help-nav">
      <router-link :to="helpMainRoute" class="back-link">
        <i class="fas fa-arrow-left"></i>
        {{ t('help.navigation.backToHelp') }}
      </router-link>
    </div>

    <div class="article-header">
      <h1><i class="fas fa-cogs"></i> {{ t('help.terminals.managingSessions.title') }}</h1>
      <p class="article-description">
        {{ t('help.terminals.managingSessions.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-list"></i> {{ t('help.terminals.managingSessions.sessionTypes.title') }}</h2>
        <p>
          {{ t('help.terminals.managingSessions.intro') }}
        </p>

        <div class="info-card">
          <h4>{{ t('help.terminals.managingSessions.quickAccessCard.title') }}</h4>
          <p v-html="t('help.terminals.managingSessions.quickAccessCard.description')"></p>
          <router-link to="/terminal-sessions" class="btn btn-primary">
            <i class="fas fa-terminal"></i>
            {{ t('help.terminals.managingSessions.quickAccessCard.button') }}
          </router-link>
        </div>

        <div class="feature-grid">
          <div class="feature-card">
            <i class="fas fa-user"></i>
            <h4>{{ t('help.terminals.managingSessions.sessionTypes.personal.title') }}</h4>
            <p>{{ t('help.terminals.managingSessions.sessionTypes.personal.description') }}</p>
          </div>
          <div class="feature-card">
            <i class="fas fa-users"></i>
            <h4>{{ t('help.terminals.managingSessions.sessionTypes.shared.title') }}</h4>
            <p>{{ t('help.terminals.managingSessions.sessionTypes.shared.description') }}</p>
          </div>
          <div class="feature-card">
            <i class="fas fa-clock"></i>
            <h4>{{ t('help.terminals.managingSessions.sessionTypes.temporary.title') }}</h4>
            <p>{{ t('help.terminals.managingSessions.sessionTypes.temporary.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-sync-alt"></i> {{ t('help.terminals.managingSessions.synchronization.title') }}</h2>
        <p>
          {{ t('help.terminals.managingSessions.synchronization.description') }}
        </p>

        <div class="feature-grid">
          <div class="feature-card">
            <i class="fas fa-sync"></i>
            <h4>{{ t('help.terminals.managingSessions.syncMethods.individual.title') }}</h4>
            <p>{{ t('help.terminals.managingSessions.syncMethods.individual.description') }}</p>
          </div>

          <div class="feature-card">
            <i class="fas fa-sync-alt"></i>
            <h4>{{ t('help.terminals.managingSessions.syncMethods.global.title') }}</h4>
            <p>{{ t('help.terminals.managingSessions.syncMethods.global.description') }}</p>
          </div>

          <div class="feature-card">
            <i class="fas fa-clock"></i>
            <h4>{{ t('help.terminals.managingSessions.syncMethods.automatic.title') }}</h4>
            <p>{{ t('help.terminals.managingSessions.syncMethods.automatic.description') }}</p>
          </div>
        </div>

        <div class="tip-box">
          <h4><i class="fas fa-lightbulb"></i> {{ t('help.terminals.managingSessions.syncTip.title') }}</h4>
          <p>
            {{ t('help.terminals.managingSessions.syncTip.description') }}
          </p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-external-link-alt"></i> {{ t('help.terminals.managingSessions.accessMethods.title') }}</h2>
        <p>
          {{ t('help.terminals.managingSessions.accessMethods.description') }}
        </p>

        <div class="access-methods">
          <div class="method-card">
            <div class="method-icon">
              <i class="fas fa-external-link-alt"></i>
            </div>
            <div class="method-content">
              <h4>{{ t('help.terminals.managingSessions.accessMethods.newTab.title') }}</h4>
              <p v-html="t('help.terminals.managingSessions.accessMethods.newTab.description')"></p>
            </div>
          </div>

          <div class="method-card">
            <div class="method-icon">
              <i class="fas fa-eye"></i>
            </div>
            <div class="method-content">
              <h4>{{ t('help.terminals.managingSessions.accessMethods.preview.title') }}</h4>
              <p v-html="t('help.terminals.managingSessions.accessMethods.preview.description')"></p>
            </div>
          </div>

          <div class="method-card">
            <div class="method-icon">
              <i class="fas fa-copy"></i>
            </div>
            <div class="method-content">
              <h4>{{ t('help.terminals.managingSessions.accessMethods.copyLink.title') }}</h4>
              <p>
                {{ t('help.terminals.managingSessions.accessMethods.copyLink.description') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-code"></i> {{ t('help.terminals.managingSessions.iframeIntegration.title') }}</h2>
        <p>
          {{ t('help.terminals.managingSessions.iframeIntegration.description') }}
        </p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.managingSessions.iframeIntegration.step1.title') }}</h4>
            <p v-html="t('help.terminals.managingSessions.iframeIntegration.step1.description')"></p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.managingSessions.iframeIntegration.step2.title') }}</h4>
            <p>
              {{ t('help.terminals.managingSessions.iframeIntegration.step2.description') }}
            </p>
          </div>
        </div>

        <div class="code-example">
          <h4>{{ t('help.terminals.managingSessions.iframeIntegration.codeExample.title') }}</h4>
          <pre><code>&lt;iframe src="https://votre-domaine.com/terminal/session123?header=true&footer=false"
        width="100%"
        height="600"
        frameborder="0"
        title="Terminal OCF"&gt;&lt;/iframe&gt;</code></pre>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-stop-circle"></i> {{ t('help.terminals.managingSessions.stopAndCleanup.title') }}</h2>
        <p>
          {{ t('help.terminals.managingSessions.stopAndCleanup.description') }}
        </p>

        <div class="action-grid">
          <div class="action-card danger">
            <i class="fas fa-stop"></i>
            <h4>{{ t('help.terminals.managingSessions.stopAndCleanup.stopSession.title') }}</h4>
            <p v-html="t('help.terminals.managingSessions.stopAndCleanup.stopSession.description')"></p>
          </div>

          <div class="action-card warning">
            <i class="fas fa-eye-slash"></i>
            <h4>{{ t('help.terminals.managingSessions.stopAndCleanup.hideSessions.title') }}</h4>
            <p v-html="t('help.terminals.managingSessions.stopAndCleanup.hideSessions.description')"></p>
          </div>
        </div>

        <div class="warning-box">
          <h4><i class="fas fa-exclamation-triangle"></i> {{ t('help.terminals.managingSessions.stopAndCleanup.warning.title') }}</h4>
          <p v-html="t('help.terminals.managingSessions.stopAndCleanup.warning.description')"></p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-chart-line"></i> {{ t('help.terminals.managingSessions.monitoring.title') }}</h2>
        <p>
          {{ t('help.terminals.managingSessions.monitoring.description') }}
        </p>

        <div class="best-practices">
          <div class="practice-item">
            <i class="fas fa-clock"></i>
            <div>
              <h4>{{ t('help.terminals.managingSessions.monitoring.practices.expiration.title') }}</h4>
              <p>{{ t('help.terminals.managingSessions.monitoring.practices.expiration.description') }}</p>
            </div>
          </div>

          <div class="practice-item">
            <i class="fas fa-save"></i>
            <div>
              <h4>{{ t('help.terminals.managingSessions.monitoring.practices.backup.title') }}</h4>
              <p>{{ t('help.terminals.managingSessions.monitoring.practices.backup.description') }}</p>
            </div>
          </div>

          <div class="practice-item">
            <i class="fas fa-memory"></i>
            <div>
              <h4>{{ t('help.terminals.managingSessions.monitoring.practices.resources.title') }}</h4>
              <p>{{ t('help.terminals.managingSessions.monitoring.practices.resources.description') }}</p>
            </div>
          </div>

          <div class="practice-item">
            <i class="fas fa-refresh"></i>
            <div>
              <h4>{{ t('help.terminals.managingSessions.monitoring.practices.sync.title') }}</h4>
              <p>{{ t('help.terminals.managingSessions.monitoring.practices.sync.description') }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/terminals/sharing`" class="next-step-card">
            <i class="fas fa-share-alt"></i>
            <h4>{{ t('help.terminals.managingSessions.nextSteps.sharing.title') }}</h4>
            <p>{{ t('help.terminals.managingSessions.nextSteps.sharing.description') }}</p>
          </router-link>

          <router-link :to="`${helpRoutePrefix}/terminals/troubleshooting`" class="next-step-card">
            <i class="fas fa-wrench"></i>
            <h4>{{ t('help.terminals.managingSessions.nextSteps.troubleshooting.title') }}</h4>
            <p>{{ t('help.terminals.managingSessions.nextSteps.troubleshooting.description') }}</p>
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useHelpTranslations } from '../../../composables/useHelpTranslations'

const { t } = useI18n()
const { loadHelpTranslations } = useHelpTranslations()
const route = useRoute()

// Determine the correct help routes based on current path
const isPublicHelp = computed(() => route.path.startsWith('/help-public'))
const helpMainRoute = computed(() => isPublicHelp.value ? '/help-public' : '/help')
const helpRoutePrefix = computed(() => isPublicHelp.value ? '/help-public' : '/help')

onMounted(async () => {
  await loadHelpTranslations()
})
</script>

<style scoped>
.info-card {
  background: var(--color-info-bg);
  border: 2px solid var(--color-info);
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.info-card h4 {
  margin: 0 0 10px 0;
  color: var(--color-primary);
}

.info-card p {
  margin: 0 0 15px 0;
  color: var(--color-text-primary);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.feature-card {
  text-align: center;
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
}

.feature-card i {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 15px;
}

.feature-card h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
}

.feature-card p {
  margin: 0;
  color: var(--color-gray-600);
  font-size: 0.9rem;
}

.tip-box {
  background: var(--color-warning-bg);
  border: 2px solid var(--color-warning);
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.tip-box h4 {
  margin: 0 0 10px 0;
  color: var(--color-warning-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.tip-box p {
  margin: 0;
  color: var(--color-warning-text);
}

.access-methods {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.method-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border-left: 4px solid var(--color-primary);
}

.method-icon i {
  font-size: 1.5rem;
  color: var(--color-primary);
  width: 30px;
  text-align: center;
}

.method-content h4 {
  margin: 0 0 8px 0;
  color: var(--color-text-primary);
}

.method-content p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.code-example h4 {
  margin: 0 0 15px 0;
  color: var(--color-text-primary);
}

.code-example pre {
  background: var(--terminal-bg);
  color: var(--terminal-fg);
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0;
}

.code-example code {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.action-card {
  padding: 20px;
  border-radius: 8px;
  border: 2px solid;
}

.action-card.danger {
  background: var(--color-danger-bg);
  border-color: var(--color-danger);
}

.action-card.warning {
  background: var(--color-warning-bg);
  border-color: var(--color-warning);
}

.action-card i {
  font-size: 1.5rem;
  margin-bottom: 10px;
  display: block;
}

.action-card.danger i {
  color: var(--color-danger);
}

.action-card.warning i {
  color: var(--color-warning);
}

.action-card h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
}

.action-card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.warning-box {
  background: var(--color-danger-bg);
  border: 2px solid var(--color-danger);
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.warning-box h4 {
  margin: 0 0 10px 0;
  color: var(--color-danger-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.warning-box p {
  margin: 0;
  color: var(--color-danger-text);
}

.best-practices {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.practice-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: var(--color-gray-50);
  border-radius: 8px;
}

.practice-item i {
  font-size: 1.3rem;
  color: var(--color-primary);
  margin-top: 5px;
}

.practice-item h4 {
  margin: 0 0 5px 0;
  color: var(--color-text-primary);
  font-size: 1rem;
}

.practice-item p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 768px) {
  .feature-grid,
  .action-grid {
    grid-template-columns: 1fr;
  }

  .method-card {
    flex-direction: column;
    text-align: center;
  }

  .step-card {
    flex-direction: column;
    text-align: center;
  }

  .practice-item {
    flex-direction: column;
    text-align: center;
  }
}
</style>