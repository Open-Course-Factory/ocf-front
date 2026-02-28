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
      <h1><i class="fas fa-play-circle"></i> {{ t('help.terminals.gettingStarted.title') }}</h1>
      <p class="article-description">
        {{ t('help.terminals.gettingStarted.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> {{ t('help.terminals.gettingStarted.overview.title') }}</h2>
        <p>
          {{ t('help.terminals.gettingStarted.overview.description') }}
        </p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-key"></i> {{ t('help.terminals.gettingStarted.firstSteps.step1.title') }}</h2>
        <p>
          {{ t('help.terminals.gettingStarted.firstSteps.step1.description') }}
        </p>
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.gettingStarted.steps.accessKeys.title') }}</h4>
            <p v-html="t('help.terminals.gettingStarted.steps.accessKeys.description')">
    
            </p>
            <router-link to="/user-terminal-keys" class="btn btn-outline">
              <i class="fas fa-key"></i>
              {{ t('help.terminals.gettingStarted.steps.accessKeys.button') }}
            </router-link>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.gettingStarted.steps.checkStatus.title') }}</h4>
            <p v-html="t('help.terminals.gettingStarted.steps.checkStatus.description')"></p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-plus-circle"></i> {{ t('help.terminals.gettingStarted.firstSteps.step2.title') }}</h2>
        <p>
          {{ t('help.terminals.gettingStarted.firstSteps.step2.description') }}
        </p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.gettingStarted.steps.accessCreation.title') }}</h4>
            <p v-html="t('help.terminals.gettingStarted.steps.accessCreation.description')"></p>
            <router-link to="/terminal-creation" class="btn btn-primary">
              <i class="fas fa-plus"></i>
              {{ t('help.terminals.gettingStarted.steps.accessCreation.button') }}
            </router-link>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.gettingStarted.steps.configure.title') }}</h4>
            <ul>
              <li v-html="t('help.terminals.gettingStarted.steps.configure.item1')"></li>
              <li v-html="t('help.terminals.gettingStarted.steps.configure.item2')"></li>
            </ul>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.gettingStarted.steps.launch.title') }}</h4>
            <p v-html="t('help.terminals.gettingStarted.steps.launch.description')"></p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-terminal"></i> {{ t('help.terminals.gettingStarted.firstSteps.step3.title') }}</h2>
        <p>
          {{ t('help.terminals.gettingStarted.firstSteps.step3.description') }}
        </p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.gettingStarted.steps.locate.title') }}</h4>
            <p v-html="t('help.terminals.gettingStarted.steps.locate.description')"></p>
            <router-link to="/terminal-sessions" class="btn btn-outline">
              <i class="fas fa-list"></i>
              {{ t('help.terminals.gettingStarted.steps.locate.button') }}
            </router-link>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.gettingStarted.steps.connect.title') }}</h4>
            <p v-html="t('help.terminals.gettingStarted.steps.connect.description')"></p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-server"></i> {{ t('help.terminals.gettingStarted.multiBackend.title') }}</h2>
        <p>{{ t('help.terminals.gettingStarted.multiBackend.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.gettingStarted.multiBackend.selectBackend.title') }}</h4>
            <p v-html="t('help.terminals.gettingStarted.multiBackend.selectBackend.description')"></p>
          </div>
        </div>

        <div class="tip-box">
          <h4><i class="fas fa-lightbulb"></i> {{ t('help.terminals.gettingStarted.multiBackend.tip.title') }}</h4>
          <p>{{ t('help.terminals.gettingStarted.multiBackend.tip.description') }}</p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-expand-arrows-alt"></i> {{ t('help.terminals.gettingStarted.machineSizes.title') }}</h2>
        <p>{{ t('help.terminals.gettingStarted.machineSizes.description') }}</p>

        <div class="feature-grid">
          <div class="feature-card">
            <i class="fas fa-microchip"></i>
            <h4>{{ t('help.terminals.gettingStarted.machineSizes.small.title') }}</h4>
            <p>{{ t('help.terminals.gettingStarted.machineSizes.small.description') }}</p>
          </div>
          <div class="feature-card">
            <i class="fas fa-desktop"></i>
            <h4>{{ t('help.terminals.gettingStarted.machineSizes.medium.title') }}</h4>
            <p>{{ t('help.terminals.gettingStarted.machineSizes.medium.description') }}</p>
          </div>
          <div class="feature-card">
            <i class="fas fa-server"></i>
            <h4>{{ t('help.terminals.gettingStarted.machineSizes.large.title') }}</h4>
            <p>{{ t('help.terminals.gettingStarted.machineSizes.large.description') }}</p>
          </div>
          <div class="feature-card">
            <i class="fas fa-database"></i>
            <h4>{{ t('help.terminals.gettingStarted.machineSizes.xlarge.title') }}</h4>
            <p>{{ t('help.terminals.gettingStarted.machineSizes.xlarge.description') }}</p>
          </div>
        </div>

        <div class="tip-box">
          <h4><i class="fas fa-lightbulb"></i> {{ t('help.terminals.gettingStarted.machineSizes.planTip.title') }}</h4>
          <p>{{ t('help.terminals.gettingStarted.machineSizes.planTip.description') }}</p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-chart-pie"></i> {{ t('help.terminals.gettingStarted.usageQuota.title') }}</h2>
        <p>{{ t('help.terminals.gettingStarted.usageQuota.description') }}</p>

        <div class="feature-grid">
          <div class="feature-card">
            <i class="fas fa-layer-group"></i>
            <h4>{{ t('help.terminals.gettingStarted.usageQuota.concurrentSessions.title') }}</h4>
            <p>{{ t('help.terminals.gettingStarted.usageQuota.concurrentSessions.description') }}</p>
          </div>
          <div class="feature-card">
            <i class="fas fa-hourglass-half"></i>
            <h4>{{ t('help.terminals.gettingStarted.usageQuota.maxDuration.title') }}</h4>
            <p>{{ t('help.terminals.gettingStarted.usageQuota.maxDuration.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-sliders-h"></i> {{ t('help.terminals.gettingStarted.advancedOptions.title') }}</h2>
        <p>{{ t('help.terminals.gettingStarted.advancedOptions.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.gettingStarted.advancedOptions.terminalName.title') }}</h4>
            <p v-html="t('help.terminals.gettingStarted.advancedOptions.terminalName.description')"></p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.gettingStarted.advancedOptions.exerciseRef.title') }}</h4>
            <p v-html="t('help.terminals.gettingStarted.advancedOptions.exerciseRef.description')"></p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-users"></i> {{ t('help.terminals.gettingStarted.bulkGroupCreation.title') }}</h2>
        <p>{{ t('help.terminals.gettingStarted.bulkGroupCreation.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.gettingStarted.bulkGroupCreation.selectGroup.title') }}</h4>
            <p v-html="t('help.terminals.gettingStarted.bulkGroupCreation.selectGroup.description')"></p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.gettingStarted.bulkGroupCreation.confirm.title') }}</h4>
            <p v-html="t('help.terminals.gettingStarted.bulkGroupCreation.confirm.description')"></p>
          </div>
        </div>

        <div class="tip-box">
          <h4><i class="fas fa-lightbulb"></i> {{ t('help.terminals.gettingStarted.bulkGroupCreation.tip.title') }}</h4>
          <p>{{ t('help.terminals.gettingStarted.bulkGroupCreation.tip.description') }}</p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-video"></i> {{ t('help.terminals.gettingStarted.recordingConsent.title') }}</h2>
        <p>{{ t('help.terminals.gettingStarted.recordingConsent.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.gettingStarted.recordingConsent.modal.title') }}</h4>
            <p v-html="t('help.terminals.gettingStarted.recordingConsent.modal.description')"></p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.gettingStarted.recordingConsent.choices.title') }}</h4>
            <p v-html="t('help.terminals.gettingStarted.recordingConsent.choices.description')"></p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-clock"></i> {{ t('help.terminals.gettingStarted.expiryWarnings.title') }}</h2>
        <p>{{ t('help.terminals.gettingStarted.expiryWarnings.description') }}</p>

        <div class="feature-grid">
          <div class="feature-card info-level">
            <i class="fas fa-info-circle"></i>
            <h4>{{ t('help.terminals.gettingStarted.expiryWarnings.tenMin.title') }}</h4>
            <p>{{ t('help.terminals.gettingStarted.expiryWarnings.tenMin.description') }}</p>
          </div>
          <div class="feature-card warning-level">
            <i class="fas fa-exclamation-triangle"></i>
            <h4>{{ t('help.terminals.gettingStarted.expiryWarnings.fiveMin.title') }}</h4>
            <p>{{ t('help.terminals.gettingStarted.expiryWarnings.fiveMin.description') }}</p>
          </div>
          <div class="feature-card danger-level">
            <i class="fas fa-exclamation-circle"></i>
            <h4>{{ t('help.terminals.gettingStarted.expiryWarnings.oneMin.title') }}</h4>
            <p>{{ t('help.terminals.gettingStarted.expiryWarnings.oneMin.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section warning">
        <h2><i class="fas fa-exclamation-triangle"></i> {{ t('help.terminals.gettingStarted.firstSteps.step4.title') }}</h2>
        <div class="warning-content">
          <p>{{ t('help.terminals.gettingStarted.firstSteps.step4.description') }}</p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <p>{{ t('help.terminals.gettingStarted.quickAccess.title') }}</p>

        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/terminals/managing-sessions`" class="next-step-card">
            <i class="fas fa-cogs"></i>
            <h4>{{ t('help.sections.terminals.managingSessions') }}</h4>
            <p>{{ t('help.terminals.managingSessions.intro') }}</p>
          </router-link>

          <router-link :to="`${helpRoutePrefix}/terminals/sharing`" class="next-step-card">
            <i class="fas fa-share-alt"></i>
            <h4>{{ t('help.sections.terminals.sharing') }}</h4>
            <p>{{ t('help.terminals.sharing.intro') }}</p>
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
/* Page-specific styles only - common help article styles are in help-article.css */

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

.feature-card.info-level {
  border-color: var(--color-info);
  background: var(--color-info-bg);
}

.feature-card.info-level i {
  color: var(--color-info);
}

.feature-card.warning-level {
  border-color: var(--color-warning);
  background: var(--color-warning-bg);
}

.feature-card.warning-level i {
  color: var(--color-warning);
}

.feature-card.danger-level {
  border-color: var(--color-danger);
  background: var(--color-danger-bg);
}

.feature-card.danger-level i {
  color: var(--color-danger);
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

/* Responsive */
@media (max-width: 768px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>