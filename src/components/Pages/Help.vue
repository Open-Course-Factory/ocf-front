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
      <h1><i class="fas fa-question-circle"></i> {{ t('help.title') }}</h1>
      <p class="help-description">
        {{ t('help.subtitle') }}
      </p>
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

const { t } = useI18n()
const { loadHelpTranslations } = useHelpTranslations()
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
const backButtonText = computed(() => isPublicHelp.value ? 'Retour à l\'accueil' : 'Retour à l\'application')

const helpSections = computed(() => [
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
])

function toggleSection(sectionId: string) {
  if (expandedSections.value.has(sectionId)) {
    expandedSections.value.delete(sectionId)
  } else {
    expandedSections.value.add(sectionId)
  }
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
  gap: 8px;
  color: #6c757d;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.btn-back:hover {
  color: #007bff;
}

.btn-back i {
  font-size: 0.8rem;
}

.help-header {
  text-align: center;
  margin-bottom: 40px;
}

.help-header h1 {
  color: #333;
  font-size: 2.5rem;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.help-header h1 i {
  color: #007bff;
}

.help-description {
  color: #6c757d;
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
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-card {
  padding: 25px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.section-card:hover {
  background-color: #f8f9fa;
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
  color: #007bff;
}

.section-title h3 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
}

.section-toggle i {
  color: #6c757d;
  transition: transform 0.3s ease;
}

.section-toggle i.rotated {
  transform: rotate(180deg);
}

.section-description {
  color: #6c757d;
  margin: 0;
  font-size: 1rem;
}

.section-content {
  border-top: 1px solid #e9ecef;
  background-color: #f8f9fa;
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
  background: white;
  transition: all 0.3s ease;
  border-bottom: 1px solid #e9ecef;
}

.help-item:hover {
  background-color: #e3f2fd;
  transform: translateX(5px);
}

.item-icon {
  margin-right: 20px;
  flex-shrink: 0;
}

.item-icon i {
  font-size: 1.3rem;
  color: #007bff;
  width: 30px;
  text-align: center;
}

.item-content {
  flex-grow: 1;
}

.item-content h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1.1rem;
}

.item-content p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.item-arrow {
  margin-left: 15px;
  flex-shrink: 0;
}

.item-arrow i {
  color: #6c757d;
  font-size: 0.9rem;
}

.help-footer {
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
}

.contact-support h3 {
  color: #333;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.contact-support h3 i {
  color: #007bff;
}

.contact-support p {
  color: #6c757d;
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
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
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
}
</style>