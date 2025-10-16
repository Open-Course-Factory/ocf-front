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
      <h1><i class="fas fa-share-alt"></i> {{ t('help.terminals.sharing.title') }}</h1>
      <p class="article-description">
        {{ t('help.terminals.sharing.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> {{ t('help.terminals.sharing.title') }}</h2>
        <p>
          {{ t('help.terminals.sharing.intro') }}
        </p>

        <div class="feature-grid">
          <div class="feature-card">
            <i class="fas fa-users"></i>
            <h4>{{ t('help.terminals.sharing.useCases.collaboration.title') }}</h4>
            <p>{{ t('help.terminals.sharing.useCases.collaboration.description') }}</p>
          </div>

          <div class="feature-card">
            <i class="fas fa-chalkboard-teacher"></i>
            <h4>{{ t('help.terminals.sharing.useCases.teaching.title') }}</h4>
            <p>{{ t('help.terminals.sharing.useCases.teaching.description') }}</p>
          </div>

          <div class="feature-card">
            <i class="fas fa-tools"></i>
            <h4>{{ t('help.terminals.sharing.useCases.support.title') }}</h4>
            <p>{{ t('help.terminals.sharing.useCases.support.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-share"></i> {{ t('help.terminals.sharing.howToShare.title') }}</h2>
        <p>
          {{ t('help.terminals.sharing.sharingSteps.description') }}
        </p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.sharing.sharingSteps.step1.title') }}</h4>
            <p v-html="t('help.terminals.sharing.sharingSteps.step1.description')"></p>
            <router-link to="/terminal-sessions" class="btn btn-primary">
              <i class="fas fa-terminal"></i>
              {{ t('help.terminals.sharing.sharingSteps.step1.button') }}
            </router-link>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.sharing.sharingSteps.step2.title') }}</h4>
            <p>{{ t('help.terminals.sharing.sharingSteps.step2.description') }}</p>
            <ul>
              <li v-html="t('help.terminals.sharing.sharingSteps.step2.item1')"></li>
              <li v-html="t('help.terminals.sharing.sharingSteps.step2.item2')"></li>
              <li v-html="t('help.terminals.sharing.sharingSteps.step2.item3')"></li>
              <li v-html="t('help.terminals.sharing.sharingSteps.step2.item4')"></li>
            </ul>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.sharing.sharingSteps.step3.title') }}</h4>
            <p v-html="t('help.terminals.sharing.sharingSteps.step3.description')"></p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-users-cog"></i> {{ t('help.terminals.sharing.accessManagement.title') }}</h2>
        <p>
          {{ t('help.terminals.sharing.accessManagement.description') }}
        </p>

        <div class="access-types">
          <div class="access-card readonly">
            <div class="access-icon">
              <i class="fas fa-eye"></i>
            </div>
            <div class="access-content">
              <h4>{{ t('help.terminals.sharing.permissions.readOnly.title') }}</h4>
              <p>
                {{ t('help.terminals.sharing.accessManagement.readOnly.description') }}
              </p>
              <div class="access-features">
                <span class="feature-tag">{{ t('help.terminals.sharing.accessManagement.readOnly.tag1') }}</span>
                <span class="feature-tag">{{ t('help.terminals.sharing.accessManagement.readOnly.tag2') }}</span>
                <span class="feature-tag">{{ t('help.terminals.sharing.accessManagement.readOnly.tag3') }}</span>
              </div>
            </div>
          </div>

          <div class="access-card readwrite">
            <div class="access-icon">
              <i class="fas fa-edit"></i>
            </div>
            <div class="access-content">
              <h4>{{ t('help.terminals.sharing.permissions.readWrite.title') }}</h4>
              <p>
                {{ t('help.terminals.sharing.accessManagement.readWrite.description') }}
              </p>
              <div class="access-features">
                <span class="feature-tag">{{ t('help.terminals.sharing.accessManagement.readWrite.tag1') }}</span>
                <span class="feature-tag">{{ t('help.terminals.sharing.accessManagement.readWrite.tag2') }}</span>
                <span class="feature-tag">{{ t('help.terminals.sharing.accessManagement.readWrite.tag3') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="management-actions">
          <h3>{{ t('help.terminals.sharing.accessManagement.actionsTitle') }}</h3>
          <div class="action-list">
            <div class="action-item">
              <i class="fas fa-users-cog"></i>
              <div>
                <h4>{{ t('help.terminals.sharing.accessManagement.actions.manage.title') }}</h4>
                <p>{{ t('help.terminals.sharing.accessManagement.actions.manage.description') }}</p>
              </div>
            </div>

            <div class="action-item">
              <i class="fas fa-ban"></i>
              <div>
                <h4>{{ t('help.terminals.sharing.accessManagement.actions.revoke.title') }}</h4>
                <p>{{ t('help.terminals.sharing.accessManagement.actions.revoke.description') }}</p>
              </div>
            </div>

            <div class="action-item">
              <i class="fas fa-clock"></i>
              <div>
                <h4>{{ t('help.terminals.sharing.accessManagement.actions.modify.title') }}</h4>
                <p>{{ t('help.terminals.sharing.accessManagement.actions.modify.description') }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-inbox"></i> {{ t('help.terminals.sharing.accessingShared.title') }}</h2>
        <p>
          {{ t('help.terminals.sharing.accessingShared.description') }}
        </p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.sharing.accessingShared.step1.title') }}</h4>
            <p v-html="t('help.terminals.sharing.accessingShared.step1.description')"></p>
            <router-link to="/terminal-shared" class="btn btn-outline">
              <i class="fas fa-share-alt"></i>
              {{ t('help.terminals.sharing.accessingShared.step1.button') }}
            </router-link>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.sharing.accessingShared.step2.title') }}</h4>
            <p>
              {{ t('help.terminals.sharing.accessingShared.step2.description') }}
            </p>
            <ul>
              <li v-html="t('help.terminals.sharing.accessingShared.step2.item1')"></li>
              <li v-html="t('help.terminals.sharing.accessingShared.step2.item2')"></li>
              <li v-html="t('help.terminals.sharing.accessingShared.step2.item3')"></li>
              <li v-html="t('help.terminals.sharing.accessingShared.step2.item4')"></li>
            </ul>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('help.terminals.sharing.accessingShared.step3.title') }}</h4>
            <p v-html="t('help.terminals.sharing.accessingShared.step3.description')"></p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-chalkboard-teacher"></i> {{ t('help.terminals.sharing.commonUseCases.title') }}</h2>
        <p>
          {{ t('help.terminals.sharing.commonUseCases.description') }}
        </p>

        <div class="usecase-grid">
          <div class="usecase-card">
            <i class="fas fa-graduation-cap"></i>
            <h4>{{ t('help.terminals.sharing.useCases.teaching.title') }}</h4>
            <p v-html="t('help.terminals.sharing.commonUseCases.teaching.description')"></p>
          </div>

          <div class="usecase-card">
            <i class="fas fa-hands-helping"></i>
            <h4>{{ t('help.terminals.sharing.useCases.support.title') }}</h4>
            <p v-html="t('help.terminals.sharing.commonUseCases.support.description')"></p>
          </div>

          <div class="usecase-card">
            <i class="fas fa-code-branch"></i>
            <h4>{{ t('help.terminals.sharing.commonUseCases.collaboration.title') }}</h4>
            <p>
              {{ t('help.terminals.sharing.commonUseCases.collaboration.description') }}
            </p>
          </div>

          <div class="usecase-card">
            <i class="fas fa-user-graduate"></i>
            <h4>{{ t('help.terminals.sharing.commonUseCases.mentoring.title') }}</h4>
            <p>
              {{ t('help.terminals.sharing.commonUseCases.mentoring.description') }}
            </p>
          </div>
        </div>
      </section>

      <section class="help-section warning">
        <h2><i class="fas fa-shield-alt"></i> {{ t('help.terminals.sharing.security.title') }}</h2>
        <div class="security-guidelines">
          <div class="guideline-item">
            <i class="fas fa-user-check"></i>
            <div>
              <h4>{{ t('help.terminals.sharing.securityPractices.verifyIdentity.title') }}</h4>
              <p>{{ t('help.terminals.sharing.securityPractices.verifyIdentity.description') }}</p>
            </div>
          </div>

          <div class="guideline-item">
            <i class="fas fa-clock"></i>
            <div>
              <h4>{{ t('help.terminals.sharing.securityPractices.limitDuration.title') }}</h4>
              <p>{{ t('help.terminals.sharing.securityPractices.limitDuration.description') }}</p>
            </div>
          </div>

          <div class="guideline-item">
            <i class="fas fa-eye"></i>
            <div>
              <h4>{{ t('help.terminals.sharing.securityPractices.monitorActivity.title') }}</h4>
              <p>{{ t('help.terminals.sharing.securityPractices.monitorActivity.description') }}</p>
            </div>
          </div>

          <div class="guideline-item">
            <i class="fas fa-save"></i>
            <div>
              <h4>{{ t('help.terminals.sharing.securityPractices.backupFirst.title') }}</h4>
              <p>{{ t('help.terminals.sharing.securityPractices.backupFirst.description') }}</p>
            </div>
          </div>

          <div class="guideline-item">
            <i class="fas fa-ban"></i>
            <div>
              <h4>{{ t('help.terminals.sharing.securityPractices.revokeQuickly.title') }}</h4>
              <p>{{ t('help.terminals.sharing.securityPractices.revokeQuickly.description') }}</p>
            </div>
          </div>

          <div class="guideline-item">
            <i class="fas fa-file-contract"></i>
            <div>
              <h4>{{ t('help.terminals.sharing.securityPractices.respectData.title') }}</h4>
              <p>{{ t('help.terminals.sharing.securityPractices.respectData.description') }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-exclamation-triangle"></i> {{ t('help.terminals.sharing.limitations.title') }}</h2>
        <p>
          {{ t('help.terminals.sharing.limitations.description') }}
        </p>

        <div class="limitation-list">
          <div class="limitation-item">
            <i class="fas fa-users"></i>
            <div>
              <h4>{{ t('help.terminals.sharing.limitations.users.title') }}</h4>
              <p>{{ t('help.terminals.sharing.limitations.users.description') }}</p>
            </div>
          </div>

          <div class="limitation-item">
            <i class="fas fa-network-wired"></i>
            <div>
              <h4>{{ t('help.terminals.sharing.limitations.network.title') }}</h4>
              <p>{{ t('help.terminals.sharing.limitations.network.description') }}</p>
            </div>
          </div>

          <div class="limitation-item">
            <i class="fas fa-sync-alt"></i>
            <div>
              <h4>{{ t('help.terminals.sharing.limitations.sync.title') }}</h4>
              <p>{{ t('help.terminals.sharing.limitations.sync.description') }}</p>
            </div>
          </div>

          <div class="limitation-item">
            <i class="fas fa-history"></i>
            <div>
              <h4>{{ t('help.terminals.sharing.limitations.history.title') }}</h4>
              <p>{{ t('help.terminals.sharing.limitations.history.description') }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/terminals/managing-sessions`" class="next-step-card">
            <i class="fas fa-cogs"></i>
            <h4>{{ t('help.terminals.sharing.nextSteps.managingSessions.title') }}</h4>
            <p>{{ t('help.terminals.sharing.nextSteps.managingSessions.description') }}</p>
          </router-link>

          <router-link :to="`${helpRoutePrefix}/terminals/troubleshooting`" class="next-step-card">
            <i class="fas fa-wrench"></i>
            <h4>{{ t('help.terminals.sharing.nextSteps.troubleshooting.title') }}</h4>
            <p>{{ t('help.terminals.sharing.nextSteps.troubleshooting.description') }}</p>
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

.help-section.warning {
  background: linear-gradient(135deg, var(--color-warning-bg) 0%, var(--color-warning-bg) 100%);
  border-left: 4px solid var(--color-warning);
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

.help-section.warning h2 i {
  color: var(--color-warning);
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

.help-section ul {
  color: var(--color-text-secondary);
  margin-left: 20px;
}

.help-section li {
  margin-bottom: 8px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.feature-card {
  text-align: center;
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
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
}

.step-card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  margin: 20px 0;
  border-left: 4px solid var(--color-primary);
}

.step-number {
  background: var(--color-primary);
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

.step-content ul {
  margin: 10px 0 15px 20px;
}

.access-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.access-card {
  display: flex;
  gap: 20px;
  padding: 25px;
  border-radius: 8px;
  border: 2px solid;
}

.access-card.readonly {
  background: var(--color-info-bg);
  border-color: var(--color-info);
}

.access-card.readwrite {
  background: var(--color-success-bg);
  border-color: #4caf50;
}

.access-icon {
  flex-shrink: 0;
}

.access-card.readonly .access-icon i {
  font-size: 2rem;
  color: var(--color-primary);
}

.access-card.readwrite .access-icon i {
  font-size: 2rem;
  color: #388e3c;
}

.access-content h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
}

.access-content p {
  margin: 0 0 15px 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.access-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feature-tag {
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.management-actions {
  margin-top: 30px;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.action-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: var(--color-gray-50);
  border-radius: 8px;
}

.action-item i {
  font-size: 1.3rem;
  color: var(--color-primary);
  margin-top: 5px;
}

.action-item h4 {
  margin: 0 0 5px 0;
  color: var(--color-text-primary);
  font-size: 1rem;
}

.action-item p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.usecase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.usecase-card {
  text-align: center;
  padding: 25px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
  transition: all 0.3s ease;
}

.usecase-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-5px);
}

.usecase-card i {
  font-size: 2.5rem;
  color: var(--color-primary);
  margin-bottom: 15px;
}

.usecase-card h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
}

.usecase-card p {
  margin: 0;
  color: var(--color-gray-600);
  font-size: 0.9rem;
  line-height: 1.5;
}

.security-guidelines {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.guideline-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.guideline-item i {
  font-size: 1.3rem;
  color: var(--color-warning);
  margin-top: 5px;
  flex-shrink: 0;
}

.guideline-item h4 {
  margin: 0 0 5px 0;
  color: var(--color-text-primary);
  font-size: 1rem;
}

.guideline-item p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.limitation-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.limitation-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: var(--color-warning-bg);
  border-radius: 8px;
  border-left: 4px solid var(--color-warning);
}

.limitation-item i {
  font-size: 1.3rem;
  color: var(--color-warning-text);
  margin-top: 5px;
}

.limitation-item h4 {
  margin: 0 0 5px 0;
  color: var(--color-warning-text);
  font-size: 1rem;
}

.limitation-item p {
  margin: 0;
  color: var(--color-warning-text);
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

  .feature-grid,
  .usecase-grid {
    grid-template-columns: 1fr;
  }

  .access-types {
    grid-template-columns: 1fr;
  }

  .access-card {
    flex-direction: column;
    text-align: center;
  }

  .step-card {
    flex-direction: column;
    text-align: center;
  }

  .security-guidelines {
    grid-template-columns: 1fr;
  }

  .next-steps {
    grid-template-columns: 1fr;
  }
}
</style>