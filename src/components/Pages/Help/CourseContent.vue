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
      <h1><i class="fas fa-edit"></i> {{ t('help.courses.content.title') }}</h1>
      <p class="article-description">
        {{ t('help.courses.content.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-file-alt"></i> {{ t('help.courses.content.types.title') }}</h2>
        <p>
          {{ t('help.courses.content.types.description') }}
        </p>

        <div class="content-types-grid">
          <div class="content-type-card">
            <i class="fas fa-book-reader"></i>
            <h4>{{ t('help.courses.content.types.theoretical.title') }}</h4>
            <p>
              {{ t('help.courses.content.types.theoretical.description') }}
            </p>
            <div class="features">
              <span class="feature-tag">{{ t('help.courses.content.types.theoretical.tag1') }}</span>
              <span class="feature-tag">{{ t('help.courses.content.types.theoretical.tag2') }}</span>
              <span class="feature-tag">{{ t('help.courses.content.types.theoretical.tag3') }}</span>
            </div>
          </div>

          <div class="content-type-card">
            <i class="fas fa-laptop-code"></i>
            <h4>{{ t('help.courses.content.types.practical.title') }}</h4>
            <p>
              {{ t('help.courses.content.types.practical.description') }}
            </p>
            <div class="features">
              <span class="feature-tag">{{ t('help.courses.content.types.practical.tag1') }}</span>
              <span class="feature-tag">{{ t('help.courses.content.types.practical.tag2') }}</span>
              <span class="feature-tag">{{ t('help.courses.content.types.practical.tag3') }}</span>
            </div>
          </div>

          <div class="content-type-card">
            <i class="fas fa-clipboard-check"></i>
            <h4>{{ t('help.courses.content.types.assessments.title') }}</h4>
            <p>
              {{ t('help.courses.content.types.assessments.description') }}
            </p>
            <div class="features">
              <span class="feature-tag">{{ t('help.courses.content.types.assessments.tag1') }}</span>
              <span class="feature-tag">{{ t('help.courses.content.types.assessments.tag2') }}</span>
              <span class="feature-tag">{{ t('help.courses.content.types.assessments.tag3') }}</span>
            </div>
          </div>

          <div class="content-type-card">
            <i class="fas fa-link"></i>
            <h4>{{ t('help.courses.content.types.resources.title') }}</h4>
            <p>
              {{ t('help.courses.content.types.resources.description') }}
            </p>
            <div class="features">
              <span class="feature-tag">{{ t('help.courses.content.types.resources.tag1') }}</span>
              <span class="feature-tag">{{ t('help.courses.content.types.resources.tag2') }}</span>
              <span class="feature-tag">{{ t('help.courses.content.types.resources.tag3') }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-tools"></i> {{ t('help.courses.content.tools.title') }}</h2>
        <p>
          {{ t('help.courses.content.tools.description') }}
        </p>

        <div class="tools-overview">
          <div class="tool-card">
            <div class="tool-icon">
              <i class="fas fa-pen-fancy"></i>
            </div>
            <div class="tool-content">
              <h4>{{ t('help.courses.content.tools.richEditor.title') }}</h4>
              <p>
                {{ t('help.courses.content.tools.richEditor.description') }}
              </p>
              <div class="tool-features">
                <ul>
                  <li>{{ t('help.courses.content.tools.richEditor.feature1') }}</li>
                  <li>{{ t('help.courses.content.tools.richEditor.feature2') }}</li>
                  <li>{{ t('help.courses.content.tools.richEditor.feature3') }}</li>
                  <li>{{ t('help.courses.content.tools.richEditor.feature4') }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="tool-card">
            <div class="tool-icon">
              <i class="fas fa-terminal"></i>
            </div>
            <div class="tool-content">
              <h4>{{ t('help.courses.content.tools.terminalIntegration.title') }}</h4>
              <p>
                {{ t('help.courses.content.tools.terminalIntegration.description') }}
              </p>
              <div class="tool-features">
                <ul>
                  <li>{{ t('help.courses.content.tools.terminalIntegration.feature1') }}</li>
                  <li>{{ t('help.courses.content.tools.terminalIntegration.feature2') }}</li>
                  <li>{{ t('help.courses.content.tools.terminalIntegration.feature3') }}</li>
                  <li>{{ t('help.courses.content.tools.terminalIntegration.feature4') }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="tool-card coming-soon">
            <div class="tool-icon">
              <i class="fas fa-puzzle-piece"></i>
            </div>
            <div class="tool-content">
              <h4>{{ t('help.courses.content.tools.interactiveModules.title') }}</h4>
              <p>
                {{ t('help.courses.content.tools.interactiveModules.description') }}
              </p>
              <div class="tool-features">
                <span class="coming-soon-badge">{{ t('help.courses.content.tools.interactiveModules.badge') }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-graduation-cap"></i> {{ t('help.courses.content.principles.title') }}</h2>
        <p>
          {{ t('help.courses.content.principles.description') }}
        </p>

        <div class="principles-list">
          <div class="principle-item">
            <div class="principle-icon">
              <i class="fas fa-target"></i>
            </div>
            <div class="principle-content">
              <h4>{{ t('help.courses.content.principles.clearObjectives.title') }}</h4>
              <p>
                {{ t('help.courses.content.principles.clearObjectives.description') }}
              </p>
              <div class="example-box">
                <strong>{{ t('help.courses.content.principles.clearObjectives.exampleLabel') }}</strong> {{ t('help.courses.content.principles.clearObjectives.exampleText') }}
              </div>
            </div>
          </div>

          <div class="principle-item">
            <div class="principle-icon">
              <i class="fas fa-layer-group"></i>
            </div>
            <div class="principle-content">
              <h4>{{ t('help.courses.content.principles.gradualProgression.title') }}</h4>
              <p>
                {{ t('help.courses.content.principles.gradualProgression.description') }}
              </p>
              <div class="example-box">
                <strong>{{ t('help.courses.content.principles.gradualProgression.exampleLabel') }}</strong> {{ t('help.courses.content.principles.gradualProgression.exampleText') }}
              </div>
            </div>
          </div>

          <div class="principle-item">
            <div class="principle-icon">
              <i class="fas fa-hands-helping"></i>
            </div>
            <div class="principle-content">
              <h4>{{ t('help.courses.content.principles.activeLearning.title') }}</h4>
              <p>
                {{ t('help.courses.content.principles.activeLearning.description') }}
              </p>
              <div class="example-box">
                <strong>{{ t('help.courses.content.principles.activeLearning.exampleLabel') }}</strong> {{ t('help.courses.content.principles.activeLearning.exampleText') }}
              </div>
            </div>
          </div>

          <div class="principle-item">
            <div class="principle-icon">
              <i class="fas fa-comments"></i>
            </div>
            <div class="principle-content">
              <h4>{{ t('help.courses.content.principles.immediateFeedback.title') }}</h4>
              <p>
                {{ t('help.courses.content.principles.immediateFeedback.description') }}
              </p>
              <div class="example-box">
                <strong>{{ t('help.courses.content.principles.immediateFeedback.exampleLabel') }}</strong> {{ t('help.courses.content.principles.immediateFeedback.exampleText') }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-lightbulb"></i> {{ t('help.courses.content.writingTips.title') }}</h2>
        <p>
          {{ t('help.courses.content.writingTips.description') }}
        </p>

        <div class="writing-tips">
          <div class="tip-category">
            <h4><i class="fas fa-language"></i> {{ t('help.courses.content.writingTips.languageStyle.title') }}</h4>
            <ul>
              <li>{{ t('help.courses.content.writingTips.languageStyle.tip1') }}</li>
              <li>{{ t('help.courses.content.writingTips.languageStyle.tip2') }}</li>
              <li>{{ t('help.courses.content.writingTips.languageStyle.tip3') }}</li>
              <li>{{ t('help.courses.content.writingTips.languageStyle.tip4') }}</li>
            </ul>
          </div>

          <div class="tip-category">
            <h4><i class="fas fa-eye"></i> {{ t('help.courses.content.writingTips.visualStructure.title') }}</h4>
            <ul>
              <li>{{ t('help.courses.content.writingTips.visualStructure.tip1') }}</li>
              <li>{{ t('help.courses.content.writingTips.visualStructure.tip2') }}</li>
              <li>{{ t('help.courses.content.writingTips.visualStructure.tip3') }}</li>
              <li>{{ t('help.courses.content.writingTips.visualStructure.tip4') }}</li>
            </ul>
          </div>

          <div class="tip-category">
            <h4><i class="fas fa-check-circle"></i> {{ t('help.courses.content.writingTips.validationExamples.title') }}</h4>
            <ul>
              <li>{{ t('help.courses.content.writingTips.validationExamples.tip1') }}</li>
              <li>{{ t('help.courses.content.writingTips.validationExamples.tip2') }}</li>
              <li>{{ t('help.courses.content.writingTips.validationExamples.tip3') }}</li>
              <li>{{ t('help.courses.content.writingTips.validationExamples.tip4') }}</li>
            </ul>
          </div>

          <div class="tip-category">
            <h4><i class="fas fa-users"></i> {{ t('help.courses.content.writingTips.audienceAdaptation.title') }}</h4>
            <ul>
              <li>{{ t('help.courses.content.writingTips.audienceAdaptation.tip1') }}</li>
              <li>{{ t('help.courses.content.writingTips.audienceAdaptation.tip2') }}</li>
              <li>{{ t('help.courses.content.writingTips.audienceAdaptation.tip3') }}</li>
              <li>{{ t('help.courses.content.writingTips.audienceAdaptation.tip4') }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="help-section workflow">
        <h2><i class="fas fa-project-diagram"></i> {{ t('help.courses.content.workflow.title') }}</h2>
        <p>
          {{ t('help.courses.content.workflow.description') }}
        </p>

        <div class="workflow-steps">
          <div class="workflow-step">
            <div class="step-icon">1</div>
            <h4>{{ t('help.courses.content.workflow.step1.title') }}</h4>
            <p>{{ t('help.courses.content.workflow.step1.description') }}</p>
          </div>

          <div class="workflow-arrow">→</div>

          <div class="workflow-step">
            <div class="step-icon">2</div>
            <h4>{{ t('help.courses.content.workflow.step2.title') }}</h4>
            <p>{{ t('help.courses.content.workflow.step2.description') }}</p>
          </div>

          <div class="workflow-arrow">→</div>

          <div class="workflow-step">
            <div class="step-icon">3</div>
            <h4>{{ t('help.courses.content.workflow.step3.title') }}</h4>
            <p>{{ t('help.courses.content.workflow.step3.description') }}</p>
          </div>

          <div class="workflow-arrow">→</div>

          <div class="workflow-step">
            <div class="step-icon">4</div>
            <h4>{{ t('help.courses.content.workflow.step4.title') }}</h4>
            <p>{{ t('help.courses.content.workflow.step4.description') }}</p>
          </div>

          <div class="workflow-arrow">→</div>

          <div class="workflow-step">
            <div class="step-icon">5</div>
            <h4>{{ t('help.courses.content.workflow.step5.title') }}</h4>
            <p>{{ t('help.courses.content.workflow.step5.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section info">
        <h2><i class="fas fa-rocket"></i> {{ t('help.courses.content.futureFeatures.title') }}</h2>
        <div class="upcoming-features">
          <p>
            {{ t('help.courses.content.futureFeatures.description') }}
          </p>

          <div class="features-timeline">
            <div class="timeline-item">
              <div class="timeline-dot soon"></div>
              <div class="timeline-content">
                <h4>{{ t('help.courses.content.futureFeatures.soon.title') }}</h4>
                <ul>
                  <li>{{ t('help.courses.content.futureFeatures.soon.feature1') }}</li>
                  <li>{{ t('help.courses.content.futureFeatures.soon.feature2') }}</li>
                  <li>{{ t('help.courses.content.futureFeatures.soon.feature3') }}</li>
                </ul>
              </div>
            </div>

            <div class="timeline-item">
              <div class="timeline-dot future"></div>
              <div class="timeline-content">
                <h4>{{ t('help.courses.content.futureFeatures.future.title') }}</h4>
                <ul>
                  <li>{{ t('help.courses.content.futureFeatures.future.feature1') }}</li>
                  <li>{{ t('help.courses.content.futureFeatures.future.feature2') }}</li>
                  <li>{{ t('help.courses.content.futureFeatures.future.feature3') }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.courses.content.resources.title') }}</h2>
        <div class="resources-grid">
          <router-link :to="`${helpRoutePrefix}/courses/structure`" class="resource-card">
            <i class="fas fa-sitemap"></i>
            <h4>{{ t('help.courses.content.resources.structure.title') }}</h4>
            <p>{{ t('help.courses.content.resources.structure.description') }}</p>
          </router-link>

          <router-link to="/pages" class="resource-card">
            <i class="fas fa-file-alt"></i>
            <h4>{{ t('help.courses.content.resources.pageManagement.title') }}</h4>
            <p>{{ t('help.courses.content.resources.pageManagement.description') }}</p>
          </router-link>

          <div class="resource-card disabled">
            <i class="fas fa-book-open"></i>
            <h4>{{ t('help.courses.content.resources.advancedGuide.title') }}</h4>
            <p>{{ t('help.courses.content.resources.advancedGuide.description') }}</p>
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

.help-section.workflow {
  background: linear-gradient(135deg, var(--color-success-bg) 0%, var(--color-success-bg) 100%);
  border-left: 4px solid var(--color-success);
}

.help-section.info {
  background: linear-gradient(135deg, var(--color-info-bg) 0%, var(--color-info-border) 100%);
  border-left: 4px solid var(--color-info);
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

.help-section.workflow h2 i {
  color: var(--color-success);
}

.help-section.info h2 i {
  color: var(--color-info);
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

.content-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.content-type-card {
  text-align: center;
  padding: 25px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
  transition: all 0.3s ease;
}

.content-type-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-5px);
}

.content-type-card i {
  font-size: 2.5rem;
  color: var(--color-primary);
  margin-bottom: 15px;
}

.content-type-card h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
}

.content-type-card p {
  margin: 0 0 15px 0;
  color: var(--color-gray-600);
  font-size: 0.9rem;
  line-height: 1.5;
}

.features {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.feature-tag {
  background: var(--color-gray-200);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
}

.tools-overview {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 25px 0;
}

.tool-card {
  display: flex;
  gap: 20px;
  padding: 25px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
  transition: all 0.3s ease;
}

.tool-card:hover:not(.coming-soon) {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.tool-card.coming-soon {
  opacity: 0.7;
  position: relative;
}

.tool-icon {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.tool-card.coming-soon .tool-icon {
  background: var(--color-gray-600);
}

.tool-content {
  flex-grow: 1;
}

.tool-content h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
  font-size: 1.2rem;
}

.tool-content p {
  margin: 0 0 15px 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.tool-features ul {
  margin: 0;
  padding-left: 20px;
  color: var(--color-text-secondary);
}

.tool-features li {
  margin-bottom: 5px;
  font-size: 0.85rem;
}

.coming-soon-badge {
  background: linear-gradient(135deg, var(--color-warning) 0%, #fd7e14 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.principles-list {
  display: flex;
  flex-direction: column;
  gap: 25px;
  margin: 25px 0;
}

.principle-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border-left: 4px solid var(--color-primary);
}

.principle-icon {
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

.principle-content {
  flex-grow: 1;
}

.principle-content h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.principle-content p {
  margin: 0 0 12px 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.example-box {
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning);
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 0.85rem;
  color: var(--color-warning-text);
}

.writing-tips {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.tip-category {
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px solid var(--color-gray-200);
}

.tip-category h4 {
  margin: 0 0 15px 0;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.tip-category h4 i {
  color: var(--color-primary);
}

.tip-category ul {
  margin: 0;
  padding-left: 20px;
  color: var(--color-text-secondary);
}

.tip-category li {
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.workflow-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 25px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
}

.workflow-step {
  text-align: center;
  padding: 15px;
  background: var(--color-bg-primary);
  border-radius: 8px;
  border: 2px solid var(--color-success);
  min-width: 120px;
}

.step-icon {
  width: 40px;
  height: 40px;
  background: var(--color-success);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  margin: 0 auto 10px auto;
}

.workflow-step h4 {
  margin: 0 0 5px 0;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.workflow-step p {
  margin: 0;
  color: var(--color-gray-600);
  font-size: 0.8rem;
}

.workflow-arrow {
  color: var(--color-success);
  font-size: 1.5rem;
  font-weight: bold;
}

.upcoming-features {
  background: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.features-timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.timeline-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}

.timeline-dot.soon {
  background: var(--color-warning);
}

.timeline-dot.future {
  background: var(--color-gray-600);
}

.timeline-content h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary);
  font-size: 1rem;
}

.timeline-content ul {
  margin: 0;
  padding-left: 20px;
  color: var(--color-text-secondary);
}

.timeline-content li {
  margin-bottom: 5px;
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

.resource-card:hover:not(.disabled) {
  border-color: var(--color-primary);
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.resource-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.resource-card i {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 15px;
}

.resource-card.disabled i {
  color: var(--color-gray-600);
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

  .content-types-grid,
  .writing-tips {
    grid-template-columns: 1fr;
  }

  .tool-card {
    flex-direction: column;
    text-align: center;
  }

  .principle-item {
    flex-direction: column;
    text-align: center;
  }

  .workflow-steps {
    flex-direction: column;
  }

  .workflow-arrow {
    transform: rotate(90deg);
  }

  .resources-grid {
    grid-template-columns: 1fr;
  }
}
</style>