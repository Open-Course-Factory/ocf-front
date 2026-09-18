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
      <h1><i class="fas fa-cogs"></i> {{ t('help.terminals.managingSessions.title') }}</h1>
      <p class="article-description">{{ t('help.terminals.managingSessions.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-list"></i> {{ t('help.terminals.managingSessions.list.title') }}</h2>
        <p>{{ t('help.terminals.managingSessions.list.description') }}</p>
        <router-link to="/terminal-sessions" class="btn btn-primary">
          <i class="fas fa-list"></i>
          {{ t('help.terminals.managingSessions.list.title') }}
        </router-link>
        <HelpScreenshot name="terminal-sessions" :caption="t('help.terminals.managingSessions.list.shot')" />
        <ul>
          <li v-for="key in ['sync', 'newSession', 'hide', 'classView']" :key="key">
            {{ t(`help.terminals.managingSessions.list.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-id-card"></i> {{ t('help.terminals.managingSessions.card.title') }}</h2>
        <p>{{ t('help.terminals.managingSessions.card.description') }}</p>
        <ul>
          <li v-for="key in ['name', 'meta', 'state']" :key="key">
            {{ t(`help.terminals.managingSessions.card.${key}`) }}
          </li>
        </ul>
        <h4>{{ t('help.terminals.managingSessions.card.actions.title') }}</h4>
        <ul>
          <li v-for="key in ['open', 'popup', 'resume', 'stop', 'destroy', 'more']" :key="key">
            {{ t(`help.terminals.managingSessions.card.actions.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-database"></i> {{ t('help.terminals.managingSessions.lifecycle.title') }}</h2>
        <p>{{ t('help.terminals.managingSessions.lifecycle.description') }}</p>
        <div class="step-card">
          <div class="step-number"><i class="fas fa-bolt"></i></div>
          <div class="step-content"><p>{{ t('help.terminals.managingSessions.lifecycle.ephemeral') }}</p></div>
        </div>
        <div class="step-card">
          <div class="step-number"><i class="fas fa-save"></i></div>
          <div class="step-content"><p>{{ t('help.terminals.managingSessions.lifecycle.persistent') }}</p></div>
        </div>
        <p>{{ t('help.terminals.managingSessions.lifecycle.expired') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-chart-pie"></i> {{ t('help.terminals.managingSessions.usage.title') }}</h2>
        <p>{{ t('help.terminals.managingSessions.usage.description') }}</p>
        <ul>
          <li v-for="key in ['plan', 'capacity', 'remaining', 'bars']" :key="key">
            {{ t(`help.terminals.managingSessions.usage.${key}`) }}
          </li>
        </ul>
        <p>{{ t('help.terminals.managingSessions.usage.composer') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-history"></i> {{ t('help.terminals.managingSessions.history.title') }}</h2>
        <p>{{ t('help.terminals.managingSessions.history.description') }}</p>
        <ul>
          <li v-for="key in ['filter', 'export', 'delete']" :key="key">
            {{ t(`help.terminals.managingSessions.history.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/terminals/getting-started`" class="next-step-card">
            <i class="fas fa-play-circle"></i>
            <h4>{{ t('help.terminals.gettingStarted.title') }}</h4>
            <p>{{ t('help.terminals.managingSessions.nextSteps.gettingStarted') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/terminals/troubleshooting`" class="next-step-card">
            <i class="fas fa-wrench"></i>
            <h4>{{ t('help.terminals.troubleshooting.title') }}</h4>
            <p>{{ t('help.terminals.managingSessions.nextSteps.troubleshooting') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/scenarios/getting-started`" class="next-step-card">
            <i class="fas fa-flag-checkered"></i>
            <h4>{{ t('help.scenarios.gettingStarted.title') }}</h4>
            <p>{{ t('help.terminals.managingSessions.nextSteps.scenarios') }}</p>
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

onMounted(async () => {
  await loadHelpTranslations()
})
</script>

<style scoped>
/* Page-specific styles only - common help article styles are in help-article.css */
</style>
