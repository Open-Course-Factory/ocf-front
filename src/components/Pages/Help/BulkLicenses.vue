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
      <h1><i class="fas fa-id-badge"></i> {{ t('help.bulkLicenses.overview.title') }}</h1>
      <p class="article-description">
        {{ t('help.bulkLicenses.overview.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> {{ t('help.bulkLicenses.overview.whatIs.title') }}</h2>
        <p>{{ t('help.bulkLicenses.overview.whatIs.description') }}</p>

        <div class="benefits-grid">
          <div class="benefit-card">
            <i class="fas fa-percent"></i>
            <p>{{ t('help.bulkLicenses.overview.whatIs.benefit1') }}</p>
          </div>
          <div class="benefit-card">
            <i class="fas fa-tachometer-alt"></i>
            <p>{{ t('help.bulkLicenses.overview.whatIs.benefit2') }}</p>
          </div>
          <div class="benefit-card">
            <i class="fas fa-exchange-alt"></i>
            <p>{{ t('help.bulkLicenses.overview.whatIs.benefit3') }}</p>
          </div>
          <div class="benefit-card">
            <i class="fas fa-chart-bar"></i>
            <p>{{ t('help.bulkLicenses.overview.whatIs.benefit4') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-shopping-cart"></i> {{ t('help.bulkLicenses.overview.purchasing.title') }}</h2>
        <p>{{ t('help.bulkLicenses.overview.purchasing.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.bulkLicenses.overview.purchasing.step1.title') }}</h4>
            <p>{{ t('help.bulkLicenses.overview.purchasing.step1.description') }}</p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.bulkLicenses.overview.purchasing.step2.title') }}</h4>
            <p>{{ t('help.bulkLicenses.overview.purchasing.step2.description') }}</p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('help.bulkLicenses.overview.purchasing.step3.title') }}</h4>
            <p>{{ t('help.bulkLicenses.overview.purchasing.step3.description') }}</p>
            <router-link to="/bulk-license-purchase" class="btn btn-primary">
              <i class="fas fa-shopping-cart"></i>
              {{ t('help.bulkLicenses.overview.purchasing.step3.title') }}
            </router-link>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-boxes"></i> {{ t('help.bulkLicenses.overview.batchManagement.title') }}</h2>
        <p>{{ t('help.bulkLicenses.overview.batchManagement.description') }}</p>

        <div class="batch-features">
          <div class="batch-item">
            <i class="fas fa-list"></i>
            <span>{{ t('help.bulkLicenses.overview.batchManagement.viewBatches') }}</span>
          </div>
          <div class="batch-item">
            <i class="fas fa-chart-pie"></i>
            <span>{{ t('help.bulkLicenses.overview.batchManagement.trackUsage') }}</span>
          </div>
          <div class="batch-item">
            <i class="fas fa-sync-alt"></i>
            <span>{{ t('help.bulkLicenses.overview.batchManagement.renewBatches') }}</span>
          </div>
          <div class="batch-item">
            <i class="fas fa-download"></i>
            <span>{{ t('help.bulkLicenses.overview.batchManagement.exportReports') }}</span>
          </div>
        </div>

        <router-link to="/license-management" class="btn btn-outline">
          <i class="fas fa-tachometer-alt"></i>
          {{ t('help.bulkLicenses.overview.batchManagement.title') }}
        </router-link>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-user-plus"></i> {{ t('help.bulkLicenses.overview.assignment.title') }}</h2>
        <p>{{ t('help.bulkLicenses.overview.assignment.description') }}</p>

        <div class="assignment-methods">
          <div class="method-card">
            <i class="fas fa-user"></i>
            <div>
              <h4>{{ t('help.bulkLicenses.overview.assignment.individual') }}</h4>
            </div>
          </div>
          <div class="method-card">
            <i class="fas fa-users"></i>
            <div>
              <h4>{{ t('help.bulkLicenses.overview.assignment.group') }}</h4>
            </div>
          </div>
          <div class="method-card">
            <i class="fas fa-magic"></i>
            <div>
              <h4>{{ t('help.bulkLicenses.overview.assignment.automatic') }}</h4>
            </div>
          </div>
          <div class="method-card">
            <i class="fas fa-undo"></i>
            <div>
              <h4>{{ t('help.bulkLicenses.overview.assignment.revoke') }}</h4>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section info">
        <h2><i class="fas fa-tags"></i> {{ t('help.bulkLicenses.overview.pricing.title') }}</h2>
        <p>{{ t('help.bulkLicenses.overview.pricing.description') }}</p>

        <div class="pricing-tiers">
          <div class="tier-card">
            <div class="tier-label">1-10</div>
            <p>{{ t('help.bulkLicenses.overview.pricing.tier1') }}</p>
          </div>
          <div class="tier-card highlighted">
            <div class="tier-label">11-50</div>
            <p>{{ t('help.bulkLicenses.overview.pricing.tier2') }}</p>
          </div>
          <div class="tier-card highlighted">
            <div class="tier-label">51-100</div>
            <p>{{ t('help.bulkLicenses.overview.pricing.tier3') }}</p>
          </div>
          <div class="tier-card enterprise">
            <div class="tier-label">100+</div>
            <p>{{ t('help.bulkLicenses.overview.pricing.tier4') }}</p>
          </div>
        </div>

        <p><em>{{ t('help.bulkLicenses.overview.pricing.note') }}</em></p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/organizations/overview`" class="next-step-card">
            <i class="fas fa-building"></i>
            <h4>{{ t('help.bulkLicenses.overview.nextSteps.organizations.title') }}</h4>
            <p>{{ t('help.bulkLicenses.overview.nextSteps.organizations.description') }}</p>
          </router-link>

          <router-link :to="`${helpRoutePrefix}/account/billing`" class="next-step-card">
            <i class="fas fa-credit-card"></i>
            <h4>{{ t('help.bulkLicenses.overview.nextSteps.billing.title') }}</h4>
            <p>{{ t('help.bulkLicenses.overview.nextSteps.billing.description') }}</p>
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

const isPublicHelp = computed(() => route.path.startsWith('/help-public'))
const helpMainRoute = computed(() => isPublicHelp.value ? '/help-public' : '/help')
const helpRoutePrefix = computed(() => isPublicHelp.value ? '/help-public' : '/help')

onMounted(async () => {
  await loadHelpTranslations()
})
</script>

<style scoped>
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.benefit-card {
  text-align: center;
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
}

.benefit-card i {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 10px;
}

.benefit-card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.batch-features {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 20px 0;
}

.batch-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 15px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border-left: 4px solid var(--color-primary);
}

.batch-item i {
  color: var(--color-primary);
  flex-shrink: 0;
}

.batch-item span {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.assignment-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.assignment-methods .method-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
}

.assignment-methods .method-card i {
  font-size: 1.3rem;
  color: var(--color-primary);
  margin-top: 2px;
  flex-shrink: 0;
}

.assignment-methods .method-card h4 {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.pricing-tiers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.tier-card {
  text-align: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.tier-card.highlighted {
  border-color: var(--color-success);
  background: var(--color-success-bg);
}

.tier-card.enterprise {
  border-color: var(--color-primary);
  background: var(--color-info-bg);
}

.tier-label {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.tier-card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
}

/* Responsive */
@media (max-width: 768px) {
  .benefits-grid,
  .assignment-methods,
  .pricing-tiers {
    grid-template-columns: 1fr;
  }
}
</style>
