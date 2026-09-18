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
      <h1><i class="fas fa-cog"></i> {{ t('help.account.settings.title') }}</h1>
      <p class="article-description">{{ t('help.account.settings.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-compass"></i> {{ t('help.account.settings.overview.title') }}</h2>
        <p>{{ t('help.account.settings.overview.description') }}</p>
        <p>{{ t('help.account.settings.overview.autosave') }}</p>
        <router-link to="/settings/navigation" class="btn btn-primary">
          <i class="fas fa-cog"></i>
          {{ t('help.account.settings.title') }}
        </router-link>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-compass"></i> {{ t('help.account.settings.navigation.title') }}</h2>
        <p>{{ t('help.account.settings.navigation.description') }}</p>
        <div class="step-card">
          <div class="step-number"><i class="fas fa-home"></i></div>
          <div class="step-content">
            <h4>{{ t('help.account.settings.navigation.defaultPage.title') }}</h4>
            <p>{{ t('help.account.settings.navigation.defaultPage.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-globe"></i> {{ t('help.account.settings.localization.title') }}</h2>
        <p>{{ t('help.account.settings.localization.description') }}</p>
        <div v-for="key in ['language', 'timezone']" :key="key" class="step-card">
          <div class="step-number"><i :class="key === 'language' ? 'fas fa-language' : 'fas fa-clock'"></i></div>
          <div class="step-content">
            <h4>{{ t(`help.account.settings.localization.${key}.title`) }}</h4>
            <p>{{ t(`help.account.settings.localization.${key}.description`) }}</p>
          </div>
        </div>
        <HelpScreenshot name="settings-localization" :caption="t('help.account.settings.localization.screenshot')" />
      </section>

      <section class="help-section">
        <h2><i class="fas fa-palette"></i> {{ t('help.account.settings.ui.title') }}</h2>
        <p>{{ t('help.account.settings.ui.description') }}</p>
        <div v-for="key in ['theme', 'compact']" :key="key" class="step-card">
          <div class="step-number"><i :class="key === 'theme' ? 'fas fa-adjust' : 'fas fa-compress'"></i></div>
          <div class="step-content">
            <h4>{{ t(`help.account.settings.ui.${key}.title`) }}</h4>
            <p>{{ t(`help.account.settings.ui.${key}.description`) }}</p>
          </div>
        </div>
        <HelpScreenshot name="settings-ui" :caption="t('help.account.settings.ui.screenshot')" />
      </section>

      <section class="help-section">
        <h2><i class="fas fa-bell"></i> {{ t('help.account.settings.notifications.title') }}</h2>
        <p>{{ t('help.account.settings.notifications.description') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-shield-alt"></i> {{ t('help.account.settings.security.title') }}</h2>
        <p>{{ t('help.account.settings.security.description') }}</p>
        <div class="step-card">
          <div class="step-number"><i class="fas fa-key"></i></div>
          <div class="step-content">
            <h4>{{ t('help.account.settings.security.password.title') }}</h4>
            <p>{{ t('help.account.settings.security.password.description') }}</p>
          </div>
        </div>
        <div class="step-card ocf-danger-card">
          <div class="step-number"><i class="fas fa-exclamation-triangle"></i></div>
          <div class="step-content">
            <h4>{{ t('help.account.settings.security.deleteAccount.title') }}</h4>
            <p>{{ t('help.account.settings.security.deleteAccount.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-terminal"></i> {{ t('help.account.settings.sshKeys.title') }}</h2>
        <p>{{ t('help.account.settings.sshKeys.description') }}</p>
        <p>{{ t('help.account.settings.sshKeys.linkText') }}</p>
        <router-link :to="`${helpRoutePrefix}/terminals/ssh-keys`" class="btn btn-outline">
          <i class="fas fa-key"></i>
          {{ t('help.account.settings.sshKeys.button') }}
        </router-link>
      </section>

      <section class="help-section info">
        <h2><i class="fas fa-info-circle"></i> {{ t('help.account.settings.version.title') }}</h2>
        <p>{{ t('help.account.settings.version.description') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-arrow-right"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/account/themes`" class="next-step-card">
            <i class="fas fa-palette"></i>
            <h4>{{ t('help.account.settings.nextSteps.themes.title') }}</h4>
            <p>{{ t('help.account.settings.nextSteps.themes.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/terminals/ssh-keys`" class="next-step-card">
            <i class="fas fa-key"></i>
            <h4>{{ t('help.account.settings.nextSteps.sshKeys.title') }}</h4>
            <p>{{ t('help.account.settings.nextSteps.sshKeys.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/account/roles-and-permissions`" class="next-step-card">
            <i class="fas fa-user-shield"></i>
            <h4>{{ t('help.account.settings.nextSteps.roles.title') }}</h4>
            <p>{{ t('help.account.settings.nextSteps.roles.description') }}</p>
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

const isPublicHelp = computed(() => route.path.startsWith('/help-public'))
const helpMainRoute = computed(() => isPublicHelp.value ? '/help-public' : '/help')
const helpRoutePrefix = computed(() => isPublicHelp.value ? '/help-public' : '/help')

onMounted(async () => {
  await loadHelpTranslations()
})
</script>

<style scoped>
.step-number i {
  font-size: 0.9rem;
}

.ocf-danger-card {
  border-left-color: var(--color-danger);
}

.ocf-danger-card .step-number {
  background: var(--color-danger);
}
</style>
