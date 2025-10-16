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
      <h1><i class="fas fa-wrench"></i> {{ t('help.terminals.troubleshooting.title') }}</h1>
      <p class="article-description">
        {{ t('help.terminals.troubleshooting.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-search"></i> {{ t('help.terminals.troubleshooting.quickDiagnosis.title') }}</h2>
        <p>
          {{ t('help.terminals.troubleshooting.quickDiagnosis.description') }}
        </p>

        <div class="diagnostic-checklist">
          <div class="check-item">
            <input type="checkbox" id="check1">
            <label for="check1">
              <i class="fas fa-wifi"></i>
              {{ t('help.terminals.troubleshooting.quickDiagnosis.checks.internet') }}
            </label>
          </div>
          <div class="check-item">
            <input type="checkbox" id="check2">
            <label for="check2">
              <i class="fas fa-browser"></i>
              {{ t('help.terminals.troubleshooting.quickDiagnosis.checks.browser') }}
            </label>
          </div>
          <div class="check-item">
            <input type="checkbox" id="check3">
            <label for="check3">
              <i class="fas fa-key"></i>
              {{ t('help.terminals.troubleshooting.quickDiagnosis.checks.key') }}
            </label>
          </div>
          <div class="check-item">
            <input type="checkbox" id="check4">
            <label for="check4">
              <i class="fas fa-clock"></i>
              {{ t('help.terminals.troubleshooting.quickDiagnosis.checks.session') }}
            </label>
          </div>
          <div class="check-item">
            <input type="checkbox" id="check5">
            <label for="check5">
              <i class="fas fa-shield-alt"></i>
              {{ t('help.terminals.troubleshooting.quickDiagnosis.checks.blocker') }}
            </label>
          </div>
        </div>

        <div class="quick-actions">
          <h3>{{ t('help.terminals.troubleshooting.quickDiagnosis.actionsTitle') }}</h3>
          <router-link to="/terminal-sessions" class="btn btn-primary">
            <i class="fas fa-sync"></i>
            {{ t('help.terminals.troubleshooting.quickDiagnosis.syncButton') }}
          </router-link>
          <router-link to="/user-terminal-keys" class="btn btn-outline">
            <i class="fas fa-key"></i>
            {{ t('help.terminals.troubleshooting.quickDiagnosis.keyButton') }}
          </router-link>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-exclamation-triangle"></i> {{ t('help.terminals.troubleshooting.commonProblems.connectionIssues.title') }}</h2>

        <div class="problem-card">
          <div class="problem-header">
            <i class="fas fa-times-circle"></i>
            <h3>{{ t('help.terminals.troubleshooting.commonProblems.cannotCreateSession.title') }}</h3>
          </div>
          <div class="problem-content">
            <h4>{{ t('help.terminals.troubleshooting.commonProblems.cannotCreateSession.causesTitle') }}</h4>
            <ul>
              <li>{{ t('help.terminals.troubleshooting.commonProblems.cannotCreateSession.causes.cause1') }}</li>
              <li>{{ t('help.terminals.troubleshooting.commonProblems.cannotCreateSession.causes.cause2') }}</li>
              <li>{{ t('help.terminals.troubleshooting.commonProblems.cannotCreateSession.causes.cause3') }}</li>
              <li>{{ t('help.terminals.troubleshooting.commonProblems.cannotCreateSession.causes.cause4') }}</li>
            </ul>
            <h4>{{ t('help.terminals.troubleshooting.commonProblems.cannotCreateSession.solutionsTitle') }}</h4>
            <div class="solution-steps">
              <div class="solution-step">
                <span class="step-number">1</span>
                <div>
                  <strong>{{ t('help.terminals.troubleshooting.commonProblems.cannotCreateSession.solutions.step1.title') }}</strong>
                  <p>{{ t('help.terminals.troubleshooting.commonProblems.cannotCreateSession.solutions.step1.description') }}</p>
                </div>
              </div>
              <div class="solution-step">
                <span class="step-number">2</span>
                <div>
                  <strong>{{ t('help.terminals.troubleshooting.commonProblems.cannotCreateSession.solutions.step2.title') }}</strong>
                  <p>{{ t('help.terminals.troubleshooting.commonProblems.cannotCreateSession.solutions.step2.description') }}</p>
                </div>
              </div>
              <div class="solution-step">
                <span class="step-number">3</span>
                <div>
                  <strong>{{ t('help.terminals.troubleshooting.commonProblems.cannotCreateSession.solutions.step3.title') }}</strong>
                  <p>{{ t('help.terminals.troubleshooting.commonProblems.cannotCreateSession.solutions.step3.description') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="problem-card">
          <div class="problem-header">
            <i class="fas fa-plug"></i>
            <h3>{{ t('help.terminals.troubleshooting.commonProblems.blackScreen.title') }}</h3>
          </div>
          <div class="problem-content">
            <h4>{{ t('help.terminals.troubleshooting.commonProblems.blackScreen.causesTitle') }}</h4>
            <ul>
              <li>{{ t('help.terminals.troubleshooting.commonProblems.blackScreen.causes.cause1') }}</li>
              <li>{{ t('help.terminals.troubleshooting.commonProblems.blackScreen.causes.cause2') }}</li>
              <li>{{ t('help.terminals.troubleshooting.commonProblems.blackScreen.causes.cause3') }}</li>
              <li>{{ t('help.terminals.troubleshooting.commonProblems.blackScreen.causes.cause4') }}</li>
            </ul>
            <h4>{{ t('help.terminals.troubleshooting.commonProblems.blackScreen.solutionsTitle') }}</h4>
            <div class="solution-steps">
              <div class="solution-step">
                <span class="step-number">1</span>
                <div>
                  <strong>{{ t('help.terminals.troubleshooting.commonProblems.blackScreen.solutions.step1.title') }}</strong>
                  <p>{{ t('help.terminals.troubleshooting.commonProblems.blackScreen.solutions.step1.description') }}</p>
                </div>
              </div>
              <div class="solution-step">
                <span class="step-number">2</span>
                <div>
                  <strong>{{ t('help.terminals.troubleshooting.commonProblems.blackScreen.solutions.step2.title') }}</strong>
                  <p>{{ t('help.terminals.troubleshooting.commonProblems.blackScreen.solutions.step2.description') }}</p>
                </div>
              </div>
              <div class="solution-step">
                <span class="step-number">3</span>
                <div>
                  <strong>{{ t('help.terminals.troubleshooting.commonProblems.blackScreen.solutions.step3.title') }}</strong>
                  <p>{{ t('help.terminals.troubleshooting.commonProblems.blackScreen.solutions.step3.description') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="problem-card">
          <div class="problem-header">
            <i class="fas fa-keyboard"></i>
            <h3>{{ t('help.terminals.troubleshooting.commonProblems.keyboard.title') }}</h3>
          </div>
          <div class="problem-content">
            <h4>{{ t('help.terminals.troubleshooting.commonProblems.keyboard.causesTitle') }}</h4>
            <ul>
              <li>{{ t('help.terminals.troubleshooting.commonProblems.keyboard.causes.cause1') }}</li>
              <li>{{ t('help.terminals.troubleshooting.commonProblems.keyboard.causes.cause2') }}</li>
              <li>{{ t('help.terminals.troubleshooting.commonProblems.keyboard.causes.cause3') }}</li>
              <li>{{ t('help.terminals.troubleshooting.commonProblems.keyboard.causes.cause4') }}</li>
            </ul>
            <h4>{{ t('help.terminals.troubleshooting.commonProblems.keyboard.solutionsTitle') }}</h4>
            <div class="solution-steps">
              <div class="solution-step">
                <span class="step-number">1</span>
                <div>
                  <strong>{{ t('help.terminals.troubleshooting.commonProblems.keyboard.solutions.step1.title') }}</strong>
                  <p>{{ t('help.terminals.troubleshooting.commonProblems.keyboard.solutions.step1.description') }}</p>
                </div>
              </div>
              <div class="solution-step">
                <span class="step-number">2</span>
                <div>
                  <strong>{{ t('help.terminals.troubleshooting.commonProblems.keyboard.solutions.step2.title') }}</strong>
                  <p v-html="t('help.terminals.troubleshooting.commonProblems.keyboard.solutions.step2.description')"></p>
                </div>
              </div>
              <div class="solution-step">
                <span class="step-number">3</span>
                <div>
                  <strong>{{ t('help.terminals.troubleshooting.commonProblems.keyboard.solutions.step3.title') }}</strong>
                  <p>{{ t('help.terminals.troubleshooting.commonProblems.keyboard.solutions.step3.description') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-share-alt"></i> {{ t('help.terminals.troubleshooting.sharingProblems.title') }}</h2>

        <div class="problem-card">
          <div class="problem-header">
            <i class="fas fa-ban"></i>
            <h3>{{ t('help.terminals.troubleshooting.sharingProblems.cannotShare.title') }}</h3>
          </div>
          <div class="problem-content">
            <h4>{{ t('help.terminals.troubleshooting.sharingProblems.cannotShare.checksTitle') }}</h4>
            <ul>
              <li>{{ t('help.terminals.troubleshooting.sharingProblems.cannotShare.checks.check1') }}</li>
              <li>{{ t('help.terminals.troubleshooting.sharingProblems.cannotShare.checks.check2') }}</li>
              <li>{{ t('help.terminals.troubleshooting.sharingProblems.cannotShare.checks.check3') }}</li>
            </ul>
            <h4>{{ t('help.terminals.troubleshooting.sharingProblems.cannotShare.solutionTitle') }}</h4>
            <p>{{ t('help.terminals.troubleshooting.sharingProblems.cannotShare.solution') }}</p>
          </div>
        </div>

        <div class="problem-card">
          <div class="problem-header">
            <i class="fas fa-eye-slash"></i>
            <h3>{{ t('help.terminals.troubleshooting.sharingProblems.cannotAccess.title') }}</h3>
          </div>
          <div class="problem-content">
            <h4>{{ t('help.terminals.troubleshooting.sharingProblems.cannotAccess.checksTitle') }}</h4>
            <ul>
              <li>{{ t('help.terminals.troubleshooting.sharingProblems.cannotAccess.checks.check1') }}</li>
              <li>{{ t('help.terminals.troubleshooting.sharingProblems.cannotAccess.checks.check2') }}</li>
              <li>{{ t('help.terminals.troubleshooting.sharingProblems.cannotAccess.checks.check3') }}</li>
              <li>{{ t('help.terminals.troubleshooting.sharingProblems.cannotAccess.checks.check4') }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-tachometer-alt"></i> {{ t('help.terminals.troubleshooting.performanceProblems.title') }}</h2>

        <div class="performance-tips">
          <div class="tip-card">
            <i class="fas fa-rocket"></i>
            <h4>{{ t('help.terminals.troubleshooting.performanceProblems.slowTerminal.title') }}</h4>
            <ul>
              <li>{{ t('help.terminals.troubleshooting.performanceProblems.slowTerminal.tip1') }}</li>
              <li>{{ t('help.terminals.troubleshooting.performanceProblems.slowTerminal.tip2') }}</li>
              <li>{{ t('help.terminals.troubleshooting.performanceProblems.slowTerminal.tip3') }}</li>
              <li>{{ t('help.terminals.troubleshooting.performanceProblems.slowTerminal.tip4') }}</li>
            </ul>
          </div>

          <div class="tip-card">
            <i class="fas fa-memory"></i>
            <h4>{{ t('help.terminals.troubleshooting.performanceProblems.freezing.title') }}</h4>
            <ul>
              <li>{{ t('help.terminals.troubleshooting.performanceProblems.freezing.tip1') }}</li>
              <li v-html="t('help.terminals.troubleshooting.performanceProblems.freezing.tip2')"></li>
              <li>{{ t('help.terminals.troubleshooting.performanceProblems.freezing.tip3') }}</li>
              <li>{{ t('help.terminals.troubleshooting.performanceProblems.freezing.tip4') }}</li>
            </ul>
          </div>

          <div class="tip-card">
            <i class="fas fa-network-wired"></i>
            <h4>{{ t('help.terminals.troubleshooting.performanceProblems.disconnections.title') }}</h4>
            <ul>
              <li>{{ t('help.terminals.troubleshooting.performanceProblems.disconnections.tip1') }}</li>
              <li>{{ t('help.terminals.troubleshooting.performanceProblems.disconnections.tip2') }}</li>
              <li>{{ t('help.terminals.troubleshooting.performanceProblems.disconnections.tip3') }}</li>
              <li>{{ t('help.terminals.troubleshooting.performanceProblems.disconnections.tip4') }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-cogs"></i> {{ t('help.terminals.troubleshooting.syncProblems.title') }}</h2>

        <div class="sync-issues">
          <div class="issue-item">
            <i class="fas fa-sync-alt"></i>
            <div>
              <h4>{{ t('help.terminals.troubleshooting.syncProblems.incorrectStatus.title') }}</h4>
              <p>
                {{ t('help.terminals.troubleshooting.syncProblems.incorrectStatus.description') }}
              </p>
            </div>
          </div>

          <div class="issue-item">
            <i class="fas fa-clock"></i>
            <div>
              <h4>{{ t('help.terminals.troubleshooting.syncProblems.inconsistentDates.title') }}</h4>
              <p>
                {{ t('help.terminals.troubleshooting.syncProblems.inconsistentDates.description') }}
              </p>
            </div>
          </div>

          <div class="issue-item">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
              <h4>{{ t('help.terminals.troubleshooting.syncProblems.syncErrors.title') }}</h4>
              <p>
                {{ t('help.terminals.troubleshooting.syncProblems.syncErrors.description') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section warning">
        <h2><i class="fas fa-life-ring"></i> {{ t('help.terminals.troubleshooting.support.whenToContact.title') }}</h2>
        <p>
          {{ t('help.terminals.troubleshooting.support.whenToContact.description') }}
        </p>

        <div class="support-triggers">
          <div class="trigger-item critical">
            <i class="fas fa-exclamation-circle"></i>
            <div>
              <h4>{{ t('help.terminals.troubleshooting.support.whenToContact.critical.title') }}</h4>
              <ul>
                <li>{{ t('help.terminals.troubleshooting.support.whenToContact.critical.item1') }}</li>
                <li>{{ t('help.terminals.troubleshooting.support.whenToContact.critical.item2') }}</li>
                <li>{{ t('help.terminals.troubleshooting.support.whenToContact.critical.item3') }}</li>
                <li>{{ t('help.terminals.troubleshooting.support.whenToContact.critical.item4') }}</li>
              </ul>
            </div>
          </div>

          <div class="trigger-item high">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
              <h4>{{ t('help.terminals.troubleshooting.support.whenToContact.high.title') }}</h4>
              <ul>
                <li>{{ t('help.terminals.troubleshooting.support.whenToContact.high.item1') }}</li>
                <li>{{ t('help.terminals.troubleshooting.support.whenToContact.high.item2') }}</li>
                <li>{{ t('help.terminals.troubleshooting.support.whenToContact.high.item3') }}</li>
                <li>{{ t('help.terminals.troubleshooting.support.whenToContact.high.item4') }}</li>
              </ul>
            </div>
          </div>

          <div class="trigger-item normal">
            <i class="fas fa-info-circle"></i>
            <div>
              <h4>{{ t('help.terminals.troubleshooting.support.whenToContact.normal.title') }}</h4>
              <ul>
                <li>{{ t('help.terminals.troubleshooting.support.whenToContact.normal.item1') }}</li>
                <li>{{ t('help.terminals.troubleshooting.support.whenToContact.normal.item2') }}</li>
                <li>{{ t('help.terminals.troubleshooting.support.whenToContact.normal.item3') }}</li>
                <li>{{ t('help.terminals.troubleshooting.support.whenToContact.normal.item4') }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="contact-info">
          <h3>{{ t('help.terminals.troubleshooting.support.infoToInclude.title') }}</h3>
          <div class="info-checklist">
            <div class="info-item">
              <i class="fas fa-user"></i>
              <span>{{ t('help.terminals.troubleshooting.support.infoToInclude.username') }}</span>
            </div>
            <div class="info-item">
              <i class="fas fa-calendar"></i>
              <span>{{ t('help.terminals.troubleshooting.support.infoToInclude.dateTime') }}</span>
            </div>
            <div class="info-item">
              <i class="fas fa-list"></i>
              <span>{{ t('help.terminals.troubleshooting.support.infoToInclude.detailedDescription') }}</span>
            </div>
            <div class="info-item">
              <i class="fas fa-browser"></i>
              <span>{{ t('help.terminals.troubleshooting.support.infoToInclude.browser') }}</span>
            </div>
            <div class="info-item">
              <i class="fas fa-desktop"></i>
              <span>{{ t('help.terminals.troubleshooting.support.infoToInclude.os') }}</span>
            </div>
            <div class="info-item">
              <i class="fas fa-camera"></i>
              <span>{{ t('help.terminals.troubleshooting.support.infoToInclude.screenshots') }}</span>
            </div>
          </div>

          <div class="contact-action">
            <a href="mailto:contact@labinux.com" class="btn btn-primary">
              <i class="fas fa-envelope"></i>
              {{ t('help.terminals.troubleshooting.support.contactButton') }}
            </a>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-lightbulb"></i> {{ t('help.terminals.troubleshooting.prevention.title') }}</h2>
        <p>
          {{ t('help.terminals.troubleshooting.prevention.description') }}
        </p>

        <div class="prevention-tips">
          <div class="prevention-category">
            <h4><i class="fas fa-save"></i> {{ t('help.terminals.troubleshooting.prevention.backup.title') }}</h4>
            <ul>
              <li>{{ t('help.terminals.troubleshooting.prevention.backup.tip1') }}</li>
              <li>{{ t('help.terminals.troubleshooting.prevention.backup.tip2') }}</li>
              <li>{{ t('help.terminals.troubleshooting.prevention.backup.tip3') }}</li>
              <li>{{ t('help.terminals.troubleshooting.prevention.backup.tip4') }}</li>
            </ul>
          </div>

          <div class="prevention-category">
            <h4><i class="fas fa-clock"></i> {{ t('help.terminals.troubleshooting.prevention.timeManagement.title') }}</h4>
            <ul>
              <li>{{ t('help.terminals.troubleshooting.prevention.timeManagement.tip1') }}</li>
              <li>{{ t('help.terminals.troubleshooting.prevention.timeManagement.tip2') }}</li>
              <li>{{ t('help.terminals.troubleshooting.prevention.timeManagement.tip3') }}</li>
              <li>{{ t('help.terminals.troubleshooting.prevention.timeManagement.tip4') }}</li>
            </ul>
          </div>

          <div class="prevention-category">
            <h4><i class="fas fa-shield-alt"></i> {{ t('help.terminals.troubleshooting.prevention.security.title') }}</h4>
            <ul>
              <li>{{ t('help.terminals.troubleshooting.prevention.security.tip1') }}</li>
              <li>{{ t('help.terminals.troubleshooting.prevention.security.tip2') }}</li>
              <li>{{ t('help.terminals.troubleshooting.prevention.security.tip3') }}</li>
              <li>{{ t('help.terminals.troubleshooting.prevention.security.tip4') }}</li>
            </ul>
          </div>

          <div class="prevention-category">
            <h4><i class="fas fa-tools"></i> {{ t('help.terminals.troubleshooting.prevention.maintenance.title') }}</h4>
            <ul>
              <li>{{ t('help.terminals.troubleshooting.prevention.maintenance.tip1') }}</li>
              <li>{{ t('help.terminals.troubleshooting.prevention.maintenance.tip2') }}</li>
              <li>{{ t('help.terminals.troubleshooting.prevention.maintenance.tip3') }}</li>
              <li>{{ t('help.terminals.troubleshooting.prevention.maintenance.tip4') }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.terminals.troubleshooting.resources.title') }}</h2>
        <div class="resources-grid">
          <router-link :to="`${helpRoutePrefix}/terminals/getting-started`" class="resource-card">
            <i class="fas fa-play-circle"></i>
            <h4>{{ t('help.terminals.troubleshooting.resources.gettingStarted.title') }}</h4>
            <p>{{ t('help.terminals.troubleshooting.resources.gettingStarted.description') }}</p>
          </router-link>

          <router-link :to="`${helpRoutePrefix}/terminals/managing-sessions`" class="resource-card">
            <i class="fas fa-cogs"></i>
            <h4>{{ t('help.terminals.troubleshooting.resources.managingSessions.title') }}</h4>
            <p>{{ t('help.terminals.troubleshooting.resources.managingSessions.description') }}</p>
          </router-link>

          <router-link :to="`${helpRoutePrefix}/terminals/sharing`" class="resource-card">
            <i class="fas fa-share-alt"></i>
            <h4>{{ t('help.terminals.troubleshooting.resources.sharing.title') }}</h4>
            <p>{{ t('help.terminals.troubleshooting.resources.sharing.description') }}</p>
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHelpTranslations } from '../../../composables/useHelpTranslations'

const route = useRoute()
const { t } = useI18n()
const { loadHelpTranslations } = useHelpTranslations()

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

.diagnostic-checklist {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
}

.check-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.check-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.check-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-weight: 500;
  cursor: pointer;
}

.check-item label i {
  color: var(--color-primary);
  width: 20px;
}

.quick-actions {
  margin-top: 25px;
  padding: 20px;
  background: var(--color-info-bg);
  border-radius: 8px;
  border: 2px solid var(--color-info);
}

.quick-actions h3 {
  margin: 0 0 15px 0;
  color: var(--color-primary);
}

.problem-card {
  margin: 25px 0;
  border: 2px solid var(--color-gray-200);
  border-radius: 8px;
  overflow: hidden;
}

.problem-header {
  background: var(--color-danger-bg);
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--color-danger-border);
}

.problem-header i {
  color: var(--color-danger-text);
  font-size: 1.3rem;
}

.problem-header h3 {
  margin: 0;
  color: var(--color-danger-text);
  font-size: 1.1rem;
}

.problem-content {
  padding: 20px;
  background: var(--color-bg-primary);
}

.problem-content h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
  font-size: 1rem;
}

.problem-content ul {
  margin: 0 0 15px 20px;
  color: var(--color-text-secondary);
}

.solution-steps {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 15px 0;
}

.solution-step {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border-left: 4px solid var(--color-primary);
}

.step-number {
  background: var(--color-primary);
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.solution-step div {
  flex-grow: 1;
}

.solution-step strong {
  display: block;
  margin-bottom: 5px;
  color: var(--color-text-primary);
}

.solution-step p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.solution-step code {
  background: var(--color-gray-200);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.85rem;
}

.performance-tips {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.tip-card {
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
}

.tip-card i {
  font-size: 1.5rem;
  color: var(--color-primary);
  margin-bottom: 10px;
}

.tip-card h4 {
  margin: 0 0 15px 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.tip-card ul {
  margin: 0;
  padding-left: 20px;
  color: var(--color-text-secondary);
}

.tip-card li {
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.sync-issues {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.issue-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: var(--color-warning-bg);
  border-radius: 8px;
  border-left: 4px solid var(--color-warning);
}

.issue-item i {
  font-size: 1.3rem;
  color: var(--color-warning-text);
  margin-top: 5px;
  flex-shrink: 0;
}

.issue-item h4 {
  margin: 0 0 5px 0;
  color: var(--color-warning-text);
  font-size: 1rem;
}

.issue-item p {
  margin: 0;
  color: var(--color-warning-text);
  font-size: 0.9rem;
}

.support-triggers {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0;
}

.trigger-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid;
}

.trigger-item.critical {
  background: var(--color-danger-bg);
  border-color: var(--color-danger);
}

.trigger-item.high {
  background: var(--color-warning-bg);
  border-color: var(--color-warning);
}

.trigger-item.normal {
  background: var(--color-info-bg);
  border-color: var(--color-info);
}

.trigger-item i {
  font-size: 1.5rem;
  margin-top: 5px;
  flex-shrink: 0;
}

.trigger-item.critical i {
  color: var(--color-danger-text);
}

.trigger-item.high i {
  color: var(--color-warning-text);
}

.trigger-item.normal i {
  color: var(--color-info-text);
}

.trigger-item h4 {
  margin: 0 0 10px 0;
  font-size: 1.1rem;
}

.trigger-item.critical h4 {
  color: var(--color-danger-text);
}

.trigger-item.high h4 {
  color: var(--color-warning-text);
}

.trigger-item.normal h4 {
  color: var(--color-info-text);
}

.trigger-item ul {
  margin: 0;
  padding-left: 20px;
}

.trigger-item li {
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.contact-info {
  margin-top: 30px;
  padding: 25px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
}

.contact-info h3 {
  margin: 0 0 20px 0;
  color: var(--color-text-primary);
}

.info-checklist {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
  margin: 15px 0 25px 0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: var(--color-bg-primary);
  border-radius: 4px;
  border: 1px solid var(--color-gray-200);
}

.info-item i {
  color: var(--color-primary);
  width: 16px;
}

.info-item span {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.contact-action {
  text-align: center;
}

.prevention-tips {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.prevention-category {
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
}

.prevention-category h4 {
  margin: 0 0 15px 0;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.prevention-category h4 i {
  color: var(--color-primary);
}

.prevention-category ul {
  margin: 0;
  padding-left: 20px;
  color: var(--color-text-secondary);
}

.prevention-category li {
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
  font-size: 1.1rem;
}

.resource-card p {
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
  margin-right: 10px;
  margin-bottom: 10px;
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

  .performance-tips,
  .prevention-tips {
    grid-template-columns: 1fr;
  }

  .solution-step {
    flex-direction: column;
    text-align: center;
  }

  .trigger-item {
    flex-direction: column;
    text-align: center;
  }

  .info-checklist {
    grid-template-columns: 1fr;
  }

  .resources-grid {
    grid-template-columns: 1fr;
  }
}
</style>