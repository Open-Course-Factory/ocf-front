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
        <h2><i class="fas fa-chart-pie"></i> {{ t('help.account.subscription.usageMetrics.title') }}</h2>
        <p>
          {{ t('help.account.subscription.usageMetrics.description') }}
        </p>

        <div class="metrics-grid">
          <div class="metric-card">
            <i class="fas fa-book-open"></i>
            <h4>{{ t('help.account.subscription.usageMetrics.activeCourses.title') }}</h4>
            <p>
              {{ t('help.account.subscription.usageMetrics.activeCourses.description') }}
            </p>
          </div>

          <div class="metric-card">
            <i class="fas fa-terminal"></i>
            <h4>{{ t('help.account.subscription.usageMetrics.concurrentTerminals.title') }}</h4>
            <p>
              {{ t('help.account.subscription.usageMetrics.concurrentTerminals.description') }}
            </p>
          </div>

          <div class="metric-card">
            <i class="fas fa-users"></i>
            <h4>{{ t('help.account.subscription.usageMetrics.concurrentUsers.title') }}</h4>
            <p>
              {{ t('help.account.subscription.usageMetrics.concurrentUsers.description') }}
            </p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-id-badge"></i> {{ t('help.account.subscription.subscriptionSource.title') }}</h2>
        <p>
          {{ t('help.account.subscription.subscriptionSource.description') }}
        </p>

        <div class="source-options">
          <div class="source-card personal">
            <div class="source-header">
              <i class="fas fa-user"></i>
              <h4>{{ t('help.account.subscription.subscriptionSource.personal.title') }}</h4>
            </div>
            <div class="source-content">
              <p>
                {{ t('help.account.subscription.subscriptionSource.personal.description') }}
              </p>
            </div>
          </div>

          <div class="source-card organization">
            <div class="source-header">
              <i class="fas fa-building"></i>
              <h4>{{ t('help.account.subscription.subscriptionSource.organization.title') }}</h4>
            </div>
            <div class="source-content">
              <p>
                {{ t('help.account.subscription.subscriptionSource.organization.description') }}
              </p>
            </div>
          </div>
        </div>

        <div class="info-box">
          <h4><i class="fas fa-eye"></i> {{ t('help.account.subscription.subscriptionSource.indicator.title') }}</h4>
          <p>{{ t('help.account.subscription.subscriptionSource.indicator.description') }}</p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-layer-group"></i> {{ t('help.account.subscription.multipleSubscriptions.title') }}</h2>
        <p>
          {{ t('help.account.subscription.multipleSubscriptions.description') }}
        </p>

        <div class="info-box">
          <h4><i class="fas fa-info-circle"></i> {{ t('help.account.subscription.multipleSubscriptions.stacked.title') }}</h4>
          <p>{{ t('help.account.subscription.multipleSubscriptions.stacked.description') }}</p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-user-shield"></i> {{ t('help.account.subscription.assignedSubscriptions.title') }}</h2>
        <p>
          {{ t('help.account.subscription.assignedSubscriptions.description') }}
        </p>

        <div class="assigned-features">
          <div class="feature-item">
            <i class="fas fa-cog"></i>
            <span>{{ t('help.account.subscription.assignedSubscriptions.managedByAdmin') }}</span>
          </div>
          <div class="feature-item">
            <i class="fas fa-eye-slash"></i>
            <span>{{ t('help.account.subscription.assignedSubscriptions.noBilling') }}</span>
          </div>
          <div class="feature-item">
            <i class="fas fa-check-circle"></i>
            <span>{{ t('help.account.subscription.assignedSubscriptions.sameFeatures') }}</span>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-gift"></i> {{ t('help.account.subscription.freePlan.title') }}</h2>
        <p>
          {{ t('help.account.subscription.freePlan.description') }}
        </p>

        <div class="info-box success">
          <h4><i class="fas fa-check"></i> {{ t('help.account.subscription.freePlan.noCreditCard.title') }}</h4>
          <p>{{ t('help.account.subscription.freePlan.noCreditCard.description') }}</p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-hourglass-half"></i> {{ t('help.account.subscription.trialPeriod.title') }}</h2>
        <p>
          {{ t('help.account.subscription.trialPeriod.description') }}
        </p>

        <div class="trial-features">
          <div class="feature-item">
            <i class="fas fa-clock"></i>
            <span>{{ t('help.account.subscription.trialPeriod.countdown') }}</span>
          </div>
          <div class="feature-item">
            <i class="fas fa-calendar-day"></i>
            <span>{{ t('help.account.subscription.trialPeriod.daysRemaining') }}</span>
          </div>
          <div class="feature-item">
            <i class="fas fa-arrow-circle-up"></i>
            <span>{{ t('help.account.subscription.trialPeriod.upgradeAnytime') }}</span>
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

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.metric-card {
  text-align: center;
  padding: 25px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
  transition: all 0.3s ease;
}

.metric-card:hover {
  border-color: var(--color-info);
  transform: translateY(-5px);
}

.metric-card i {
  font-size: 2rem;
  color: var(--color-info);
  margin-bottom: 15px;
}

.metric-card h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
}

.metric-card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.source-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.source-card {
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid;
  transition: all 0.3s ease;
}

.source-card:hover {
  transform: translateY(-2px);
}

.source-card.personal {
  border-color: var(--color-primary);
}

.source-card.organization {
  border-color: var(--color-info);
}

.source-header {
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.source-card.personal .source-header {
  background: var(--color-gray-50);
  color: var(--color-primary);
}

.source-card.organization .source-header {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.source-header i {
  font-size: 1.3rem;
}

.source-header h4 {
  margin: 0;
  font-size: 1.1rem;
}

.source-content {
  padding: 20px;
  background: var(--color-bg-primary);
}

.source-content p {
  margin: 0;
  color: var(--color-text-secondary);
}

.info-box {
  background: var(--color-info-bg);
  border: 2px solid var(--color-info);
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.info-box h4 {
  margin: 0 0 10px 0;
  color: var(--color-info);
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-box p {
  margin: 0;
  color: var(--color-text-secondary);
}

.info-box.success {
  background: var(--color-success-bg);
  border-color: var(--color-success);
}

.info-box.success h4 {
  color: var(--color-success);
}

.assigned-features,
.trial-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
}

.assigned-features .feature-item,
.trial-features .feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border-left: 4px solid var(--color-primary);
}

.assigned-features .feature-item i,
.trial-features .feature-item i {
  color: var(--color-primary);
  font-size: 1.2rem;
  flex-shrink: 0;
}

.assigned-features .feature-item span,
.trial-features .feature-item span {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

/* Responsive */
@media (max-width: 768px) {
  .subscription-overview,
  .optimization-grid,
  .support-options,
  .metrics-grid {
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

  .cancellation-options,
  .source-options {
    grid-template-columns: 1fr;
  }

  .next-steps {
    grid-template-columns: 1fr;
  }
}
</style>
