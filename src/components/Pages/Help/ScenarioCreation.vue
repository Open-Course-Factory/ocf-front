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
      <h1><i class="fas fa-plus-circle"></i> {{ t('help.scenarios.creation.title') }}</h1>
      <p class="article-description">
        {{ t('help.scenarios.creation.intro') }}
      </p>
    </div>

    <div class="article-content">
      <!-- Overview -->
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> {{ t('help.scenarios.creation.overview.title') }}</h2>
        <p>{{ t('help.scenarios.creation.overview.description') }}</p>
      </section>

      <!-- Creating a Scenario -->
      <section class="help-section">
        <h2><i class="fas fa-plus-circle"></i> {{ t('help.scenarios.creation.creating.title') }}</h2>
        <p>{{ t('help.scenarios.creation.creating.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.creation.creating.step1.title') }}</h4>
            <p v-html="t('help.scenarios.creation.creating.step1.description')"></p>
            <router-link to="/admin/scenarios" class="btn btn-outline">
              <i class="fas fa-flag-checkered"></i>
              {{ t('help.scenarios.creation.creating.step1.button') }}
            </router-link>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.creation.creating.step2.title') }}</h4>
            <p v-html="t('help.scenarios.creation.creating.step2.description')"></p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.creation.creating.step3.title') }}</h4>
            <p v-html="t('help.scenarios.creation.creating.step3.description')"></p>
          </div>
        </div>

        <div class="tip-box">
          <h4><i class="fas fa-lightbulb"></i> {{ t('help.scenarios.creation.creating.tip.title') }}</h4>
          <p>{{ t('help.scenarios.creation.creating.tip.description') }}</p>
        </div>
      </section>

      <!-- Adding Steps -->
      <section class="help-section">
        <h2><i class="fas fa-list-ol"></i> {{ t('help.scenarios.creation.steps.title') }}</h2>
        <p>{{ t('help.scenarios.creation.steps.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.creation.steps.step1.title') }}</h4>
            <p v-html="t('help.scenarios.creation.steps.step1.description')"></p>
            <router-link to="/admin/scenario-steps" class="btn btn-outline">
              <i class="fas fa-list-ol"></i>
              {{ t('help.scenarios.creation.steps.step1.button') }}
            </router-link>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.creation.steps.step2.title') }}</h4>
            <p v-html="t('help.scenarios.creation.steps.step2.description')"></p>
            <ul>
              <li v-html="t('help.scenarios.creation.steps.step2.fieldTitle')"></li>
              <li v-html="t('help.scenarios.creation.steps.step2.fieldText')"></li>
              <li v-html="t('help.scenarios.creation.steps.step2.fieldHint')"></li>
              <li v-html="t('help.scenarios.creation.steps.step2.fieldVerify')"></li>
              <li v-html="t('help.scenarios.creation.steps.step2.fieldBackground')"></li>
              <li v-html="t('help.scenarios.creation.steps.step2.fieldForeground')"></li>
              <li v-html="t('help.scenarios.creation.steps.step2.fieldOrder')"></li>
            </ul>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.creation.steps.step3.title') }}</h4>
            <p v-html="t('help.scenarios.creation.steps.step3.description')"></p>
          </div>
        </div>

        <div class="tip-box">
          <h4><i class="fas fa-lightbulb"></i> {{ t('help.scenarios.creation.steps.tip.title') }}</h4>
          <p>{{ t('help.scenarios.creation.steps.tip.description') }}</p>
        </div>
      </section>

      <!-- Writing Good Verify Scripts -->
      <section class="help-section">
        <h2><i class="fas fa-terminal"></i> {{ t('help.scenarios.creation.verifyScripts.title') }}</h2>
        <p>{{ t('help.scenarios.creation.verifyScripts.description') }}</p>

        <div class="feature-grid">
          <div class="feature-card">
            <i class="fas fa-box"></i>
            <h4>{{ t('help.scenarios.creation.verifyScripts.checkPackage.title') }}</h4>
            <div class="code-example">
              <code>dpkg -l nginx | grep -q '^ii'</code>
            </div>
          </div>
          <div class="feature-card">
            <i class="fas fa-file"></i>
            <h4>{{ t('help.scenarios.creation.verifyScripts.checkFile.title') }}</h4>
            <div class="code-example">
              <code>test -f /etc/nginx/nginx.conf</code>
            </div>
          </div>
          <div class="feature-card">
            <i class="fas fa-cog"></i>
            <h4>{{ t('help.scenarios.creation.verifyScripts.checkService.title') }}</h4>
            <div class="code-example">
              <code>systemctl is-active --quiet nginx</code>
            </div>
          </div>
          <div class="feature-card">
            <i class="fas fa-search"></i>
            <h4>{{ t('help.scenarios.creation.verifyScripts.checkContent.title') }}</h4>
            <div class="code-example">
              <code>grep -q 'server_name' /etc/nginx/sites-enabled/default</code>
            </div>
          </div>
        </div>

        <div class="warning-box">
          <h4><i class="fas fa-exclamation-triangle"></i> {{ t('help.scenarios.creation.verifyScripts.warning.title') }}</h4>
          <p>{{ t('help.scenarios.creation.verifyScripts.warning.description') }}</p>
        </div>
      </section>

      <!-- CTF Flag Challenges -->
      <section class="help-section">
        <h2><i class="fas fa-flag"></i> {{ t('help.scenarios.creation.ctf.title') }}</h2>
        <p>{{ t('help.scenarios.creation.ctf.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.creation.ctf.enable.title') }}</h4>
            <p v-html="t('help.scenarios.creation.ctf.enable.description')"></p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.creation.ctf.markSteps.title') }}</h4>
            <p v-html="t('help.scenarios.creation.ctf.markSteps.description')"></p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.creation.ctf.unique.title') }}</h4>
            <p v-html="t('help.scenarios.creation.ctf.unique.description')"></p>
          </div>
        </div>

        <div class="tip-box">
          <h4><i class="fas fa-lightbulb"></i> {{ t('help.scenarios.creation.ctf.tip.title') }}</h4>
          <p>{{ t('help.scenarios.creation.ctf.tip.description') }}</p>
        </div>
      </section>

      <!-- KillerCoda Compatibility -->
      <section class="help-section info">
        <h2><i class="fas fa-file-import"></i> {{ t('help.scenarios.creation.killercoda.title') }}</h2>
        <p>{{ t('help.scenarios.creation.killercoda.description') }}</p>
        <p>{{ t('help.scenarios.creation.killercoda.layout') }}</p>

        <div class="tip-box">
          <h4><i class="fas fa-info-circle"></i> {{ t('help.scenarios.creation.killercoda.info.title') }}</h4>
          <p>{{ t('help.scenarios.creation.killercoda.info.description') }}</p>
        </div>
      </section>

      <!-- Monitoring Student Progress -->
      <section class="help-section">
        <h2><i class="fas fa-chart-line"></i> {{ t('help.scenarios.creation.monitoring.title') }}</h2>
        <p>{{ t('help.scenarios.creation.monitoring.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.creation.monitoring.navigate.title') }}</h4>
            <p v-html="t('help.scenarios.creation.monitoring.navigate.description')"></p>
            <router-link to="/admin/scenario-sessions" class="btn btn-outline">
              <i class="fas fa-chart-line"></i>
              {{ t('help.scenarios.creation.monitoring.navigate.button') }}
            </router-link>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.creation.monitoring.track.title') }}</h4>
            <p v-html="t('help.scenarios.creation.monitoring.track.description')"></p>
          </div>
        </div>
      </section>

      <!-- Best Practices -->
      <section class="help-section">
        <h2><i class="fas fa-star"></i> {{ t('help.scenarios.creation.bestPractices.title') }}</h2>
        <p>{{ t('help.scenarios.creation.bestPractices.description') }}</p>

        <div class="tip-box">
          <h4><i class="fas fa-lightbulb"></i> {{ t('help.scenarios.creation.bestPractices.tips.title') }}</h4>
          <ul>
            <li>{{ t('help.scenarios.creation.bestPractices.tips.tip1') }}</li>
            <li>{{ t('help.scenarios.creation.bestPractices.tips.tip2') }}</li>
            <li>{{ t('help.scenarios.creation.bestPractices.tips.tip3') }}</li>
            <li>{{ t('help.scenarios.creation.bestPractices.tips.tip4') }}</li>
            <li>{{ t('help.scenarios.creation.bestPractices.tips.tip5') }}</li>
            <li>{{ t('help.scenarios.creation.bestPractices.tips.tip6') }}</li>
          </ul>
        </div>
      </section>

      <!-- Next Steps -->
      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <p>{{ t('help.scenarios.creation.nextSteps.description') }}</p>

        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/scenarios/getting-started`" class="next-step-card">
            <i class="fas fa-play-circle"></i>
            <h4>{{ t('help.sections.scenarios.gettingStarted') }}</h4>
            <p>{{ t('help.scenarios.gettingStarted.intro') }}</p>
          </router-link>

          <router-link :to="`${helpRoutePrefix}/courses/structure`" class="next-step-card">
            <i class="fas fa-sitemap"></i>
            <h4>{{ t('help.sections.courses.structure') }}</h4>
            <p>{{ t('help.courses.structure.intro') }}</p>
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

.code-example {
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm);
  margin: var(--spacing-sm) 0 0 0;
  overflow-x: auto;
  text-align: left;
}

.code-example code {
  color: var(--color-text-primary);
  font-family: var(--font-family-monospace);
  font-size: 0.85rem;
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

.tip-box ul {
  margin: 10px 0 0 20px;
  color: var(--color-warning-text);
}

.tip-box li {
  margin-bottom: 6px;
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

/* Responsive */
@media (max-width: 768px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
