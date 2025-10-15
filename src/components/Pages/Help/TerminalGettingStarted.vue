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
/* Page-specific styles only - common help article styles are in help-article.css */
</style>