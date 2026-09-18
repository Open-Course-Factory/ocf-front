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
      <h1><i class="fas fa-key"></i> {{ t('help.terminals.sshKeys.title') }}</h1>
      <p class="article-description">{{ t('help.terminals.sshKeys.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-terminal"></i> {{ t('help.terminals.sshKeys.terminalKey.title') }}</h2>
        <p>{{ t('help.terminals.sshKeys.terminalKey.description') }}</p>
        <p>{{ t('help.terminals.sshKeys.terminalKey.page') }}</p>
        <router-link to="/user-terminal-keys" class="btn btn-outline">
          <i class="fas fa-key"></i>
          {{ t('help.terminals.sshKeys.terminalKey.title') }}
        </router-link>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-lock"></i> {{ t('help.terminals.sshKeys.sshKeys.title') }}</h2>
        <p>{{ t('help.terminals.sshKeys.sshKeys.description') }}</p>
        <HelpScreenshot name="settings-ssh-keys" :caption="t('help.terminals.sshKeys.sshKeys.shot')" />
        <ul>
          <li v-for="key in ['add', 'edit', 'delete']" :key="key">
            {{ t(`help.terminals.sshKeys.sshKeys.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/terminals/getting-started`" class="next-step-card">
            <i class="fas fa-play-circle"></i>
            <h4>{{ t('help.terminals.gettingStarted.title') }}</h4>
            <p>{{ t('help.terminals.sshKeys.nextSteps.gettingStarted') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/account/settings`" class="next-step-card">
            <i class="fas fa-cog"></i>
            <h4>{{ t('help.account.settings.title') }}</h4>
            <p>{{ t('help.terminals.sshKeys.nextSteps.settings') }}</p>
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
