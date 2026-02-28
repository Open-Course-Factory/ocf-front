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
      <h1><i class="fas fa-key"></i> {{ t('help.terminals.sshKeys.title') }}</h1>
      <p class="article-description">
        {{ t('help.terminals.sshKeys.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> {{ t('help.terminals.sshKeys.overview.title') }}</h2>
        <p>
          {{ t('help.terminals.sshKeys.overview.description') }}
        </p>
        <div class="info-box">
          <i class="fas fa-terminal"></i>
          <p>{{ t('help.terminals.sshKeys.overview.requirement') }}</p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-sync-alt"></i> {{ t('help.terminals.sshKeys.regenerate.title') }}</h2>
        <p>
          {{ t('help.terminals.sshKeys.regenerate.description') }}
        </p>
        <div class="action-steps">
          <div class="action-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>{{ t('help.terminals.sshKeys.regenerate.step1.title') }}</h4>
              <p>{{ t('help.terminals.sshKeys.regenerate.step1.description') }}</p>
            </div>
          </div>
          <div class="action-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>{{ t('help.terminals.sshKeys.regenerate.step2.title') }}</h4>
              <p>{{ t('help.terminals.sshKeys.regenerate.step2.description') }}</p>
            </div>
          </div>
          <div class="action-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>{{ t('help.terminals.sshKeys.regenerate.step3.title') }}</h4>
              <p>{{ t('help.terminals.sshKeys.regenerate.step3.description') }}</p>
            </div>
          </div>
        </div>
        <div class="warning-box">
          <h4><i class="fas fa-exclamation-triangle"></i> {{ t('help.terminals.sshKeys.regenerate.warning.title') }}</h4>
          <p>{{ t('help.terminals.sshKeys.regenerate.warning.description') }}</p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-id-card"></i> {{ t('help.terminals.sshKeys.details.title') }}</h2>
        <p>
          {{ t('help.terminals.sshKeys.details.description') }}
        </p>
        <div class="key-details-grid">
          <div class="detail-card">
            <i class="fas fa-fingerprint"></i>
            <h4>{{ t('help.terminals.sshKeys.details.keyId.title') }}</h4>
            <p>{{ t('help.terminals.sshKeys.details.keyId.description') }}</p>
          </div>
          <div class="detail-card">
            <i class="fas fa-tag"></i>
            <h4>{{ t('help.terminals.sshKeys.details.keyName.title') }}</h4>
            <p>{{ t('help.terminals.sshKeys.details.keyName.description') }}</p>
          </div>
          <div class="detail-card">
            <i class="fas fa-toggle-on"></i>
            <h4>{{ t('help.terminals.sshKeys.details.status.title') }}</h4>
            <p>{{ t('help.terminals.sshKeys.details.status.description') }}</p>
          </div>
          <div class="detail-card">
            <i class="fas fa-layer-group"></i>
            <h4>{{ t('help.terminals.sshKeys.details.maxSessions.title') }}</h4>
            <p>{{ t('help.terminals.sshKeys.details.maxSessions.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-shield-alt"></i> {{ t('help.terminals.sshKeys.security.title') }}</h2>
        <p>
          {{ t('help.terminals.sshKeys.security.description') }}
        </p>
        <div class="best-practices">
          <div class="practice-item">
            <i class="fas fa-lock"></i>
            <div>
              <h4>{{ t('help.terminals.sshKeys.security.keepSecure.title') }}</h4>
              <p>{{ t('help.terminals.sshKeys.security.keepSecure.description') }}</p>
            </div>
          </div>
          <div class="practice-item">
            <i class="fas fa-user-lock"></i>
            <div>
              <h4>{{ t('help.terminals.sshKeys.security.noShare.title') }}</h4>
              <p>{{ t('help.terminals.sshKeys.security.noShare.description') }}</p>
            </div>
          </div>
          <div class="practice-item">
            <i class="fas fa-redo"></i>
            <div>
              <h4>{{ t('help.terminals.sshKeys.security.regenerateIfCompromised.title') }}</h4>
              <p>{{ t('help.terminals.sshKeys.security.regenerateIfCompromised.description') }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-wrench"></i> {{ t('help.terminals.sshKeys.troubleshooting.title') }}</h2>
        <p>
          {{ t('help.terminals.sshKeys.troubleshooting.description') }}
        </p>
        <div class="troubleshooting-items">
          <div class="trouble-item">
            <div class="trouble-header">
              <i class="fas fa-times-circle"></i>
              <h4>{{ t('help.terminals.sshKeys.troubleshooting.noKey.title') }}</h4>
            </div>
            <p>{{ t('help.terminals.sshKeys.troubleshooting.noKey.description') }}</p>
          </div>
          <div class="trouble-item">
            <div class="trouble-header">
              <i class="fas fa-ban"></i>
              <h4>{{ t('help.terminals.sshKeys.troubleshooting.inactive.title') }}</h4>
            </div>
            <p>{{ t('help.terminals.sshKeys.troubleshooting.inactive.description') }}</p>
          </div>
          <div class="trouble-item">
            <div class="trouble-header">
              <i class="fas fa-question-circle"></i>
              <h4>{{ t('help.terminals.sshKeys.troubleshooting.lost.title') }}</h4>
            </div>
            <p>{{ t('help.terminals.sshKeys.troubleshooting.lost.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-arrow-right"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/terminals/getting-started`" class="next-step-card">
            <i class="fas fa-play-circle"></i>
            <h4>{{ t('help.terminals.sshKeys.nextSteps.gettingStarted.title') }}</h4>
            <p>{{ t('help.terminals.sshKeys.nextSteps.gettingStarted.description') }}</p>
          </router-link>

          <router-link :to="`${helpRoutePrefix}/terminals/troubleshooting`" class="next-step-card">
            <i class="fas fa-wrench"></i>
            <h4>{{ t('help.terminals.sshKeys.nextSteps.troubleshooting.title') }}</h4>
            <p>{{ t('help.terminals.sshKeys.nextSteps.troubleshooting.description') }}</p>
          </router-link>

          <router-link :to="`${helpRoutePrefix}/account/settings`" class="next-step-card">
            <i class="fas fa-cog"></i>
            <h4>{{ t('help.terminals.sshKeys.nextSteps.settings.title') }}</h4>
            <p>{{ t('help.terminals.sshKeys.nextSteps.settings.description') }}</p>
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

const isPublicHelp = computed(() => route.path.startsWith('/help-public'))
const helpMainRoute = computed(() => isPublicHelp.value ? '/help-public' : '/help')
const helpRoutePrefix = computed(() => isPublicHelp.value ? '/help-public' : '/help')

onMounted(async () => {
  await loadHelpTranslations()
})
</script>

<style scoped>
.action-steps {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.action-step {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border-left: 4px solid var(--color-primary);
}

.step-number {
  background: var(--color-primary);
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

.step-content h4 {
  margin: 0 0 8px 0;
  color: var(--color-text-primary);
}

.step-content p {
  margin: 0;
  color: var(--color-text-secondary);
}

.warning-box {
  background: var(--color-warning-bg);
  border: 2px solid var(--color-warning);
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.warning-box h4 {
  margin: 0 0 10px 0;
  color: var(--color-warning-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.warning-box p {
  margin: 0;
  color: var(--color-warning-text);
}

.info-box {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  background: var(--color-info-bg);
  border-radius: 8px;
  border-left: 4px solid var(--color-info);
  margin: 15px 0;
}

.info-box i {
  font-size: 1.3rem;
  color: var(--color-info);
  flex-shrink: 0;
}

.info-box p {
  margin: 0;
  color: var(--color-text-secondary);
}

.key-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.detail-card {
  text-align: center;
  padding: 25px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
  transition: all 0.3s ease;
}

.detail-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-5px);
}

.detail-card i {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 15px;
}

.detail-card h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
}

.detail-card p {
  margin: 0;
  color: var(--color-gray-600);
  font-size: 0.9rem;
  line-height: 1.5;
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
  padding: 15px 20px;
  background: var(--color-success-bg);
  border-radius: 8px;
  border-left: 4px solid var(--color-success);
}

.practice-item i {
  font-size: 1.3rem;
  color: var(--color-success);
  margin-top: 3px;
  flex-shrink: 0;
}

.practice-item h4 {
  margin: 0 0 5px 0;
  color: var(--color-text-primary);
}

.practice-item p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.troubleshooting-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.trouble-item {
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border-left: 4px solid var(--color-warning);
}

.trouble-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.trouble-header i {
  color: var(--color-warning);
  font-size: 1.1rem;
}

.trouble-header h4 {
  margin: 0;
  color: var(--color-text-primary);
}

.trouble-item p {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 768px) {
  .key-details-grid {
    grid-template-columns: 1fr;
  }

  .action-step {
    flex-direction: column;
    text-align: center;
  }

  .practice-item {
    flex-direction: column;
    text-align: center;
  }

  .info-box {
    flex-direction: column;
    text-align: center;
  }

  .next-steps {
    grid-template-columns: 1fr;
  }
}
</style>
