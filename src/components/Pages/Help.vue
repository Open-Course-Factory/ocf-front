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
  <div class="help-page">
    <div class="back-button">
      <router-link :to="backRoute" class="btn-back">
        <i class="fas fa-arrow-left"></i>
        {{ backButtonText }}
      </router-link>
    </div>
    <div class="help-header">
      <div class="header-content">
        <div class="header-text">
          <h1><i class="fas fa-question-circle"></i> {{ t('help.title') }}</h1>
          <p class="help-description">
            {{ t('help.subtitle') }}
          </p>
        </div>
        <div v-if="isPublicHelp" class="header-controls">
          <div class="language-selector">
            <select :value="currentLocale" @change="handleLocaleChange" class="help-language-select">
              <option v-for="localeCode in supportedLocales" :key="`help-locale-${localeCode}`" :value="localeCode">
                {{ getLocaleInfo(localeCode).flag }} {{ getLocaleInfo(localeCode).name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="help-sections">
      <div class="help-section" v-for="section in helpSections" :key="section.id">
        <div class="section-card" @click="toggleSection(section.id)">
          <div class="section-header">
            <div class="section-title">
              <i :class="section.icon"></i>
              <h3>{{ section.title }}</h3>
            </div>
            <div class="section-toggle">
              <i class="fas fa-chevron-down" :class="{ rotated: expandedSections.has(section.id) }"></i>
            </div>
          </div>
          <p class="section-description">{{ section.description }}</p>
        </div>

        <div v-if="expandedSections.has(section.id)" class="section-content">
          <div class="help-items">
            <router-link
              v-for="item in section.items"
              :key="item.route"
              :to="item.route"
              class="help-item"
            >
              <div class="item-icon">
                <i :class="item.icon"></i>
              </div>
              <div class="item-content">
                <h4>{{ item.title }}</h4>
                <p>{{ item.description }}</p>
              </div>
              <div class="item-arrow">
                <i class="fas fa-arrow-right"></i>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <div class="help-footer">
      <div class="contact-support">
        <h3><i class="fas fa-headset"></i> {{ t('help.contact.title') }}</h3>
        <p>{{ t('help.contact.text') }} <a href="mailto:contact@labinux.com">contact@labinux.com</a></p>
        <a href="mailto:contact@labinux.com" class="btn btn-primary">
          <i class="fas fa-envelope"></i>
          {{ t('help.contact.title') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useHelpTranslations } from '../../composables/useHelpTranslations'
import { useLocale } from '../../composables/useLocale'
import { useFeatureFlags } from '../../composables/useFeatureFlags'

const { t } = useI18n()
const { loadHelpTranslations } = useHelpTranslations()
const { currentLocale, supportedLocales, setLocale, getLocaleInfo } = useLocale()
const { isEnabled } = useFeatureFlags()
const route = useRoute()

onMounted(async () => {
  await loadHelpTranslations()
})

const expandedSections = ref(new Set<string>())

// Determine if this is public help (non-authenticated) or authenticated help
const isPublicHelp = computed(() => route.path.startsWith('/help-public'))
const routePrefix = computed(() => isPublicHelp.value ? '/help-public' : '/help')

// Back button configuration
const backRoute = computed(() => isPublicHelp.value ? '/' : '/courses')
const backButtonText = computed(() => isPublicHelp.value ? t('help.backToHome') : t('help.backToApp'))

// Feature flag mapping for help sections
const sectionFeatureFlags: Record<string, string> = {
  terminals: 'terminal_management',
  courses: 'course_conception',
  // account section is always visible (no feature flag)
}

const helpSections = computed(() => {
  const allSections = [
    {
      id: 'terminals',
      title: t('help.sections.terminals.title'),
      description: t('help.sections.terminals.description'),
      icon: 'fas fa-terminal',
      items: [
        {
          route: `${routePrefix.value}/terminals/getting-started`,
          title: t('help.sections.terminals.gettingStarted'),
          description: t('help.terminals.gettingStarted.intro'),
          icon: 'fas fa-play-circle'
        },
        {
          route: `${routePrefix.value}/terminals/managing-sessions`,
          title: t('help.sections.terminals.managingSessions'),
          description: t('help.terminals.managingSessions.intro'),
          icon: 'fas fa-cogs'
        },
        {
          route: `${routePrefix.value}/terminals/sharing`,
          title: t('help.sections.terminals.sharing'),
          description: t('help.terminals.sharing.intro'),
          icon: 'fas fa-share-alt'
        },
        {
          route: `${routePrefix.value}/terminals/troubleshooting`,
          title: t('help.sections.terminals.troubleshooting'),
          description: t('help.terminals.troubleshooting.intro'),
          icon: 'fas fa-wrench'
        }
      ]
    },
    {
      id: 'courses',
      title: t('help.sections.courses.title'),
      description: t('help.sections.courses.description'),
      icon: 'fas fa-graduation-cap',
      items: [
        {
          route: `${routePrefix.value}/courses/structure`,
          title: t('help.sections.courses.structure'),
          description: t('help.courses.structure.intro'),
          icon: 'fas fa-sitemap'
        },
        {
          route: `${routePrefix.value}/courses/content`,
          title: t('help.sections.courses.content'),
          description: t('help.courses.content.intro'),
          icon: 'fas fa-edit'
        }
      ]
    },
    {
      id: 'account',
      title: t('help.sections.account.title'),
      description: t('help.sections.account.description'),
      icon: 'fas fa-user-cog',
      items: [
        {
          route: `${routePrefix.value}/account/subscription`,
          title: t('help.sections.account.subscription'),
          description: t('help.account.subscription.intro'),
          icon: 'fas fa-calendar-check'
        },
        {
          route: `${routePrefix.value}/account/billing`,
          title: t('help.sections.account.billing'),
          description: t('help.account.billing.intro'),
          icon: 'fas fa-credit-card'
        }
      ]
    }
  ]

  // Filter sections based on feature flags
  return allSections.filter(section => {
    const featureFlag = sectionFeatureFlags[section.id]
    // If no feature flag is defined for this section, always show it
    if (!featureFlag) return true
    // Otherwise, check if the feature flag is enabled
    return isEnabled(featureFlag)
  })
})

function toggleSection(sectionId: string) {
  if (expandedSections.value.has(sectionId)) {
    expandedSections.value.delete(sectionId)
  } else {
    expandedSections.value.add(sectionId)
  }
}

function handleLocaleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  setLocale(target.value)
}
</script>

<style scoped>
.help-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.back-button {
  margin-bottom: 20px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: var(--font-size-sm);
  transition: color var(--transition-base);
}

.btn-back:hover {
  color: var(--color-primary);
}

.btn-back i {
  font-size: 0.8rem;
}

.help-header {
  text-align: center;
  margin-bottom: 40px;
}

.help-header h1 {
  color: var(--color-text-primary);
  font-size: 2.5rem;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.help-header h1 i {
  color: var(--color-primary);
}

.help-description {
  color: var(--color-text-muted);
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
}

.help-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 60px;
}

.help-section {
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-primary);
  box-shadow: var(--shadow-sm);
}

.section-card {
  padding: 25px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.section-card:hover {
  background-color: var(--color-bg-secondary);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.section-title i {
  font-size: 1.5rem;
  color: var(--color-primary);
}

.section-title h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.3rem;
}

.section-toggle i {
  color: var(--color-text-muted);
  transition: transform 0.3s ease;
}

.section-toggle i.rotated {
  transform: rotate(180deg);
}

.section-description {
  color: var(--color-text-muted);
  margin: 0;
  font-size: 1rem;
}

.section-content {
  border-top: var(--border-width-thin) solid var(--color-border-light);
  background-color: var(--color-bg-secondary);
}

.help-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1px;
}

.help-item {
  display: flex;
  align-items: center;
  padding: 20px 25px;
  text-decoration: none;
  color: inherit;
  background: var(--color-bg-primary);
  transition: all 0.3s ease;
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

.help-item:hover {
  background-color: var(--color-primary-light);
  transform: translateX(5px);
}

.item-icon {
  margin-right: 20px;
  flex-shrink: 0;
}

.item-icon i {
  font-size: 1.3rem;
  color: var(--color-primary);
  width: 30px;
  text-align: center;
}

.item-content {
  flex-grow: 1;
}

.item-content h4 {
  margin: 0 0 5px 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.item-content p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.item-arrow {
  margin-left: 15px;
  flex-shrink: 0;
}

.item-arrow i {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.help-footer {
  text-align: center;
  padding: 40px 20px;
  background: var(--color-bg-secondary);
  border-radius: 8px;
}

.contact-support h3 {
  color: var(--color-text-primary);
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.contact-support h3 i {
  color: var(--color-primary);
}

.contact-support p {
  color: var(--color-text-muted);
  margin: 0 0 25px 0;
  font-size: 1.1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.header-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
}

.language-selector {
  display: flex;
  align-items: center;
}

.help-language-select {
  padding: 8px 12px;
  border-radius: 6px;
  border: var(--border-width-thin) solid var(--color-border-medium);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s ease;
  min-width: 140px;
}

.help-language-select:hover {
  border-color: var(--color-border-dark);
}

.help-language-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus-primary);
}

.help-language-select option {
  padding: 8px;
  font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
  .help-page {
    padding: 10px;
  }

  .help-header h1 {
    font-size: 2rem;
    flex-direction: column;
    gap: 10px;
  }

  .help-description {
    font-size: 1rem;
  }

  .section-card {
    padding: 20px;
  }

  .help-items {
    grid-template-columns: 1fr;
  }

  .help-item {
    padding: 15px 20px;
  }

  .item-icon {
    margin-right: 15px;
  }

  .header-controls {
    margin-top: 15px;
  }

  .help-language-select {
    padding: 6px 10px;
    min-width: 120px;
    font-size: 12px;
  }
}
</style>