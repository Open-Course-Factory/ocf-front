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
      <h1><i class="fas fa-calendar-check"></i> {{ t('help.account.subscription.title') }}</h1>
      <p class="article-description">{{ t('help.account.subscription.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-tags"></i> {{ t('help.account.subscription.catalogue.title') }}</h2>
        <p>{{ t('help.account.subscription.catalogue.description') }}</p>

        <div class="ocf-plan-grid">
          <div v-for="plan in plans" :key="plan" class="ocf-plan-card">
            <h4>{{ t(`help.account.subscription.catalogue.${plan}.title`) }}</h4>
            <div class="ocf-plan-price">{{ t(`help.account.subscription.catalogue.${plan}.price`) }}</div>
            <p>{{ t(`help.account.subscription.catalogue.${plan}.description`) }}</p>
          </div>
        </div>

        <p>{{ t('help.account.subscription.catalogue.ttc') }}</p>
        <HelpScreenshot name="pricing" :caption="t('help.account.subscription.subscribe.screenshot')" />
      </section>

      <section class="help-section">
        <h2><i class="fas fa-compass"></i> {{ t('help.account.subscription.whereToFind.title') }}</h2>
        <p>{{ t('help.account.subscription.whereToFind.description') }}</p>
        <ul>
          <li>{{ t('help.account.subscription.whereToFind.dashboard') }}</li>
          <li>{{ t('help.account.subscription.whereToFind.plans') }}</li>
          <li>{{ t('help.account.subscription.whereToFind.pricing') }}</li>
          <li>{{ t('help.account.subscription.whereToFind.licenses') }}</li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-shopping-cart"></i> {{ t('help.account.subscription.subscribe.title') }}</h2>
        <p>{{ t('help.account.subscription.subscribe.description') }}</p>
        <HelpScreenshot name="subscription-plans" :caption="t('help.account.subscription.catalogue.screenshot')" />

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.account.subscription.subscribe.free.title') }}</h4>
            <p>{{ t('help.account.subscription.subscribe.free.description') }}</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.account.subscription.subscribe.paid.title') }}</h4>
            <p>{{ t('help.account.subscription.subscribe.paid.description') }}</p>
            <p>{{ t('help.account.subscription.subscribe.emailVerified') }}</p>
            <router-link to="/subscription-plans" class="btn btn-primary">
              <i class="fas fa-tags"></i>
              {{ t('navigation.availablePlans') }}
            </router-link>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-exchange-alt"></i> {{ t('help.account.subscription.changePlan.title') }}</h2>
        <p>{{ t('help.account.subscription.changePlan.description') }}</p>
        <div v-for="kind in ['upgrade', 'fromFree', 'toFree']" :key="kind" class="step-card">
          <div class="step-number"><i class="fas fa-arrow-right"></i></div>
          <div class="step-content">
            <h4>{{ t(`help.account.subscription.changePlan.${kind}.title`) }}</h4>
            <p>{{ t(`help.account.subscription.changePlan.${kind}.description`) }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-tachometer-alt"></i> {{ t('help.account.subscription.dashboard.title') }}</h2>
        <p>{{ t('help.account.subscription.dashboard.description') }}</p>
        <ul>
          <li v-for="key in ['plan', 'source', 'priority', 'features', 'billing', 'actions']" :key="key">
            {{ t(`help.account.subscription.dashboard.${key}`) }}
          </li>
        </ul>
        <HelpScreenshot name="subscription-dashboard" :caption="t('help.account.subscription.dashboard.screenshot')" />
        <router-link to="/subscription-dashboard" class="btn btn-outline">
          <i class="fas fa-tachometer-alt"></i>
          {{ t('navigation.mySubscription') }}
        </router-link>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-chart-pie"></i> {{ t('help.account.subscription.usage.title') }}</h2>
        <p>{{ t('help.account.subscription.usage.description') }}</p>
        <ul>
          <li v-for="key in ['plan', 'capacity', 'bars', 'sessions', 'refresh']" :key="key">
            {{ t(`help.account.subscription.usage.${key}`) }}
          </li>
        </ul>
        <p>{{ t('help.account.subscription.usage.orgPanel') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-id-badge"></i> {{ t('help.account.subscription.sources.title') }}</h2>
        <p>{{ t('help.account.subscription.sources.description') }}</p>
        <div class="ocf-source-grid">
          <div v-for="(icon, source) in sourceIcons" :key="source" class="ocf-source-card">
            <i :class="icon"></i>
            <h4>{{ t(`help.account.subscription.sources.${source}.title`) }}</h4>
            <p>{{ t(`help.account.subscription.sources.${source}.description`) }}</p>
          </div>
        </div>
        <p>{{ t('help.account.subscription.sources.assignedNote') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-times-circle"></i> {{ t('help.account.subscription.cancel.title') }}</h2>
        <p>{{ t('help.account.subscription.cancel.description') }}</p>
        <ul>
          <li>{{ t('help.account.subscription.cancel.atPeriodEnd') }}</li>
          <li>{{ t('help.account.subscription.cancel.immediately') }}</li>
        </ul>
        <p>{{ t('help.account.subscription.cancel.reactivate') }}</p>
        <p>{{ t('help.account.subscription.cancel.portal') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-arrow-right"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/account/billing`" class="next-step-card">
            <i class="fas fa-credit-card"></i>
            <h4>{{ t('help.account.subscription.nextSteps.billing.title') }}</h4>
            <p>{{ t('help.account.subscription.nextSteps.billing.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/organizations/overview`" class="next-step-card">
            <i class="fas fa-building"></i>
            <h4>{{ t('help.account.subscription.nextSteps.organizations.title') }}</h4>
            <p>{{ t('help.account.subscription.nextSteps.organizations.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/terminals/getting-started`" class="next-step-card">
            <i class="fas fa-terminal"></i>
            <h4>{{ t('help.account.subscription.nextSteps.terminals.title') }}</h4>
            <p>{{ t('help.account.subscription.nextSteps.terminals.description') }}</p>
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

const plans = ['discovery', 'solo', 'trainer', 'school']
const sourceIcons = {
  personal: 'fas fa-user',
  organization: 'fas fa-building',
  assigned: 'fas fa-users'
}

// Determine the correct help routes based on current path
const isPublicHelp = computed(() => route.path.startsWith('/help-public'))
const helpMainRoute = computed(() => isPublicHelp.value ? '/help-public' : '/help')
const helpRoutePrefix = computed(() => isPublicHelp.value ? '/help-public' : '/help')

onMounted(async () => {
  await loadHelpTranslations()
})
</script>

<style scoped>
.ocf-plan-grid,
.ocf-source-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.ocf-plan-card,
.ocf-source-card {
  padding: 20px;
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border-light);
  border-radius: 8px;
}

.ocf-plan-card h4,
.ocf-source-card h4 {
  margin: 0 0 8px 0;
  color: var(--color-text-primary);
}

.ocf-plan-price {
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 10px;
}

.ocf-plan-card p,
.ocf-source-card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.ocf-source-card {
  text-align: center;
}

.ocf-source-card i {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 12px;
}

.step-number i {
  font-size: 0.9rem;
}
</style>
