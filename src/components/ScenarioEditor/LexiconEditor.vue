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
                <select
                  v-model="entry.parent_key"
                  class="form-control"
                  :disabled="!sitsInTheWorld(entry.kind)"
                  :data-testid="`lexicon-parent-${index}`"
                >
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
                  <option value="message">{{ t('lexicon.kindMessage') }}</option>
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
                  @click="removeEntry(entry)"
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
        <button type="button" class="btn btn-primary" :disabled="isSaving" data-testid="lexicon-save" @click="lexicon.save()">
          {{ lexicon.isSaving.value ? t('lexicon.saving') : t('lexicon.save') }}
        </button>
      </div>

      <!-- Refusals and gaps read differently on purpose: one means the save did
           not happen, the other that it did and there is work left. -->
      <p v-if="saveError" class="ocf-lexicon-error" data-testid="lexicon-error">
        <i class="fas fa-circle-exclamation" aria-hidden="true"></i> {{ saveError }}
      </p>

      <!-- Scripts still naming a room. Kept apart from the vocabulary's own
           gaps: this is not something to name in another language, it is a
           script to change. -->
      <div v-if="scriptLiterals.length" class="ocf-lexicon-problems" data-testid="lexicon-script-literals">
        <strong>{{ t('lexicon.scriptsTitle', { count: scriptLiterals.length }) }}</strong>
        <p class="ocf-lexicon-intro">{{ t('lexicon.scriptsBody') }}</p>
        <ul>
          <li v-for="(literal, i) in scriptLiterals" :key="i">{{ literal }}</li>
        </ul>
      </div>

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
import { computed, onMounted } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import type { ScenarioLexicon, LexiconEntry } from '../../composables/useScenarioLexicon'

/**
 * The vocabulary a scenario's world is built from.
 *
 * Edited as one table and saved as one document, because that is what it is
 * server-side: entries point at parents, and a lexicon saved halfway through
 * has rooms inside rooms that are not there yet.
 */
const props = defineProps<{
  lexicon: ScenarioLexicon
  locales: string[]
  defaultLocale: string
}>()

const { problems, scriptLiterals, isLoading, isSaving, saveError } = props.lexicon

/**
 * Everything except the messages.
 *
 * A message is in this document too, and is saved with it, but it is prose and
 * belongs on its own screen — a hundred sentences in name-sized boxes, mixed in
 * among the rooms, is a table nobody finds anything in.
 */
const entries = computed(() =>
  props.lexicon.entries.value.filter(entry => entry.kind !== 'message')
)

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

/**
 * Only a place stands somewhere. A stem is a fragment of other names, a text
 * is found inside a file, and a message is read by a person — none of them has
 * a path, so the server stores no parent for them. Offering the choice anyway
 * would let a trainer set something that is silently dropped on save.
 */
function sitsInTheWorld(kind: string): boolean {
  return kind === 'place'
}

function addEntry() {
  props.lexicon.entries.value.push({
    key: '',
    parent_key: entries.value.length ? entries.value[0].key : '',
    kind: 'place',
    names: Object.fromEntries(props.locales.map(code => [code, ''])) as Record<string, string>
  })
}

/**
 * Remove by identity, never by the row's position.
 *
 * The rows shown here are a filtered view — the messages are not among them —
 * so the row's index is not the entry's index in the document, and splicing by
 * it deletes something else.
 */
function removeEntry(entry: LexiconEntry) {
  const all = props.lexicon.entries.value
  const at = all.indexOf(entry)
  if (at !== -1) all.splice(at, 1)
}

onMounted(() => props.lexicon.ensureLoaded())

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
      kindMessage: 'Message (what a check says when it refuses)',
      add: 'Add an object',
      remove: 'Remove',
      save: 'Save vocabulary',
      saving: 'Saving…',
      saveError: 'The vocabulary could not be saved',
      loadError: 'The vocabulary could not be loaded',
      loading: 'Loading the vocabulary…',
      empty: 'No objects yet. Add one, or import a scenario that has them.',
      problems: 'Saved. {count} thing(s) left to do:',
      clean: 'Saved. Every object is named in every language.',
      scriptsTitle: '{count} script(s) still name a room directly:',
      scriptsBody: 'These work in the language they were written in, and send a learner reading another one somewhere their machine does not have. Replace the name with the vocabulary reference beside it.'
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
      kindMessage: 'Message (ce que dit une vérification qui refuse)',
      add: 'Ajouter un objet',
      remove: 'Supprimer',
      save: 'Enregistrer le vocabulaire',
      saving: 'Enregistrement…',
      saveError: "Le vocabulaire n'a pas pu être enregistré",
      loadError: "Le vocabulaire n'a pas pu être chargé",
      loading: 'Chargement du vocabulaire…',
      empty: 'Aucun objet pour le moment. Ajoutez-en un, ou importez un scénario qui en contient.',
      problems: 'Enregistré. {count} chose(s) à finir :',
      clean: 'Enregistré. Chaque objet est nommé dans toutes les langues.',
      scriptsTitle: '{count} script(s) nomment encore une pièce directement :',
      scriptsBody: "Ils fonctionnent dans la langue où ils ont été écrits, et envoient un apprenant qui en lit une autre là où sa machine n'a rien. Remplacez le nom par la référence du vocabulaire indiquée à côté."
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
