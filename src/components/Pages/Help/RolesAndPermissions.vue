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
      <h1><i class="fas fa-user-shield"></i> {{ t('help.account.rolesAndPermissions.title') }}</h1>
      <p class="article-description">{{ t('help.account.rolesAndPermissions.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-layer-group"></i> {{ t('help.account.rolesAndPermissions.overviewTitle') }}</h2>
        <p>{{ t('help.account.rolesAndPermissions.overviewDescription') }}</p>

        <div class="ocf-role-levels">
          <div v-for="level in levels" :key="level.key" class="ocf-level-card">
            <div class="ocf-level-icon" :class="level.key">
              <i :class="level.icon"></i>
            </div>
            <div>
              <h3>{{ t(`help.account.rolesAndPermissions.${level.key}Level`) }}</h3>
              <p>{{ t(`help.account.rolesAndPermissions.${level.key}LevelDesc`) }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-building"></i> {{ t('help.account.rolesAndPermissions.orgRolesTitle') }}</h2>
        <p>{{ t('help.account.rolesAndPermissions.orgRolesDescription') }}</p>

        <div class="ocf-permission-matrix">
          <table>
            <thead>
              <tr>
                <th>{{ t('help.account.rolesAndPermissions.permission') }}</th>
                <th v-for="role in orgRoles" :key="role.key" class="ocf-role-col">
                  <i :class="role.icon"></i>
                  {{ t(`help.account.rolesAndPermissions.${role.key}`) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in orgMatrix" :key="row.key">
                <td class="ocf-permission-name">{{ t(`help.account.rolesAndPermissions.${row.key}`) }}</td>
                <td
                  v-for="(mark, index) in row.marks"
                  :key="index"
                  :class="`ocf-permission-${mark}`"
                  :title="mark === 'partial' ? t('help.account.rolesAndPermissions.cannotPromoteToOwner') : undefined"
                >
                  <i :class="markIcons[mark]"></i>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="ocf-legend">
          <span v-for="(icon, mark) in markIcons" :key="mark" class="ocf-legend-item">
            <i :class="[icon, `ocf-legend-${mark}`]"></i>
            {{ t(`help.account.rolesAndPermissions.${legendKeys[mark]}`) }}
          </span>
        </div>
        <p>{{ t('help.account.rolesAndPermissions.cannotPromoteToOwner') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-chalkboard-teacher"></i> {{ t('help.account.rolesAndPermissions.groupRolesTitle') }}</h2>
        <p>{{ t('help.account.rolesAndPermissions.groupRolesDescription') }}</p>

        <div class="ocf-role-cards">
          <div v-for="role in groupRoles" :key="role.key" class="ocf-role-card">
            <div class="ocf-role-card-header" :class="role.key">
              <i :class="role.icon"></i>
              <h3>{{ t(`help.account.rolesAndPermissions.group${role.label}`) }}</h3>
            </div>
            <p>{{ t(`help.account.rolesAndPermissions.group${role.label}Desc`) }}</p>
            <ul>
              <li v-for="n in 3" :key="n">{{ t(`help.account.rolesAndPermissions.group${role.label}Perm${n}`) }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="help-section warning">
        <h2><i class="fas fa-shield-alt"></i> {{ t('help.account.rolesAndPermissions.platformAdminTitle') }}</h2>
        <p><strong>{{ t('help.account.rolesAndPermissions.platformAdminNoticeTitle') }}</strong></p>
        <p>{{ t('help.account.rolesAndPermissions.platformAdminNoticeDesc') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.account.rolesAndPermissions.scenariosTitle') }}</h2>
        <div v-for="n in 4" :key="n" class="step-card">
          <div class="step-number">?</div>
          <div class="step-content">
            <h4>{{ t(`help.account.rolesAndPermissions.scenario${n}Question`) }}</h4>
            <p>{{ t(`help.account.rolesAndPermissions.scenario${n}Answer`) }}</p>
          </div>
        </div>
      </section>

      <section class="help-section info">
        <h2><i class="fas fa-code"></i> {{ t('help.account.rolesAndPermissions.reference.title') }}</h2>
        <p>{{ t('help.account.rolesAndPermissions.reference.description') }}</p>
        <router-link :to="`${helpRoutePrefix}/account/permissions-reference`" class="btn btn-outline">
          <i class="fas fa-lock"></i>
          {{ t('help.account.rolesAndPermissions.reference.button') }}
        </router-link>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useHelpTranslations } from '../../../composables/useHelpTranslations'

const { t } = useI18n()
const { loadHelpTranslations } = useHelpTranslations()
const route = useRoute()

const isPublicHelp = computed(() => route.path.startsWith('/help-public'))
const helpMainRoute = computed(() => isPublicHelp.value ? '/help-public' : '/help')
const helpRoutePrefix = computed(() => isPublicHelp.value ? '/help-public' : '/help')

const levels = [
  { key: 'platform', icon: 'fas fa-globe' },
  { key: 'organization', icon: 'fas fa-building' },
  { key: 'group', icon: 'fas fa-chalkboard-teacher' }
]

// Organization hierarchy: member < teacher < manager < owner (ocf-core auth/access).
const orgRoles = [
  { key: 'owner', icon: 'fas fa-crown' },
  { key: 'manager', icon: 'fas fa-user-tie' },
  { key: 'teacher', icon: 'fas fa-chalkboard-teacher' },
  { key: 'member', icon: 'fas fa-user' }
]

type Mark = 'check' | 'partial' | 'cross'
const y: Mark = 'check'
const p: Mark = 'partial'
const n: Mark = 'cross'

// Column order follows orgRoles: owner, manager, teacher, member.
const orgMatrix: { key: string; marks: Mark[] }[] = [
  { key: 'viewOrganization', marks: [y, y, y, y] },
  { key: 'useOrgPlan', marks: [y, y, y, y] },
  { key: 'createClasses', marks: [y, y, y, n] },
  { key: 'inviteMembers', marks: [y, y, n, n] },
  { key: 'removeMembers', marks: [y, y, n, n] },
  { key: 'changeRoles', marks: [y, p, n, n] },
  { key: 'promoteToOwner', marks: [y, n, n, n] },
  { key: 'manageBilling', marks: [y, y, n, n] },
  { key: 'editOrgSettings', marks: [y, y, n, n] },
  { key: 'deleteOrganization', marks: [y, n, n, n] },
  { key: 'transferOwnership', marks: [y, n, n, n] }
]

const markIcons: Record<Mark, string> = {
  check: 'fas fa-check',
  partial: 'fas fa-minus',
  cross: 'fas fa-times'
}
const legendKeys: Record<Mark, string> = { check: 'allowed', partial: 'partial', cross: 'denied' }

const groupRoles = [
  { key: 'owner', label: 'Owner', icon: 'fas fa-crown' },
  { key: 'manager', label: 'Manager', icon: 'fas fa-user-shield' },
  { key: 'member', label: 'Member', icon: 'fas fa-user' }
]

onMounted(async () => {
  await loadHelpTranslations()
})
</script>

<style scoped>
.ocf-role-levels,
.ocf-role-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin: 1.5rem 0;
}

.ocf-level-card {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border);
  border-radius: 12px;
}

.ocf-level-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  flex-shrink: 0;
  background: var(--color-bg-secondary);
  color: var(--color-primary);
}

.ocf-level-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  color: var(--color-text-primary);
}

.ocf-level-card p {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.ocf-permission-matrix {
  overflow-x: auto;
  margin: 1.5rem 0 1rem;
}

.ocf-permission-matrix table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-bg-primary);
}

.ocf-permission-matrix th {
  padding: 0.75rem 1rem;
  text-align: left;
  background: var(--color-primary);
  color: var(--color-white);
  font-weight: 600;
}

.ocf-permission-matrix th i {
  margin-right: 0.4rem;
}

.ocf-role-col {
  text-align: center !important;
  min-width: 110px;
}

.ocf-permission-matrix td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.9375rem;
}

.ocf-permission-name {
  color: var(--color-text-primary);
  font-weight: 500;
}

.ocf-permission-check,
.ocf-permission-partial,
.ocf-permission-cross {
  text-align: center;
  font-size: 1.1rem;
}

.ocf-permission-check i,
.ocf-legend-check {
  color: var(--color-success);
}

.ocf-permission-partial i,
.ocf-legend-partial {
  color: var(--color-warning);
}

.ocf-permission-cross i,
.ocf-legend-cross {
  color: var(--color-danger);
}

.ocf-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
}

.ocf-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.ocf-role-card {
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}

.ocf-role-card-header {
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-white);
  background: var(--color-secondary);
}

.ocf-role-card-header.owner {
  background: var(--color-warning);
}

.ocf-role-card-header.manager {
  background: var(--color-primary);
}

.ocf-role-card-header h3 {
  margin: 0;
  font-size: 1.125rem;
}

.ocf-role-card p {
  padding: 1rem 1.5rem 0;
  margin: 0;
  color: var(--color-text-secondary);
}

.ocf-role-card ul {
  padding: 0.5rem 1.5rem 1.5rem 3rem;
  margin: 0;
  color: var(--color-text-secondary);
}

.ocf-role-card li {
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
}

@media (max-width: 768px) {
  .ocf-permission-matrix th,
  .ocf-permission-matrix td {
    padding: 0.5rem 0.6rem;
    font-size: 0.85rem;
  }
}
</style>
