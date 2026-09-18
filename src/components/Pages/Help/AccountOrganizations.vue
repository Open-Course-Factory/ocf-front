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
      <h1><i class="fas fa-building"></i> {{ t('help.organizations.overview.title') }}</h1>
      <p class="article-description">{{ t('help.organizations.overview.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-layer-group"></i> {{ t('help.organizations.overview.types.title') }}</h2>
        <p>{{ t('help.organizations.overview.types.description') }}</p>
        <div class="ocf-help-type-grid">
          <div class="ocf-help-type-card">
            <i class="fas fa-user"></i>
            <h4>{{ t('help.organizations.overview.types.personal.title') }}</h4>
            <p>{{ t('help.organizations.overview.types.personal.description') }}</p>
          </div>
          <div class="ocf-help-type-card">
            <i class="fas fa-building"></i>
            <h4>{{ t('help.organizations.overview.types.team.title') }}</h4>
            <p>{{ t('help.organizations.overview.types.team.description') }}</p>
          </div>
        </div>
        <HelpScreenshot name="organizations" :caption="t('help.organizations.overview.types.caption')" />
        <p>{{ t('help.organizations.overview.types.compare') }}</p>
      </section>

      <section class="help-section info">
        <h2><i class="fas fa-exchange-alt"></i> {{ t('help.organizations.overview.switcher.title') }}</h2>
        <p>{{ t('help.organizations.overview.switcher.description') }}</p>
        <p>{{ t('help.organizations.overview.switcher.how') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-plus-circle"></i> {{ t('help.organizations.overview.creating.title') }}</h2>
        <p>{{ t('help.organizations.overview.creating.description') }}</p>
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.organizations.overview.creating.step1.title') }}</h4>
            <p>{{ t('help.organizations.overview.creating.step1.description') }}</p>
            <router-link v-if="!isPublicHelp" to="/organizations" class="btn btn-outline">
              <i class="fas fa-building"></i>
              {{ t('help.organizations.overview.creating.button') }}
            </router-link>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.organizations.overview.creating.step2.title') }}</h4>
            <p>{{ t('help.organizations.overview.creating.step2.description') }}</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('help.organizations.overview.creating.step3.title') }}</h4>
            <p>{{ t('help.organizations.overview.creating.step3.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-columns"></i> {{ t('help.organizations.overview.page.title') }}</h2>
        <p>{{ t('help.organizations.overview.page.description') }}</p>
        <HelpScreenshot name="organization-detail" :caption="t('help.organizations.overview.page.caption')" />
        <ul>
          <li v-html="t('help.organizations.overview.page.overview')"></li>
          <li v-html="t('help.organizations.overview.page.members')"></li>
          <li v-html="t('help.organizations.overview.page.groups')"></li>
          <li v-html="t('help.organizations.overview.page.scenarios')"></li>
          <li v-html="t('help.organizations.overview.page.sessions')"></li>
          <li v-html="t('help.organizations.overview.page.subscription')"></li>
          <li v-html="t('help.organizations.overview.page.settings')"></li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-user-tag"></i> {{ t('help.organizations.overview.members.title') }}</h2>
        <p>{{ t('help.organizations.overview.members.description') }}</p>
        <ul>
          <li v-html="t('help.organizations.overview.members.member')"></li>
          <li v-html="t('help.organizations.overview.members.teacher')"></li>
          <li v-html="t('help.organizations.overview.members.manager')"></li>
          <li v-html="t('help.organizations.overview.members.owner')"></li>
        </ul>
        <p>{{ t('help.organizations.overview.members.offboarding') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-id-card"></i> {{ t('help.organizations.overview.plans.title') }}</h2>
        <p v-html="t('help.organizations.overview.plans.inherited')"></p>
        <p v-html="t('help.organizations.overview.plans.dedicated')"></p>
        <p>{{ t('help.organizations.overview.plans.roles') }}</p>
        <p>{{ t('help.organizations.overview.plans.seats') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/classes/overview`" class="next-step-card">
            <i class="fas fa-chalkboard-teacher"></i>
            <h4>{{ t('help.organizations.overview.nextSteps.classes.title') }}</h4>
            <p>{{ t('help.organizations.overview.nextSteps.classes.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/organizations/bulk-import`" class="next-step-card">
            <i class="fas fa-file-import"></i>
            <h4>{{ t('help.organizations.overview.nextSteps.bulkImport.title') }}</h4>
            <p>{{ t('help.organizations.overview.nextSteps.bulkImport.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/account/roles-and-permissions`" class="next-step-card">
            <i class="fas fa-user-shield"></i>
            <h4>{{ t('help.organizations.overview.nextSteps.roles.title') }}</h4>
            <p>{{ t('help.organizations.overview.nextSteps.roles.description') }}</p>
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

.ocf-help-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.ocf-help-type-card {
  padding: 20px;
  background: var(--color-gray-50);
  border: 2px solid var(--color-gray-200);
  border-radius: 8px;
}

.ocf-help-type-card i {
  font-size: 1.6rem;
  color: var(--color-primary);
  margin-bottom: 12px;
}

.ocf-help-type-card h4 {
  margin: 0 0 8px 0;
  color: var(--color-text-primary);
}

.ocf-help-type-card p {
  margin: 0;
  color: var(--color-gray-600);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .ocf-help-type-grid {
    grid-template-columns: 1fr;
  }
}
</style>
