<!--
  Open Course Factory - Front
  Copyright (C) 2023-2026 Solution Libre
-->
<template>
  <div class="ocf-messages">
    <p class="ocf-messages-intro">{{ t('messages.intro') }}</p>

    <div v-if="lexicon.isLoading.value" class="ocf-messages-state">{{ t('messages.loading') }}</div>

    <template v-else>
      <p v-if="!messages.length" class="ocf-messages-state" data-testid="messages-empty">
        {{ t('messages.empty') }}
      </p>

      <template v-else>
        <label class="ocf-messages-filter">
          <span class="ocf-sr-only">{{ t('messages.filter') }}</span>
          <i class="fas fa-magnifying-glass" aria-hidden="true"></i>
          <input
            v-model="filter"
            type="search"
            class="form-control"
            :placeholder="t('messages.filterPlaceholder')"
            data-testid="messages-filter"
          />
        </label>

        <p v-if="!shown.length" class="ocf-messages-state" data-testid="messages-no-match">
          {{ t('messages.noMatch') }}
        </p>

        <ul class="ocf-messages-list">
          <li
            v-for="entry in shown"
            :key="entry.key"
            class="ocf-message"
            :data-testid="`message-${entry.key}`"
          >
            <div class="ocf-message-head">
              <code class="ocf-message-key">{{ entry.key }}</code>
              <!-- A message with placeholders is a printf format string, and
                   printf fills them from the check's own variables. Dropping
                   one prints the wrong number; there is nothing in the sentence
                   to say so, hence the count. -->
              <span
                v-if="placeholderCount(entry) > 0"
                class="ocf-message-slots"
                :title="t('messages.placeholderHelp')"
              >
                {{ t('messages.placeholders', { count: placeholderCount(entry) }) }}
              </span>
            </div>

            <div class="ocf-message-langs">
              <div v-for="code in locales" :key="code" class="ocf-message-lang">
                <label :for="`message-${entry.key}-${code}`">{{ languageName(code) }}</label>
                <textarea
                  :id="`message-${entry.key}-${code}`"
                  v-model="entry.names[code]"
                  class="form-control ocf-message-text"
                  rows="2"
                  :class="{ 'ocf-message-empty': !entry.names[code] }"
                  :data-testid="`message-text-${entry.key}-${code}`"
                ></textarea>
                <p
                  v-if="slotMismatch(entry, code)"
                  class="ocf-message-warn"
                  :data-testid="`message-slots-${entry.key}-${code}`"
                >
                  <i class="fas fa-triangle-exclamation" aria-hidden="true"></i>
                  {{ t('messages.slotMismatch', {
                    here: countSlots(entry.names[code]),
                    source: placeholderCount(entry)
                  }) }}
                </p>
              </div>
            </div>
          </li>
        </ul>
      </template>

      <div class="ocf-messages-actions">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="lexicon.isSaving.value"
          data-testid="messages-save"
          @click="lexicon.save()"
        >
          {{ lexicon.isSaving.value ? t('messages.saving') : t('messages.save') }}
        </button>
        <p class="ocf-messages-note">{{ t('messages.savesEverything') }}</p>
      </div>

      <p v-if="lexicon.saveError.value" class="ocf-messages-error" data-testid="messages-error">
        <i class="fas fa-circle-exclamation" aria-hidden="true"></i> {{ lexicon.saveError.value }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import type { ScenarioLexicon, LexiconEntry } from '../../composables/useScenarioLexicon'

/**
 * The sentences a check prints when it refuses.
 *
 * They live in the same document as the world's rooms and are saved with it,
 * but editing them is a different job: a room is one word typed into a shell,
 * a message is prose somebody reads. A hundred sentences in name-sized boxes,
 * interleaved with the rooms, is a table nobody finds anything in.
 */
const props = defineProps<{
  lexicon: ScenarioLexicon
  locales: string[]
  defaultLocale: string
}>()

const filter = ref('')

onMounted(() => props.lexicon.ensureLoaded())

const messages = computed(() =>
  props.lexicon.entries.value.filter(entry => entry.kind === 'message')
)

/**
 * Filter on the text as well as the key.
 *
 * Someone who read a bad sentence in the player has the sentence, not the key —
 * asking them for the key is asking them to find it first.
 */
const shown = computed(() => {
  const needle = filter.value.trim().toLocaleLowerCase()
  if (!needle) return messages.value
  return messages.value.filter(entry =>
    entry.key.toLocaleLowerCase().includes(needle) ||
    Object.values(entry.names).some(text => (text || '').toLocaleLowerCase().includes(needle))
  )
})

function languageName(locale: string): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: 'language' }).of(locale) || locale
    return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1)
  } catch {
    return locale
  }
}

function countSlots(text: string | undefined): number {
  return (text || '').split('%s').length - 1
}

/** How many the sentence was written with, which is what the script passes. */
function placeholderCount(entry: LexiconEntry): number {
  return countSlots(entry.names[props.defaultLocale])
}

/**
 * A translation that lost or gained a placeholder against the original.
 *
 * Flagged rather than blocked: the server refuses the save and names the entry,
 * and being told which box is wrong while typing beats being told after.
 * An empty translation is not a mismatch — it is untranslated, which the box
 * already shows.
 */
function slotMismatch(entry: LexiconEntry, locale: string): boolean {
  if (locale === props.defaultLocale) return false
  if (!entry.names[locale]) return false
  return countSlots(entry.names[locale]) !== placeholderCount(entry)
}

const { t } = useTranslations({
  en: {
    messages: {
      intro:
        'What a check says when it refuses. A learner reads these in the language they chose, so each one has to exist in every language the scenario offers.',
      filter: 'Find a message',
      filterPlaceholder: 'Search a key or a sentence…',
      noMatch: 'No message matches.',
      empty: 'This scenario has no messages yet. A check that prints its own text has it written into the script instead.',
      placeholders: '{count} value from the check',
      placeholderHelp:
        '%s is filled in by the check when it runs. Keep as many as the original has, in the order they are printed.',
      slotMismatch: 'This has {here} %s, the original has {source}. The check will print the wrong values.',
      save: 'Save messages',
      saving: 'Saving…',
      savesEverything: 'Saves the whole vocabulary, including anything edited on the Vocabulary tab.',
      loading: 'Loading the messages…'
    }
  },
  fr: {
    messages: {
      intro:
        "Ce que dit une vérification lorsqu'elle refuse. Un apprenant les lit dans la langue qu'il a choisie : chacune doit donc exister dans toutes les langues proposées par le scénario.",
      filter: 'Trouver un message',
      filterPlaceholder: 'Chercher une clé ou une phrase…',
      noMatch: 'Aucun message ne correspond.',
      empty: "Ce scénario n'a pas encore de messages. Une vérification qui affiche son propre texte l'a écrit dans le script.",
      placeholders: '{count} valeur venant de la vérification',
      placeholderHelp:
        "%s est rempli par la vérification à l'exécution. Gardez-en autant que l'original, dans l'ordre où ils sont affichés.",
      slotMismatch: "Celle-ci a {here} %s, l'original en a {source}. La vérification affichera les mauvaises valeurs.",
      save: 'Enregistrer les messages',
      saving: 'Enregistrement…',
      savesEverything: "Enregistre tout le vocabulaire, y compris ce qui a été modifié dans l'onglet Vocabulaire.",
      loading: 'Chargement des messages…'
    }
  }
})
</script>

<style scoped>
.ocf-messages-intro {
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}

.ocf-messages-state {
  color: var(--color-text-secondary);
  padding: 1rem 0;
}

.ocf-messages-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: var(--color-text-secondary);
}

.ocf-messages-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ocf-message {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.75rem;
  background: var(--color-background-soft);
}

.ocf-message-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.ocf-message-key {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.ocf-message-slots {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 0.1rem 0.6rem;
}

.ocf-message-langs {
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 900px) {
  .ocf-message-langs {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }
}

.ocf-message-lang label {
  display: block;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.25rem;
}

.ocf-message-text {
  width: 100%;
  resize: vertical;
  font-family: inherit;
}

.ocf-message-empty {
  border-color: var(--color-warning);
}

.ocf-message-warn {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: var(--color-warning);
}

.ocf-messages-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.ocf-messages-note {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.ocf-messages-error {
  margin-top: 0.75rem;
  color: var(--color-danger);
}

.ocf-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
</style>
