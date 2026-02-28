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
      <h1><i class="fas fa-building"></i> {{ t('help.organizations.overview.title') }}</h1>
      <p class="article-description">
        {{ t('help.organizations.overview.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> {{ t('help.organizations.overview.whatAre.title') }}</h2>
        <p>{{ t('help.organizations.overview.whatAre.description') }}</p>

        <div class="benefits-grid">
          <div class="benefit-card">
            <i class="fas fa-users-cog"></i>
            <p>{{ t('help.organizations.overview.whatAre.benefit1') }}</p>
          </div>
          <div class="benefit-card">
            <i class="fas fa-receipt"></i>
            <p>{{ t('help.organizations.overview.whatAre.benefit2') }}</p>
          </div>
          <div class="benefit-card">
            <i class="fas fa-object-group"></i>
            <p>{{ t('help.organizations.overview.whatAre.benefit3') }}</p>
          </div>
          <div class="benefit-card">
            <i class="fas fa-user-shield"></i>
            <p>{{ t('help.organizations.overview.whatAre.benefit4') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-plus-circle"></i> {{ t('help.organizations.overview.creating.title') }}</h2>
        <p>{{ t('help.organizations.overview.creating.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.organizations.overview.creating.step1.title') }}</h4>
            <p>{{ t('help.organizations.overview.creating.step1.description') }}</p>
            <router-link v-if="!isPublicHelp" to="/organizations" class="btn btn-primary">
              <i class="fas fa-building"></i>
              {{ t('help.organizations.overview.creating.step1.title') }}
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
        <h2><i class="fas fa-users"></i> {{ t('help.organizations.overview.members.title') }}</h2>
        <p>{{ t('help.organizations.overview.members.description') }}</p>

        <div class="feature-list">
          <div class="feature-item">
            <i class="fas fa-envelope"></i>
            <span>{{ t('help.organizations.overview.members.addMembers') }}</span>
          </div>
          <div class="feature-item">
            <i class="fas fa-user-tag"></i>
            <span>{{ t('help.organizations.overview.members.assignRoles') }}</span>
          </div>
          <div class="feature-item">
            <i class="fas fa-id-card"></i>
            <span>{{ t('help.organizations.overview.members.manageLicenses') }}</span>
          </div>
          <div class="feature-item">
            <i class="fas fa-user-minus"></i>
            <span>{{ t('help.organizations.overview.members.removeMembers') }}</span>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-cog"></i> {{ t('help.organizations.overview.settings.title') }}</h2>
        <p>{{ t('help.organizations.overview.settings.description') }}</p>

        <div class="settings-grid">
          <div class="setting-card">
            <i class="fas fa-sliders-h"></i>
            <h4>{{ t('help.organizations.overview.settings.general') }}</h4>
          </div>
          <div class="setting-card">
            <i class="fas fa-bell"></i>
            <h4>{{ t('help.organizations.overview.settings.notifications') }}</h4>
          </div>
          <div class="setting-card">
            <i class="fas fa-shield-alt"></i>
            <h4>{{ t('help.organizations.overview.settings.security') }}</h4>
          </div>
          <div class="setting-card">
            <i class="fas fa-credit-card"></i>
            <h4>{{ t('help.organizations.overview.settings.billing') }}</h4>
          </div>
        </div>
      </section>

      <section class="help-section info">
        <h2><i class="fas fa-lightbulb"></i> {{ t('help.organizations.overview.bestPractices.title') }}</h2>
        <p>{{ t('help.organizations.overview.bestPractices.description') }}</p>

        <div class="tips-list">
          <div class="tip-card">
            <h4><i class="fas fa-user-check"></i> {{ t('help.organizations.overview.bestPractices.tip1.title') }}</h4>
            <p>{{ t('help.organizations.overview.bestPractices.tip1.description') }}</p>
          </div>
          <div class="tip-card">
            <h4><i class="fas fa-layer-group"></i> {{ t('help.organizations.overview.bestPractices.tip2.title') }}</h4>
            <p>{{ t('help.organizations.overview.bestPractices.tip2.description') }}</p>
          </div>
          <div class="tip-card">
            <h4><i class="fas fa-clipboard-check"></i> {{ t('help.organizations.overview.bestPractices.tip3.title') }}</h4>
            <p>{{ t('help.organizations.overview.bestPractices.tip3.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-columns"></i> {{ t('help.organizations.overview.detailTabs.title') }}</h2>
        <p>{{ t('help.organizations.overview.detailTabs.description') }}</p>

        <div class="tabs-grid">
          <div class="tab-card">
            <i class="fas fa-home"></i>
            <h4>{{ t('help.organizations.overview.detailTabs.overview.title') }}</h4>
            <p>{{ t('help.organizations.overview.detailTabs.overview.description') }}</p>
          </div>
          <div class="tab-card">
            <i class="fas fa-users"></i>
            <h4>{{ t('help.organizations.overview.detailTabs.members.title') }}</h4>
            <p>{{ t('help.organizations.overview.detailTabs.members.description') }}</p>
          </div>
          <div class="tab-card">
            <i class="fas fa-object-group"></i>
            <h4>{{ t('help.organizations.overview.detailTabs.groups.title') }}</h4>
            <p>{{ t('help.organizations.overview.detailTabs.groups.description') }}</p>
          </div>
          <div class="tab-card">
            <i class="fas fa-calendar-check"></i>
            <h4>{{ t('help.organizations.overview.detailTabs.subscription.title') }}</h4>
            <p>{{ t('help.organizations.overview.detailTabs.subscription.description') }}</p>
          </div>
          <div class="tab-card">
            <i class="fas fa-cog"></i>
            <h4>{{ t('help.organizations.overview.detailTabs.settings.title') }}</h4>
            <p>{{ t('help.organizations.overview.detailTabs.settings.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-calendar-check"></i> {{ t('help.organizations.overview.orgSubscription.title') }}</h2>
        <p>{{ t('help.organizations.overview.orgSubscription.description') }}</p>

        <div class="info-box">
          <h4><i class="fas fa-info-circle"></i> {{ t('help.organizations.overview.orgSubscription.separate.title') }}</h4>
          <p>{{ t('help.organizations.overview.orgSubscription.separate.description') }}</p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-sort-amount-up"></i> {{ t('help.organizations.overview.subscriptionPreference.title') }}</h2>
        <p>{{ t('help.organizations.overview.subscriptionPreference.description') }}</p>

        <div class="info-box">
          <h4><i class="fas fa-arrow-up"></i> {{ t('help.organizations.overview.subscriptionPreference.priority.title') }}</h4>
          <p>{{ t('help.organizations.overview.subscriptionPreference.priority.description') }}</p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-file-import"></i> {{ t('help.organizations.overview.bulkImportIntegration.title') }}</h2>
        <p>{{ t('help.organizations.overview.bulkImportIntegration.description') }}</p>

        <div class="feature-list">
          <div class="feature-item">
            <i class="fas fa-mouse-pointer"></i>
            <span>{{ t('help.organizations.overview.bulkImportIntegration.accessButton') }}</span>
          </div>
          <div class="feature-item">
            <i class="fas fa-users-cog"></i>
            <span>{{ t('help.organizations.overview.bulkImportIntegration.autoAssign') }}</span>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/groups/management`" class="next-step-card">
            <i class="fas fa-users"></i>
            <h4>{{ t('help.organizations.overview.nextSteps.groups.title') }}</h4>
            <p>{{ t('help.organizations.overview.nextSteps.groups.description') }}</p>
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

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border-left: 4px solid var(--color-primary);
}

.feature-item i {
  color: var(--color-primary);
  font-size: 1.2rem;
  flex-shrink: 0;
}

.feature-item span {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.setting-card {
  text-align: center;
  padding: 20px;
  background: var(--color-gray-50);
  border: 2px solid var(--color-gray-200);
  border-radius: 8px;
}

.setting-card i {
  font-size: 1.5rem;
  color: var(--color-primary);
  margin-bottom: 10px;
}

.setting-card h4 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.tip-card {
  padding: 15px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.tip-card h4 {
  margin: 0 0 8px 0;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.tip-card h4 i {
  color: var(--color-info);
}

.tip-card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.tabs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.tab-card {
  text-align: center;
  padding: 20px;
  background: var(--color-gray-50);
  border: 2px solid var(--color-gray-200);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.tab-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-3px);
}

.tab-card i {
  font-size: 1.5rem;
  color: var(--color-primary);
  margin-bottom: 10px;
}

.tab-card h4 {
  margin: 0 0 8px 0;
  color: var(--color-text-primary);
  font-size: 0.95rem;
}

.tab-card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  line-height: 1.4;
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

/* Responsive */
@media (max-width: 768px) {
  .benefits-grid,
  .settings-grid,
  .tabs-grid {
    grid-template-columns: 1fr;
  }
}
</style>
