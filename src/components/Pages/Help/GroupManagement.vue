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
      <h1><i class="fas fa-sitemap"></i> {{ t('help.organizations.groups.title') }}</h1>
      <p class="article-description">{{ t('help.organizations.groups.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section info">
        <h2><i class="fas fa-chalkboard-teacher"></i> {{ t('help.organizations.groups.classes.title') }}</h2>
        <p>{{ t('help.organizations.groups.classes.description') }}</p>
        <router-link :to="`${helpRoutePrefix}/classes/overview`" class="btn btn-primary">
          <i class="fas fa-chalkboard-teacher"></i>
          {{ t('help.organizations.groups.classes.button') }}
        </router-link>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-th-large"></i> {{ t('help.organizations.groups.list.title') }}</h2>
        <p>{{ t('help.organizations.groups.list.description') }}</p>
        <ul>
          <li>{{ t('help.organizations.groups.list.card') }}</li>
          <li>{{ t('help.organizations.groups.list.open') }}</li>
          <li>{{ t('help.organizations.groups.list.scope') }}</li>
          <li>{{ t('help.organizations.groups.list.access') }}</li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-project-diagram"></i> {{ t('help.organizations.groups.hierarchy.title') }}</h2>
        <p>{{ t('help.organizations.groups.hierarchy.description') }}</p>
        <ul>
          <li>{{ t('help.organizations.groups.hierarchy.tree') }}</li>
          <li>{{ t('help.organizations.groups.hierarchy.counts') }}</li>
          <li>{{ t('help.organizations.groups.hierarchy.move') }}</li>
          <li>{{ t('help.organizations.groups.hierarchy.details') }}</li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-code-branch"></i> {{ t('help.organizations.groups.subgroups.title') }}</h2>
        <p>{{ t('help.organizations.groups.subgroups.description') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/classes/overview`" class="next-step-card">
            <i class="fas fa-chalkboard-teacher"></i>
            <h4>{{ t('help.organizations.groups.nextSteps.overview.title') }}</h4>
            <p>{{ t('help.organizations.groups.nextSteps.overview.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/classes/settings`" class="next-step-card">
            <i class="fas fa-cog"></i>
            <h4>{{ t('help.organizations.groups.nextSteps.settings.title') }}</h4>
            <p>{{ t('help.organizations.groups.nextSteps.settings.description') }}</p>
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
