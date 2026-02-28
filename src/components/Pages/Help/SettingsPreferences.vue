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
      <h1><i class="fas fa-cog"></i> {{ t('help.account.settings.title') }}</h1>
      <p class="article-description">
        {{ t('help.account.settings.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> {{ t('help.account.settings.overview.title') }}</h2>
        <p>
          {{ t('help.account.settings.overview.description') }}
        </p>
        <div class="info-box">
          <i class="fas fa-mouse-pointer"></i>
          <p>{{ t('help.account.settings.overview.access') }}</p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-compass"></i> {{ t('help.account.settings.navigation.title') }}</h2>
        <p>
          {{ t('help.account.settings.navigation.description') }}
        </p>
        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-home"></i>
          </div>
          <div class="feature-content">
            <h4>{{ t('help.account.settings.navigation.defaultPage.title') }}</h4>
            <p>{{ t('help.account.settings.navigation.defaultPage.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-globe"></i> {{ t('help.account.settings.localization.title') }}</h2>
        <p>
          {{ t('help.account.settings.localization.description') }}
        </p>
        <div class="settings-grid">
          <div class="setting-card">
            <i class="fas fa-language"></i>
            <h4>{{ t('help.account.settings.localization.language.title') }}</h4>
            <p>{{ t('help.account.settings.localization.language.description') }}</p>
          </div>
          <div class="setting-card">
            <i class="fas fa-clock"></i>
            <h4>{{ t('help.account.settings.localization.timezone.title') }}</h4>
            <p>{{ t('help.account.settings.localization.timezone.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-palette"></i> {{ t('help.account.settings.ui.title') }}</h2>
        <p>
          {{ t('help.account.settings.ui.description') }}
        </p>
        <div class="settings-grid">
          <div class="setting-card">
            <i class="fas fa-adjust"></i>
            <h4>{{ t('help.account.settings.ui.theme.title') }}</h4>
            <p>{{ t('help.account.settings.ui.theme.description') }}</p>
          </div>
          <div class="setting-card">
            <i class="fas fa-compress-alt"></i>
            <h4>{{ t('help.account.settings.ui.compact.title') }}</h4>
            <p>{{ t('help.account.settings.ui.compact.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-bell"></i> {{ t('help.account.settings.notifications.title') }}</h2>
        <p>
          {{ t('help.account.settings.notifications.description') }}
        </p>
        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-sliders-h"></i>
          </div>
          <div class="feature-content">
            <h4>{{ t('help.account.settings.notifications.preferences.title') }}</h4>
            <p>{{ t('help.account.settings.notifications.preferences.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-lock"></i> {{ t('help.account.settings.security.title') }}</h2>
        <p>
          {{ t('help.account.settings.security.description') }}
        </p>
        <div class="security-steps">
          <div class="security-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>{{ t('help.account.settings.security.currentPassword.title') }}</h4>
              <p>{{ t('help.account.settings.security.currentPassword.description') }}</p>
            </div>
          </div>
          <div class="security-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>{{ t('help.account.settings.security.newPassword.title') }}</h4>
              <p>{{ t('help.account.settings.security.newPassword.description') }}</p>
            </div>
          </div>
          <div class="security-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>{{ t('help.account.settings.security.confirmation.title') }}</h4>
              <p>{{ t('help.account.settings.security.confirmation.description') }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-key"></i> {{ t('help.account.settings.sshKeys.title') }}</h2>
        <p>
          {{ t('help.account.settings.sshKeys.description') }}
        </p>
        <div class="info-box">
          <i class="fas fa-arrow-right"></i>
          <p>
            {{ t('help.account.settings.sshKeys.linkText') }}
          </p>
        </div>
        <router-link :to="`${helpRoutePrefix}/terminals/ssh-keys`" class="btn btn-outline">
          <i class="fas fa-key"></i>
          {{ t('help.account.settings.sshKeys.button') }}
        </router-link>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-code-branch"></i> {{ t('help.account.settings.version.title') }}</h2>
        <p>
          {{ t('help.account.settings.version.description') }}
        </p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-arrow-right"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/account/themes`" class="next-step-card">
            <i class="fas fa-palette"></i>
            <h4>{{ t('help.account.settings.nextSteps.themes.title') }}</h4>
            <p>{{ t('help.account.settings.nextSteps.themes.description') }}</p>
          </router-link>

          <router-link :to="`${helpRoutePrefix}/terminals/ssh-keys`" class="next-step-card">
            <i class="fas fa-key"></i>
            <h4>{{ t('help.account.settings.nextSteps.sshKeys.title') }}</h4>
            <p>{{ t('help.account.settings.nextSteps.sshKeys.description') }}</p>
          </router-link>

          <router-link :to="`${helpRoutePrefix}/account/roles-and-permissions`" class="next-step-card">
            <i class="fas fa-user-shield"></i>
            <h4>{{ t('help.account.settings.nextSteps.roles.title') }}</h4>
            <p>{{ t('help.account.settings.nextSteps.roles.description') }}</p>
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
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.setting-card {
  text-align: center;
  padding: 25px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
  transition: all 0.3s ease;
}

.setting-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-5px);
}

.setting-card i {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 15px;
}

.setting-card h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
}

.setting-card p {
  margin: 0;
  color: var(--color-gray-600);
  font-size: 0.9rem;
  line-height: 1.5;
}

.feature-card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border-left: 4px solid var(--color-primary);
  margin: 20px 0;
}

.feature-icon {
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

.feature-content h4 {
  margin: 0 0 8px 0;
  color: var(--color-text-primary);
}

.feature-content p {
  margin: 0;
  color: var(--color-text-secondary);
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

.security-steps {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.security-step {
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

.step-content h4 {
  margin: 0 0 8px 0;
  color: var(--color-text-primary);
}

.step-content p {
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

/* Responsive */
@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .feature-card {
    flex-direction: column;
    text-align: center;
  }

  .security-step {
    flex-direction: column;
    text-align: center;
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
