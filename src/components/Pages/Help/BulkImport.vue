<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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
      <h1><i class="fas fa-file-import"></i> {{ t('help.organizations.bulkImport.title') }}</h1>
      <p class="article-description">{{ t('help.organizations.bulkImport.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-map-marker-alt"></i> {{ t('help.organizations.bulkImport.where.title') }}</h2>
        <p>{{ t('help.organizations.bulkImport.where.description') }}</p>
        <HelpScreenshot name="organization-import" :caption="t('help.organizations.bulkImport.where.caption')" />
      </section>

      <section class="help-section">
        <h2><i class="fas fa-file-csv"></i> {{ t('help.organizations.bulkImport.files.title') }}</h2>
        <p>{{ t('help.organizations.bulkImport.files.description') }}</p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.organizations.bulkImport.files.users.title') }}</h4>
            <p v-html="t('help.organizations.bulkImport.files.users.description')"></p>
            <div class="code-example"><code>email,name<br>marie.dupont@univ-labinux.example,DUPONT Marie<br>jean.martin@univ-labinux.example,MARTIN Jean</code></div>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.organizations.bulkImport.files.groups.title') }}</h4>
            <p v-html="t('help.organizations.bulkImport.files.groups.description')"></p>
            <div class="code-example"><code>group_name,display_name,description,parent_group,max_members,expires_at,external_id<br>l3-info-a,L3 Informatique — Groupe A,Troisième année — groupe A,,50,2027-06-30T23:59:59Z,l3a</code></div>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('help.organizations.bulkImport.files.memberships.title') }}</h4>
            <p v-html="t('help.organizations.bulkImport.files.memberships.description')"></p>
            <div class="code-example"><code>user_email,group_name,role<br>marie.dupont@univ-labinux.example,l3-info-a,member<br>claire.martin@univ-labinux.example,l3-info-a,teacher</code></div>
          </div>
        </div>

        <p v-html="t('help.organizations.bulkImport.files.nameSplit')"></p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-sliders-h"></i> {{ t('help.organizations.bulkImport.options.title') }}</h2>
        <ul>
          <li v-html="t('help.organizations.bulkImport.options.update')"></li>
          <li v-html="t('help.organizations.bulkImport.options.verified')"></li>
          <li v-html="t('help.organizations.bulkImport.options.target')"></li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-check-double"></i> {{ t('help.organizations.bulkImport.run.title') }}</h2>
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('help.organizations.bulkImport.run.step1.title') }}</h4>
            <p>{{ t('help.organizations.bulkImport.run.step1.description') }}</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('help.organizations.bulkImport.run.step2.title') }}</h4>
            <p>{{ t('help.organizations.bulkImport.run.step2.description') }}</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('help.organizations.bulkImport.run.step3.title') }}</h4>
            <p>{{ t('help.organizations.bulkImport.run.step3.description') }}</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">4</div>
          <div class="step-content">
            <h4>{{ t('help.organizations.bulkImport.run.step4.title') }}</h4>
            <p>{{ t('help.organizations.bulkImport.run.step4.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/classes/members`" class="next-step-card">
            <i class="fas fa-user-plus"></i>
            <h4>{{ t('help.organizations.bulkImport.nextSteps.classes.title') }}</h4>
            <p>{{ t('help.organizations.bulkImport.nextSteps.classes.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/organizations/overview`" class="next-step-card">
            <i class="fas fa-building"></i>
            <h4>{{ t('help.organizations.bulkImport.nextSteps.overview.title') }}</h4>
            <p>{{ t('help.organizations.bulkImport.nextSteps.overview.description') }}</p>
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
import HelpScreenshot from './HelpScreenshot.vue'

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
/* Page-specific styles only - common help article styles are in help-article.css */
</style>
