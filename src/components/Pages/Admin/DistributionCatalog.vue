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
  <div class="wrapper">
    <div class="catalog-page">
      <header class="page-header">
        <h1>
          <i class="fas fa-layer-group"></i>
          {{ t('distributionCatalog.title') }}
        </h1>
        <p class="page-description">{{ t('distributionCatalog.description') }}</p>
      </header>

      <div v-if="loading" class="state-block">
        <i class="fas fa-spinner fa-spin"></i>
        {{ t('distributionCatalog.loading') }}
      </div>

      <div v-else-if="loadError" class="state-block state-error">
        <i class="fas fa-exclamation-triangle"></i>
        <span>{{ loadError }}</span>
        <button class="btn-secondary" @click="load">{{ t('distributionCatalog.retry') }}</button>
      </div>

      <div v-else-if="entries.length === 0" class="state-block">
        {{ t('distributionCatalog.empty') }}
      </div>

      <template v-else>
        <ul class="distribution-list" data-test="distribution-list">
          <li v-for="entry in entries" :key="entry.name" class="distribution-row">
            <label class="distribution-toggle">
              <input
                type="checkbox"
                :checked="entry.offered"
                :disabled="saving"
                :data-test="`offer-${entry.name}`"
                @change="setOffered(entry, ($event.target as HTMLInputElement).checked)"
              />
              <span class="distribution-text">
                <span class="distribution-name">{{ entry.name }}</span>
                <small v-if="entry.description" class="distribution-desc">{{ entry.description }}</small>
              </span>
            </label>
            <span v-if="entry.min_size_key" class="distribution-min" :title="t('distributionCatalog.minSizeHint')">
              {{ t('distributionCatalog.minSize', { size: entry.min_size_key.toUpperCase() }) }}
            </span>
            <!-- A reserved slot, so the row never changes height when the
                 status appears. -->
            <span class="distribution-status" :class="{ visible: !entry.offered }">
              <i class="fas fa-eye-slash"></i>
              {{ t('distributionCatalog.withheld') }}
            </span>
          </li>
        </ul>

        <p class="catalog-note">
          <i class="fas fa-info-circle"></i>
          {{ t('distributionCatalog.launchNote') }}
        </p>

        <div class="catalog-actions">
          <span v-if="saveError" class="save-error" data-test="save-error">
            <i class="fas fa-exclamation-circle"></i> {{ saveError }}
          </span>
          <span v-else-if="savedRecently" class="save-ok" data-test="save-ok">
            <i class="fas fa-check"></i> {{ t('distributionCatalog.saved') }}
          </span>
          <button
            class="btn-primary"
            :disabled="saving || !dirty"
            data-test="save-catalog"
            @click="save"
          >
            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-save"></i>
            {{ t('distributionCatalog.save') }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useTranslations } from '../../../composables/useTranslations'

interface CatalogEntry {
  name: string
  description?: string
  os_type?: string
  min_size_key?: string
  offered: boolean
}

const { t } = useTranslations({
  en: {
    distributionCatalog: {
      title: 'Terminal distributions',
      description: 'Choose which environments people are offered when they start a terminal.',
      loading: 'Loading the catalogue…',
      empty: 'The terminal backend reports no distributions.',
      retry: 'Try again',
      withheld: 'Not offered',
      minSize: 'needs {size}',
      minSizeHint: 'The smallest machine size this environment can run on. Plans that do not allow it cannot start this environment.',
      launchNote: 'An environment you do not offer stays available to scenarios that ask for it by name — hiding it here removes it from the launcher, it does not uninstall it.',
      save: 'Save',
      saved: 'Saved',
      loadFailed: 'Could not load the distribution catalogue.',
      saveFailed: 'Could not save the catalogue.'
    }
  },
  fr: {
    distributionCatalog: {
      title: 'Distributions des terminaux',
      description: 'Choisissez les environnements proposés au démarrage d\'un terminal.',
      loading: 'Chargement du catalogue…',
      empty: 'Le backend de terminaux ne renvoie aucune distribution.',
      retry: 'Réessayer',
      withheld: 'Non proposée',
      minSize: 'nécessite {size}',
      minSizeHint: 'La plus petite taille de machine sur laquelle cet environnement peut tourner. Les plans qui ne l\'autorisent pas ne peuvent pas le démarrer.',
      launchNote: 'Un environnement non proposé reste disponible pour les scénarios qui le demandent par son nom — le masquer ici le retire du lanceur, cela ne le désinstalle pas.',
      save: 'Enregistrer',
      saved: 'Enregistré',
      loadFailed: 'Impossible de charger le catalogue des distributions.',
      saveFailed: 'Impossible d\'enregistrer le catalogue.'
    }
  }
})

const ENDPOINT = '/terminals/admin/distribution-catalog'

const entries = ref<CatalogEntry[]>([])
const savedState = ref<Record<string, boolean>>({})
const loading = ref(false)
const saving = ref(false)
const loadError = ref('')
const saveError = ref('')
const savedRecently = ref(false)

/** Nothing to save until a box actually differs from what the server holds. */
const dirty = computed(() =>
  entries.value.some(e => savedState.value[e.name] !== e.offered)
)

function snapshot(list: CatalogEntry[]) {
  entries.value = list
  savedState.value = Object.fromEntries(list.map(e => [e.name, e.offered]))
}

function setOffered(entry: CatalogEntry, offered: boolean) {
  entry.offered = offered
  savedRecently.value = false
  saveError.value = ''
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const response = await axios.get<CatalogEntry[]>(ENDPOINT)
    snapshot(response.data ?? [])
  } catch (error: any) {
    loadError.value = error?.response?.data?.error_message || t('distributionCatalog.loadFailed')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  saveError.value = ''
  try {
    // Send the whole withheld set, not a delta: what the boxes say is what is
    // stored, so the screen and the setting cannot drift apart.
    const withheld = entries.value.filter(e => !e.offered).map(e => e.name)
    const response = await axios.put<CatalogEntry[]>(ENDPOINT, { withheld })
    // Render what came back rather than what we sent.
    snapshot(response.data ?? [])
    savedRecently.value = true
  } catch (error: any) {
    saveError.value = error?.response?.data?.error_message || t('distributionCatalog.saveFailed')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.catalog-page {
  max-width: 820px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.page-header h1 {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-2xl);
  color: var(--color-text-primary);
}

.page-description {
  margin: 0 0 var(--spacing-xl) 0;
  color: var(--color-text-secondary);
}

.state-block {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  color: var(--color-text-secondary);
}

.state-error {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.distribution-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.distribution-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
}

.distribution-row + .distribution-row {
  border-top: 1px solid var(--color-border-light);
}

.distribution-toggle {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  flex: 1;
  margin: 0;
  cursor: pointer;
}

.distribution-toggle input[type='checkbox'] {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 0.2em;
  cursor: pointer;
}

.distribution-text {
  display: flex;
  flex-direction: column;
}

.distribution-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.distribution-desc {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.distribution-min {
  flex-shrink: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* Always laid out, only revealed — so ticking a box never shifts the row. */
.distribution-status {
  flex-shrink: 0;
  min-width: 8.5rem;
  text-align: right;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  visibility: hidden;
}

.distribution-status.visible {
  visibility: visible;
}

.catalog-note {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin: var(--spacing-md) 0 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.catalog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.save-error {
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}

.save-ok {
  color: var(--color-success);
  font-size: var(--font-size-sm);
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
}
</style>
