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
  <span class="ocf-role-counts">
    <span
      v-for="role in rolesByRank(counts)"
      :key="role"
      :class="['ocf-role-count', `ocf-role-count-${role}`]"
      :title="t(`roleCounts.${role}`)"
      :data-test="`role-count-${role}`"
    >
      <i :class="ROLE_ICONS[role]"></i>
      {{ counts[role] }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { useTranslations } from '../../composables/useTranslations'
import { rolesByRank, type RoleCounts } from '../../utils/roles'
import type { MemberRole } from '../../types/base'

defineProps<{ counts: RoleCounts }>()

const ROLE_ICONS: Record<MemberRole, string> = {
  owner: 'fas fa-crown',
  manager: 'fas fa-user-shield',
  teacher: 'fas fa-chalkboard-teacher',
  member: 'fas fa-user'
}

const { t } = useTranslations({
  en: { roleCounts: { owner: 'Owners', manager: 'Managers', teacher: 'Teachers', member: 'Members' } },
  fr: { roleCounts: { owner: 'Propriétaires', manager: 'Gestionnaires', teacher: 'Formateurs', member: 'Membres' } }
})
</script>

<style scoped>
.ocf-role-counts {
  display: inline-flex;
  gap: var(--spacing-xs);
  margin-left: var(--spacing-xs);
}

.ocf-role-count {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px 6px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  cursor: help;
}

.ocf-role-count-owner {
  color: var(--color-warning);
}

.ocf-role-count-manager {
  color: var(--color-primary);
}
</style>
