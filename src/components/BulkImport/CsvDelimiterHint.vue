<template>
  <!--
    The slot is always rendered, at one line of height, so a detected
    delimiter never pushes the table or the buttons below it.
  -->
  <p class="ocf-csv-delimiter-hint" aria-live="polite">{{ hint }}</p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import type { CsvDelimiter } from '../../utils/csvDelimiter'

const translations = {
  en: {
    csvDelimiter: {
      semicolon: 'Semicolon-separated file detected',
      tab: 'Tab-separated file detected'
    }
  },
  fr: {
    csvDelimiter: {
      semicolon: 'Fichier séparé par des points-virgules détecté',
      tab: 'Fichier séparé par des tabulations détecté'
    }
  }
}

const { t } = useTranslations(translations)

const props = defineProps<{ delimiter: CsvDelimiter | null }>()

const hint = computed(() => {
  switch (props.delimiter) {
    case ';': return t('csvDelimiter.semicolon')
    case '\t': return t('csvDelimiter.tab')
    default: return ''
  }
})
</script>

<style scoped>
.ocf-csv-delimiter-hint {
  margin: 0;
  min-height: 1.5em;
  line-height: 1.5em;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
