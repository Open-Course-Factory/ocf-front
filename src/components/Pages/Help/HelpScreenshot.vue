<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<!--
  A screenshot in a help article.

  `name` is a file in public/help/screenshots/<locale>/, produced by
  `npm run docs:screenshots` (e2e/docs-screenshots.spec.ts) — never hand-made.
  The locale folder follows the UI language, so the picture matches the text
  around it. Clicking opens the full-size image in a new tab.
-->

<template>
  <figure class="ocf-help-shot">
    <a :href="src" target="_blank" rel="noopener">
      <img :src="src" :alt="caption || name" loading="lazy" />
    </a>
    <figcaption v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ name: string; caption?: string }>()
const { locale } = useI18n()
const src = computed(() => `/help/screenshots/${locale.value}/${props.name}.png`)
</script>

<style scoped>
.ocf-help-shot {
  margin: 1.25rem 0;
}

.ocf-help-shot img {
  display: block;
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md, 8px);
  box-shadow: var(--shadow-sm);
}

.ocf-help-shot figcaption {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  text-align: center;
}
</style>
