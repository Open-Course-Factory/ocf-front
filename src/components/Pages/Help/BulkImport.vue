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
        <h2><i class="fas fa-file-code"></i> {{ t('help.bulkImport.overview.csvEncoding.title') }}</h2>
        <p>{{ t('help.bulkImport.overview.csvEncoding.description') }}</p>

        <div class="encoding-details">
          <div class="format-item">
            <i class="fas fa-check-circle"></i>
            <span>{{ t('help.bulkImport.overview.csvEncoding.utf8') }}</span>
          </div>
          <div class="format-item">
            <i class="fas fa-windows"></i>
            <span>{{ t('help.bulkImport.overview.csvEncoding.windows') }}</span>
          </div>
          <div class="format-item">
            <i class="fas fa-magic"></i>
            <span>{{ t('help.bulkImport.overview.csvEncoding.bomStripping') }}</span>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-language"></i> {{ t('help.bulkImport.overview.columnAliases.title') }}</h2>
        <p>{{ t('help.bulkImport.overview.columnAliases.description') }}</p>

        <div class="alias-example">
          <h4><i class="fas fa-exchange-alt"></i> {{ t('help.bulkImport.overview.columnAliases.examplesTitle') }}</h4>
          <div class="alias-list">
            <div class="alias-item">
              <code>nom</code> <i class="fas fa-arrow-right"></i> <code>last_name</code>
            </div>
            <div class="alias-item">
              <code>prenom</code> <i class="fas fa-arrow-right"></i> <code>first_name</code>
            </div>
            <div class="alias-item">
              <code>e-mail</code> <i class="fas fa-arrow-right"></i> <code>email</code>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-redo"></i> {{ t('help.bulkImport.overview.forcePasswordReset.title') }}</h2>
        <p>{{ t('help.bulkImport.overview.forcePasswordReset.description') }}</p>

        <div class="format-details">
          <div class="format-item">
            <i class="fas fa-columns"></i>
            <span>{{ t('help.bulkImport.overview.forcePasswordReset.column') }}</span>
          </div>
          <div class="format-item">
            <i class="fas fa-robot"></i>
            <span>{{ t('help.bulkImport.overview.forcePasswordReset.automatic') }}</span>
          </div>
        </div>
      </section>

      <section class="help-section warning">
        <h2><i class="fas fa-key"></i> {{ t('help.bulkImport.overview.autoGeneratedPasswords.title') }}</h2>
        <p>{{ t('help.bulkImport.overview.autoGeneratedPasswords.description') }}</p>

        <div class="format-details">
          <div class="format-item">
            <i class="fas fa-lock"></i>
            <span>{{ t('help.bulkImport.overview.autoGeneratedPasswords.secure') }}</span>
          </div>
          <div class="format-item">
            <i class="fas fa-download"></i>
            <span>{{ t('help.bulkImport.overview.autoGeneratedPasswords.downloadable') }}</span>
          </div>
        </div>

        <div class="warning-box">
          <h4><i class="fas fa-exclamation-triangle"></i> {{ t('help.bulkImport.overview.autoGeneratedPasswords.warning.title') }}</h4>
          <p>{{ t('help.bulkImport.overview.autoGeneratedPasswords.warning.description') }}</p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-gift"></i> {{ t('help.bulkImport.overview.trialPlanAssignment.title') }}</h2>
        <p>{{ t('help.bulkImport.overview.trialPlanAssignment.description') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-users-cog"></i> {{ t('help.bulkImport.overview.targetGroupDropdown.title') }}</h2>
        <p>{{ t('help.bulkImport.overview.targetGroupDropdown.description') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-sync-alt"></i> {{ t('help.bulkImport.overview.updateExistingUsers.title') }}</h2>
        <p>{{ t('help.bulkImport.overview.updateExistingUsers.description') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-clipboard-check"></i> {{ t('help.bulkImport.overview.validationPreview.title') }}</h2>
        <p>{{ t('help.bulkImport.overview.validationPreview.description') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-tasks"></i> {{ t('help.bulkImport.overview.importProgress.title') }}</h2>
        <p>{{ t('help.bulkImport.overview.importProgress.description') }}</p>

        <div class="progress-counters">
          <div class="counter-card success">
            <i class="fas fa-user-plus"></i>
            <span>{{ t('help.bulkImport.overview.importProgress.created') }}</span>
          </div>
          <div class="counter-card info">
            <i class="fas fa-user-edit"></i>
            <span>{{ t('help.bulkImport.overview.importProgress.updated') }}</span>
          </div>
          <div class="counter-card muted">
            <i class="fas fa-user-slash"></i>
            <span>{{ t('help.bulkImport.overview.importProgress.skipped') }}</span>
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

.encoding-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 20px 0;
}

.alias-example {
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.alias-example h4 {
  margin: 0 0 15px 0;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.alias-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alias-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--color-bg-primary);
  border-radius: 6px;
}

.alias-item code {
  background: var(--color-gray-100);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  color: var(--color-primary);
}

.alias-item i {
  color: var(--color-gray-400);
  font-size: 0.8rem;
}

.warning-box {
  background: var(--color-warning-bg);
  border: 2px solid var(--color-warning);
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.warning-box h4 {
  margin: 0 0 10px 0;
  color: var(--color-warning-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.warning-box p {
  margin: 0;
  color: var(--color-warning-text);
}

.progress-counters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.counter-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  border-radius: 8px;
  border: 2px solid;
}

.counter-card.success {
  background: var(--color-success-bg);
  border-color: var(--color-success);
}

.counter-card.success i {
  color: var(--color-success);
}

.counter-card.info {
  background: var(--color-info-bg);
  border-color: var(--color-info);
}

.counter-card.info i {
  color: var(--color-info);
}

.counter-card.muted {
  background: var(--color-gray-50);
  border-color: var(--color-gray-200);
}

.counter-card.muted i {
  color: var(--color-gray-400);
}

.counter-card i {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.counter-card span {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

/* Responsive */
@media (max-width: 768px) {
  .benefits-grid,
  .progress-counters {
    grid-template-columns: 1fr;
  }
}
</style>
