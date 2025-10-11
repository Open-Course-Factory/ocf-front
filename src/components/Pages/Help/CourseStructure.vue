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
      <h1><i class="fas fa-sitemap"></i> {{ t('help.courses.structure.title') }}</h1>
      <p class="article-description">
        {{ t('help.courses.structure.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-layer-group"></i> {{ t('help.courses.structure.hierarchy.title') }}</h2>
        <p>
          {{ t('help.courses.structure.hierarchy.description') }}
        </p>

        <div class="hierarchy-diagram">
          <div class="level-card level-1">
            <div class="level-icon">
              <i class="fas fa-book"></i>
            </div>
            <div class="level-content">
              <h3>{{ t('help.courses.structure.hierarchy.levels.course.title') }}</h3>
              <p>{{ t('help.courses.structure.hierarchy.levels.course.description') }}</p>
              <div class="level-examples">
                <span class="example-tag">{{ t('help.courses.structure.hierarchy.levels.course.example1') }}</span>
                <span class="example-tag">{{ t('help.courses.structure.hierarchy.levels.course.example2') }}</span>
                <span class="example-tag">{{ t('help.courses.structure.hierarchy.levels.course.example3') }}</span>
              </div>
            </div>
          </div>

          <div class="hierarchy-arrow">
            <i class="fas fa-arrow-down"></i>
          </div>

          <div class="level-card level-2">
            <div class="level-icon">
              <i class="fas fa-book-open"></i>
            </div>
            <div class="level-content">
              <h3>{{ t('help.courses.structure.hierarchy.levels.chapter.title') }}</h3>
              <p>{{ t('help.courses.structure.hierarchy.levels.chapter.description') }}</p>
              <div class="level-examples">
                <span class="example-tag">{{ t('help.courses.structure.hierarchy.levels.chapter.example1') }}</span>
                <span class="example-tag">{{ t('help.courses.structure.hierarchy.levels.chapter.example2') }}</span>
                <span class="example-tag">{{ t('help.courses.structure.hierarchy.levels.chapter.example3') }}</span>
              </div>
            </div>
          </div>

          <div class="hierarchy-arrow">
            <i class="fas fa-arrow-down"></i>
          </div>

          <div class="level-card level-3">
            <div class="level-icon">
              <i class="fas fa-stream"></i>
            </div>
            <div class="level-content">
              <h3>{{ t('help.courses.structure.hierarchy.levels.section.title') }}</h3>
              <p>{{ t('help.courses.structure.hierarchy.levels.section.description') }}</p>
              <div class="level-examples">
                <span class="example-tag">{{ t('help.courses.structure.hierarchy.levels.section.example1') }}</span>
                <span class="example-tag">{{ t('help.courses.structure.hierarchy.levels.section.example2') }}</span>
                <span class="example-tag">{{ t('help.courses.structure.hierarchy.levels.section.example3') }}</span>
              </div>
            </div>
          </div>

          <div class="hierarchy-arrow">
            <i class="fas fa-arrow-down"></i>
          </div>

          <div class="level-card level-4">
            <div class="level-icon">
              <i class="fas fa-file-alt"></i>
            </div>
            <div class="level-content">
              <h3>{{ t('help.courses.structure.hierarchy.levels.page.title') }}</h3>
              <p>{{ t('help.courses.structure.hierarchy.levels.page.description') }}</p>
              <div class="level-examples">
                <span class="example-tag">{{ t('help.courses.structure.hierarchy.levels.page.example1') }}</span>
                <span class="example-tag">{{ t('help.courses.structure.hierarchy.levels.page.example2') }}</span>
                <span class="example-tag">{{ t('help.courses.structure.hierarchy.levels.page.example3') }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-plus-circle"></i> {{ t('help.courses.structure.creation.title') }}</h2>
        <p>
          {{ t('help.courses.structure.creation.description') }}
        </p>

        <div class="creation-workflow">
          <div class="workflow-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>{{ t('help.courses.structure.creation.step1.title') }}</h4>
              <p>
                {{ t('help.courses.structure.creation.step1.description') }}
              </p>
              <router-link to="/courses" class="btn btn-outline">
                <i class="fas fa-book"></i>
                {{ t('help.courses.structure.creation.step1.button') }}
              </router-link>
            </div>
          </div>

          <div class="workflow-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>{{ t('help.courses.structure.creation.step2.title') }}</h4>
              <p>
                {{ t('help.courses.structure.creation.step2.description') }}
              </p>
              <router-link to="/chapters" class="btn btn-outline">
                <i class="fas fa-book-open"></i>
                {{ t('help.courses.structure.creation.step2.button') }}
              </router-link>
            </div>
          </div>

          <div class="workflow-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>{{ t('help.courses.structure.creation.step3.title') }}</h4>
              <p>
                {{ t('help.courses.structure.creation.step3.description') }}
              </p>
              <router-link to="/sections" class="btn btn-outline">
                <i class="fas fa-stream"></i>
                {{ t('help.courses.structure.creation.step3.button') }}
              </router-link>
            </div>
          </div>

          <div class="workflow-step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h4>{{ t('help.courses.structure.creation.step4.title') }}</h4>
              <p>
                {{ t('help.courses.structure.creation.step4.description') }}
              </p>
              <router-link to="/pages" class="btn btn-outline">
                <i class="fas fa-file-alt"></i>
                {{ t('help.courses.structure.creation.step4.button') }}
              </router-link>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-cogs"></i> {{ t('help.courses.structure.organization.title') }}</h2>
        <p>
          {{ t('help.courses.structure.organization.description') }}
        </p>

        <div class="practices-grid">
          <div class="practice-card">
            <i class="fas fa-bullseye"></i>
            <h4>{{ t('help.courses.structure.organization.tips.tip1.title') }}</h4>
            <p>
              {{ t('help.courses.structure.organization.tips.tip1.description') }}
            </p>
          </div>

          <div class="practice-card">
            <i class="fas fa-sort-amount-up"></i>
            <h4>{{ t('help.courses.structure.organization.tips.tip2.title') }}</h4>
            <p>
              {{ t('help.courses.structure.organization.tips.tip2.description') }}
            </p>
          </div>

          <div class="practice-card">
            <i class="fas fa-balance-scale"></i>
            <h4>{{ t('help.courses.structure.organization.tips.tip3.title') }}</h4>
            <p>
              {{ t('help.courses.structure.organization.tips.tip3.description') }}
            </p>
          </div>

          <div class="practice-card">
            <i class="fas fa-tags"></i>
            <h4>{{ t('help.courses.structure.organization.tips.tip4.title') }}</h4>
            <p>
              {{ t('help.courses.structure.organization.tips.tip4.description') }}
            </p>
          </div>
        </div>

        <div class="structuring-tips">
          <h3>{{ t('help.courses.structure.organization.structuring.title') }}</h3>
          <div class="tip-list">
            <div class="tip-item">
              <i class="fas fa-lightbulb"></i>
              <div>
                <h4>{{ t('help.courses.structure.organization.structuring.tip1.title') }}</h4>
                <p>
                  {{ t('help.courses.structure.organization.structuring.tip1.description') }}
                </p>
              </div>
            </div>

            <div class="tip-item">
              <i class="fas fa-puzzle-piece"></i>
              <div>
                <h4>{{ t('help.courses.structure.organization.structuring.tip2.title') }}</h4>
                <p>
                  {{ t('help.courses.structure.organization.structuring.tip2.description') }}
                </p>
              </div>
            </div>

            <div class="tip-item">
              <i class="fas fa-route"></i>
              <div>
                <h4>{{ t('help.courses.structure.organization.structuring.tip3.title') }}</h4>
                <p>
                  {{ t('help.courses.structure.organization.structuring.tip3.description') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-link"></i> {{ t('help.courses.structure.relationships.title') }}</h2>
        <p>
          {{ t('help.courses.structure.relationships.description') }}
        </p>

        <div class="relationships-info">
          <div class="relationship-card">
            <h4><i class="fas fa-sitemap"></i> {{ t('help.courses.structure.relationships.strict.title') }}</h4>
            <p>
              {{ t('help.courses.structure.relationships.strict.description') }}
            </p>
          </div>

          <div class="relationship-card">
            <h4><i class="fas fa-copy"></i> {{ t('help.courses.structure.relationships.reuse.title') }}</h4>
            <p>
              {{ t('help.courses.structure.relationships.reuse.description') }}
            </p>
          </div>

          <div class="relationship-card">
            <h4><i class="fas fa-share-alt"></i> {{ t('help.courses.structure.relationships.sharing.title') }}</h4>
            <p>
              {{ t('help.courses.structure.relationships.sharing.description') }}
            </p>
          </div>
        </div>
      </section>

      <section class="help-section info">
        <h2><i class="fas fa-info-circle"></i> {{ t('help.courses.structure.evolution.title') }}</h2>
        <div class="evolution-notice">
          <p v-html="t('help.courses.structure.evolution.notice')"></p>
          <p>
            {{ t('help.courses.structure.evolution.documentation') }}
          </p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/courses/content`" class="next-step-card">
            <i class="fas fa-edit"></i>
            <h4>{{ t('help.courses.structure.nextSteps.content.title') }}</h4>
            <p>{{ t('help.courses.structure.nextSteps.content.description') }}</p>
          </router-link>

          <div class="next-step-card disabled">
            <i class="fas fa-users"></i>
            <h4>{{ t('help.courses.structure.nextSteps.collaboration.title') }}</h4>
            <p>{{ t('help.courses.structure.nextSteps.collaboration.description') }}</p>
          </div>
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
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.back-link:hover {
  color: #0056b3;
}

.article-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 2px solid #e9ecef;
}

.article-header h1 {
  color: #333;
  font-size: 2.5rem;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.article-header h1 i {
  color: #007bff;
}

.article-description {
  color: #6c757d;
  font-size: 1.2rem;
  margin: 0;
}

.article-content {
  line-height: 1.6;
}

.help-section {
  margin-bottom: 40px;
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.help-section.info {
  background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
  border-left: 4px solid #17a2b8;
}

.help-section h2 {
  color: #333;
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.help-section h2 i {
  color: #007bff;
}

.help-section.info h2 i {
  color: #17a2b8;
}

.help-section h3 {
  color: #333;
  margin: 25px 0 15px 0;
  font-size: 1.2rem;
}

.help-section p {
  color: #555;
  margin-bottom: 15px;
}

.hierarchy-diagram {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin: 30px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.level-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 2px solid;
  width: 100%;
  max-width: 600px;
  transition: all 0.3s ease;
}

.level-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.level-1 { border-color: #dc3545; }
.level-2 { border-color: #fd7e14; }
.level-3 { border-color: #ffc107; }
.level-4 { border-color: #28a745; }

.level-icon {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.level-1 .level-icon { background: #dc3545; }
.level-2 .level-icon { background: #fd7e14; }
.level-3 .level-icon { background: #ffc107; }
.level-4 .level-icon { background: #28a745; }

.level-content {
  flex-grow: 1;
}

.level-content h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 1.3rem;
}

.level-content p {
  margin: 0 0 12px 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.level-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.example-tag {
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  color: #495057;
  border: 1px solid #dee2e6;
}

.hierarchy-arrow {
  color: #6c757d;
  font-size: 1.5rem;
  margin: 5px 0;
}

.creation-workflow {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 25px 0;
}

.workflow-step {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.step-number {
  background: #007bff;
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
  color: #333;
  font-size: 1.1rem;
}

.step-content p {
  margin: 0 0 15px 0;
  color: #555;
}

.practices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.practice-card {
  text-align: center;
  padding: 25px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.practice-card:hover {
  border-color: #007bff;
  transform: translateY(-5px);
}

.practice-card i {
  font-size: 2.5rem;
  color: #007bff;
  margin-bottom: 15px;
}

.practice-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.practice-card p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
}

.structuring-tips {
  margin-top: 30px;
}

.tip-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: #fff3cd;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
}

.tip-item i {
  font-size: 1.3rem;
  color: #856404;
  margin-top: 5px;
  flex-shrink: 0;
}

.tip-item h4 {
  margin: 0 0 5px 0;
  color: #856404;
  font-size: 1rem;
}

.tip-item p {
  margin: 0;
  color: #856404;
  font-size: 0.9rem;
}

.relationships-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.relationship-card {
  padding: 20px;
  background: #e3f2fd;
  border: 2px solid #2196f3;
  border-radius: 8px;
}

.relationship-card h4 {
  margin: 0 0 10px 0;
  color: #1976d2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.relationship-card p {
  margin: 0;
  color: #333;
  font-size: 0.9rem;
}

.evolution-notice {
  background: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.evolution-notice p {
  margin: 0 0 15px 0;
}

.evolution-notice p:last-child {
  margin: 0;
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
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  text-align: center;
}

.next-step-card:hover:not(.disabled) {
  border-color: #007bff;
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.next-step-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.next-step-card i {
  font-size: 2rem;
  color: #007bff;
  margin-bottom: 15px;
}

.next-step-card.disabled i {
  color: #6c757d;
}

.next-step-card h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1rem;
}

.next-step-card p {
  margin: 0;
  color: #6c757d;
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

.btn-outline {
  background-color: transparent;
  color: #007bff;
  border: 2px solid #007bff;
}

.btn-outline:hover {
  background-color: #007bff;
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

  .level-card {
    flex-direction: column;
    text-align: center;
  }

  .workflow-step {
    flex-direction: column;
    text-align: center;
  }

  .practices-grid,
  .relationships-info {
    grid-template-columns: 1fr;
  }

  .next-steps {
    grid-template-columns: 1fr;
  }
}
</style>