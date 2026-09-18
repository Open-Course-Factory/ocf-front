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
      <h1><i class="fas fa-id-badge"></i> {{ t('help.organizations.bulkLicenses.title') }}</h1>
      <p class="article-description">{{ t('help.organizations.bulkLicenses.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> {{ t('help.organizations.bulkLicenses.what.title') }}</h2>
        <p>{{ t('help.organizations.bulkLicenses.what.description') }}</p>
        <p>{{ t('help.organizations.bulkLicenses.what.eligibility') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-shopping-cart"></i> {{ t('help.organizations.bulkLicenses.purchase.title') }}</h2>
        <p>{{ t('help.organizations.bulkLicenses.purchase.description') }}</p>
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.organizations.bulkLicenses.purchase.step1.title') }}</h4>
            <p>{{ t('help.organizations.bulkLicenses.purchase.step1.description') }}</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.organizations.bulkLicenses.purchase.step2.title') }}</h4>
            <p>{{ t('help.organizations.bulkLicenses.purchase.step2.description') }}</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('help.organizations.bulkLicenses.purchase.step3.title') }}</h4>
            <p>{{ t('help.organizations.bulkLicenses.purchase.step3.description') }}</p>
          </div>
        </div>
        <p>{{ t('help.organizations.bulkLicenses.purchase.after') }}</p>
        <router-link v-if="!isPublicHelp" to="/bulk-license-purchase" class="btn btn-outline">
          <i class="fas fa-shopping-cart"></i>
          {{ t('help.organizations.bulkLicenses.purchase.title') }}
        </router-link>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-layer-group"></i> {{ t('help.organizations.bulkLicenses.manage.title') }}</h2>
        <p>{{ t('help.organizations.bulkLicenses.manage.description') }}</p>
        <ul>
          <li v-html="t('help.organizations.bulkLicenses.manage.batch')"></li>
          <li v-html="t('help.organizations.bulkLicenses.manage.assign')"></li>
          <li v-html="t('help.organizations.bulkLicenses.manage.revoke')"></li>
          <li v-html="t('help.organizations.bulkLicenses.manage.add')"></li>
          <li v-html="t('help.organizations.bulkLicenses.manage.delete')"></li>
        </ul>
        <router-link v-if="!isPublicHelp" to="/license-management" class="btn btn-outline">
          <i class="fas fa-layer-group"></i>
          {{ t('help.organizations.bulkLicenses.manage.title') }}
        </router-link>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/organizations/overview`" class="next-step-card">
            <i class="fas fa-building"></i>
            <h4>{{ t('help.organizations.bulkLicenses.nextSteps.organizations.title') }}</h4>
            <p>{{ t('help.organizations.bulkLicenses.nextSteps.organizations.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/account/subscription`" class="next-step-card">
            <i class="fas fa-credit-card"></i>
            <h4>{{ t('help.organizations.bulkLicenses.nextSteps.subscription.title') }}</h4>
            <p>{{ t('help.organizations.bulkLicenses.nextSteps.subscription.description') }}</p>
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
