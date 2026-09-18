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
      <h1><i class="fas fa-plus-circle"></i> {{ t('help.scenarios.creation.title') }}</h1>
      <p class="article-description">{{ t('help.scenarios.creation.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-user-lock"></i> {{ t('help.scenarios.creation.access.title') }}</h2>
        <p>{{ t('help.scenarios.creation.access.description') }}</p>
        <router-link to="/scenario-editor" class="btn btn-primary">
          <i class="fas fa-project-diagram"></i>
          {{ t('help.scenarios.creation.title') }}
        </router-link>
        <HelpScreenshot name="scenarios-catalogue" :caption="t('help.scenarios.creation.access.shot')" />
      </section>

      <section class="help-section">
        <h2><i class="fas fa-columns"></i> {{ t('help.scenarios.creation.layout.title') }}</h2>
        <p>{{ t('help.scenarios.creation.layout.description') }}</p>
        <p>{{ t('help.scenarios.creation.layout.header') }}</p>
        <p>{{ t('help.scenarios.creation.layout.readOnly') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-file-alt"></i> {{ t('help.scenarios.creation.scenario.title') }}</h2>
        <p>{{ t('help.scenarios.creation.scenario.description') }}</p>
        <ul>
          <li v-for="key in ['general', 'content', 'setup', 'options', 'languages', 'vocabulary']" :key="key">
            {{ t(`help.scenarios.creation.scenario.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-shoe-prints"></i> {{ t('help.scenarios.creation.steps.title') }}</h2>
        <p>{{ t('help.scenarios.creation.steps.description') }}</p>
        <div v-for="(icon, key) in stepTypeIcons" :key="key" class="step-card">
          <div class="step-number"><i :class="icon"></i></div>
          <div class="step-content"><p>{{ t(`help.scenarios.creation.steps.${key}`) }}</p></div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-edit"></i> {{ t('help.scenarios.creation.stepDialog.title') }}</h2>
        <ul>
          <li v-for="key in ['content', 'hints', 'verify', 'background', 'foreground', 'flag', 'questions', 'effects']" :key="key">
            {{ t(`help.scenarios.creation.stepDialog.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-link"></i> {{ t('help.scenarios.creation.chaining.title') }}</h2>
        <p>{{ t('help.scenarios.creation.chaining.description') }}</p>
        <p>{{ t('help.scenarios.creation.chaining.reorder') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-play"></i> {{ t('help.scenarios.creation.preview.title') }}</h2>
        <p>{{ t('help.scenarios.creation.preview.description') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-file-import"></i> {{ t('help.scenarios.creation.importExport.title') }}</h2>
        <p>{{ t('help.scenarios.creation.importExport.description') }}</p>
        <ul>
          <li v-for="key in ['killercoda', 'json', 'export']" :key="key">
            {{ t(`help.scenarios.creation.importExport.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-box-archive"></i> {{ t('help.scenarios.creation.archive.title') }}</h2>
        <p>{{ t('help.scenarios.creation.archive.description') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-heartbeat"></i> {{ t('help.scenarios.creation.health.title') }}</h2>
        <p>{{ t('help.scenarios.creation.health.description') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/scenarios/getting-started`" class="next-step-card">
            <i class="fas fa-play-circle"></i>
            <h4>{{ t('help.scenarios.gettingStarted.title') }}</h4>
            <p>{{ t('help.scenarios.creation.nextSteps.gettingStarted') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/groups/management`" class="next-step-card">
            <i class="fas fa-users"></i>
            <h4>{{ t('help.groups.management.title') }}</h4>
            <p>{{ t('help.scenarios.creation.nextSteps.classes') }}</p>
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
