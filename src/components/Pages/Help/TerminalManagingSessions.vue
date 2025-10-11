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
.help-article {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.help-nav {
  margin-bottom: 30px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.back-link:hover {
  color: #0056b3;
}

.article-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 2px solid #e9ecef;
}

.article-header h1 {
  color: #333;
  font-size: 2.5rem;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.article-header h1 i {
  color: #007bff;
}

.article-description {
  color: #6c757d;
  font-size: 1.2rem;
  margin: 0;
}

.article-content {
  line-height: 1.6;
}

.help-section {
  margin-bottom: 40px;
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.help-section h2 {
  color: #333;
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.help-section h2 i {
  color: #007bff;
}

.help-section h3 {
  color: #333;
  margin: 25px 0 15px 0;
  font-size: 1.2rem;
}

.help-section p {
  color: #555;
  margin-bottom: 15px;
}

.help-section ul {
  color: #555;
  margin-left: 20px;
}

.help-section li {
  margin-bottom: 8px;
}

.info-card {
  background: #e3f2fd;
  border: 2px solid #2196f3;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.info-card h4 {
  margin: 0 0 10px 0;
  color: #1976d2;
}

.info-card p {
  margin: 0 0 15px 0;
  color: #333;
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
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.feature-card i {
  font-size: 2rem;
  color: #007bff;
  margin-bottom: 15px;
}

.feature-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.feature-card p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.tip-box {
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.tip-box h4 {
  margin: 0 0 10px 0;
  color: #856404;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tip-box p {
  margin: 0;
  color: #856404;
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
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.method-icon i {
  font-size: 1.5rem;
  color: #007bff;
  width: 30px;
  text-align: center;
}

.method-content h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.method-content p {
  margin: 0;
  color: #555;
  font-size: 0.9rem;
}

.step-card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
  border-left: 4px solid #007bff;
}

.step-number {
  background: #007bff;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.step-content {
  flex-grow: 1;
}

.step-content h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1rem;
}

.step-content p {
  margin: 0;
  color: #555;
}

.code-example {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.code-example h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.code-example pre {
  background: #2d3748;
  color: #e2e8f0;
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
  background: #f8d7da;
  border-color: #dc3545;
}

.action-card.warning {
  background: #fff3cd;
  border-color: #ffc107;
}

.action-card i {
  font-size: 1.5rem;
  margin-bottom: 10px;
  display: block;
}

.action-card.danger i {
  color: #dc3545;
}

.action-card.warning i {
  color: #ffc107;
}

.action-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.action-card p {
  margin: 0;
  color: #555;
  font-size: 0.9rem;
}

.warning-box {
  background: #f8d7da;
  border: 2px solid #dc3545;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.warning-box h4 {
  margin: 0 0 10px 0;
  color: #721c24;
  display: flex;
  align-items: center;
  gap: 8px;
}

.warning-box p {
  margin: 0;
  color: #721c24;
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
  background: #f8f9fa;
  border-radius: 8px;
}

.practice-item i {
  font-size: 1.3rem;
  color: #007bff;
  margin-top: 5px;
}

.practice-item h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1rem;
}

.practice-item p {
  margin: 0;
  color: #555;
  font-size: 0.9rem;
}

.next-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.next-step-card {
  display: block;
  padding: 20px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  text-align: center;
}

.next-step-card:hover {
  border-color: #007bff;
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.next-step-card i {
  font-size: 2rem;
  color: #007bff;
  margin-bottom: 15px;
}

.next-step-card h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1rem;
}

.next-step-card p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .help-article {
    padding: 10px;
  }

  .article-header h1 {
    font-size: 2rem;
    flex-direction: column;
    gap: 10px;
  }

  .help-section {
    padding: 20px;
  }

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

  .next-steps {
    grid-template-columns: 1fr;
  }
}
</style>