<!--
  Open Course Factory - Front
  Copyright (C) 2023-2026 Solution Libre
-->
<template>
  <div class="ocf-lexicon">
    <p class="ocf-lexicon-intro">{{ t('lexicon.intro') }}</p>

    <div v-if="isLoading" class="ocf-lexicon-state">{{ t('lexicon.loading') }}</div>

    <template v-else>
      <div class="ocf-lexicon-scroll">
        <table class="ocf-lexicon-table" data-testid="lexicon-table">
          <thead>
            <tr>
              <th>{{ t('lexicon.key') }}</th>
              <th>{{ t('lexicon.inside') }}</th>
              <th>{{ t('lexicon.kind') }}</th>
              <th v-for="code in locales" :key="code">{{ languageName(code) }}</th>
              <th><span class="ocf-sr-only">{{ t('lexicon.remove') }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entry, index) in entries" :key="index" :data-testid="`lexicon-row-${index}`">
              <td>
                <input
                  v-model="entry.key"
                  class="form-control ocf-lexicon-key"
                  :placeholder="t('lexicon.keyPlaceholder')"
                  :data-testid="`lexicon-key-${index}`"
                  @input="entry.key = entry.key.toUpperCase()"
                />
              </td>
              <td>
                <!-- A parent is chosen, never typed: an entry pointing at a
                     room that does not exist cannot be stored, so offering the
                     mistake would only produce a rejected save. -->
                <select v-model="entry.parent_key" class="form-control" :data-testid="`lexicon-parent-${index}`">
                  <option value="">{{ t('lexicon.noParent') }}</option>
                  <option
                    v-for="candidate in parentChoices(entry)"
                    :key="candidate"
                    :value="candidate"
                  >{{ candidate }}</option>
                </select>
              </td>
              <td>
                <select v-model="entry.kind" class="form-control" :data-testid="`lexicon-kind-${index}`">
                  <option value="place">{{ t('lexicon.kindPlace') }}</option>
                  <option value="token">{{ t('lexicon.kindToken') }}</option>
                  <option value="stem">{{ t('lexicon.kindStem') }}</option>
                </select>
              </td>
              <td v-for="code in locales" :key="code">
                <input
                  v-model="entry.names[code]"
                  class="form-control"
                  :data-testid="`lexicon-name-${index}-${code}`"
                  :class="{ 'ocf-lexicon-empty': !entry.names[code] }"
                />
              </td>
              <td>
                <button
                  type="button"
                  class="ocf-lexicon-remove"
                  :title="t('lexicon.remove')"
                  :aria-label="t('lexicon.remove')"
                  :data-testid="`lexicon-remove-${index}`"
                  @click="entries.splice(index, 1)"
                >
                  <i class="fas fa-trash" aria-hidden="true"></i>
                </button>
              </td>
            </tr>
            <tr v-if="!entries.length">
              <td :colspan="4 + locales.length" class="ocf-lexicon-state">{{ t('lexicon.empty') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="ocf-lexicon-actions">
        <button type="button" class="btn btn-secondary" data-testid="lexicon-add" @click="addEntry">
          <i class="fas fa-plus" aria-hidden="true"></i> {{ t('lexicon.add') }}
        </button>
        <button type="button" class="btn btn-primary" :disabled="isSaving" data-testid="lexicon-save" @click="save">
          {{ isSaving ? t('lexicon.saving') : t('lexicon.save') }}
        </button>
      </div>

      <!-- Refusals and gaps read differently on purpose: one means the save did
           not happen, the other that it did and there is work left. -->
      <p v-if="saveError" class="ocf-lexicon-error" data-testid="lexicon-error">
        <i class="fas fa-circle-exclamation" aria-hidden="true"></i> {{ saveError }}
      </p>

      <div v-if="problems.length" class="ocf-lexicon-problems" data-testid="lexicon-problems">
        <strong>{{ t('lexicon.problems', { count: problems.length }) }}</strong>
        <ul>
          <li v-for="(problem, i) in problems" :key="i">{{ problem }}</li>
        </ul>
      </div>
      <p v-else-if="!saveError" class="ocf-lexicon-clean" data-testid="lexicon-clean">
        <i class="fas fa-circle-check" aria-hidden="true"></i> {{ t('lexicon.clean') }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { useTranslations } from '../../composables/useTranslations'

/**
 * The vocabulary a scenario's world is built from.
 *
 * Edited as one table and saved as one document, because that is what it is
 * server-side: entries point at parents, and a lexicon saved halfway through
 * has rooms inside rooms that are not there yet.
 */
const props = defineProps<{
  scenarioId: string
  locales: string[]
  defaultLocale: string
}>()

interface LexiconEntry {
  key: string
  parent_key: string
  kind: string
  names: Record<string, string>
}

const entries = ref<LexiconEntry[]>([])
const problems = ref<string[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const saveError = ref('')

function languageName(locale: string): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: 'language' }).of(locale) || locale
    return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1)
  } catch {
    return locale
  }
}

/**
 * Keys an entry may sit inside: any other entry, minus itself.
 *
 * Not filtered for cycles beyond that — the server refuses those and names the
 * entry, which is a better message than a silently shortened list that leaves
 * someone wondering where a room went.
 */
function parentChoices(entry: LexiconEntry): string[] {
  return entries.value.map(e => e.key).filter(key => key && key !== entry.key)
}

function addEntry() {
  entries.value.push({
    key: '',
    parent_key: entries.value.length ? entries.value[0].key : '',
    kind: 'place',
    names: Object.fromEntries(props.locales.map(code => [code, ''])) as Record<string, string>
  })
}

async function load() {
  if (!props.scenarioId) return
  isLoading.value = true
  saveError.value = ''
  try {
    const response = await axios.get(`/scenarios/${props.scenarioId}/lexicon`)
    entries.value = (response.data?.entries || []).map((e: any) => ({
      key: e.key,
      parent_key: e.parent_key || '',
      kind: e.kind || 'place',
      // Every declared language gets a box, including ones this entry has no
      // name in yet — an absent column is indistinguishable from a filled one.
      names: Object.fromEntries(
        props.locales.map(code => [code, e.names?.[code] || ''])
      ) as Record<string, string>
    }))
    problems.value = response.data?.problems || []
  } catch (err: any) {
    saveError.value = err.response?.data?.error_message || t('lexicon.loadError')
  } finally {
    isLoading.value = false
  }
}

async function save() {
  isSaving.value = true
  saveError.value = ''
  try {
    const response = await axios.put(`/scenarios/${props.scenarioId}/lexicon`, {
      entries: entries.value.map(e => ({
        key: e.key,
        parent_key: e.parent_key,
        kind: e.kind,
        names: e.names
      }))
    })
    problems.value = response.data?.problems || []
  } catch (err: any) {
    // A refusal names the entry at fault, so it is shown as sent rather than
    // replaced with a generic failure.
    saveError.value =
      err.response?.data?.error_message ||
      err.response?.data?.message ||
      t('lexicon.saveError')
  } finally {
    isSaving.value = false
  }
}

onMounted(load)
watch(() => props.scenarioId, load)

const { t } = useTranslations({
  en: {
    lexicon: {
      intro: 'The objects this world is built from. Scripts refer to them as $W_KEY for the name and $P_KEY for the path, so one script serves every language.',
      key: 'Key',
      keyPlaceholder: 'CELLAR',
      inside: 'Inside',
      noParent: '— the world —',
      kind: 'Kind',
      kindPlace: 'Place (a directory or file)',
      kindToken: 'Text (found inside a file)',
      kindStem: 'Stem (part of other names)',
      add: 'Add an object',
      remove: 'Remove',
      save: 'Save vocabulary',
      saving: 'Saving…',
      saveError: 'The vocabulary could not be saved',
      loadError: 'The vocabulary could not be loaded',
      loading: 'Loading the vocabulary…',
      empty: 'No objects yet. Add one, or import a scenario that has them.',
      problems: 'Saved. {count} thing(s) left to do:',
      clean: 'Saved. Every object is named in every language.'
    }
  },
  fr: {
    lexicon: {
      intro: "Les objets qui composent ce monde. Les scripts y font référence par $W_CLE pour le nom et $P_CLE pour le chemin : un seul script sert toutes les langues.",
      key: 'Clé',
      keyPlaceholder: 'CAVE',
      inside: 'Dans',
      noParent: '— le monde —',
      kind: 'Type',
      kindPlace: 'Lieu (dossier ou fichier)',
      kindToken: 'Texte (trouvé dans un fichier)',
      kindStem: 'Radical (morceau d’autres noms)',
      add: 'Ajouter un objet',
      remove: 'Supprimer',
      save: 'Enregistrer le vocabulaire',
      saving: 'Enregistrement…',
      saveError: "Le vocabulaire n'a pas pu être enregistré",
      loadError: "Le vocabulaire n'a pas pu être chargé",
      loading: 'Chargement du vocabulaire…',
      empty: 'Aucun objet pour le moment. Ajoutez-en un, ou importez un scénario qui en contient.',
      problems: 'Enregistré. {count} chose(s) à finir :',
      clean: 'Enregistré. Chaque objet est nommé dans toutes les langues.'
    }
  }
})
</script>

<style scoped>
.ocf-lexicon { display: flex; flex-direction: column; gap: 0.75rem; }

.ocf-lexicon-intro,
.ocf-lexicon-state {
  margin: 0;
  font-size: 0.88rem;
  color: var(--color-text-muted);
}

.ocf-lexicon-scroll { overflow-x: auto; }

.ocf-lexicon-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.ocf-lexicon-table th {
  text-align: left;
  padding: 0.35rem 0.4rem;
  color: var(--color-text-secondary);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.ocf-lexicon-table td {
  padding: 0.2rem 0.4rem;
  vertical-align: middle;
}

.ocf-lexicon-key { font-family: monospace; text-transform: uppercase; }

/* An unnamed box is marked, so a gap is visible without reading the list. */
.ocf-lexicon-empty { border-color: var(--color-warning); }

.ocf-lexicon-remove {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem;
}
.ocf-lexicon-remove:hover { color: var(--color-danger); }

.ocf-lexicon-actions { display: flex; gap: 0.5rem; }

.ocf-lexicon-problems {
  border-left: 3px solid var(--color-warning);
  background: var(--color-background-secondary);
  padding: 0.6rem 0.9rem;
  border-radius: 4px;
  font-size: 0.85rem;
}
.ocf-lexicon-problems ul { margin: 0.3rem 0 0; padding-left: 1.1rem; }

.ocf-lexicon-clean { margin: 0; font-size: 0.85rem; color: var(--color-success); }
.ocf-lexicon-error { margin: 0; font-size: 0.85rem; color: var(--color-danger); }

.ocf-sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0);
  white-space: nowrap; border: 0;
}
</style>
