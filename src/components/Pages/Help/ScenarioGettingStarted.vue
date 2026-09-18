<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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
      <p class="article-description">{{ t('help.scenarios.gettingStarted.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-list"></i> {{ t('help.scenarios.gettingStarted.catalogue.title') }}</h2>
        <p>{{ t('help.scenarios.gettingStarted.catalogue.description') }}</p>
        <router-link to="/scenarios" class="btn btn-primary">
          <i class="fas fa-flask"></i>
          {{ t('help.scenarios.gettingStarted.catalogue.title') }}
        </router-link>
        <HelpScreenshot name="learner-scenarios" :caption="t('help.scenarios.gettingStarted.catalogue.shot')" />
        <ul>
          <li v-for="key in ['card', 'language', 'unavailable']" :key="key">
            {{ t(`help.scenarios.gettingStarted.catalogue.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-rocket"></i> {{ t('help.scenarios.gettingStarted.launch.title') }}</h2>
        <p>{{ t('help.scenarios.gettingStarted.launch.description') }}</p>
        <p>{{ t('help.scenarios.gettingStarted.launch.budget') }}</p>
        <p>{{ t('help.scenarios.gettingStarted.launch.existing') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-columns"></i> {{ t('help.scenarios.gettingStarted.player.title') }}</h2>
        <p>{{ t('help.scenarios.gettingStarted.player.description') }}</p>
        <HelpScreenshot name="learner-scenario-player" :caption="t('help.scenarios.gettingStarted.player.shot')" />
        <ul>
          <li v-for="key in ['briefing', 'terminal', 'panel', 'abandon']" :key="key">
            {{ t(`help.scenarios.gettingStarted.player.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-shoe-prints"></i> {{ t('help.scenarios.gettingStarted.stepTypes.title') }}</h2>
        <div v-for="(icon, key) in stepTypeIcons" :key="key" class="step-card">
          <div class="step-number"><i :class="icon"></i></div>
          <div class="step-content"><p>{{ t(`help.scenarios.gettingStarted.stepTypes.${key}`) }}</p></div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-lightbulb"></i> {{ t('help.scenarios.gettingStarted.help.title') }}</h2>
        <ul>
          <li v-for="key in ['hints', 'reset', 'preparing', 'crashTraps']" :key="key">
            {{ t(`help.scenarios.gettingStarted.help.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-flag-checkered"></i> {{ t('help.scenarios.gettingStarted.endings.title') }}</h2>
        <ul>
          <li v-for="key in ['completed', 'abandoned', 'expired']" :key="key">
            {{ t(`help.scenarios.gettingStarted.endings.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-history"></i> {{ t('help.scenarios.gettingStarted.history.title') }}</h2>
        <p>{{ t('help.scenarios.gettingStarted.history.description') }}</p>
        <router-link to="/my-scenarios" class="btn btn-outline">
          <i class="fas fa-history"></i>
          {{ t('help.scenarios.gettingStarted.history.title') }}
        </router-link>
        <HelpScreenshot name="learner-my-scenarios" :caption="t('help.scenarios.gettingStarted.history.shot')" />
        <ul>
          <li v-for="key in ['resume', 'review', 'abandon']" :key="key">
            {{ t(`help.scenarios.gettingStarted.history.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/terminals/getting-started`" class="next-step-card">
            <i class="fas fa-terminal"></i>
            <h4>{{ t('help.terminals.gettingStarted.title') }}</h4>
            <p>{{ t('help.scenarios.gettingStarted.nextSteps.terminals') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/terminals/managing-sessions`" class="next-step-card">
            <i class="fas fa-cogs"></i>
            <h4>{{ t('help.terminals.managingSessions.title') }}</h4>
            <p>{{ t('help.scenarios.gettingStarted.nextSteps.managing') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/scenarios/creation`" class="next-step-card">
            <i class="fas fa-plus-circle"></i>
            <h4>{{ t('help.scenarios.creation.title') }}</h4>
            <p>{{ t('help.scenarios.gettingStarted.nextSteps.creation') }}</p>
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
import HelpScreenshot from './HelpScreenshot.vue'

const { t } = useI18n()
const { loadHelpTranslations } = useHelpTranslations()
const route = useRoute()

// Determine the correct help routes based on current path
const isPublicHelp = computed(() => route.path.startsWith('/help-public'))
const helpMainRoute = computed(() => isPublicHelp.value ? '/help-public' : '/help')
const helpRoutePrefix = computed(() => isPublicHelp.value ? '/help-public' : '/help')

const stepTypeIcons = {
  terminal: 'fas fa-terminal',
  info: 'fas fa-book-open',
  flag: 'fas fa-flag',
  quiz: 'fas fa-question'
}

onMounted(async () => {
  await loadHelpTranslations()
})
</script>

<style scoped>
/* Page-specific styles only - common help article styles are in help-article.css */
</style>
