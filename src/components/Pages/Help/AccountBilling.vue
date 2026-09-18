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
      <h1><i class="fas fa-credit-card"></i> {{ t('help.account.billing.title') }}</h1>
      <p class="article-description">{{ t('help.account.billing.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-compass"></i> {{ t('help.account.billing.whereToFind.title') }}</h2>
        <p>{{ t('help.account.billing.whereToFind.description') }}</p>
        <p>{{ t('help.account.billing.whereToFind.verified') }}</p>
        <p>{{ t('help.account.billing.whereToFind.assigned') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-file-invoice-dollar"></i> {{ t('help.account.billing.invoices.title') }}</h2>
        <p>{{ t('help.account.billing.invoices.description') }}</p>
        <ul>
          <li v-for="key in ['filter', 'refresh', 'details', 'download']" :key="key">
            {{ t(`help.account.billing.invoices.${key}`) }}
          </li>
        </ul>
        <HelpScreenshot name="invoices" :caption="t('help.account.billing.invoices.screenshot')" />
        <router-link to="/invoices" class="btn btn-outline">
          <i class="fas fa-file-invoice-dollar"></i>
          {{ t('help.account.billing.invoices.title') }}
        </router-link>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-map-marker-alt"></i> {{ t('help.account.billing.addresses.title') }}</h2>
        <p>{{ t('help.account.billing.addresses.description') }}</p>
        <ul>
          <li>{{ t('help.account.billing.addresses.fields') }}</li>
          <li>{{ t('help.account.billing.addresses.default') }}</li>
          <li>{{ t('help.account.billing.addresses.edit') }}</li>
        </ul>
        <router-link to="/billing-addresses" class="btn btn-outline">
          <i class="fas fa-map-marker-alt"></i>
          {{ t('help.account.billing.addresses.title') }}
        </router-link>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-credit-card"></i> {{ t('help.account.billing.paymentMethods.title') }}</h2>
        <p>{{ t('help.account.billing.paymentMethods.description') }}</p>
        <ul>
          <li>{{ t('help.account.billing.paymentMethods.add') }}</li>
          <li>{{ t('help.account.billing.paymentMethods.default') }}</li>
        </ul>
        <router-link to="/payment-methods" class="btn btn-outline">
          <i class="fas fa-credit-card"></i>
          {{ t('help.account.billing.paymentMethods.title') }}
        </router-link>
      </section>

      <section class="help-section info">
        <h2><i class="fas fa-shield-alt"></i> {{ t('help.account.billing.portal.title') }}</h2>
        <p>{{ t('help.account.billing.portal.description') }}</p>
        <ul>
          <li>{{ t('help.account.billing.portal.card') }}</li>
          <li>{{ t('help.account.billing.portal.history') }}</li>
          <li>{{ t('help.account.billing.portal.invoices') }}</li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-arrow-right"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/account/subscription`" class="next-step-card">
            <i class="fas fa-calendar-check"></i>
            <h4>{{ t('help.account.billing.nextSteps.subscription.title') }}</h4>
            <p>{{ t('help.account.billing.nextSteps.subscription.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/licenses/bulk-purchase`" class="next-step-card">
            <i class="fas fa-layer-group"></i>
            <h4>{{ t('help.account.billing.nextSteps.licenses.title') }}</h4>
            <p>{{ t('help.account.billing.nextSteps.licenses.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/account/settings`" class="next-step-card">
            <i class="fas fa-cog"></i>
            <h4>{{ t('help.account.billing.nextSteps.settings.title') }}</h4>
            <p>{{ t('help.account.billing.nextSteps.settings.description') }}</p>
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
