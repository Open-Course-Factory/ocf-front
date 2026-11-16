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

<!-- Renders the REAL shared components and classes, unstyled by this page,
     so any drift between them and the design system shows up here. -->
<template>
  <div class="design-system-audit">
    <div class="audit-header">
      <h1><i class="fas fa-palette"></i> {{ t('designSystem.title') }}</h1>
      <div class="theme-toggle">
        <button :class="{ active: currentTheme === 'light' }" @click="setTheme('light')">
          <i class="fas fa-sun"></i> {{ t('designSystem.light') }}
        </button>
        <button :class="{ active: currentTheme === 'dark' }" @click="setTheme('dark')">
          <i class="fas fa-moon"></i> {{ t('designSystem.dark') }}
        </button>
      </div>
    </div>

    <div class="audit-grid">
      <!-- 1. Tokens -->
      <section class="audit-section audit-section--wide">
        <h2 class="section-title">{{ t('designSystem.tokens') }}</h2>
        <div class="section-body">
          <div v-for="group in tokenGroups" :key="group.key" class="token-group">
            <h3 class="caption">{{ t(`designSystem.${group.key}`) }}</h3>
            <div class="token-list">
              <div v-for="token in group.tokens" :key="token" class="token">
                <div class="token-swatch" :style="`${group.prop}: var(${token})`">
                  {{ group.prop === 'font-size' ? 'Aa' : '' }}
                </div>
                <!-- trailing space keeps token names separate words in the text content -->
                <code>{{ `${token} ` }}</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Buttons -->
      <section class="audit-section audit-section--wide">
        <h2 class="section-title">{{ t('designSystem.buttons') }}</h2>
        <div class="section-body">
          <h3 class="caption">UI/Button.vue</h3>
          <div class="row">
            <Button v-for="v in buttonVariants" :key="v" :variant="v" size="md">{{ v }}</Button>
          </div>
          <div class="row">
            <Button>{{ t('designSystem.noProps') }}</Button>
            <Button variant="primary" size="sm">sm</Button>
            <Button variant="primary" size="lg">lg</Button>
            <Button variant="primary" size="md" icon="fas fa-plus">icon</Button>
            <Button variant="primary" size="md" disabled>disabled</Button>
            <Button variant="primary" size="md" loading>loading</Button>
          </div>
          <h3 class="caption">.btn</h3>
          <div class="row">
            <button v-for="c in rawButtonClasses" :key="c" type="button" :class="['btn', c]">{{ c }}</button>
          </div>
          <div class="row">
            <button type="button" class="btn btn-primary btn-sm">btn-sm</button>
            <button type="button" class="btn btn-primary btn-lg">btn-lg</button>
            <button type="button" class="btn btn-primary"><i class="fas fa-plus"></i> icon</button>
            <button type="button" class="btn btn-primary" disabled>disabled</button>
            <button type="button" class="btn-icon" :aria-label="t('designSystem.more')"><i class="fas fa-ellipsis-v"></i></button>
          </div>
        </div>
      </section>

      <!-- 3. Forms -->
      <section class="audit-section">
        <h2 class="section-title">{{ t('designSystem.forms') }}</h2>
        <div class="section-body">
          <h3 class="caption">UI/FormGroup.vue</h3>
          <FormGroup id="dsa-name" :label="t('designSystem.name')" :help-text="t('designSystem.help')" required>
            <input id="dsa-name" class="form-control" :placeholder="t('designSystem.placeholder')" />
          </FormGroup>
          <FormGroup id="dsa-email" label="Email" :error="t('designSystem.error')">
            <input id="dsa-email" class="form-control is-invalid" value="not-an-email" />
          </FormGroup>
          <h3 class="caption">.form-group</h3>
          <div class="form-group">
            <label for="dsa-select">{{ t('designSystem.choice') }}</label>
            <select id="dsa-select" class="form-control"><option>Ubuntu</option><option>Debian</option></select>
          </div>
          <div class="form-group">
            <label for="dsa-text">{{ t('designSystem.description') }}</label>
            <textarea id="dsa-text" class="form-control" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label for="dsa-disabled">{{ t('designSystem.disabled') }}</label>
            <input id="dsa-disabled" class="form-control" disabled value="read-only" />
          </div>
          <div class="form-check">
            <input id="dsa-check" type="checkbox" class="form-check-input" checked />
            <label for="dsa-check" class="form-check-label">{{ t('designSystem.checkbox') }}</label>
          </div>
        </div>
      </section>

      <!-- 4. Alerts -->
      <section class="audit-section">
        <h2 class="section-title">{{ t('designSystem.alerts') }}</h2>
        <div class="section-body">
          <h3 class="caption">UI/ErrorAlert.vue</h3>
          <ErrorAlert :message="t('designSystem.error')" />
          <h3 class="caption">.alert</h3>
          <div class="alert alert-success"><i class="fas fa-check-circle"></i> alert-success</div>
          <div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i> alert-warning</div>
          <div class="alert alert-danger"><i class="fas fa-times-circle"></i> alert-danger</div>
          <div class="alert alert-info"><i class="fas fa-info-circle"></i> alert-info</div>
        </div>
      </section>

      <!-- 5. Badges -->
      <section class="audit-section">
        <h2 class="section-title">{{ t('designSystem.badges') }}</h2>
        <div class="section-body">
          <h3 class="caption">AdminBadge / BetaBadge</h3>
          <div class="row">
            <AdminBadge />
            <AdminBadge icon-only />
            <BetaBadge size="small" />
            <BetaBadge />
            <BetaBadge size="large" />
          </div>
          <h3 class="caption">.badge</h3>
          <div class="row">
            <span v-for="c in badgeClasses" :key="c" :class="['badge', c]">{{ c }}</span>
          </div>
        </div>
      </section>

      <!-- 6. Cards -->
      <section class="audit-section">
        <h2 class="section-title">{{ t('designSystem.cards') }}</h2>
        <div class="section-body">
          <h3 class="caption">UI/SettingsCard.vue</h3>
          <SettingsCard :title="t('designSystem.cardTitle')" icon="fas fa-user">
            <template #headerActions>
              <Button variant="outline-primary" size="sm">{{ t('designSystem.edit') }}</Button>
            </template>
            <p>{{ t('designSystem.cardBody') }}</p>
          </SettingsCard>
          <h3 class="caption">.card</h3>
          <div class="card">
            <div class="card-header"><h3>{{ t('designSystem.cardTitle') }}</h3></div>
            <div class="card-body"><p>{{ t('designSystem.cardBody') }}</p></div>
          </div>
        </div>
      </section>

      <!-- 7. Tabs + 8. Menus -->
      <section class="audit-section">
        <h2 class="section-title">{{ t('designSystem.tabsMenus') }}</h2>
        <div class="section-body">
          <h3 class="caption">Common/TabStrip.vue</h3>
          <TabStrip v-model="activeTab" :tabs="tabs" :aria-label="t('designSystem.tabsMenus')" />
          <h3 class="caption">Common/DropdownMenu.vue</h3>
          <DropdownMenu align="left" :trigger-label="t('designSystem.more')">
            <button type="button" class="ocf-dropdown-item"><i class="fas fa-edit"></i> {{ t('designSystem.edit') }}</button>
            <button type="button" class="ocf-dropdown-item" disabled><i class="fas fa-copy"></i> {{ t('designSystem.disabled') }}</button>
            <button type="button" class="ocf-dropdown-item ocf-dropdown-item--danger"><i class="fas fa-trash"></i> {{ t('designSystem.delete') }}</button>
          </DropdownMenu>
        </div>
      </section>

      <!-- 9. Tables -->
      <section class="audit-section audit-section--wide">
        <h2 class="section-title">{{ t('designSystem.tables') }}</h2>
        <div class="section-body">
          <h3 class="caption">Generic/EntityTable.vue</h3>
          <EntityTable :columns="columns" :rows="rows" searchable show-count>
            <template #row-actions>
              <button type="button" class="btn-icon" :aria-label="t('designSystem.edit')"><i class="fas fa-edit"></i></button>
            </template>
          </EntityTable>
          <h3 class="caption">table.ocf-data-table</h3>
          <div class="table-scroll">
            <table class="ocf-data-table">
              <thead><tr><th v-for="c in columns" :key="c.key">{{ c.label }}</th></tr></thead>
              <tbody>
                <tr v-for="r in rows" :key="r.id"><td>{{ r.name }}</td><td>{{ r.email }}</td><td>{{ r.role }}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- 10. Pagination and progress -->
      <section class="audit-section">
        <h2 class="section-title">{{ t('designSystem.progress') }}</h2>
        <div class="section-body">
          <h3 class="caption">Common/ClientPager.vue</h3>
          <ClientPager
            :current-page="page"
            :total-pages="5"
            :total-items="42"
            :showing-from="(page - 1) * 10 + 1"
            :showing-to="Math.min(page * 10, 42)"
            testid-prefix="dsa"
            @previous="page--"
            @next="page++"
          />
          <h3 class="caption">Common/ProgressBar.vue</h3>
          <div class="stack">
            <ProgressBar :value="25" />
            <ProgressBar :value="60" variant="success" />
            <ProgressBar :value="85" variant="warning" />
            <ProgressBar :value="100" variant="danger" />
            <ProgressBar :value="0" indeterminate />
          </div>
        </div>
      </section>

      <!-- 11. Empty states -->
      <section class="audit-section">
        <h2 class="section-title">{{ t('designSystem.empty') }}</h2>
        <div class="section-body">
          <h3 class="caption">Common/EmptyState.vue</h3>
          <EmptyState
            icon-class="fas fa-flask"
            :title="t('designSystem.emptyTitle')"
            :description="t('designSystem.emptyText')"
            :action-text="t('designSystem.create')"
            action-icon="fas fa-plus"
          />
          <h3 class="caption">.empty-state</h3>
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>{{ t('designSystem.emptyTitle') }}</p>
          </div>
        </div>
      </section>

      <!-- 12. Modal -->
      <section class="audit-section">
        <h2 class="section-title">{{ t('designSystem.modal') }}</h2>
        <div class="section-body">
          <h3 class="caption">Modals/BaseModal.vue</h3>
          <div class="row">
            <button v-for="s in modalSizes" :key="s" type="button" class="btn btn-secondary" @click="modalSize = s">{{ s }}</button>
          </div>
          <BaseModal
            :visible="modalSize !== null"
            :size="modalSize ?? 'medium'"
            :title="t('designSystem.modal')"
            title-icon="fas fa-window-maximize"
            show-default-footer
            :confirm-text="t('designSystem.confirm')"
            :cancel-text="t('designSystem.cancel')"
            @close="modalSize = null"
            @confirm="modalSize = null"
          >
            <p>{{ t('designSystem.cardBody') }}</p>
          </BaseModal>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import Button from '../UI/Button.vue'
import FormGroup from '../UI/FormGroup.vue'
import ErrorAlert from '../UI/ErrorAlert.vue'
import SettingsCard from '../UI/SettingsCard.vue'
import AdminBadge from '../Common/AdminBadge.vue'
import BetaBadge from '../Common/BetaBadge.vue'
import TabStrip from '../Common/TabStrip.vue'
import DropdownMenu from '../Common/DropdownMenu.vue'
import ClientPager from '../Common/ClientPager.vue'
import ProgressBar from '../Common/ProgressBar.vue'
import EmptyState from '../Common/EmptyState.vue'
import EntityTable from '../Generic/EntityTable.vue'
import BaseModal from '../Modals/BaseModal.vue'

const { t } = useTranslations({
  en: {
    designSystem: {
      title: 'Labinux design system audit',
      light: 'Light',
      dark: 'Dark',
      tokens: '1. Tokens',
      colors: 'Colors',
      spacing: 'Spacing',
      radius: 'Radius',
      shadows: 'Shadows',
      typography: 'Font sizes',
      buttons: '2. Buttons',
      noProps: 'No props',
      forms: '3. Forms',
      name: 'Name',
      help: 'Help text under the field',
      placeholder: 'Type here',
      error: 'This value is not valid',
      choice: 'Distribution',
      description: 'Description',
      disabled: 'Disabled',
      checkbox: 'Checkbox',
      alerts: '4. Alerts',
      badges: '5. Badges',
      cards: '6. Cards',
      cardTitle: 'Profile',
      cardBody: 'Sample content inside the container.',
      edit: 'Edit',
      delete: 'Delete',
      more: 'More actions',
      tabsMenus: '7-8. Tabs and menus',
      tabOverview: 'Overview',
      tabMembers: 'Members',
      tabSettings: 'Settings',
      tables: '9. Tables',
      role: 'Role',
      progress: '10. Pagination and progress',
      empty: '11. Empty states',
      emptyTitle: 'No scenario yet',
      emptyText: 'Create your first scenario to see it here.',
      create: 'Create',
      modal: '12. Modal',
      confirm: 'Confirm',
      cancel: 'Cancel'
    }
  },
  fr: {
    designSystem: {
      title: 'Audit du design system Labinux',
      light: 'Clair',
      dark: 'Sombre',
      tokens: '1. Jetons',
      colors: 'Couleurs',
      spacing: 'Espacements',
      radius: 'Arrondis',
      shadows: 'Ombres',
      typography: 'Tailles de police',
      buttons: '2. Boutons',
      noProps: 'Sans props',
      forms: '3. Formulaires',
      name: 'Nom',
      help: 'Texte d’aide sous le champ',
      placeholder: 'Saisissez ici',
      error: 'Cette valeur n’est pas valide',
      choice: 'Distribution',
      description: 'Description',
      disabled: 'Désactivé',
      checkbox: 'Case à cocher',
      alerts: '4. Alertes',
      badges: '5. Badges',
      cards: '6. Cartes',
      cardTitle: 'Profil',
      cardBody: 'Exemple de contenu dans le conteneur.',
      edit: 'Modifier',
      delete: 'Supprimer',
      more: 'Plus d’actions',
      tabsMenus: '7-8. Onglets et menus',
      tabOverview: 'Aperçu',
      tabMembers: 'Membres',
      tabSettings: 'Paramètres',
      tables: '9. Tableaux',
      role: 'Rôle',
      progress: '10. Pagination et progression',
      empty: '11. États vides',
      emptyTitle: 'Aucun scénario pour l’instant',
      emptyText: 'Créez votre premier scénario pour le voir ici.',
      create: 'Créer',
      modal: '12. Fenêtre modale',
      confirm: 'Confirmer',
      cancel: 'Annuler'
    }
  }
})

const currentTheme = ref(
  document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
)

function setTheme(theme: 'light' | 'dark') {
  currentTheme.value = theme
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

const tokenGroups = [
  {
    key: 'colors',
    prop: 'background',
    tokens: [
      '--color-primary', '--color-primary-hover', '--color-secondary',
      '--color-success', '--color-success-bg', '--color-warning', '--color-warning-bg',
      '--color-danger', '--color-danger-bg', '--color-info', '--color-info-bg',
      '--color-text-primary', '--color-text-secondary', '--color-text-muted',
      '--color-background', '--color-bg-primary', '--color-bg-secondary', '--color-bg-tertiary',
      '--color-surface', '--color-border', '--color-border-light', '--color-border-medium'
    ]
  },
  { key: 'spacing', prop: 'width', tokens: ['--spacing-xs', '--spacing-sm', '--spacing-md', '--spacing-lg', '--spacing-xl', '--spacing-2xl'] },
  { key: 'radius', prop: 'border-radius', tokens: ['--border-radius-sm', '--border-radius-md', '--border-radius-lg', '--border-radius-xl', '--border-radius-full'] },
  { key: 'shadows', prop: 'box-shadow', tokens: ['--shadow-xs', '--shadow-sm', '--shadow-md', '--shadow-lg', '--shadow-xl'] },
  { key: 'typography', prop: 'font-size', tokens: ['--font-size-xs', '--font-size-sm', '--font-size-base', '--font-size-lg', '--font-size-xl', '--font-size-2xl'] }
]

const buttonVariants = ['primary', 'secondary', 'danger', 'warning', 'info', 'outline-primary', 'outline-secondary'] as const
const rawButtonClasses = ['btn-primary', 'btn-secondary', 'btn-danger', 'btn-success', 'btn-outline-primary', 'btn-outline-danger']
const badgeClasses = ['badge-primary', 'badge-secondary', 'badge-success', 'badge-warning', 'badge-danger']

const activeTab = ref('overview')
const tabs = computed(() => [
  { key: 'overview', label: t('designSystem.tabOverview'), icon: 'fas fa-eye' },
  { key: 'members', label: t('designSystem.tabMembers'), icon: 'fas fa-users' },
  { key: 'settings', label: t('designSystem.tabSettings'), icon: 'fas fa-cog' }
])

const columns = computed(() => [
  { key: 'name', label: t('designSystem.name'), sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: t('designSystem.role') }
])
const rows = [
  { id: 1, name: 'Alice Martin', email: 'alice@example.com', role: 'owner' },
  { id: 2, name: 'Bruno Petit', email: 'bruno@example.com', role: 'manager' },
  { id: 3, name: 'Chloé Durand', email: 'chloe@example.com', role: 'member' }
]

const page = ref(1)

const modalSizes = ['small', 'medium', 'large', 'xlarge'] as const
const modalSize = ref<(typeof modalSizes)[number] | null>(null)
</script>

<style scoped>
/* Showcase layout only: shared components and classes are shown as they are. */
.design-system-audit {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.audit-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-bg-primary);
  border-bottom: var(--border-width-medium) solid var(--color-border-light);
  padding: var(--spacing-sm) var(--spacing-lg);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.audit-header h1 {
  font-size: var(--font-size-lg);
  margin: 0;
}

.theme-toggle {
  display: flex;
  gap: var(--spacing-sm);
}

.theme-toggle button {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: var(--border-width-medium) solid var(--color-border-medium);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.theme-toggle button.active {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.audit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}

.audit-section {
  min-width: 0;
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  background: var(--color-bg-primary);
}

.audit-section--wide {
  grid-column: 1 / -1;
}

.section-title {
  margin: 0;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
  background: var(--color-bg-tertiary);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

.section-body {
  padding: var(--spacing-md);
}

.caption {
  margin: var(--spacing-md) 0 var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-family: monospace;
  color: var(--color-text-muted);
}

.caption:first-child {
  margin-top: 0;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.token-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.token {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
}

.token-swatch {
  min-width: var(--spacing-xs);
  height: var(--spacing-xl);
  min-height: var(--spacing-xl);
  width: var(--spacing-3xl);
  border: var(--border-width-thin) solid var(--color-border-light);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.table-scroll {
  overflow-x: auto;
}
</style>
