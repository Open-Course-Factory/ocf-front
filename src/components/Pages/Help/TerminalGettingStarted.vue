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
  margin: 0 0 15px 0;
  color: #555;
}

.step-content ul {
  margin: 10px 0 15px 20px;
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

.btn-outline {
  background-color: transparent;
  color: #007bff;
  border: 2px solid #007bff;
}

.btn-outline:hover {
  background-color: #007bff;
  color: white;
}

.help-section.warning {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border-left: 4px solid #ffc107;
}

.help-section.warning h2 i {
  color: #ffc107;
}

.warning-content ul {
  margin: 0;
}

.warning-content li {
  margin-bottom: 10px;
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

  .step-card {
    flex-direction: column;
    text-align: center;
  }

  .step-number {
    align-self: center;
  }

  .next-steps {
    grid-template-columns: 1fr;
  }
}
</style>