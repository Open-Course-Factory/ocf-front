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
      <h1><i class="fas fa-credit-card"></i> {{ t('help.account.billing.title') }}</h1>
      <p class="article-description">
        {{ t('help.account.billing.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> {{ t('help.account.billing.system.title') }}</h2>
        <p>
          {{ t('help.account.billing.system.description') }}
        </p>

        <div class="billing-overview">
          <div class="overview-item">
            <i class="fas fa-calendar-alt"></i>
            <div>
              <h4>{{ t('help.account.billing.system.recurring.title') }}</h4>
              <p>
                {{ t('help.account.billing.system.recurring.description') }}
              </p>
            </div>
          </div>

          <div class="overview-item">
            <i class="fas fa-shield-alt"></i>
            <div>
              <h4>{{ t('help.account.billing.system.secure.title') }}</h4>
              <p>
                {{ t('help.account.billing.system.secure.description') }}
              </p>
            </div>
          </div>

          <div class="overview-item">
            <i class="fas fa-calculator"></i>
            <div>
              <h4>{{ t('help.account.billing.system.transparent.title') }}</h4>
              <p>
                {{ t('help.account.billing.system.transparent.description') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-credit-card"></i> {{ t('help.account.billing.paymentMethods.title') }}</h2>
        <p>
          {{ t('help.account.billing.paymentMethods.description') }}
        </p>

        <div class="payment-methods-guide">
          <div class="method-section">
            <h3>{{ t('help.account.billing.paymentMethods.types.title') }}</h3>
            <div class="payment-types">
              <div class="payment-type">
                <i class="fab fa-cc-visa"></i>
                <span>{{ t('help.account.billing.paymentMethods.types.visa') }}</span>
              </div>
              <div class="payment-type">
                <i class="fab fa-cc-mastercard"></i>
                <span>{{ t('help.account.billing.paymentMethods.types.mastercard') }}</span>
              </div>
              <div class="payment-type">
                <i class="fab fa-cc-amex"></i>
                <span>{{ t('help.account.billing.paymentMethods.types.amex') }}</span>
              </div>
              <div class="payment-type">
                <i class="fas fa-university"></i>
                <span>{{ t('help.account.billing.paymentMethods.types.sepa') }}</span>
              </div>
            </div>
          </div>

          <div class="method-section">
            <h3>{{ t('help.account.billing.paymentMethods.management.title') }}</h3>
            <div class="management-actions">
              <div class="action-card">
                <i class="fas fa-plus-circle"></i>
                <h4>{{ t('help.account.billing.paymentMethods.management.add.title') }}</h4>
                <p>{{ t('help.account.billing.paymentMethods.management.add.description') }}</p>
                <router-link to="/payment-methods" class="btn btn-primary">
                  <i class="fas fa-credit-card"></i>
                  {{ t('help.account.billing.paymentMethods.management.add.button') }}
                </router-link>
              </div>

              <div class="action-card">
                <i class="fas fa-star"></i>
                <h4>{{ t('help.account.billing.paymentMethods.management.default.title') }}</h4>
                <p>{{ t('help.account.billing.paymentMethods.management.default.description') }}</p>
              </div>

              <div class="action-card">
                <i class="fas fa-sync-alt"></i>
                <h4>{{ t('help.account.billing.paymentMethods.management.update.title') }}</h4>
                <p>{{ t('help.account.billing.paymentMethods.management.update.description') }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="security-tips">
          <h3>{{ t('help.account.billing.paymentMethods.security.title') }}</h3>
          <div class="security-list">
            <div class="security-item">
              <i class="fas fa-lock"></i>
              <span>{{ t('help.account.billing.paymentMethods.security.tip1') }}</span>
            </div>
            <div class="security-item">
              <i class="fas fa-eye"></i>
              <span>{{ t('help.account.billing.paymentMethods.security.tip2') }}</span>
            </div>
            <div class="security-item">
              <i class="fas fa-bell"></i>
              <span>{{ t('help.account.billing.paymentMethods.security.tip3') }}</span>
            </div>
            <div class="security-item">
              <i class="fas fa-trash-alt"></i>
              <span>{{ t('help.account.billing.paymentMethods.security.tip4') }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-map-marker-alt"></i> {{ t('help.account.billing.billingAddress.title') }}</h2>
        <p>
          {{ t('help.account.billing.billingAddress.description') }}
        </p>

        <div class="billing-address-guide">
          <div class="address-importance">
            <h3>{{ t('help.account.billing.billingAddress.importance.title') }}</h3>
            <ul>
              <li>{{ t('help.account.billing.billingAddress.importance.fiscal') }}</li>
              <li>{{ t('help.account.billing.billingAddress.importance.vat') }}</li>
              <li>{{ t('help.account.billing.billingAddress.importance.accounting') }}</li>
              <li>{{ t('help.account.billing.billingAddress.importance.regulations') }}</li>
            </ul>
          </div>

          <div class="address-management">
            <h3>{{ t('help.account.billing.billingAddress.management.title') }}</h3>
            <div class="address-actions">
              <div class="address-action">
                <i class="fas fa-home"></i>
                <div>
                  <h4>{{ t('help.account.billing.billingAddress.management.primary.title') }}</h4>
                  <p>{{ t('help.account.billing.billingAddress.management.primary.description') }}</p>
                </div>
              </div>

              <div class="address-action">
                <i class="fas fa-building"></i>
                <div>
                  <h4>{{ t('help.account.billing.billingAddress.management.business.title') }}</h4>
                  <p>{{ t('help.account.billing.billingAddress.management.business.description') }}</p>
                </div>
              </div>

              <div class="address-action">
                <i class="fas fa-edit"></i>
                <div>
                  <h4>{{ t('help.account.billing.billingAddress.management.edit.title') }}</h4>
                  <p>{{ t('help.account.billing.billingAddress.management.edit.description') }}</p>
                </div>
              </div>
            </div>

            <router-link to="/billing-addresses" class="btn btn-outline">
              <i class="fas fa-map-marker-alt"></i>
              {{ t('help.account.billing.billingAddress.management.button') }}
            </router-link>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-file-invoice"></i> {{ t('help.account.billing.invoices.title') }}</h2>
        <p>
          {{ t('help.account.billing.invoices.description') }}
        </p>

        <div class="invoice-management">
          <div class="invoice-features">
            <div class="feature-card">
              <i class="fas fa-list"></i>
              <h4>{{ t('help.account.billing.invoices.features.history.title') }}</h4>
              <p>
                {{ t('help.account.billing.invoices.features.history.description') }}
              </p>
            </div>

            <div class="feature-card">
              <i class="fas fa-download"></i>
              <h4>{{ t('help.account.billing.invoices.features.download.title') }}</h4>
              <p>
                {{ t('help.account.billing.invoices.features.download.description') }}
              </p>
            </div>

            <div class="feature-card">
              <i class="fas fa-info-circle"></i>
              <h4>{{ t('help.account.billing.invoices.features.details.title') }}</h4>
              <p>
                {{ t('help.account.billing.invoices.features.details.description') }}
              </p>
            </div>
          </div>

          <div class="invoice-access">
            <h3>{{ t('help.account.billing.invoices.features.button') }}</h3>
            <router-link to="/invoices" class="btn btn-primary">
              <i class="fas fa-file-invoice"></i>
              {{ t('help.account.billing.invoices.features.button') }}
            </router-link>
          </div>
        </div>

        <div class="invoice-structure">
          <h3>{{ t('help.account.billing.invoices.structure.title') }}</h3>
          <div class="structure-items">
            <div class="structure-item">
              <span class="structure-label">En-tête :</span>
              <span>{{ t('help.account.billing.invoices.structure.header') }}</span>
            </div>
            <div class="structure-item">
              <span class="structure-label">Période :</span>
              <span>{{ t('help.account.billing.invoices.structure.period') }}</span>
            </div>
            <div class="structure-item">
              <span class="structure-label">Détail :</span>
              <span>{{ t('help.account.billing.invoices.structure.detail') }}</span>
            </div>
            <div class="structure-item">
              <span class="structure-label">Taxes :</span>
              <span>{{ t('help.account.billing.invoices.structure.taxes') }}</span>
            </div>
            <div class="structure-item">
              <span class="structure-label">Total :</span>
              <span>{{ t('help.account.billing.invoices.structure.total') }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-exclamation-triangle"></i> {{ t('help.account.billing.paymentIssues.title') }}</h2>
        <p>
          {{ t('help.account.billing.paymentIssues.description') }}
        </p>

        <div class="payment-issues">
          <div class="issue-card declined">
            <div class="issue-header">
              <i class="fas fa-times-circle"></i>
              <h4>{{ t('help.account.billing.paymentIssues.declined.title') }}</h4>
            </div>
            <div class="issue-content">
              <h5>{{ t('help.account.billing.paymentIssues.declined.causes.title') }}</h5>
              <ul>
                <li>{{ t('help.account.billing.paymentIssues.declined.causes.insufficient') }}</li>
                <li>{{ t('help.account.billing.paymentIssues.declined.causes.expired') }}</li>
                <li>{{ t('help.account.billing.paymentIssues.declined.causes.limit') }}</li>
                <li>{{ t('help.account.billing.paymentIssues.declined.causes.incorrect') }}</li>
              </ul>
              <h5>{{ t('help.account.billing.paymentIssues.declined.solutions.title') }}</h5>
              <ul>
                <li>{{ t('help.account.billing.paymentIssues.declined.solutions.balance') }}</li>
                <li>{{ t('help.account.billing.paymentIssues.declined.solutions.update') }}</li>
                <li>{{ t('help.account.billing.paymentIssues.declined.solutions.bank') }}</li>
                <li>{{ t('help.account.billing.paymentIssues.declined.solutions.alternative') }}</li>
              </ul>
            </div>
          </div>

          <div class="issue-card retry">
            <div class="issue-header">
              <i class="fas fa-redo"></i>
              <h4>{{ t('help.account.billing.paymentIssues.retry.title') }}</h4>
            </div>
            <div class="issue-content">
              <p>
                {{ t('help.account.billing.paymentIssues.retry.description1') }}
              </p>
              <p>
                {{ t('help.account.billing.paymentIssues.retry.description2') }}
              </p>
            </div>
          </div>

          <div class="issue-card suspension">
            <div class="issue-header">
              <i class="fas fa-pause-circle"></i>
              <h4>{{ t('help.account.billing.paymentIssues.suspension.title') }}</h4>
            </div>
            <div class="issue-content">
              <p>
                {{ t('help.account.billing.paymentIssues.suspension.description1') }}
              </p>
              <p>
                {{ t('help.account.billing.paymentIssues.suspension.description2') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-calculator"></i> {{ t('help.account.billing.refunds.title') }}</h2>
        <p>
          {{ t('help.account.billing.refunds.description') }}
        </p>

        <div class="refund-policy">
          <div class="policy-section">
            <h3>{{ t('help.account.billing.refunds.policy.title') }}</h3>
            <div class="policy-items">
              <div class="policy-item">
                <i class="fas fa-calendar-week"></i>
                <div>
                  <h4>{{ t('help.account.billing.refunds.policy.trial.title') }}</h4>
                  <p>
                    {{ t('help.account.billing.refunds.policy.trial.description') }}
                  </p>
                </div>
              </div>

              <div class="policy-item">
                <i class="fas fa-balance-scale"></i>
                <div>
                  <h4>{{ t('help.account.billing.refunds.policy.proration.title') }}</h4>
                  <p>
                    {{ t('help.account.billing.refunds.policy.proration.description') }}
                  </p>
                </div>
              </div>

              <div class="policy-item">
                <i class="fas fa-bug"></i>
                <div>
                  <h4>{{ t('help.account.billing.refunds.policy.technical.title') }}</h4>
                  <p>
                    {{ t('help.account.billing.refunds.policy.technical.description') }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="credit-system">
            <h3>{{ t('help.account.billing.refunds.credits.title') }}</h3>
            <p>
              {{ t('help.account.billing.refunds.credits.description1') }}
            </p>
            <p>
              {{ t('help.account.billing.refunds.credits.description2') }}
            </p>
          </div>
        </div>
      </section>

      <section class="help-section info">
        <h2><i class="fas fa-tools"></i> {{ t('help.account.billing.evolution.title') }}</h2>
        <div class="billing-evolution">
          <p v-html="t('help.account.billing.evolution.notice')"></p>

          <div class="upcoming-billing-features">
            <h4>{{ t('help.account.billing.evolution.upcoming.title') }}</h4>
            <ul>
              <li>{{ t('help.account.billing.evolution.upcoming.usage') }}</li>
              <li>{{ t('help.account.billing.evolution.upcoming.alternatives') }}</li>
              <li>{{ t('help.account.billing.evolution.upcoming.group') }}</li>
              <li>{{ t('help.account.billing.evolution.upcoming.alerts') }}</li>
              <li>{{ t('help.account.billing.evolution.upcoming.integration') }}</li>
              <li>{{ t('help.account.billing.evolution.upcoming.currencies') }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-headset"></i> {{ t('help.account.billing.support.title') }}</h2>
        <p>
          {{ t('help.account.billing.support.description') }}
        </p>

        <div class="billing-support">
          <div class="support-channels">
            <div class="support-channel">
              <i class="fas fa-envelope"></i>
              <div>
                <h4>{{ t('help.account.billing.support.email.title') }}</h4>
                <p>{{ t('help.account.billing.support.email.description') }}</p>
                <a href="mailto:contact@labinux.com?subject=Support Facturation" class="btn btn-outline">
                  <i class="fas fa-envelope"></i>
                  {{ t('help.account.billing.support.email.button') }}
                </a>
              </div>
            </div>

            <div class="support-channel">
              <i class="fas fa-phone"></i>
              <div>
                <h4>{{ t('help.account.billing.support.priority.title') }}</h4>
                <p>{{ t('help.account.billing.support.priority.description') }}</p>
                <div class="contact-note">
                  <small>{{ t('help.account.billing.support.priority.note') }}</small>
                </div>
              </div>
            </div>
          </div>

          <div class="support-tips">
            <h4>{{ t('help.account.billing.support.tips.title') }}</h4>
            <div class="tips-list">
              <div class="tip-point">
                <i class="fas fa-user"></i>
                <span>{{ t('help.account.billing.support.tips.email') }}</span>
              </div>
              <div class="tip-point">
                <i class="fas fa-file-invoice"></i>
                <span>{{ t('help.account.billing.support.tips.invoice') }}</span>
              </div>
              <div class="tip-point">
                <i class="fas fa-calendar"></i>
                <span>{{ t('help.account.billing.support.tips.datetime') }}</span>
              </div>
              <div class="tip-point">
                <i class="fas fa-camera"></i>
                <span>{{ t('help.account.billing.support.tips.screenshot') }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-arrow-right"></i> {{ t('help.account.billing.resources.title') }}</h2>
        <div class="billing-resources">
          <router-link :to="`${helpRoutePrefix}/account/subscription`" class="resource-card">
            <i class="fas fa-calendar-check"></i>
            <h4>{{ t('help.account.billing.resources.subscription.title') }}</h4>
            <p>{{ t('help.account.billing.resources.subscription.description') }}</p>
          </router-link>

          <router-link to="/payment-methods" class="resource-card">
            <i class="fas fa-credit-card"></i>
            <h4>{{ t('help.account.billing.resources.paymentMethods.title') }}</h4>
            <p>{{ t('help.account.billing.resources.paymentMethods.description') }}</p>
          </router-link>

          <router-link to="/invoices" class="resource-card">
            <i class="fas fa-file-invoice"></i>
            <h4>{{ t('help.account.billing.resources.invoices.title') }}</h4>
            <p>{{ t('help.account.billing.resources.invoices.description') }}</p>
          </router-link>

          <router-link to="/billing-addresses" class="resource-card">
            <i class="fas fa-map-marker-alt"></i>
            <h4>{{ t('help.account.billing.resources.addresses.title') }}</h4>
            <p>{{ t('help.account.billing.resources.addresses.description') }}</p>
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

.billing-overview {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 25px 0;
}

.overview-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border-left: 4px solid var(--color-primary);
}

.overview-item i {
  font-size: 1.5rem;
  color: var(--color-primary);
  margin-top: 5px;
  flex-shrink: 0;
}

.overview-item h4 {
  margin: 0 0 8px 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.overview-item p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.payment-methods-guide {
  margin: 25px 0;
}

.method-section {
  margin-bottom: 25px;
}

.payment-types {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin: 15px 0;
}

.payment-type {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: var(--color-gray-50);
  border: 2px solid var(--color-gray-200);
  border-radius: 8px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.payment-type i {
  font-size: 1.2rem;
  color: var(--color-primary);
}

.management-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 15px 0;
}

.action-card {
  text-align: center;
  padding: 20px;
  background: var(--color-gray-50);
  border: 2px solid var(--color-gray-200);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.action-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-5px);
}

.action-card i {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 15px;
}

.action-card h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
}

.action-card p {
  margin: 0 0 15px 0;
  color: var(--color-gray-600);
  font-size: 0.9rem;
}

.security-tips {
  margin-top: 30px;
}

.security-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 15px 0;
}

.security-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--color-success-bg);
  border-radius: 4px;
  border-left: 4px solid var(--color-success);
}

.security-item i {
  color: var(--color-success);
  flex-shrink: 0;
}

.security-item span {
  color: var(--color-success-text);
  font-size: 0.9rem;
}

.billing-address-guide {
  margin: 25px 0;
}

.address-importance {
  margin-bottom: 25px;
}

.address-importance ul {
  margin: 10px 0;
  padding-left: 20px;
  color: var(--color-text-secondary);
}

.address-importance li {
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.address-management {
  background: var(--color-gray-50);
  padding: 20px;
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
}

.address-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 15px 0 20px 0;
}

.address-action {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  background: var(--color-bg-primary);
  border-radius: 4px;
}

.address-action i {
  font-size: 1.3rem;
  color: var(--color-primary);
  flex-shrink: 0;
}

.address-action h4 {
  margin: 0 0 3px 0;
  color: var(--color-text-primary);
  font-size: 1rem;
}

.address-action p {
  margin: 0;
  color: var(--color-gray-600);
  font-size: 0.85rem;
}

.invoice-management {
  margin: 25px 0;
}

.invoice-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.feature-card {
  text-align: center;
  padding: 20px;
  background: var(--color-gray-50);
  border: 2px solid var(--color-gray-200);
  border-radius: 8px;
}

.feature-card i {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 15px;
}

.feature-card h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
}

.feature-card p {
  margin: 0;
  color: var(--color-gray-600);
  font-size: 0.9rem;
  line-height: 1.5;
}

.invoice-access {
  text-align: center;
  margin: 20px 0;
  padding: 20px;
  background: var(--color-info-bg);
  border-radius: 8px;
  border: 2px solid var(--color-info);
}

.invoice-structure {
  margin-top: 25px;
}

.structure-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 15px 0;
}

.structure-item {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-gray-200);
}

.structure-label {
  font-weight: 600;
  color: var(--color-text-primary);
  min-width: 100px;
  margin-right: 15px;
}

.structure-item span:last-child {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.payment-issues {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 25px 0;
}

.issue-card {
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid;
}

.issue-card.declined {
  border-color: var(--color-danger);
}

.issue-card.retry {
  border-color: var(--color-warning);
}

.issue-card.suspension {
  border-color: var(--color-gray-600);
}

.issue-header {
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.issue-card.declined .issue-header {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.issue-card.retry .issue-header {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.issue-card.suspension .issue-header {
  background: var(--color-gray-200);
  color: var(--color-text-primary);
}

.issue-header i {
  font-size: 1.3rem;
}

.issue-header h4 {
  margin: 0;
  font-size: 1.1rem;
}

.issue-content {
  padding: 20px;
  background: var(--color-bg-primary);
}

.issue-content h5 {
  margin: 0 0 8px 0;
  color: var(--color-text-primary);
  font-size: 0.95rem;
}

.issue-content ul {
  margin: 0 0 15px 20px;
  color: var(--color-text-secondary);
}

.issue-content li {
  margin-bottom: 3px;
  font-size: 0.85rem;
}

.issue-content p {
  margin: 0 0 10px 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.refund-policy {
  margin: 25px 0;
}

.policy-section {
  margin-bottom: 25px;
}

.policy-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 15px 0;
}

.policy-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border-left: 4px solid var(--color-success);
}

.policy-item i {
  font-size: 1.3rem;
  color: var(--color-success);
  margin-top: 5px;
  flex-shrink: 0;
}

.policy-item h4 {
  margin: 0 0 5px 0;
  color: var(--color-text-primary);
  font-size: 1rem;
}

.policy-item p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.credit-system {
  padding: 20px;
  background: var(--color-success-bg);
  border-radius: 8px;
  border: 2px solid var(--color-success);
}

.credit-system h3 {
  margin: 0 0 10px 0;
  color: var(--color-success-text);
}

.credit-system p {
  margin: 0 0 10px 0;
  color: var(--color-success-text);
  font-size: 0.9rem;
}

.credit-system p:last-child {
  margin: 0;
}

.billing-evolution {
  background: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.billing-evolution p {
  margin: 0 0 15px 0;
}

.upcoming-billing-features {
  margin: 15px 0;
}

.upcoming-billing-features h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
}

.upcoming-billing-features ul {
  margin: 0;
  padding-left: 20px;
  color: var(--color-text-secondary);
}

.upcoming-billing-features li {
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.billing-support {
  margin: 25px 0;
}

.support-channels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.support-channel {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
}

.support-channel i {
  font-size: 1.5rem;
  color: var(--color-primary);
  margin-top: 5px;
  flex-shrink: 0;
}

.support-channel h4 {
  margin: 0 0 8px 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.support-channel p {
  margin: 0 0 15px 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.contact-note {
  margin-top: 5px;
}

.contact-note small {
  color: var(--color-gray-600);
  font-style: italic;
}

.support-tips {
  margin-top: 25px;
  padding: 15px;
  background: var(--color-warning-bg);
  border-radius: 8px;
  border-left: 4px solid var(--color-warning);
}

.support-tips h4 {
  margin: 0 0 10px 0;
  color: var(--color-warning-text);
}

.tips-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}

.tip-point {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-warning-text);
  font-size: 0.85rem;
}

.tip-point i {
  color: var(--color-warning);
  font-size: 0.9rem;
  flex-shrink: 0;
}

.billing-resources {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.resource-card {
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

.resource-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.resource-card i {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 15px;
}

.resource-card h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
  font-size: 1rem;
}

.resource-card p {
  margin: 0;
  color: var(--color-gray-600);
  font-size: 0.85rem;
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

  .payment-types {
    justify-content: center;
  }

  .management-actions,
  .invoice-features,
  .support-channels {
    grid-template-columns: 1fr;
  }

  .billing-resources {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .tips-list {
    grid-template-columns: 1fr;
  }
}
</style>