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
      <h1><i class="fas fa-users"></i> {{ t('help.groups.management.title') }}</h1>
      <p class="article-description">
        {{ t('help.groups.management.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> {{ t('help.groups.management.overview.title') }}</h2>
        <p>{{ t('help.groups.management.overview.description') }}</p>

        <div class="feature-grid">
          <div class="feature-card">
            <i class="fas fa-sitemap"></i>
            <p>{{ t('help.groups.management.overview.feature1') }}</p>
          </div>
          <div class="feature-card">
            <i class="fas fa-terminal"></i>
            <p>{{ t('help.groups.management.overview.feature2') }}</p>
          </div>
          <div class="feature-card">
            <i class="fas fa-user-tag"></i>
            <p>{{ t('help.groups.management.overview.feature3') }}</p>
          </div>
          <div class="feature-card">
            <i class="fas fa-project-diagram"></i>
            <p>{{ t('help.groups.management.overview.feature4') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-plus-circle"></i> {{ t('help.groups.management.creating.title') }}</h2>
        <p>{{ t('help.groups.management.creating.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.groups.management.creating.step1.title') }}</h4>
            <p>{{ t('help.groups.management.creating.step1.description') }}</p>
            <router-link v-if="!isPublicHelp" to="/class-groups" class="btn btn-primary">
              <i class="fas fa-users"></i>
              {{ t('help.groups.management.creating.step1.title') }}
            </router-link>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.groups.management.creating.step2.title') }}</h4>
            <p>{{ t('help.groups.management.creating.step2.description') }}</p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('help.groups.management.creating.step3.title') }}</h4>
            <p>{{ t('help.groups.management.creating.step3.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-project-diagram"></i> {{ t('help.groups.management.hierarchy.title') }}</h2>
        <p>{{ t('help.groups.management.hierarchy.description') }}</p>

        <div class="hierarchy-features">
          <div class="hierarchy-item">
            <i class="fas fa-folder-tree"></i>
            <span>{{ t('help.groups.management.hierarchy.parentGroups') }}</span>
          </div>
          <div class="hierarchy-item">
            <i class="fas fa-arrow-down"></i>
            <span>{{ t('help.groups.management.hierarchy.inheritance') }}</span>
          </div>
          <div class="hierarchy-item">
            <i class="fas fa-hand-pointer"></i>
            <span>{{ t('help.groups.management.hierarchy.navigation') }}</span>
          </div>
          <div class="hierarchy-item">
            <i class="fas fa-eye"></i>
            <span>{{ t('help.groups.management.hierarchy.visualization') }}</span>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-user-tag"></i> {{ t('help.groups.management.roles.title') }}</h2>
        <p>{{ t('help.groups.management.roles.description') }}</p>

        <div class="roles-grid">
          <div class="role-card owner">
            <div class="role-header">
              <i class="fas fa-crown"></i>
              <h4>{{ t('help.groups.management.roles.owner.title') }}</h4>
            </div>
            <p>{{ t('help.groups.management.roles.owner.description') }}</p>
          </div>

          <div class="role-card admin">
            <div class="role-header">
              <i class="fas fa-user-shield"></i>
              <h4>{{ t('help.groups.management.roles.admin.title') }}</h4>
            </div>
            <p>{{ t('help.groups.management.roles.admin.description') }}</p>
          </div>

          <div class="role-card assistant">
            <div class="role-header">
              <i class="fas fa-hands-helping"></i>
              <h4>{{ t('help.groups.management.roles.assistant.title') }}</h4>
            </div>
            <p>{{ t('help.groups.management.roles.assistant.description') }}</p>
          </div>

          <div class="role-card member">
            <div class="role-header">
              <i class="fas fa-user"></i>
              <h4>{{ t('help.groups.management.roles.member.title') }}</h4>
            </div>
            <p>{{ t('help.groups.management.roles.member.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-book"></i> {{ t('help.groups.management.content.title') }}</h2>
        <p>{{ t('help.groups.management.content.description') }}</p>

        <div class="content-features">
          <div class="content-item">
            <i class="fas fa-graduation-cap"></i>
            <span>{{ t('help.groups.management.content.assignCourses') }}</span>
          </div>
          <div class="content-item">
            <i class="fas fa-terminal"></i>
            <span>{{ t('help.groups.management.content.terminalAccess') }}</span>
          </div>
          <div class="content-item">
            <i class="fas fa-calendar-alt"></i>
            <span>{{ t('help.groups.management.content.scheduling') }}</span>
          </div>
          <div class="content-item">
            <i class="fas fa-chart-line"></i>
            <span>{{ t('help.groups.management.content.tracking') }}</span>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-cog"></i> {{ t('help.groups.management.settings.title') }}</h2>
        <p>{{ t('help.groups.management.settings.description') }}</p>

        <ul>
          <li><strong>{{ t('help.groups.management.settings.general') }}</strong></li>
          <li><strong>{{ t('help.groups.management.settings.enrollment') }}</strong></li>
          <li><strong>{{ t('help.groups.management.settings.notifications') }}</strong></li>
          <li><strong>{{ t('help.groups.management.settings.limits') }}</strong></li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/organizations/overview`" class="next-step-card">
            <i class="fas fa-building"></i>
            <h4>{{ t('help.groups.management.nextSteps.organizations.title') }}</h4>
            <p>{{ t('help.groups.management.nextSteps.organizations.description') }}</p>
          </router-link>

          <router-link :to="`${helpRoutePrefix}/account/roles-and-permissions`" class="next-step-card">
            <i class="fas fa-user-shield"></i>
            <h4>{{ t('help.groups.management.nextSteps.roles.title') }}</h4>
            <p>{{ t('help.groups.management.nextSteps.roles.description') }}</p>
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
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 15px;
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
  margin-bottom: 10px;
}

.feature-card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.hierarchy-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
}

.hierarchy-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border-left: 4px solid var(--color-primary);
}

.hierarchy-item i {
  color: var(--color-primary);
  font-size: 1.2rem;
  flex-shrink: 0;
}

.hierarchy-item span {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.role-card {
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--color-gray-200);
}

.role-header {
  padding: 12px 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
}

.role-card.owner .role-header {
  background: linear-gradient(135deg, var(--color-warning-amber) 0%, var(--color-warning-amber-light) 100%);
}

.role-card.admin .role-header {
  background: linear-gradient(135deg, var(--color-org-personal) 0%, var(--color-org-personal-light) 100%);
}

.role-card.assistant .role-header {
  background: linear-gradient(135deg, var(--color-org-team) 0%, var(--color-org-team-light) 100%);
}

.role-card.member .role-header {
  background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-gray-500) 100%);
}

.role-header h4 {
  margin: 0;
  font-size: 1rem;
}

.role-card p {
  padding: 12px 15px;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.content-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
}

.content-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border-left: 4px solid var(--color-success);
}

.content-item i {
  color: var(--color-success);
  font-size: 1.2rem;
  flex-shrink: 0;
}

.content-item span {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

/* Responsive */
@media (max-width: 768px) {
  .feature-grid,
  .roles-grid {
    grid-template-columns: 1fr;
  }
}
</style>
