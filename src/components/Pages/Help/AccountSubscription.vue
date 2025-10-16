<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
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
      <p class="article-description">
        {{ t('help.account.subscription.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> {{ t('help.account.subscription.overview.title') }}</h2>
        <p>
          {{ t('help.account.subscription.overview.description') }}
        </p>

        <div class="subscription-overview">
          <div class="overview-card">
            <i class="fas fa-user"></i>
            <h4>{{ t('help.account.subscription.overview.individual.title') }}</h4>
            <p>
              {{ t('help.account.subscription.overview.individual.description') }}
            </p>
          </div>

          <div class="overview-card">
            <i class="fas fa-users"></i>
            <h4>{{ t('help.account.subscription.overview.educational.title') }}</h4>
            <p>
              {{ t('help.account.subscription.overview.educational.description') }}
            </p>
          </div>

          <div class="overview-card">
            <i class="fas fa-building"></i>
            <h4>{{ t('help.account.subscription.overview.enterprise.title') }}</h4>
            <p>
              {{ t('help.account.subscription.overview.enterprise.description') }}
            </p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-tachometer-alt"></i> {{ t('help.account.subscription.dashboard.title') }}</h2>
        <p>
          {{ t('help.account.subscription.dashboard.description') }}
        </p>

        <div class="dashboard-guide">
          <div class="guide-step">
            <div class="step-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="step-content">
              <h4>{{ t('help.account.subscription.dashboard.usage.title') }}</h4>
              <p>
                {{ t('help.account.subscription.dashboard.usage.description') }}
              </p>
              <router-link to="/subscription-dashboard" class="btn btn-primary">
                <i class="fas fa-tachometer-alt"></i>
                {{ t('help.account.subscription.dashboard.usage.button') }}
              </router-link>
            </div>
          </div>

          <div class="guide-step">
            <div class="step-icon">
              <i class="fas fa-calendar-alt"></i>
            </div>
            <div class="step-content">
              <h4>{{ t('help.account.subscription.dashboard.info.title') }}</h4>
              <p>
                {{ t('help.account.subscription.dashboard.info.description') }}
              </p>
            </div>
          </div>

          <div class="guide-step">
            <div class="step-icon">
              <i class="fas fa-bell"></i>
            </div>
            <div class="step-content">
              <h4>{{ t('help.account.subscription.dashboard.alerts.title') }}</h4>
              <p>
                {{ t('help.account.subscription.dashboard.alerts.description') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-exchange-alt"></i> {{ t('help.account.subscription.planChange.title') }}</h2>
        <p>
          {{ t('help.account.subscription.planChange.description') }}
        </p>

        <div class="plan-change-workflow">
          <div class="workflow-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>{{ t('help.account.subscription.planChange.step1.title') }}</h4>
              <p>
                {{ t('help.account.subscription.planChange.step1.description') }}
              </p>
            </div>
          </div>

          <div class="workflow-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>{{ t('help.account.subscription.planChange.step2.title') }}</h4>
              <p>
                {{ t('help.account.subscription.planChange.step2.description') }}
              </p>
              <router-link to="/subscription-plans" class="btn btn-outline">
                <i class="fas fa-search"></i>
                {{ t('help.account.subscription.planChange.step2.button') }}
              </router-link>
            </div>
          </div>

          <div class="workflow-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>{{ t('help.account.subscription.planChange.step3.title') }}</h4>
              <p>
                {{ t('help.account.subscription.planChange.step3.description') }}
              </p>
            </div>
          </div>
        </div>

        <div class="change-tips">
          <h3>{{ t('help.account.subscription.planChange.tips.title') }}</h3>
          <div class="tip-list">
            <div class="tip-item">
              <i class="fas fa-arrow-up"></i>
              <div>
                <h4>{{ t('help.account.subscription.planChange.tips.upgrade.title') }}</h4>
                <p>
                  {{ t('help.account.subscription.planChange.tips.upgrade.description') }}
                </p>
              </div>
            </div>

            <div class="tip-item">
              <i class="fas fa-arrow-down"></i>
              <div>
                <h4>{{ t('help.account.subscription.planChange.tips.downgrade.title') }}</h4>
                <p>
                  {{ t('help.account.subscription.planChange.tips.downgrade.description') }}
                </p>
              </div>
            </div>

            <div class="tip-item">
              <i class="fas fa-shield-alt"></i>
              <div>
                <h4>{{ t('help.account.subscription.planChange.tips.dataProtection.title') }}</h4>
                <p>
                  {{ t('help.account.subscription.planChange.tips.dataProtection.description') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-chart-bar"></i> {{ t('help.account.subscription.optimization.title') }}</h2>
        <p>
          {{ t('help.account.subscription.optimization.description') }}
        </p>

        <div class="optimization-grid">
          <div class="optimization-card">
            <i class="fas fa-stopwatch"></i>
            <h4>{{ t('help.account.subscription.optimization.sessions.title') }}</h4>
            <p>
              {{ t('help.account.subscription.optimization.sessions.description') }}
            </p>
          </div>

          <div class="optimization-card">
            <i class="fas fa-database"></i>
            <h4>{{ t('help.account.subscription.optimization.storage.title') }}</h4>
            <p>
              {{ t('help.account.subscription.optimization.storage.description') }}
            </p>
          </div>

          <div class="optimization-card">
            <i class="fas fa-share-alt"></i>
            <h4>{{ t('help.account.subscription.optimization.sharing.title') }}</h4>
            <p>
              {{ t('help.account.subscription.optimization.sharing.description') }}
            </p>
          </div>

          <div class="optimization-card">
            <i class="fas fa-clock"></i>
            <h4>{{ t('help.account.subscription.optimization.planning.title') }}</h4>
            <p>
              {{ t('help.account.subscription.optimization.planning.description') }}
            </p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-pause-circle"></i> {{ t('help.account.subscription.suspension.title') }}</h2>
        <p>
          {{ t('help.account.subscription.suspension.description') }}
        </p>

        <div class="cancellation-options">
          <div class="option-card pause">
            <div class="option-header">
              <i class="fas fa-pause"></i>
              <h4>{{ t('help.account.subscription.suspension.pause.title') }}</h4>
            </div>
            <div class="option-content">
              <p>
                {{ t('help.account.subscription.suspension.pause.description') }}
              </p>
              <ul>
                <li>{{ t('help.account.subscription.suspension.pause.feature1') }}</li>
                <li>{{ t('help.account.subscription.suspension.pause.feature2') }}</li>
                <li>{{ t('help.account.subscription.suspension.pause.feature3') }}</li>
                <li>{{ t('help.account.subscription.suspension.pause.feature4') }}</li>
              </ul>
            </div>
          </div>

          <div class="option-card cancel">
            <div class="option-header">
              <i class="fas fa-times-circle"></i>
              <h4>{{ t('help.account.subscription.suspension.cancel.title') }}</h4>
            </div>
            <div class="option-content">
              <p>
                {{ t('help.account.subscription.suspension.cancel.description') }}
              </p>
              <ul>
                <li>{{ t('help.account.subscription.suspension.cancel.feature1') }}</li>
                <li>{{ t('help.account.subscription.suspension.cancel.feature2') }}</li>
                <li>{{ t('help.account.subscription.suspension.cancel.feature3') }}</li>
                <li>{{ t('help.account.subscription.suspension.cancel.feature4') }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="warning-box">
          <h4><i class="fas fa-exclamation-triangle"></i> {{ t('help.account.subscription.suspension.warning.title') }}</h4>
          <p v-html="t('help.account.subscription.suspension.warning.description')"></p>
        </div>
      </section>

      <section class="help-section info">
        <h2><i class="fas fa-rocket"></i> {{ t('help.account.subscription.evolution.title') }}</h2>
        <div class="evolution-notice">
          <p v-html="t('help.account.subscription.evolution.notice')"></p>

          <div class="upcoming-features">
            <h4>{{ t('help.account.subscription.evolution.upcoming.title') }}</h4>
            <ul>
              <li>{{ t('help.account.subscription.evolution.upcoming.feature1') }}</li>
              <li>{{ t('help.account.subscription.evolution.upcoming.feature2') }}</li>
              <li>{{ t('help.account.subscription.evolution.upcoming.feature3') }}</li>
              <li>{{ t('help.account.subscription.evolution.upcoming.feature4') }}</li>
              <li>{{ t('help.account.subscription.evolution.upcoming.feature5') }}</li>
            </ul>
          </div>

          <p>
            {{ t('help.account.subscription.evolution.documentation') }}
          </p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.account.subscription.support.title') }}</h2>
        <p>
          {{ t('help.account.subscription.support.description') }}
        </p>

        <div class="support-options">
          <div class="support-card">
            <i class="fas fa-envelope"></i>
            <h4>{{ t('help.account.subscription.support.email.title') }}</h4>
            <p>{{ t('help.account.subscription.support.email.description') }}</p>
            <a href="mailto:contact@labinux.com" class="btn btn-outline">
              <i class="fas fa-envelope"></i>
              {{ t('help.account.subscription.support.email.button') }}
            </a>
          </div>

          <div class="support-card">
            <i class="fas fa-credit-card"></i>
            <h4>{{ t('help.account.subscription.support.billing.title') }}</h4>
            <p>{{ t('help.account.subscription.support.billing.description') }}</p>
            <a href="mailto:contact@labinux.com" class="btn btn-outline">
              <i class="fas fa-calculator"></i>
              {{ t('help.account.subscription.support.billing.button') }}
            </a>
          </div>

          <div class="support-card">
            <i class="fas fa-handshake"></i>
            <h4>{{ t('help.account.subscription.support.optimization.title') }}</h4>
            <p>{{ t('help.account.subscription.support.optimization.description') }}</p>
            <a href="mailto:contact@labinux.com" class="btn btn-outline">
              <i class="fas fa-lightbulb"></i>
              {{ t('help.account.subscription.support.optimization.button') }}
            </a>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-arrow-right"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/account/billing`" class="next-step-card">
            <i class="fas fa-credit-card"></i>
            <h4>{{ t('help.account.subscription.nextSteps.billing.title') }}</h4>
            <p>{{ t('help.account.subscription.nextSteps.billing.description') }}</p>
          </router-link>

          <router-link to="/subscription-dashboard" class="next-step-card">
            <i class="fas fa-tachometer-alt"></i>
            <h4>{{ t('help.account.subscription.nextSteps.dashboard.title') }}</h4>
            <p>{{ t('help.account.subscription.nextSteps.dashboard.description') }}</p>
          </router-link>

          <router-link to="/subscription-plans" class="next-step-card">
            <i class="fas fa-list"></i>
            <h4>{{ t('help.account.subscription.nextSteps.plans.title') }}</h4>
            <p>{{ t('help.account.subscription.nextSteps.plans.description') }}</p>
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
.help-article {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.help-nav {
  margin-bottom: 30px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.back-link:hover {
  color: var(--color-primary-hover);
}

.article-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 2px solid var(--color-gray-200);
}

.article-header h1 {
  color: var(--color-text-primary);
  font-size: 2.5rem;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.article-header h1 i {
  color: var(--color-primary);
}

.article-description {
  color: var(--color-gray-600);
  font-size: 1.2rem;
  margin: 0;
}

.article-content {
  line-height: 1.6;
}

.help-section {
  margin-bottom: 40px;
  background: var(--color-bg-primary);
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.help-section.info {
  background: linear-gradient(135deg, var(--color-info-bg) 0%, var(--color-info-border) 100%);
  border-left: 4px solid var(--color-info);
}

.help-section h2 {
  color: var(--color-text-primary);
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.help-section h2 i {
  color: var(--color-primary);
}

.help-section.info h2 i {
  color: var(--color-info);
}

.help-section h3 {
  color: var(--color-text-primary);
  margin: 25px 0 15px 0;
  font-size: 1.2rem;
}

.help-section p {
  color: var(--color-text-secondary);
  margin-bottom: 15px;
}

.subscription-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.overview-card {
  text-align: center;
  padding: 25px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
  transition: all 0.3s ease;
}

.overview-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-5px);
}

.overview-card i {
  font-size: 2.5rem;
  color: var(--color-primary);
  margin-bottom: 15px;
}

.overview-card h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
}

.overview-card p {
  margin: 0;
  color: var(--color-gray-600);
  font-size: 0.9rem;
  line-height: 1.5;
}

.dashboard-guide {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 25px 0;
}

.guide-step {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border-left: 4px solid var(--color-primary);
}

.step-icon {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.step-content {
  flex-grow: 1;
}

.step-content h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.step-content p {
  margin: 0 0 15px 0;
  color: var(--color-text-secondary);
}

.plan-change-workflow {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 25px 0;
}

.workflow-step {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border-left: 4px solid var(--color-success);
}

.step-number {
  background: var(--color-success);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.workflow-step .step-content {
  flex-grow: 1;
}

.workflow-step .step-content h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.workflow-step .step-content p {
  margin: 0 0 15px 0;
  color: var(--color-text-secondary);
}

.change-tips {
  margin-top: 30px;
}

.tip-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: var(--color-warning-bg);
  border-radius: 8px;
  border-left: 4px solid var(--color-warning);
}

.tip-item i {
  font-size: 1.3rem;
  color: var(--color-warning-text);
  margin-top: 5px;
  flex-shrink: 0;
}

.tip-item h4 {
  margin: 0 0 5px 0;
  color: var(--color-warning-text);
  font-size: 1rem;
}

.tip-item p {
  margin: 0;
  color: var(--color-warning-text);
  font-size: 0.9rem;
}

.optimization-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.optimization-card {
  text-align: center;
  padding: 20px;
  background: var(--color-success-bg);
  border: 2px solid var(--color-success);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.optimization-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.15);
}

.optimization-card i {
  font-size: 2rem;
  color: var(--color-success);
  margin-bottom: 15px;
}

.optimization-card h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
}

.optimization-card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.cancellation-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.option-card {
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid;
  transition: all 0.3s ease;
}

.option-card:hover {
  transform: translateY(-2px);
}

.option-card.pause {
  border-color: var(--color-warning);
}

.option-card.cancel {
  border-color: var(--color-danger);
}

.option-header {
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.option-card.pause .option-header {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.option-card.cancel .option-header {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.option-header i {
  font-size: 1.3rem;
}

.option-header h4 {
  margin: 0;
  font-size: 1.1rem;
}

.option-content {
  padding: 20px;
  background: var(--color-bg-primary);
}

.option-content p {
  margin: 0 0 15px 0;
  color: var(--color-text-secondary);
}

.option-content ul {
  margin: 0;
  padding-left: 20px;
  color: var(--color-text-secondary);
}

.option-content li {
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.warning-box {
  background: var(--color-danger-bg);
  border: 2px solid var(--color-danger);
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.warning-box h4 {
  margin: 0 0 10px 0;
  color: var(--color-danger-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.warning-box p {
  margin: 0;
  color: var(--color-danger-text);
}

.evolution-notice {
  background: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.evolution-notice p {
  margin: 0 0 15px 0;
}

.evolution-notice p:last-child {
  margin: 0;
}

.upcoming-features {
  margin: 15px 0;
}

.upcoming-features h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
}

.upcoming-features ul {
  margin: 0;
  padding-left: 20px;
  color: var(--color-text-secondary);
}

.upcoming-features li {
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.support-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.support-card {
  text-align: center;
  padding: 25px;
  background: var(--color-gray-50);
  border: 2px solid var(--color-gray-200);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.support-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-5px);
}

.support-card i {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 15px;
}

.support-card h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
}

.support-card p {
  margin: 0 0 15px 0;
  color: var(--color-gray-600);
  font-size: 0.9rem;
}

.next-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.next-step-card {
  display: block;
  padding: 20px;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-gray-200);
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  text-align: center;
}

.next-step-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.next-step-card i {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 15px;
}

.next-step-card h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.next-step-card p {
  margin: 0;
  color: var(--color-gray-600);
  font-size: 0.9rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-1px);
}

.btn-outline {
  background-color: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.btn-outline:hover {
  background-color: var(--color-primary);
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .help-article {
    padding: 10px;
  }

  .article-header h1 {
    font-size: 2rem;
    flex-direction: column;
    gap: 10px;
  }

  .help-section {
    padding: 20px;
  }

  .subscription-overview,
  .optimization-grid,
  .support-options {
    grid-template-columns: 1fr;
  }

  .dashboard-guide .guide-step {
    flex-direction: column;
    text-align: center;
  }

  .plan-change-workflow .workflow-step {
    flex-direction: column;
    text-align: center;
  }

  .cancellation-options {
    grid-template-columns: 1fr;
  }

  .next-steps {
    grid-template-columns: 1fr;
  }
}
</style>
