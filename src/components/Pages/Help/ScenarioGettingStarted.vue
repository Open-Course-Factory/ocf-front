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
      <h1><i class="fas fa-play-circle"></i> {{ t('help.scenarios.gettingStarted.title') }}</h1>
      <p class="article-description">
        {{ t('help.scenarios.gettingStarted.intro') }}
      </p>
    </div>

    <div class="article-content">
      <!-- What are Interactive Scenarios? -->
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> {{ t('help.scenarios.gettingStarted.whatAre.title') }}</h2>
        <p>{{ t('help.scenarios.gettingStarted.whatAre.description') }}</p>
      </section>

      <!-- Starting a Scenario -->
      <section class="help-section">
        <h2><i class="fas fa-play"></i> {{ t('help.scenarios.gettingStarted.starting.title') }}</h2>
        <p>{{ t('help.scenarios.gettingStarted.starting.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.gettingStarted.starting.step1.title') }}</h4>
            <p v-html="t('help.scenarios.gettingStarted.starting.step1.description')"></p>
            <router-link to="/terminal-sessions" class="btn btn-outline">
              <i class="fas fa-terminal"></i>
              {{ t('help.scenarios.gettingStarted.starting.step1.button') }}
            </router-link>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.gettingStarted.starting.step2.title') }}</h4>
            <p v-html="t('help.scenarios.gettingStarted.starting.step2.description')"></p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.gettingStarted.starting.step3.title') }}</h4>
            <p v-html="t('help.scenarios.gettingStarted.starting.step3.description')"></p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">4</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.gettingStarted.starting.step4.title') }}</h4>
            <p v-html="t('help.scenarios.gettingStarted.starting.step4.description')"></p>
          </div>
        </div>

        <div class="tip-box">
          <h4><i class="fas fa-lightbulb"></i> {{ t('help.scenarios.gettingStarted.starting.tip.title') }}</h4>
          <p>{{ t('help.scenarios.gettingStarted.starting.tip.description') }}</p>
        </div>
      </section>

      <!-- The Scenario Panel -->
      <section class="help-section">
        <h2><i class="fas fa-columns"></i> {{ t('help.scenarios.gettingStarted.panel.title') }}</h2>
        <p>{{ t('help.scenarios.gettingStarted.panel.description') }}</p>

        <div class="feature-grid">
          <div class="feature-card">
            <i class="fas fa-ellipsis-h"></i>
            <h4>{{ t('help.scenarios.gettingStarted.panel.progress.title') }}</h4>
            <p>{{ t('help.scenarios.gettingStarted.panel.progress.description') }}</p>
          </div>
          <div class="feature-card">
            <i class="fas fa-file-alt"></i>
            <h4>{{ t('help.scenarios.gettingStarted.panel.content.title') }}</h4>
            <p>{{ t('help.scenarios.gettingStarted.panel.content.description') }}</p>
          </div>
          <div class="feature-card">
            <i class="fas fa-compress-arrows-alt"></i>
            <h4>{{ t('help.scenarios.gettingStarted.panel.collapse.title') }}</h4>
            <p>{{ t('help.scenarios.gettingStarted.panel.collapse.description') }}</p>
          </div>
        </div>

        <div class="tip-box">
          <h4><i class="fas fa-lightbulb"></i> {{ t('help.scenarios.gettingStarted.panel.tip.title') }}</h4>
          <p>{{ t('help.scenarios.gettingStarted.panel.tip.description') }}</p>
        </div>
      </section>

      <!-- Verifying Your Work -->
      <section class="help-section">
        <h2><i class="fas fa-check-circle"></i> {{ t('help.scenarios.gettingStarted.verifying.title') }}</h2>
        <p>{{ t('help.scenarios.gettingStarted.verifying.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.gettingStarted.verifying.click.title') }}</h4>
            <p v-html="t('help.scenarios.gettingStarted.verifying.click.description')"></p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.gettingStarted.verifying.result.title') }}</h4>
            <p v-html="t('help.scenarios.gettingStarted.verifying.result.description')"></p>
          </div>
        </div>

        <div class="feature-grid">
          <div class="feature-card info-level">
            <i class="fas fa-check"></i>
            <h4>{{ t('help.scenarios.gettingStarted.verifying.passed.title') }}</h4>
            <p>{{ t('help.scenarios.gettingStarted.verifying.passed.description') }}</p>
          </div>
          <div class="feature-card danger-level">
            <i class="fas fa-times"></i>
            <h4>{{ t('help.scenarios.gettingStarted.verifying.failed.title') }}</h4>
            <p>{{ t('help.scenarios.gettingStarted.verifying.failed.description') }}</p>
          </div>
        </div>

        <div class="tip-box">
          <h4><i class="fas fa-lightbulb"></i> {{ t('help.scenarios.gettingStarted.verifying.tip.title') }}</h4>
          <p>{{ t('help.scenarios.gettingStarted.verifying.tip.description') }}</p>
        </div>
      </section>

      <!-- Using Hints -->
      <section class="help-section">
        <h2><i class="fas fa-lightbulb"></i> {{ t('help.scenarios.gettingStarted.hints.title') }}</h2>
        <p>{{ t('help.scenarios.gettingStarted.hints.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.gettingStarted.hints.show.title') }}</h4>
            <p v-html="t('help.scenarios.gettingStarted.hints.show.description')"></p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.gettingStarted.hints.hide.title') }}</h4>
            <p v-html="t('help.scenarios.gettingStarted.hints.hide.description')"></p>
          </div>
        </div>
      </section>

      <!-- CTF Flag Challenges -->
      <section class="help-section">
        <h2><i class="fas fa-flag"></i> {{ t('help.scenarios.gettingStarted.ctf.title') }}</h2>
        <p>{{ t('help.scenarios.gettingStarted.ctf.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.gettingStarted.ctf.find.title') }}</h4>
            <p v-html="t('help.scenarios.gettingStarted.ctf.find.description')"></p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.gettingStarted.ctf.submit.title') }}</h4>
            <p v-html="t('help.scenarios.gettingStarted.ctf.submit.description')"></p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.gettingStarted.ctf.unique.title') }}</h4>
            <p v-html="t('help.scenarios.gettingStarted.ctf.unique.description')"></p>
          </div>
        </div>

        <div class="tip-box">
          <h4><i class="fas fa-lightbulb"></i> {{ t('help.scenarios.gettingStarted.ctf.tip.title') }}</h4>
          <p>{{ t('help.scenarios.gettingStarted.ctf.tip.description') }}</p>
        </div>
      </section>

      <!-- Code Blocks -->
      <section class="help-section">
        <h2><i class="fas fa-code"></i> {{ t('help.scenarios.gettingStarted.codeBlocks.title') }}</h2>
        <p>{{ t('help.scenarios.gettingStarted.codeBlocks.description') }}</p>

        <div class="feature-grid">
          <div class="feature-card">
            <i class="fas fa-copy"></i>
            <h4>{{ t('help.scenarios.gettingStarted.codeBlocks.copy.title') }}</h4>
            <p>{{ t('help.scenarios.gettingStarted.codeBlocks.copy.description') }}</p>
          </div>
          <div class="feature-card">
            <i class="fas fa-terminal"></i>
            <h4>{{ t('help.scenarios.gettingStarted.codeBlocks.execute.title') }}</h4>
            <p>{{ t('help.scenarios.gettingStarted.codeBlocks.execute.description') }}</p>
          </div>
        </div>
      </section>

      <!-- Abandoning a Scenario -->
      <section class="help-section warning">
        <h2><i class="fas fa-sign-out-alt"></i> {{ t('help.scenarios.gettingStarted.abandoning.title') }}</h2>
        <p>{{ t('help.scenarios.gettingStarted.abandoning.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.gettingStarted.abandoning.click.title') }}</h4>
            <p v-html="t('help.scenarios.gettingStarted.abandoning.click.description')"></p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.gettingStarted.abandoning.confirm.title') }}</h4>
            <p v-html="t('help.scenarios.gettingStarted.abandoning.confirm.description')"></p>
          </div>
        </div>

        <div class="warning-box">
          <h4><i class="fas fa-exclamation-triangle"></i> {{ t('help.scenarios.gettingStarted.abandoning.warning.title') }}</h4>
          <p>{{ t('help.scenarios.gettingStarted.abandoning.warning.description') }}</p>
        </div>
      </section>

      <!-- Completing a Scenario -->
      <section class="help-section">
        <h2><i class="fas fa-trophy"></i> {{ t('help.scenarios.gettingStarted.completing.title') }}</h2>
        <p>{{ t('help.scenarios.gettingStarted.completing.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.gettingStarted.completing.finish.title') }}</h4>
            <p v-html="t('help.scenarios.gettingStarted.completing.finish.description')"></p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.scenarios.gettingStarted.completing.history.title') }}</h4>
            <p v-html="t('help.scenarios.gettingStarted.completing.history.description')"></p>
            <router-link to="/my-scenarios" class="btn btn-outline">
              <i class="fas fa-list"></i>
              {{ t('help.scenarios.gettingStarted.completing.history.button') }}
            </router-link>
          </div>
        </div>
      </section>

      <!-- Next Steps -->
      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <p>{{ t('help.scenarios.gettingStarted.nextSteps.description') }}</p>

        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/scenarios/creation`" class="next-step-card">
            <i class="fas fa-plus-circle"></i>
            <h4>{{ t('help.sections.scenarios.creation') }}</h4>
            <p>{{ t('help.scenarios.creation.intro') }}</p>
          </router-link>

          <router-link :to="`${helpRoutePrefix}/terminals/getting-started`" class="next-step-card">
            <i class="fas fa-terminal"></i>
            <h4>{{ t('help.sections.terminals.gettingStarted') }}</h4>
            <p>{{ t('help.terminals.gettingStarted.intro') }}</p>
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
