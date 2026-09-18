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
      <h1><i class="fas fa-play-circle"></i> {{ t('help.terminals.gettingStarted.title') }}</h1>
      <p class="article-description">{{ t('help.terminals.gettingStarted.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> {{ t('help.terminals.gettingStarted.what.title') }}</h2>
        <p>{{ t('help.terminals.gettingStarted.what.description') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-sliders-h"></i> {{ t('help.terminals.gettingStarted.open.title') }}</h2>
        <p>{{ t('help.terminals.gettingStarted.open.description') }}</p>
        <router-link to="/terminal-creation" class="btn btn-primary">
          <i class="fas fa-plus"></i>
          {{ t('help.terminals.gettingStarted.open.button') }}
        </router-link>
        <HelpScreenshot name="terminal-creation" :caption="t('help.terminals.gettingStarted.open.shot')" />
      </section>

      <section class="help-section">
        <h2><i class="fab fa-linux"></i> {{ t('help.terminals.gettingStarted.environment.title') }}</h2>
        <p>{{ t('help.terminals.gettingStarted.environment.description') }}</p>
        <p>{{ t('help.terminals.gettingStarted.environment.dedicated') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-microchip"></i> {{ t('help.terminals.gettingStarted.size.title') }}</h2>
        <p>{{ t('help.terminals.gettingStarted.size.description') }}</p>
        <p>{{ t('help.terminals.gettingStarted.size.budget') }}</p>
        <p>{{ t('help.terminals.gettingStarted.size.locked') }}</p>
        <p>{{ t('help.terminals.gettingStarted.size.seat') }}</p>
        <h4>{{ t('help.terminals.gettingStarted.size.useCases.title') }}</h4>
        <ul>
          <li v-for="key in ['xs', 's', 'm', 'l', 'xl']" :key="key">
            {{ t(`help.terminals.gettingStarted.size.useCases.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-puzzle-piece"></i> {{ t('help.terminals.gettingStarted.features.title') }}</h2>
        <p>{{ t('help.terminals.gettingStarted.features.description') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-cog"></i> {{ t('help.terminals.gettingStarted.advanced.title') }}</h2>
        <p>{{ t('help.terminals.gettingStarted.advanced.description') }}</p>
        <ul>
          <li v-for="key in ['name', 'hostname', 'exerciseRef', 'packages', 'network', 'persistence']" :key="key">
            {{ t(`help.terminals.gettingStarted.advanced.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-rocket"></i> {{ t('help.terminals.gettingStarted.create.title') }}</h2>
        <p>{{ t('help.terminals.gettingStarted.create.description') }}</p>
        <div class="ocf-help-tip">
          <h4><i class="fas fa-video"></i> {{ t('help.terminals.gettingStarted.create.recording') }}</h4>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-terminal"></i> {{ t('help.terminals.gettingStarted.session.title') }}</h2>
        <p>{{ t('help.terminals.gettingStarted.session.description') }}</p>
        <HelpScreenshot name="terminal-session" :caption="t('help.terminals.gettingStarted.session.shot')" />
        <ul>
          <li v-for="key in ['header', 'banner', 'stop', 'destroy', 'history']" :key="key">
            {{ t(`help.terminals.gettingStarted.session.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-clock"></i> {{ t('help.terminals.gettingStarted.expiry.title') }}</h2>
        <p>{{ t('help.terminals.gettingStarted.expiry.description') }}</p>
        <ul>
          <li>{{ t('help.terminals.gettingStarted.expiry.tenMin') }}</li>
          <li>{{ t('help.terminals.gettingStarted.expiry.fiveMin') }}</li>
          <li>{{ t('help.terminals.gettingStarted.expiry.oneMin') }}</li>
        </ul>
        <p>{{ t('help.terminals.gettingStarted.expiry.ended') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/terminals/managing-sessions`" class="next-step-card">
            <i class="fas fa-cogs"></i>
            <h4>{{ t('help.terminals.managingSessions.title') }}</h4>
            <p>{{ t('help.terminals.gettingStarted.nextSteps.managing') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/terminals/troubleshooting`" class="next-step-card">
            <i class="fas fa-wrench"></i>
            <h4>{{ t('help.terminals.troubleshooting.title') }}</h4>
            <p>{{ t('help.terminals.gettingStarted.nextSteps.troubleshooting') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/scenarios/getting-started`" class="next-step-card">
            <i class="fas fa-flag-checkered"></i>
            <h4>{{ t('help.scenarios.gettingStarted.title') }}</h4>
            <p>{{ t('help.terminals.gettingStarted.nextSteps.scenarios') }}</p>
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

.ocf-help-tip {
  background: var(--color-warning-bg);
  border: 2px solid var(--color-warning);
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.ocf-help-tip h4 {
  margin: 0;
  color: var(--color-warning-text);
  font-weight: 500;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
</style>
