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

<script setup lang="ts">
import { computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'

const { t } = useTranslations({
  en: {
    adminBadge: {
      label: 'Admin',
      defaultTooltip: 'Visible thanks to your administrator role'
    }
  },
  fr: {
    adminBadge: {
      label: 'Admin',
      defaultTooltip: 'Visible gr\u00e2ce \u00e0 votre r\u00f4le d\u2019administrateur'
    }
  }
})

interface Props {
  iconOnly?: boolean
  tooltip?: string
}

const props = withDefaults(defineProps<Props>(), {
  iconOnly: false,
  tooltip: ''
})

const resolvedTooltip = computed(() =>
  props.tooltip || t('adminBadge.defaultTooltip')
)
</script>

<template>
  <span class="admin-badge" :title="resolvedTooltip">
    <i class="fas fa-shield-alt"></i>
    <span v-if="!iconOnly" class="admin-badge-label">{{ t('adminBadge.label') }}</span>
  </span>
</template>

<style scoped>
.admin-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  font-size: var(--font-size-xs);
  color: var(--color-secondary);
  border: 1px dashed var(--color-secondary);
  border-radius: var(--border-radius-sm);
  opacity: 0.75;
  cursor: help;
  vertical-align: middle;
  line-height: 1;
}

.admin-badge i {
  font-size: 0.65rem;
}

.admin-badge-label {
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.3px;
}
</style>
