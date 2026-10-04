<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * A step as the learner reads it: its title and its instructions, rendered by
 * the learner panel's own pipeline and styles. The step editor shows it beside
 * the Markdown; a read-only scenario and the step library show it alone.
 */
-->

<template>
  <div class="ocf-learner-preview" data-testid="step-preview">
    <p class="ocf-learner-preview-label"><i class="fas fa-eye" aria-hidden="true"></i> {{ t('learnerPreview.label') }}</p>
    <h3 class="ocf-learner-preview-title">{{ shown.title }}</h3>
    <div class="markdown-content" v-html="html"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { renderStepMarkdown } from '../../utils/killercodaMarkdown'

const props = defineProps<{
  title: string
  text: string
  // A step outline's translations: the one in the reader's language is shown,
  // as a learner in that language would get it.
  translations?: Array<{ locale: string; title?: string; text_content?: string }>
}>()

const { t, locale } = useTranslations({
  en: { learnerPreview: { label: 'What the learner sees' } },
  fr: { learnerPreview: { label: 'Ce que voit l’apprenant' } }
})

const shown = computed(() => {
  const lang = String(locale.value).slice(0, 2)
  const translation = props.translations?.find(tr => tr.locale.slice(0, 2) === lang)
  return {
    title: translation?.title || props.title,
    text: translation?.text_content || props.text
  }
})

const html = computed(() => renderStepMarkdown(shown.value.text || '', shown.value.title))
</script>

<style scoped>
.ocf-learner-preview {
  color: var(--color-text-primary);
  line-height: var(--line-height-relaxed);
}

.ocf-learner-preview-label {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.ocf-learner-preview-title {
  margin: var(--spacing-sm) 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}
</style>
<style scoped src="../Terminal/scenarioMarkdown.css"></style>
