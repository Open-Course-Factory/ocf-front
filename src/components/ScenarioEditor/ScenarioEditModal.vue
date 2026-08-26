<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Modal for creating or editing a Scenario entity. Four tabs:
 * General / Content / Setup / Options.
 *
 * The parent owns the working `editingScenario` object — this component
 * mutates it in place via the v-model contract. The save flow remains in
 * the parent (it dispatches between platform / org / group create endpoints
 * and refreshes the canvas afterwards).
 *
 * Extracted from ScenarioEditor.vue during the Wave 12 refactor — markup,
 * fields, tabs, and ARIA semantics are preserved verbatim.
 */
-->

<template>
  <BaseModal
    :visible="visible"
    :title="title"
    size="large"
    :show-default-footer="true"
    :confirm-text="isTranslating ? t('scenarioEditor.saveTranslation') : t('scenarioEditor.saveEntity')"
    :cancel-text="t('scenarioEditor.cancel')"
    :is-loading="isSaving"
    :error-message="errorMessage"
    @close="emit('close')"
    @confirm="isTranslating ? handleSaveTranslation() : emit('save')"
  >
    <!-- Tabs -->
    <TabStrip
      v-model="activeTab"
      :tabs="tabs"
      :aria-label="ariaLabel"
      class="modal-tabs-spacing"
    />

    <!-- Which language the scenario's own text is being edited in. The same
         choice as the header, repeated beside the content it governs. -->
    <div v-if="offeredLocales.length > 1" class="ocf-scn-locale" data-testid="scenario-edit-locale-switch">
      <span class="ocf-scn-locale-label">
        <i class="fas fa-language" aria-hidden="true"></i>
        {{ t('scenarioEditor.editingIn') }}
      </span>
      <button
        v-for="code in offeredLocales"
        :key="code"
        type="button"
        class="ocf-scn-locale-btn"
        :class="{ active: (locale || defaultLocale) === code }"
        :aria-pressed="(locale || defaultLocale) === code"
        :data-testid="`scenario-edit-locale-${code}`"
        @click="requestLocale(code)"
      >
        {{ languageName(code) }}
        <span v-if="code === defaultLocale" class="ocf-scn-locale-origin">{{ t('scenarioEditor.originalTag') }}</span>
      </button>
    </div>

    <!-- General tab -->
    <div
      v-show="activeTab === 'general'"
      id="panel-general"
      role="tabpanel"
      aria-labelledby="tab-general"
      class="modal-form"
    >
      <div v-if="!isTranslating" class="form-group">
        <label for="scenario-name">{{ t('scenarioEditor.scenarioName') }}</label>
        <input
          id="scenario-name"
          v-model="model.name"
          type="text"
          class="form-control"
          :placeholder="t('scenarioEditor.enterName')"
        />
      </div>

        <TranslationPane
            v-if="isTranslating"
            field-id="scenario-title-translation"
            :label="t('scenarioEditor.scenarioTitle')"
            :source="model.title || ''"
            v-model="translationData.title"
            :source-locale-label="defaultLocaleLabel"
            :target-locale-label="localeLabel"
          />
      <div v-if="!isTranslating" class="form-group">
        <label for="scenario-title">{{ t('scenarioEditor.scenarioTitle') }}</label>
        <input
          id="scenario-title"
          v-model="model.title"
          type="text"
          class="form-control"
          :placeholder="t('scenarioEditor.enterTitle')"
        />
      </div>

      <div v-if="!isTranslating" class="form-row">
        <div class="form-group">
          <label for="scenario-difficulty">{{ t('scenarioEditor.difficulty') }}</label>
          <select id="scenario-difficulty" v-model="model.difficulty" class="form-control">
            <option value="beginner">{{ t('scenarioEditor.beginner') }}</option>
            <option value="intermediate">{{ t('scenarioEditor.intermediate') }}</option>
            <option value="advanced">{{ t('scenarioEditor.advanced') }}</option>
          </select>
        </div>

        <div class="form-group">
          <label for="scenario-estimated-time">{{ t('scenarioEditor.estimatedTimeMinutes') }}</label>
          <input
            id="scenario-estimated-time"
            v-model.number="model.estimated_time_minutes"
            type="number"
            min="0"
            step="5"
            class="form-control"
            placeholder="30"
          />
        </div>
      </div>

        <TranslationPane
            v-if="isTranslating"
            field-id="scenario-description-translation"
            :label="t('scenarioEditor.description')"
            :source="model.description || ''"
            v-model="translationData.description"
            :source-locale-label="defaultLocaleLabel"
            :target-locale-label="localeLabel"
            multiline
            :rows="3"
          />
      <div v-if="!isTranslating" class="form-group">
        <label for="scenario-description">{{ t('scenarioEditor.description') }}</label>
        <textarea
          id="scenario-description"
          v-model="model.description"
          class="form-control"
          rows="3"
          :placeholder="t('scenarioEditor.enterDescription')"
        ></textarea>
      </div>

      <!-- Scope picker (creation only) -->
      <div class="form-group" v-if="model.isNew && availableCreateScopes.length > 0">
        <label for="create-scope">{{ t('scenarioEditor.createScope') }}</label>
        <select id="create-scope" v-model="model._scopeKey" class="form-control">
          <optgroup v-if="platformScopeAvailable" :label="t('scenarioEditor.scopePlatform')">
            <option value="platform:*">🛡️ {{ t('scenarioEditor.platformOnly') }}</option>
          </optgroup>
          <optgroup v-if="orgScopes.length" :label="t('scenarioEditor.scopeOrganizations')">
            <option v-for="s in orgScopes" :key="`org:${s.id}`" :value="`org:${s.id}`">
              {{ s.name }}
            </option>
          </optgroup>
          <optgroup v-if="groupScopes.length" :label="t('scenarioEditor.scopeGroups')">
            <option v-for="s in groupScopes" :key="`group:${s.id}`" :value="`group:${s.id}`">
              {{ s.name }}
            </option>
          </optgroup>
        </select>
        <p class="form-hint">{{ scopeHint }}</p>
      </div>
      <!-- Read-only org indicator (edit mode) -->
      <div class="form-group" v-else-if="!model.isNew && currentScenarioOrgLabel">
        <label for="scenario-org-readonly">{{ t('scenarioEditor.orgLabel') }}</label>
        <input
          id="scenario-org-readonly"
          type="text"
          class="form-control"
          :value="currentScenarioOrgLabel"
          disabled
        />
      </div>
    </div>

    <!-- Content tab -->
    <div
      v-show="activeTab === 'content'"
      id="panel-content"
      role="tabpanel"
      aria-labelledby="tab-content"
      class="modal-form"
    >
        <TranslationPane
            v-if="isTranslating"
            field-id="scenario-intro-text-translation"
            :label="t('scenarioEditor.introText')"
            :source="model.intro_text || ''"
            v-model="translationData.intro_text"
            :source-locale-label="defaultLocaleLabel"
            :target-locale-label="localeLabel"
            multiline
            :rows="6"
          />
      <div v-if="!isTranslating" class="form-group">
        <label for="scenario-intro-text">{{ t('scenarioEditor.introText') }}</label>
        <textarea
          id="scenario-intro-text"
          v-model="model.intro_text"
          class="form-control"
          rows="6"
          :placeholder="t('scenarioEditor.introTextPlaceholder')"
        ></textarea>
        <span class="form-hint">{{ t('scenarioEditor.markdownSupported') }}</span>
      </div>

        <TranslationPane
            v-if="isTranslating"
            field-id="scenario-finish-text-translation"
            :label="t('scenarioEditor.finishText')"
            :source="model.finish_text || ''"
            v-model="translationData.finish_text"
            :source-locale-label="defaultLocaleLabel"
            :target-locale-label="localeLabel"
            multiline
            :rows="6"
          />
      <div v-if="!isTranslating" class="form-group">
        <label for="scenario-finish-text">{{ t('scenarioEditor.finishText') }}</label>
        <textarea
          id="scenario-finish-text"
          v-model="model.finish_text"
          class="form-control"
          rows="6"
          :placeholder="t('scenarioEditor.finishTextPlaceholder')"
        ></textarea>
        <span class="form-hint">{{ t('scenarioEditor.markdownSupported') }}</span>
      </div>

        <TranslationPane
            v-if="isTranslating"
            field-id="scenario-objectives-translation"
            :label="t('scenarioEditor.objectives')"
            :source="model.objectives || ''"
            v-model="translationData.objectives"
            :source-locale-label="defaultLocaleLabel"
            :target-locale-label="localeLabel"
            multiline
            :rows="3"
          />
      <div v-if="!isTranslating" class="form-group">
        <label for="scenario-objectives">{{ t('scenarioEditor.objectives') }}</label>
        <textarea
          id="scenario-objectives"
          v-model="model.objectives"
          class="form-control"
          rows="3"
          :placeholder="t('scenarioEditor.objectivesPlaceholder')"
        ></textarea>
      </div>

        <TranslationPane
            v-if="isTranslating"
            field-id="scenario-prerequisites-translation"
            :label="t('scenarioEditor.prerequisites')"
            :source="model.prerequisites || ''"
            v-model="translationData.prerequisites"
            :source-locale-label="defaultLocaleLabel"
            :target-locale-label="localeLabel"
            multiline
            :rows="3"
          />
      <div v-if="!isTranslating" class="form-group">
        <label for="scenario-prerequisites">{{ t('scenarioEditor.prerequisites') }}</label>
        <textarea
          id="scenario-prerequisites"
          v-model="model.prerequisites"
          class="form-control"
          rows="3"
          :placeholder="t('scenarioEditor.prerequisitesPlaceholder')"
        ></textarea>
      </div>
    </div>

    <!-- A scenario's scripts, size, visibility and languages are configuration:
         they mean the same thing whatever language a learner reads it in, so a
         translation has nothing to say about them. Said out loud rather than
         shown as fields that would not save. -->
    <div v-if="isTranslating && (activeTab === 'setup' || activeTab === 'options')" class="ocf-scn-shared" data-testid="scenario-edit-shared-notice">
      <i class="fas fa-lock"></i>
      <div>
        <strong>{{ t('scenarioEditor.sharedTitle') }}</strong>
        <p>{{ t('scenarioEditor.sharedBody') }}</p>
      </div>
    </div>

    <!-- Vocabulary tab: the objects this world is built from. Saved on its own,
         because it is its own document server-side and the scenario's Save
         sends a fixed list of configuration fields. -->
    <div
      v-if="activeTab === 'vocabulary' && !isTranslating"
      id="panel-vocabulary"
      role="tabpanel"
      aria-labelledby="tab-vocabulary"
      class="modal-form"
    >
      <LexiconEditor
        v-if="model.entityId && lexicon"
        :lexicon="lexicon"
        :locales="lexiconLocales"
        :default-locale="defaultLocale || 'en'"
      />
      <p v-else class="ocf-scn-locale-label">{{ t('scenarioEditor.vocabularyAfterSave') }}</p>
    </div>

    <!-- Messages tab: the sentences a check prints when it refuses. The same
         document as the vocabulary, and saved with it — a different editing
         job, because these are prose somebody reads rather than a word typed
         into a shell. -->
    <div
      v-if="activeTab === 'messages' && !isTranslating"
      id="panel-messages"
      role="tabpanel"
      aria-labelledby="tab-messages"
      class="modal-form"
    >
      <MessageEditor
        v-if="model.entityId && lexicon"
        :lexicon="lexicon"
        :locales="lexiconLocales"
        :default-locale="defaultLocale || 'en'"
      />
      <p v-else class="ocf-scn-locale-label">{{ t('scenarioEditor.vocabularyAfterSave') }}</p>
    </div>

    <!-- Setup tab -->
    <div
      v-show="activeTab === 'setup' && !isTranslating"
      id="panel-setup"
      role="tabpanel"
      aria-labelledby="tab-setup"
      class="modal-form"
    >
      <div class="form-group">
        <label for="scenario-setup-script">{{ t('scenarioEditor.setupScript') }}</label>
        <textarea
          id="scenario-setup-script"
          v-model="model.setup_script"
          class="form-control script-editor"
          rows="12"
          :placeholder="t('scenarioEditor.setupScriptPlaceholder')"
        ></textarea>
        <span class="form-hint">{{ t('scenarioEditor.setupScriptHint') }}</span>
      </div>
    </div>

    <!-- Options tab -->
    <div
      v-show="activeTab === 'options' && !isTranslating"
      id="panel-options"
      role="tabpanel"
      aria-labelledby="tab-options"
      class="modal-form"
    >
      <!-- Which languages this scenario is offered in. Declaring one is what
           turns on the translation editor; a scenario that names only its own
           language behaves exactly as it always has. -->
      <div class="form-group ocf-languages">
        <label>{{ t('scenarioEditor.languages') }}</label>
        <p class="ocf-languages-hint">{{ t('scenarioEditor.languagesHint') }}</p>
        <div class="ocf-language-options">
          <label v-for="code in SUPPORTED_LOCALES" :key="code" class="ocf-language-option">
            <input
              type="checkbox"
              :value="code"
              :checked="offeredLocales.includes(code)"
              :data-testid="`scenario-locale-${code}`"
              @change="toggleLocale(code, ($event.target as HTMLInputElement).checked)"
            />
            <span>{{ languageName(code) }}</span>
          </label>
        </div>

        <div v-if="offeredLocales.length > 1" class="ocf-default-locale">
          <label for="scenario-default-locale">{{ t('scenarioEditor.defaultLocale') }}</label>
          <select
            id="scenario-default-locale"
            class="form-control"
            data-testid="scenario-default-locale"
            :value="model.default_locale || offeredLocales[0]"
            @change="model.default_locale = ($event.target as HTMLSelectElement).value"
          >
            <option v-for="code in offeredLocales" :key="code" :value="code">
              {{ languageName(code) }}
            </option>
          </select>
          <p class="ocf-languages-hint">{{ t('scenarioEditor.defaultLocaleHint') }}</p>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="scenario-instance-type">{{ t('scenarioEditor.instanceType') }}</label>
          <select
            v-if="sizes.length > 0"
            id="scenario-instance-type"
            v-model="instanceTypeModel"
            class="form-control"
          >
            <option
              v-if="model.instance_type && !sizes.some(s => s.key.toUpperCase() === String(model.instance_type).toUpperCase())"
              :value="model.instance_type"
            >
              {{ t('scenarioEditor.instanceTypeUnknown', { key: model.instance_type }) }}
            </option>
            <option v-for="s in sizes" :key="s.key" :value="s.key">
              {{ s.key }} — {{ s.name }} ({{ formatMcpuAsVcpu(effectiveCpuMcpu(s)) }} vCPU, {{ s.memory }} RAM)
            </option>
          </select>
          <input
            v-else
            id="scenario-instance-type"
            v-model="model.instance_type"
            type="text"
            class="form-control"
            placeholder="S"
          />
        </div>

        <div class="form-group">
          <label for="scenario-hostname">{{ t('scenarioEditor.hostname') }}</label>
          <input
            id="scenario-hostname"
            v-model="model.hostname"
            type="text"
            class="form-control"
            placeholder="lab"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="scenario-os-type">{{ t('scenarioEditor.osType') }}</label>
          <select id="scenario-os-type" v-model="model.os_type" class="form-control">
            <option value="">-</option>
            <option value="deb">Debian (apt)</option>
            <option value="rpm">RPM (dnf/yum)</option>
            <option value="apk">Alpine (apk)</option>
            <option value="pacman">Arch (pacman)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="scenario-source-type">{{ t('scenarioEditor.sourceType') }}</label>
          <select id="scenario-source-type" v-model="model.source_type" class="form-control">
            <option value="">-</option>
            <option value="builtin">{{ t('scenarioEditor.sourceBuiltin') }}</option>
            <option value="git">Git</option>
            <option value="upload">Upload</option>
            <option value="seed">Seed</option>
          </select>
        </div>
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label" for="scenario-flags-enabled">
          <input id="scenario-flags-enabled" type="checkbox" v-model="model.flags_enabled" />
          {{ t('scenarioEditor.flagsEnabled') }}
        </label>
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label" for="scenario-crash-traps">
          <input id="scenario-crash-traps" type="checkbox" v-model="model.crash_traps" />
          {{ t('scenarioEditor.crashTraps') }}
        </label>
        <span class="form-hint">{{ t('scenarioEditor.crashTrapsHint') }}</span>
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label" for="scenario-is-public">
          <input id="scenario-is-public" type="checkbox" v-model="model.is_public" />
          {{ t('scenarioEditor.isPublic') }}
        </label>
      </div>
    </div>
  </BaseModal>

  <!-- Switching language rebuilds the form from the other language's text. -->
  <BaseModal
    :visible="!!pendingLocaleChange"
    :title="t('scenarioEditor.confirmLocaleChangeTitle')"
    size="small"
    :show-default-footer="true"
    :confirm-text="t('scenarioEditor.confirmLocaleChangeConfirm')"
    :cancel-text="t('scenarioEditor.cancel')"
    @close="pendingLocaleChange = null"
    @confirm="commitLocaleChange"
  >
    <p>{{ t('scenarioEditor.confirmLocaleChangeBody') }}</p>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, watch } from 'vue'
import BaseModal from '../Modals/BaseModal.vue'
import TabStrip from '../Common/TabStrip.vue'
import TranslationPane from './TranslationPane.vue'
import LexiconEditor from './LexiconEditor.vue'
import MessageEditor from './MessageEditor.vue'
import { useScenarioLexicon, type ScenarioLexicon } from '../../composables/useScenarioLexicon'
import { useScenarioEditorI18n } from '../../composables/useScenarioEditorI18n'
import type { Size } from '../../types/terminal'
import { formatMcpuAsVcpu, effectiveCpuMcpu } from '../../utils/formatters'

interface ScopeOption {
  id: string
  name: string
}

interface Props {
  visible: boolean
  /** The language being edited; equal to defaultLocale means authoring. */
  locale?: string
  defaultLocale?: string
  /** The existing translation of this scenario's own text, when written. */
  translation?: any
  localeLabel?: string
  defaultLocaleLabel?: string
  // The working scenario object — mutated in place. The parent owns its lifecycle.
  editingScenario: Record<string, any>
  title: string
  isSaving?: boolean
  errorMessage?: string
  // Scope picker (creation only)
  orgScopes: ScopeOption[]
  groupScopes: ScopeOption[]
  platformScopeAvailable: boolean
  availableCreateScopes: any[]
  scopeHint: string
  // Edit mode org indicator
  currentScenarioOrgLabel: string | null
  // Machine size catalog for the instance_type dropdown (empty → plain text input).
  sizes?: Size[]
  // Optional ARIA label override; defaults to a generic editor name.
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  isSaving: false,
  errorMessage: '',
  sizes: () => [],
  ariaLabel: undefined,
  locale: '',
  defaultLocale: '',
  translation: undefined,
  localeLabel: '',
  defaultLocaleLabel: ''
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save'): void
  (e: 'save-translation', fields: Record<string, string>): void
  (e: 'update:locale', locale: string): void
}>()

/**
 * Whether this modal is translating the scenario's own text rather than
 * editing the scenario.
 *
 * Only prose is translated. A scenario's name, size, hostname, scripts and
 * visibility are configuration: they mean the same thing in every language, and
 * offering them per translation would invite two copies of one setting.
 */
const isTranslating = computed(() => !!props.locale && props.locale !== props.defaultLocale)

const translationData = ref<Record<string, string>>({
  title: '',
  description: '',
  objectives: '',
  prerequisites: '',
  intro_text: '',
  finish_text: ''
})

const TRANSLATED_FIELDS = ['title', 'description', 'objectives', 'prerequisites', 'intro_text', 'finish_text'] as const

watch(() => [props.visible, props.translation, props.locale], () => {
  const existing = props.translation || {}
  translationData.value = Object.fromEntries(
    TRANSLATED_FIELDS.map(field => [field, existing[field] || ''])
  ) as Record<string, string>
}, { immediate: true })

const translationIsDirty = computed(() => {
  if (!isTranslating.value) return false
  const loaded = props.translation || {}
  return TRANSLATED_FIELDS.some(f => (translationData.value[f] || '') !== (loaded[f] || ''))
})

const pendingLocaleChange = ref<string | null>(null)

function requestLocale(locale: string) {
  if (locale === (props.locale || props.defaultLocale)) return
  if (translationIsDirty.value) {
    pendingLocaleChange.value = locale
    return
  }
  emit('update:locale', locale)
}

function commitLocaleChange() {
  if (pendingLocaleChange.value) emit('update:locale', pendingLocaleChange.value)
  pendingLocaleChange.value = null
}

function handleSaveTranslation() {
  emit('save-translation', { ...translationData.value })
}

const { t } = useScenarioEditorI18n()

// Local proxy that mutates the parent's editingScenario (objects are
// reference-semantic in Vue — mutating fields is observed by reactivity).
// Using a computed that returns the prop keeps the template terse.
const model = computed(() => props.editingScenario)

/**
 * Languages the platform itself speaks. A scenario cannot be offered in one the
 * product cannot render its own interface in, so this is the honest bound.
 */
const SUPPORTED_LOCALES = ['en', 'fr']

/** The stored JSON array, as a list. Anything unparseable reads as none. */
const offeredLocales = computed<string[]>(() => {
  const raw = model.value.locales
  if (!raw) return []
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})

/** The languages the vocabulary has a box for; the scenario's own if it offers none. */
const lexiconLocales = computed<string[]>(() =>
  offeredLocales.value.length ? offeredLocales.value : [props.defaultLocale || 'en']
)

/**
 * One lexicon for the whole modal.
 *
 * The Vocabulary and Messages tabs are two views of a single document, and a
 * save sends all of it. Held here rather than in either tab so that the one
 * saved second cannot undo what the other has not saved yet.
 */
// shallowRef, not ref: a deep ref unwraps the refs inside the lexicon, and the
// two tabs would then be handed plain values that never update.
const lexicon = shallowRef<ScenarioLexicon | null>(null)
watch(
  () => model.value.entityId,
  entityId => {
    lexicon.value = entityId
      ? useScenarioLexicon(entityId, () => lexiconLocales.value, () => t('scenarioEditor.lexiconSaveError'))
      : null
  },
  { immediate: true }
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
 * Add or remove a language.
 *
 * Removing the default one moves the default rather than leaving it pointing at
 * a language no longer offered — a scenario whose own text claims to be in a
 * language it does not list would make every other language read as stale
 * against nothing.
 */
function toggleLocale(code: string, checked: boolean) {
  const next = checked
    ? SUPPORTED_LOCALES.filter(c => offeredLocales.value.includes(c) || c === code)
    : offeredLocales.value.filter(c => c !== code)

  model.value.locales = next.length ? JSON.stringify(next) : ''

  if (!next.length) {
    model.value.default_locale = ''
  } else if (!next.includes(model.value.default_locale)) {
    model.value.default_locale = next[0]
  }
}

// Bridges v-model with the size <select>: if the stored instance_type matches a
// catalog key case-insensitively, surface the catalog's canonical key so the
// corresponding <option> gets selected. Writing back stores the picked key.
const instanceTypeModel = computed<string>({
  get() {
    const current = model.value.instance_type
    if (!current || props.sizes.length === 0) return current ?? ''
    const match = props.sizes.find(
      s => s.key.toUpperCase() === String(current).toUpperCase()
    )
    return match ? match.key : current
  },
  set(val: string) {
    model.value.instance_type = val
  }
})

const activeTab = ref('general')
const allTabs = computed(() => [
  { key: 'general', label: t('scenarioEditor.tabGeneral') },
  { key: 'content', label: t('scenarioEditor.tabContent') },
  { key: 'setup', label: t('scenarioEditor.tabSetup') },
  { key: 'options', label: t('scenarioEditor.tabOptions') },
  { key: 'vocabulary', label: t('scenarioEditor.tabVocabulary') },
  { key: 'messages', label: t('scenarioEditor.tabMessages') }
])
// At create time, only show General + Content — the Setup/Options tabs are
// hidden until first save to reduce friction (Marc: "I have to fill 12 fields
// before I have anything to save").
const tabs = computed(() =>
  model.value.isNew
    ? allTabs.value.filter(tab => tab.key === 'general' || tab.key === 'content')
    : allTabs.value
)

// Reset to the first tab whenever the modal opens.
watch(() => props.visible, (vis) => {
  if (vis) activeTab.value = 'general'
})
</script>

<style scoped>
.ocf-scn-locale {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.25rem 0 0.75rem;
}

.ocf-scn-locale-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.ocf-scn-locale-btn {
  padding: 0.2rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-background);
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
}

.ocf-scn-locale-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

.ocf-scn-locale-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.ocf-scn-locale-origin {
  opacity: 0.7;
  font-size: 0.75rem;
  margin-left: 0.25rem;
}

.ocf-scn-shared {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 1rem 1.1rem;
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-warning);
  border-radius: 4px;
  background: var(--color-background-secondary);
}

.ocf-scn-shared i { color: var(--color-warning); margin-top: 0.15rem; }
.ocf-scn-shared strong { color: var(--color-text-primary); }
.ocf-scn-shared p { margin: 0.25rem 0 0; font-size: 0.9rem; color: var(--color-text-secondary); }

.ocf-languages {
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1rem;
}

.ocf-languages-hint {
  margin: 0.2rem 0 0.6rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.ocf-language-options {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.ocf-language-option {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 400;
  color: var(--color-text-primary);
}

.ocf-default-locale {
  margin-top: 0.9rem;
  max-width: 18rem;
}

.modal-tabs-spacing {
  margin-bottom: 1rem;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-primary);
}

.form-control {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.form-control::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.6;
}

textarea.form-control {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.script-editor {
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  tab-size: 4;
  resize: vertical;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

.checkbox-group {
  flex-direction: row !important;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500 !important;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}
</style>
