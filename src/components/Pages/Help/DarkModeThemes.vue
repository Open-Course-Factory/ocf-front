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
      <h1><i class="fas fa-palette"></i> {{ t('help.account.themes.title') }}</h1>
      <p class="article-description">
        {{ t('help.account.themes.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> {{ t('help.account.themes.overview.title') }}</h2>
        <p>
          {{ t('help.account.themes.overview.description') }}
        </p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-adjust"></i> {{ t('help.account.themes.selection.title') }}</h2>
        <p>
          {{ t('help.account.themes.selection.description') }}
        </p>
        <div class="theme-options">
          <div class="theme-card light">
            <div class="theme-preview light-preview">
              <i class="fas fa-sun"></i>
            </div>
            <h4>{{ t('help.account.themes.selection.light.title') }}</h4>
            <p>{{ t('help.account.themes.selection.light.description') }}</p>
          </div>
          <div class="theme-card dark">
            <div class="theme-preview dark-preview">
              <i class="fas fa-moon"></i>
            </div>
            <h4>{{ t('help.account.themes.selection.dark.title') }}</h4>
            <p>{{ t('help.account.themes.selection.dark.description') }}</p>
          </div>
          <div class="theme-card auto">
            <div class="theme-preview auto-preview">
              <i class="fas fa-magic"></i>
            </div>
            <h4>{{ t('help.account.themes.selection.auto.title') }}</h4>
            <p>{{ t('help.account.themes.selection.auto.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-compress-alt"></i> {{ t('help.account.themes.compact.title') }}</h2>
        <p>
          {{ t('help.account.themes.compact.description') }}
        </p>
        <div class="compact-info">
          <div class="compact-card">
            <i class="fas fa-expand"></i>
            <h4>{{ t('help.account.themes.compact.standard.title') }}</h4>
            <p>{{ t('help.account.themes.compact.standard.description') }}</p>
          </div>
          <div class="compact-card">
            <i class="fas fa-compress"></i>
            <h4>{{ t('help.account.themes.compact.compact.title') }}</h4>
            <p>{{ t('help.account.themes.compact.compact.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-sliders-h"></i> {{ t('help.account.themes.whereToChange.title') }}</h2>
        <p>
          {{ t('help.account.themes.whereToChange.description') }}
        </p>
        <div class="info-box">
          <i class="fas fa-cog"></i>
          <p>{{ t('help.account.themes.whereToChange.path') }}</p>
        </div>
        <router-link :to="`${helpRoutePrefix}/account/settings`" class="btn btn-outline">
          <i class="fas fa-cog"></i>
          {{ t('help.account.themes.whereToChange.button') }}
        </router-link>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-check-circle"></i> {{ t('help.account.themes.consistency.title') }}</h2>
        <p>
          {{ t('help.account.themes.consistency.description') }}
        </p>
        <div class="consistency-grid">
          <div class="consistency-item">
            <i class="fas fa-terminal"></i>
            <span>{{ t('help.account.themes.consistency.terminal') }}</span>
          </div>
          <div class="consistency-item">
            <i class="fas fa-tachometer-alt"></i>
            <span>{{ t('help.account.themes.consistency.dashboard') }}</span>
          </div>
          <div class="consistency-item">
            <i class="fas fa-question-circle"></i>
            <span>{{ t('help.account.themes.consistency.help') }}</span>
          </div>
          <div class="consistency-item">
            <i class="fas fa-graduation-cap"></i>
            <span>{{ t('help.account.themes.consistency.courses') }}</span>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-arrow-right"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/account/settings`" class="next-step-card">
            <i class="fas fa-cog"></i>
            <h4>{{ t('help.account.themes.nextSteps.settings.title') }}</h4>
            <p>{{ t('help.account.themes.nextSteps.settings.description') }}</p>
          </router-link>

          <router-link :to="`${helpRoutePrefix}/terminals/getting-started`" class="next-step-card">
            <i class="fas fa-play-circle"></i>
            <h4>{{ t('help.account.themes.nextSteps.gettingStarted.title') }}</h4>
            <p>{{ t('help.account.themes.nextSteps.gettingStarted.description') }}</p>
          </router-link>

          <router-link :to="`${helpRoutePrefix}/account/subscription`" class="next-step-card">
            <i class="fas fa-calendar-check"></i>
            <h4>{{ t('help.account.themes.nextSteps.subscription.title') }}</h4>
            <p>{{ t('help.account.themes.nextSteps.subscription.description') }}</p>
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
.theme-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.theme-card {
  text-align: center;
  padding: 25px;
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
  transition: all 0.3s ease;
}

.theme-card:hover {
  transform: translateY(-5px);
}

.theme-card.light {
  background: var(--color-gray-50);
}

.theme-card.light:hover {
  border-color: var(--color-warning);
}

.theme-card.dark {
  background: var(--color-gray-50);
}

.theme-card.dark:hover {
  border-color: var(--color-primary);
}

.theme-card.auto {
  background: var(--color-gray-50);
}

.theme-card.auto:hover {
  border-color: var(--color-success);
}

.theme-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  font-size: 2rem;
}

.light-preview {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.dark-preview {
  background: var(--color-gray-200);
  color: var(--color-text-primary);
}

.auto-preview {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.theme-card h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
}

.theme-card p {
  margin: 0;
  color: var(--color-gray-600);
  font-size: 0.9rem;
  line-height: 1.5;
}

.compact-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.compact-card {
  text-align: center;
  padding: 25px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
  transition: all 0.3s ease;
}

.compact-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-5px);
}

.compact-card i {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 15px;
}

.compact-card h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
}

.compact-card p {
  margin: 0;
  color: var(--color-gray-600);
  font-size: 0.9rem;
  line-height: 1.5;
}

.info-box {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  background: var(--color-info-bg);
  border-radius: 8px;
  border-left: 4px solid var(--color-info);
  margin: 15px 0;
}

.info-box i {
  font-size: 1.3rem;
  color: var(--color-info);
  flex-shrink: 0;
}

.info-box p {
  margin: 0;
  color: var(--color-text-secondary);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 0.95rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-outline {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.btn-outline:hover {
  background: var(--color-primary);
  color: white;
}

.consistency-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.consistency-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: var(--color-success-bg);
  border-radius: 8px;
  border-left: 4px solid var(--color-success);
}

.consistency-item i {
  font-size: 1.3rem;
  color: var(--color-success);
  flex-shrink: 0;
}

.consistency-item span {
  color: var(--color-text-primary);
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .theme-options {
    grid-template-columns: 1fr;
  }

  .compact-info {
    grid-template-columns: 1fr;
  }

  .consistency-grid {
    grid-template-columns: 1fr;
  }

  .info-box {
    flex-direction: column;
    text-align: center;
  }

  .next-steps {
    grid-template-columns: 1fr;
  }
}
</style>
