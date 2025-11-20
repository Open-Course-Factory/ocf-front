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

<script setup lang="ts">
import { computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import type { EmailTemplateVariable } from '../../types/entities'

interface Props {
  html: string
  variables: EmailTemplateVariable[]
}

const props = defineProps<Props>()

const { t } = useTranslations({
  en: {
    preview: {
      title: 'Live Preview',
      withExamples: 'with example data',
      noContent: 'No content to preview'
    }
  },
  fr: {
    preview: {
      title: 'Aperçu en Direct',
      withExamples: 'avec exemples de données',
      noContent: 'Aucun contenu à prévisualiser'
    }
  }
})

const renderedHtml = computed(() => {
  let result = props.html

  // Simple variable replacement for preview using example values
  props.variables.forEach((variable) => {
    if (variable.name && variable.example) {
      // Handle Go template syntax {{.VariableName}}
      const regex = new RegExp(`{{\\s*\\.${variable.name}\\s*}}`, 'g')
      result = result.replace(regex, variable.example)
    }
  })

  return result
})

const hasContent = computed(() => {
  return props.html && props.html.trim().length > 0
})
</script>

<template>
  <div class="email-preview">
    <div class="preview-header">
      <span class="preview-label">{{ t('preview.title') }}</span>
      <span v-if="variables.length > 0" class="preview-info">
        ({{ t('preview.withExamples') }})
      </span>
    </div>

    <div class="preview-container">
      <div v-if="!hasContent" class="preview-empty">
        <i class="fas fa-envelope-open"></i>
        <p>{{ t('preview.noContent') }}</p>
      </div>
      <iframe
        v-else
        :srcdoc="renderedHtml"
        class="preview-iframe"
        sandbox="allow-same-origin"
        title="Email Preview"
      />
    </div>
  </div>
</template>

<style scoped>
.email-preview {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  background: var(--color-background-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}

.preview-label {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.preview-info {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

.preview-container {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  min-height: 400px;
  position: relative;
}

.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: var(--color-text-tertiary);
}

.preview-empty i {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.preview-empty p {
  margin: 0;
  font-style: italic;
}

.preview-iframe {
  width: 100%;
  height: 600px;
  border: none;
  display: block;
  background: white;
}
</style>
