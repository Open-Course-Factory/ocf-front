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
      <h1><i class="fas fa-file-import"></i> {{ t('help.bulkImport.overview.title') }}</h1>
      <p class="article-description">
        {{ t('help.bulkImport.overview.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> {{ t('help.bulkImport.overview.whatIs.title') }}</h2>
        <p>{{ t('help.bulkImport.overview.whatIs.description') }}</p>

        <div class="benefits-grid">
          <div class="benefit-card">
            <i class="fas fa-users"></i>
            <p>{{ t('help.bulkImport.overview.whatIs.benefit1') }}</p>
          </div>
          <div class="benefit-card">
            <i class="fas fa-magic"></i>
            <p>{{ t('help.bulkImport.overview.whatIs.benefit2') }}</p>
          </div>
          <div class="benefit-card">
            <i class="fas fa-check-circle"></i>
            <p>{{ t('help.bulkImport.overview.whatIs.benefit3') }}</p>
          </div>
          <div class="benefit-card">
            <i class="fas fa-object-group"></i>
            <p>{{ t('help.bulkImport.overview.whatIs.benefit4') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-file-csv"></i> {{ t('help.bulkImport.overview.csvFormat.title') }}</h2>
        <p>{{ t('help.bulkImport.overview.csvFormat.description') }}</p>

        <div class="format-details">
          <div class="format-item">
            <i class="fas fa-asterisk"></i>
            <span>{{ t('help.bulkImport.overview.csvFormat.requiredFields') }}</span>
          </div>
          <div class="format-item">
            <i class="fas fa-plus"></i>
            <span>{{ t('help.bulkImport.overview.csvFormat.optionalFields') }}</span>
          </div>
          <div class="format-item">
            <i class="fas fa-code"></i>
            <span>{{ t('help.bulkImport.overview.csvFormat.encoding') }}</span>
          </div>
          <div class="format-item">
            <i class="fas fa-grip-lines-vertical"></i>
            <span>{{ t('help.bulkImport.overview.csvFormat.delimiter') }}</span>
          </div>
        </div>

        <div class="csv-example">
          <h4><i class="fas fa-code"></i> CSV</h4>
          <pre><code>{{ t('help.bulkImport.overview.csvFormat.example') }}</code></pre>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-hat-wizard"></i> {{ t('help.bulkImport.overview.wizard.title') }}</h2>
        <p>{{ t('help.bulkImport.overview.wizard.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.bulkImport.overview.wizard.step1.title') }}</h4>
            <p>{{ t('help.bulkImport.overview.wizard.step1.description') }}</p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.bulkImport.overview.wizard.step2.title') }}</h4>
            <p>{{ t('help.bulkImport.overview.wizard.step2.description') }}</p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('help.bulkImport.overview.wizard.step3.title') }}</h4>
            <p>{{ t('help.bulkImport.overview.wizard.step3.description') }}</p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">4</div>
          <div class="step-content">
            <h4>{{ t('help.bulkImport.overview.wizard.step4.title') }}</h4>
            <p>{{ t('help.bulkImport.overview.wizard.step4.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section warning">
        <h2><i class="fas fa-exclamation-triangle"></i> {{ t('help.bulkImport.overview.validation.title') }}</h2>
        <p>{{ t('help.bulkImport.overview.validation.description') }}</p>

        <div class="validation-list">
          <div class="validation-item">
            <i class="fas fa-envelope"></i>
            <span>{{ t('help.bulkImport.overview.validation.emailValidation') }}</span>
          </div>
          <div class="validation-item">
            <i class="fas fa-user-tag"></i>
            <span>{{ t('help.bulkImport.overview.validation.roleValidation') }}</span>
          </div>
          <div class="validation-item">
            <i class="fas fa-users"></i>
            <span>{{ t('help.bulkImport.overview.validation.groupValidation') }}</span>
          </div>
          <div class="validation-item">
            <i class="fas fa-file-alt"></i>
            <span>{{ t('help.bulkImport.overview.validation.errorReport') }}</span>
          </div>
        </div>
      </section>

      <section class="help-section info">
        <h2><i class="fas fa-lightbulb"></i> {{ t('help.bulkImport.overview.tips.title') }}</h2>
        <p>{{ t('help.bulkImport.overview.tips.description') }}</p>

        <div class="tips-list">
          <div class="tip-card">
            <h4><i class="fas fa-flask"></i> {{ t('help.bulkImport.overview.tips.tip1.title') }}</h4>
            <p>{{ t('help.bulkImport.overview.tips.tip1.description') }}</p>
          </div>
          <div class="tip-card">
            <h4><i class="fas fa-layer-group"></i> {{ t('help.bulkImport.overview.tips.tip2.title') }}</h4>
            <p>{{ t('help.bulkImport.overview.tips.tip2.description') }}</p>
          </div>
          <div class="tip-card">
            <h4><i class="fas fa-clone"></i> {{ t('help.bulkImport.overview.tips.tip3.title') }}</h4>
            <p>{{ t('help.bulkImport.overview.tips.tip3.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/organizations/overview`" class="next-step-card">
            <i class="fas fa-building"></i>
            <h4>{{ t('help.bulkImport.overview.nextSteps.organizations.title') }}</h4>
            <p>{{ t('help.bulkImport.overview.nextSteps.organizations.description') }}</p>
          </router-link>

          <router-link :to="`${helpRoutePrefix}/groups/management`" class="next-step-card">
            <i class="fas fa-users"></i>
            <h4>{{ t('help.bulkImport.overview.nextSteps.groups.title') }}</h4>
            <p>{{ t('help.bulkImport.overview.nextSteps.groups.description') }}</p>
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

.format-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 20px 0;
}

.format-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 15px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border-left: 4px solid var(--color-primary);
}

.format-item i {
  color: var(--color-primary);
  flex-shrink: 0;
}

.format-item span {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.csv-example {
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.csv-example h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.csv-example pre {
  background: var(--terminal-bg);
  color: var(--terminal-fg);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0;
  font-size: 0.85rem;
}

.validation-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 20px 0;
}

.validation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.validation-item i {
  color: var(--color-warning);
  flex-shrink: 0;
}

.validation-item span {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
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

/* Responsive */
@media (max-width: 768px) {
  .benefits-grid {
    grid-template-columns: 1fr;
  }
}
</style>
