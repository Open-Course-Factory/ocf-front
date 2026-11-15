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
  Previous / next pager for a list paginated in the browser
  (useClientPagination). Renders nothing while everything fits on one page.
-->
<script setup lang="ts">
import { useTranslations } from '../../composables/useTranslations'

const props = defineProps<{
  currentPage: number
  totalPages: number
  totalItems: number
  showingFrom: number
  showingTo: number
  /** data-testid prefix: `<prefix>-page-prev`, `-page-next`, `-page-indicator` */
  testidPrefix: string
}>()

const emit = defineEmits<{
  previous: []
  next: []
}>()

const { t } = useTranslations({
  en: {
    clientPager: {
      label: 'Pagination',
      showing: 'Showing {from}-{to} of {total}',
      pageOf: 'Page {page} of {total}',
      previous: 'Previous',
      next: 'Next'
    }
  },
  fr: {
    clientPager: {
      label: 'Pagination',
      showing: 'Affichage {from}-{to} sur {total}',
      pageOf: 'Page {page} sur {total}',
      previous: 'Précédent',
      next: 'Suivant'
    }
  }
})
</script>

<template>
  <nav v-if="props.totalPages > 1" class="ocf-client-pager" :aria-label="t('clientPager.label')">
    <span class="ocf-client-pager__info">
      {{ t('clientPager.showing', { from: props.showingFrom, to: props.showingTo, total: props.totalItems }) }}
    </span>
    <div class="ocf-client-pager__buttons">
      <button
        type="button"
        class="btn btn-sm btn-secondary"
        :data-testid="`${props.testidPrefix}-page-prev`"
        :disabled="props.currentPage <= 1"
        @click="emit('previous')"
      >
        <i class="fas fa-chevron-left" aria-hidden="true"></i>
        {{ t('clientPager.previous') }}
      </button>
      <span
        class="ocf-client-pager__indicator"
        :data-testid="`${props.testidPrefix}-page-indicator`"
        :aria-label="t('clientPager.pageOf', { page: props.currentPage, total: props.totalPages })"
        role="status"
      >
        {{ props.currentPage }} / {{ props.totalPages }}
      </span>
      <button
        type="button"
        class="btn btn-sm btn-secondary"
        :data-testid="`${props.testidPrefix}-page-next`"
        :disabled="props.currentPage >= props.totalPages"
        @click="emit('next')"
      >
        {{ t('clientPager.next') }}
        <i class="fas fa-chevron-right" aria-hidden="true"></i>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.ocf-client-pager {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-light);
}

.ocf-client-pager__info,
.ocf-client-pager__indicator {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.ocf-client-pager__buttons {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ocf-client-pager__indicator {
  font-weight: 500;
}

.ocf-client-pager .btn {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.ocf-client-pager .btn:hover:not(:disabled) {
  background: var(--color-bg-quaternary);
}

.ocf-client-pager .btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
