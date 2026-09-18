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
      <h1><i class="fas fa-wrench"></i> {{ t('help.terminals.troubleshooting.title') }}</h1>
      <p class="article-description">{{ t('help.terminals.troubleshooting.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-ban"></i> {{ t('help.terminals.troubleshooting.cannotCreate.title') }}</h2>
        <div v-for="key in ['budget', 'locked', 'capacity', 'offline', 'persistence']" :key="key" class="step-card">
          <div class="step-number"><i class="fas fa-exclamation"></i></div>
          <div class="step-content">
            <h4>{{ t(`help.terminals.troubleshooting.cannotCreate.${key}.title`) }}</h4>
            <p>{{ t(`help.terminals.troubleshooting.cannotCreate.${key}.description`) }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-plug"></i> {{ t('help.terminals.troubleshooting.blackScreen.title') }}</h2>
        <p>{{ t('help.terminals.troubleshooting.blackScreen.description') }}</p>
        <div v-for="(key, index) in ['reconnect', 'blockers', 'reload', 'expired']" :key="key" class="step-card">
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-content"><p>{{ t(`help.terminals.troubleshooting.blackScreen.steps.${key}`) }}</p></div>
        </div>
      </section>

      <section v-for="key in ['keyboard', 'shell', 'stopGreyed', 'packages', 'wrongState']" :key="key" class="help-section">
        <h2><i class="fas fa-question"></i> {{ t(`help.terminals.troubleshooting.${key}.title`) }}</h2>
        <p>{{ t(`help.terminals.troubleshooting.${key}.description`) }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-life-ring"></i> {{ t('help.terminals.troubleshooting.support.title') }}</h2>
        <p>{{ t('help.terminals.troubleshooting.support.description') }}</p>
        <ul>
          <li v-for="key in ['session', 'when', 'browser']" :key="key">
            {{ t(`help.terminals.troubleshooting.support.items.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/terminals/getting-started`" class="next-step-card">
            <i class="fas fa-play-circle"></i>
            <h4>{{ t('help.terminals.gettingStarted.title') }}</h4>
            <p>{{ t('help.terminals.troubleshooting.nextSteps.gettingStarted') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/terminals/managing-sessions`" class="next-step-card">
            <i class="fas fa-cogs"></i>
            <h4>{{ t('help.terminals.managingSessions.title') }}</h4>
            <p>{{ t('help.terminals.troubleshooting.nextSteps.managing') }}</p>
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
