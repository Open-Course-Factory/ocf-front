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
      <h1><i class="fas fa-palette"></i> {{ t('help.account.themes.title') }}</h1>
      <p class="article-description">{{ t('help.account.themes.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-adjust"></i> {{ t('help.account.themes.selection.title') }}</h2>
        <div class="ocf-theme-grid">
          <div v-for="(icon, mode) in modeIcons" :key="mode" class="ocf-theme-card">
            <i :class="icon"></i>
            <h4>{{ t(`help.account.themes.selection.${mode}.title`) }}</h4>
            <p>{{ t(`help.account.themes.selection.${mode}.description`) }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-map-signs"></i> {{ t('help.account.themes.whereToChange.title') }}</h2>
        <p>{{ t('help.account.themes.whereToChange.description') }}</p>
        <p>{{ t('help.account.themes.whereToChange.compact') }}</p>
        <HelpScreenshot name="settings-ui" :caption="t('help.account.themes.whereToChange.screenshot')" />
        <router-link to="/settings/ui" class="btn btn-primary">
          <i class="fas fa-palette"></i>
          {{ t('help.account.settings.ui.title') }}
        </router-link>
        <router-link :to="`${helpRoutePrefix}/account/settings`" class="btn btn-outline">
          <i class="fas fa-book"></i>
          {{ t('help.account.themes.whereToChange.button') }}
        </router-link>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-arrow-right"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/account/settings`" class="next-step-card">
            <i class="fas fa-cog"></i>
            <h4>{{ t('help.account.themes.nextSteps.settings.title') }}</h4>
            <p>{{ t('help.account.themes.nextSteps.settings.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/terminals/getting-started`" class="next-step-card">
            <i class="fas fa-terminal"></i>
            <h4>{{ t('help.account.themes.nextSteps.gettingStarted.title') }}</h4>
            <p>{{ t('help.account.themes.nextSteps.gettingStarted.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/account/subscription`" class="next-step-card">
            <i class="fas fa-calendar-check"></i>
            <h4>{{ t('help.account.themes.nextSteps.subscription.title') }}</h4>
            <p>{{ t('help.account.themes.nextSteps.subscription.description') }}</p>
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

const modeIcons = { light: 'fas fa-sun', dark: 'fas fa-moon', auto: 'fas fa-adjust' }

const isPublicHelp = computed(() => route.path.startsWith('/help-public'))
const helpMainRoute = computed(() => isPublicHelp.value ? '/help-public' : '/help')
const helpRoutePrefix = computed(() => isPublicHelp.value ? '/help-public' : '/help')

onMounted(async () => {
  await loadHelpTranslations()
})
</script>

<style scoped>
.ocf-theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.ocf-theme-card {
  text-align: center;
  padding: 24px;
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border-light);
  border-radius: 8px;
}

.ocf-theme-card i {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 12px;
}

.ocf-theme-card h4 {
  margin: 0 0 8px 0;
  color: var(--color-text-primary);
}

.ocf-theme-card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.btn + .btn {
  margin-left: 10px;
}
</style>
