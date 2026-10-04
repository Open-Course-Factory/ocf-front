<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Writes a scenario with the teacher's own AI assistant, in three steps:
 * describe what to write (or what to change), copy the prompt into any chat
 * assistant, paste its answer back. Nothing runs on our side: the answer is
 * imported through the same JSON import routes as a file, and a refusal lists
 * every problem with a ready-made follow-up prompt for the assistant.
 *
 * "create" imports into the destination the teacher picks. "improve" sends the
 * scenario's own JSON export along and imports the answer back into the
 * scenario's own scope, which updates it in place (the import upserts by
 * title — see useScenarioCreateScopes.scopeKeyForScenario).
 */
-->

<template>
  <BaseModal
    :visible="visible"
    :title="mode === 'create' ? t('scenarioAi.createTitle') : t('scenarioAi.improveTitle')"
    title-icon="fas fa-wand-magic-sparkles"
    size="large"
    :close-on-overlay-click="false"
    @close="close"
  >
    <ol class="ocf-ai-steps" aria-hidden="true">
      <li v-for="n in 3" :key="n" :class="{ 'is-current': step === n, 'is-done': step > n }">
        {{ t(`scenarioAi.step${n}`) }}
      </li>
    </ol>

    <!-- The language the assistant is instructed in, for every prompt of this
         window including the fix-up one. The content language is separate. -->
    <div class="ocf-ai-prompt-language">
      <label for="ai-prompt-language">{{ t('scenarioAi.promptLanguage') }}</label>
      <select id="ai-prompt-language" v-model="promptLanguage" class="form-control" data-testid="scenario-ai-prompt-language">
        <option value="fr">Français</option>
        <option value="en">English</option>
      </select>
    </div>

    <!-- 1. Describe -->
    <div v-if="step === 1" class="ocf-ai-body" data-testid="scenario-ai-step-describe">
      <template v-if="mode === 'create'">
        <div class="form-group">
          <label for="ai-description">{{ t('scenarioAi.description') }}</label>
          <textarea
            id="ai-description"
            v-model="brief.description"
            class="form-control"
            rows="5"
            :placeholder="t('scenarioAi.descriptionPlaceholder')"
          ></textarea>
        </div>
        <div class="ocf-ai-row">
          <div class="form-group">
            <label for="ai-language">{{ t('scenarioAi.language') }}</label>
            <select id="ai-language" v-model="brief.language" class="form-control" @change="contentLanguageChosen = true">
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
          <div class="form-group">
            <label for="ai-level">{{ t('scenarioAi.level') }}</label>
            <select id="ai-level" v-model="brief.level" class="form-control">
              <option value="beginner">{{ t('scenarioEditor.beginner') }}</option>
              <option value="intermediate">{{ t('scenarioEditor.intermediate') }}</option>
              <option value="advanced">{{ t('scenarioEditor.advanced') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label for="ai-step-count">{{ t('scenarioAi.stepCount') }}</label>
            <input id="ai-step-count" v-model.number="brief.stepCount" type="number" min="1" max="20" class="form-control" />
          </div>
        </div>
        <fieldset class="ocf-ai-types">
          <legend>{{ t('scenarioAi.stepTypes') }}</legend>
          <label v-for="type in SCENARIO_AI_STEP_TYPES" :key="type">
            <input v-model="brief.stepTypes" type="checkbox" :value="type" />
            {{ t(`scenarioAi.type.${type}`) }}
          </label>
        </fieldset>
        <ScenarioScopeSelect
          id="ai-destination"
          v-model="destinationKey"
          :label="t('scenarioAi.destination')"
          :empty-hint="t('scenarioAi.noDestination')"
        />
      </template>

      <template v-else>
        <p class="ocf-ai-target">
          <i class="fas fa-flask" aria-hidden="true"></i>
          {{ t('scenarioAi.improving', { title: scenario?.title || '' }) }}
        </p>
        <div class="form-group">
          <label for="ai-instruction">{{ t('scenarioAi.instruction') }}</label>
          <textarea
            id="ai-instruction"
            v-model="instruction"
            class="form-control"
            rows="5"
            :placeholder="t('scenarioAi.instructionPlaceholder')"
          ></textarea>
        </div>
      </template>
    </div>

    <!-- 2. Copy the prompt -->
    <div v-else-if="step === 2" class="ocf-ai-body" data-testid="scenario-ai-step-prompt">
      <p class="ocf-ai-help">{{ t('scenarioAi.promptHelp') }}</p>
      <div class="ocf-ai-copy-row">
        <button type="button" class="ocf-btn-outline" data-testid="scenario-ai-copy-prompt" @click="copy(prompt, 'prompt')">
          <i :class="copied === 'prompt' ? 'fas fa-check' : 'fas fa-copy'" aria-hidden="true"></i>
          {{ copied === 'prompt' ? t('scenarioAi.copied') : t('scenarioAi.copyPrompt') }}
        </button>
        <span class="ocf-ai-hint">{{ t('scenarioAi.openYourAi') }}</span>
      </div>
      <textarea
        class="form-control ocf-ai-code"
        data-testid="scenario-ai-prompt"
        :value="prompt"
        rows="14"
        readonly
        :aria-label="t('scenarioAi.promptLabel')"
        @focus="($event.target as HTMLTextAreaElement).select()"
      ></textarea>
    </div>

    <!-- 3. Paste the answer -->
    <div v-else class="ocf-ai-body" data-testid="scenario-ai-step-answer">
      <div class="form-group">
        <label for="ai-answer">{{ t('scenarioAi.answer') }}</label>
        <textarea
          id="ai-answer"
          v-model="answer"
          class="form-control ocf-ai-code"
          rows="10"
          :placeholder="t('scenarioAi.answerPlaceholder')"
        ></textarea>
      </div>

      <!-- One status line, always present, so nothing below it moves while typing. -->
      <p class="ocf-ai-status" :class="parsed?.ok ? 'is-ok' : parsed ? 'is-error' : ''" data-testid="scenario-ai-parse-status">
        {{ parseStatus }}
      </p>

      <div v-if="changes" class="ocf-ai-changes" data-testid="scenario-ai-changes">
        <p>{{ t('scenarioAi.stepCountChange', { before: changes.stepsBefore, after: changes.stepsAfter }) }}</p>
        <p v-if="changes.addedSteps.length">+ {{ changes.addedSteps.join(' · ') }}</p>
        <p v-if="changes.removedSteps.length">− {{ changes.removedSteps.join(' · ') }}</p>
        <label v-if="changes.titleChanged" class="ocf-ai-keep-title" data-testid="scenario-ai-title-changed">
          <input v-model="keepOriginalTitle" type="checkbox" />
          {{ t('scenarioAi.keepTitle', { title: scenario?.title || '' }) }}
        </label>
      </div>

      <ScenarioImportProblems v-if="problems.length" :title="errorMessage" :problems="problems">
        <button type="button" class="ocf-btn-outline ocf-ai-fix-btn" data-testid="scenario-ai-copy-fix" @click="copy(buildFixPrompt(problems, promptLanguage), 'fix')">
          <i :class="copied === 'fix' ? 'fas fa-check' : 'fas fa-copy'" aria-hidden="true"></i>
          {{ copied === 'fix' ? t('scenarioAi.copied') : t('scenarioAi.copyFix') }}
        </button>
      </ScenarioImportProblems>
    </div>

    <div v-if="errorMessage && !problems.length" class="alert alert-danger ocf-ai-error" role="alert">{{ errorMessage }}</div>

    <template #footer>
      <button v-if="step > 1" type="button" class="btn btn-secondary" :disabled="busy" @click="step--">
        <i class="fas fa-arrow-left" aria-hidden="true"></i> {{ t('scenarioAi.back') }}
      </button>
      <button type="button" class="btn btn-secondary" :disabled="busy" @click="close">{{ t('scenarioAi.cancel') }}</button>
      <button
        v-if="step === 1"
        type="button"
        class="btn btn-primary"
        data-testid="scenario-ai-next"
        :disabled="!canWritePrompt || busy"
        @click="writePrompt"
      >
        <i :class="busy ? 'fas fa-spinner fa-spin' : 'fas fa-arrow-right'" aria-hidden="true"></i> {{ t('scenarioAi.writePrompt') }}
      </button>
      <button v-else-if="step === 2" type="button" class="btn btn-primary" data-testid="scenario-ai-next" @click="step = 3">
        <i class="fas fa-arrow-right" aria-hidden="true"></i> {{ t('scenarioAi.haveAnswer') }}
      </button>
      <button
        v-else
        type="button"
        class="btn btn-primary"
        data-testid="scenario-ai-import"
        :disabled="!parsed?.ok || busy"
        @click="importAnswer"
      >
        <i :class="busy ? 'fas fa-spinner fa-spin' : 'fas fa-file-import'" aria-hidden="true"></i>
        {{ mode === 'create' ? t('scenarioAi.import') : t('scenarioAi.update') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import BaseModal from '../Modals/BaseModal.vue'
import { useFeatureFlags } from '../../composables/useFeatureFlags'
import ScenarioScopeSelect from './ScenarioScopeSelect.vue'
import ScenarioImportProblems from './ScenarioImportProblems.vue'
import { useScenarioEditorI18n } from '../../composables/useScenarioEditorI18n'
import { useLocale } from '../../composables/useLocale'
import { useScenarioCreateScopes } from '../../composables/useScenarioCreateScopes'
import { useScenarioAiTranslations } from '../../composables/useScenarioAiTranslations'
import { useScenarioImportError } from '../../composables/useScenarioImportError'
import { teacherService } from '../../services/domain/scenario'
import { useScenarioAiCatalog } from '../../composables/useScenarioAiCatalog'
import { scenarioImportProblems } from '../../utils/scenarioImportProblems'
import {
  SCENARIO_AI_STEP_TYPES,
  buildCreatePrompt,
  buildImprovePrompt,
  buildFixPrompt,
  extractJsonObject,
  summarizeScenarioChanges,
  type ScenarioAiBrief,
  type ScenarioAiCatalog,
  type ScenarioAiLanguage
} from '../../utils/scenarioAiPrompt'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'improve'
  /** The scenario to improve; ignored when creating. */
  scenario?: { id: string; title: string; organization_id?: string | null } | null
}>()

const stepEffectsEnabled = useFeatureFlags().createReactiveFlag('scenario_step_effects')

const emit = defineEmits<{
  close: []
  imported: [scenario: { id: string }]
}>()

useScenarioEditorI18n()
const describeImportError = useScenarioImportError()
const { t } = useScenarioAiTranslations()
// The user's chosen UI language, as the language selector and preferences set it.
const { currentLocale } = useLocale()
const { parseScopeKey, pickDefaultScopeKey, scopeKeyForScenario, loadScopeSources } = useScenarioCreateScopes()
const { loadCatalog } = useScenarioAiCatalog()

const step = ref(1)
const busy = ref(false)
const brief = reactive<ScenarioAiBrief>({ description: '', language: 'fr', level: 'beginner', stepCount: 4, stepTypes: ['terminal', 'quiz'] })
const destinationKey = ref('')
const instruction = ref('')
const promptLanguage = ref<ScenarioAiLanguage>('fr')
// The content language follows the prompt language until the teacher picks one.
const contentLanguageChosen = ref(false)
const catalog = ref<ScenarioAiCatalog | null>(null)
const original = ref<Record<string, any> | null>(null)
const answer = ref('')
const keepOriginalTitle = ref(true)
const problems = ref<string[]>([])
const errorMessage = ref('')
const copied = ref<'' | 'prompt' | 'fix'>('')

const canWritePrompt = computed(() =>
  props.mode === 'create'
    ? brief.description.trim() !== '' && !!parseScopeKey(destinationKey.value)
    : instruction.value.trim() !== '' && !!props.scenario
)

// Computed rather than written once, so that switching the prompt language —
// or going back to change the brief — rewrites the prompt in place.
const prompt = computed(() => {
  // Step banners are only advertised while the editor offers them.
  const options = { effects: stepEffectsEnabled.value }
  if (props.mode === 'create') return catalog.value ? buildCreatePrompt(brief, catalog.value, promptLanguage.value, options) : ''
  return original.value ? buildImprovePrompt(instruction.value, original.value, catalog.value, promptLanguage.value, options) : ''
})

watch(promptLanguage, language => {
  if (!contentLanguageChosen.value) brief.language = language
})

const parsed = computed(() => (answer.value.trim() ? extractJsonObject(answer.value) : null))

const parseStatus = computed(() => {
  const result = parsed.value
  if (!result) return t('scenarioAi.waitingForAnswer')
  // `in` rather than `!result.ok`: without strictNullChecks a boolean
  // discriminant does not narrow the union.
  if ('reason' in result) {
    return result.reason === 'invalid' ? t('scenarioAi.invalidJson', { detail: result.detail || '' }) : t('scenarioAi.noJson')
  }
  const steps = Array.isArray(result.value.steps) ? result.value.steps.length : 0
  return t('scenarioAi.found', { title: String(result.value.title ?? ''), steps })
})

const changes = computed(() =>
  props.mode === 'improve' && original.value && parsed.value?.ok
    ? summarizeScenarioChanges(original.value, parsed.value.value)
    : null
)

watch(() => props.visible, async (open) => {
  if (!open) return
  reset()
  promptLanguage.value = currentLocale.value.startsWith('en') ? 'en' : 'fr'
  brief.language = promptLanguage.value
  if (props.mode === 'create') {
    await loadScopeSources()
    destinationKey.value = pickDefaultScopeKey()
  }
})

function reset() {
  step.value = 1
  busy.value = false
  brief.description = ''
  instruction.value = ''
  contentLanguageChosen.value = false
  catalog.value = null
  original.value = null
  answer.value = ''
  keepOriginalTitle.value = true
  problems.value = []
  errorMessage.value = ''
  copied.value = ''
}

async function writePrompt() {
  busy.value = true
  errorMessage.value = ''
  try {
    if (props.mode === 'create') {
      catalog.value = await loadCatalog()
    } else {
      const [exported, platform] = await Promise.all([
        teacherService.exportScenarioJSON(props.scenario!.id),
        loadCatalog()
      ])
      original.value = exported
      catalog.value = platform
    }
    step.value = 2
  } catch (err: any) {
    errorMessage.value = err.response?.data?.error_message || t('scenarioAi.exportError')
  } finally {
    busy.value = false
  }
}

async function copy(text: string, what: 'prompt' | 'fix') {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = what
    setTimeout(() => { if (copied.value === what) copied.value = '' }, 2500)
  } catch {
    // No clipboard (insecure origin, denied permission): the prompt stays in
    // the read-only box, which selects itself on focus for a manual copy.
    errorMessage.value = t('scenarioAi.copyFailed')
  }
}

function destination(): { groupId?: string; organizationId?: string } {
  const key = props.mode === 'create' ? destinationKey.value : scopeKeyForScenario(props.scenario || {})
  const scope = parseScopeKey(key)
  if (scope?.kind === 'group') return { groupId: scope.id }
  if (scope?.kind === 'org') return { organizationId: scope.id }
  return {}
}

async function importAnswer() {
  if (!parsed.value?.ok) return
  const data = { ...parsed.value.value }
  if (changes.value?.titleChanged && keepOriginalTitle.value) data.title = original.value!.title

  busy.value = true
  problems.value = []
  errorMessage.value = ''
  try {
    const scenario = await teacherService.importScenarioJSONInto(destination(), data)
    emit('imported', scenario)
  } catch (err: any) {
    problems.value = scenarioImportProblems(err)
    if (problems.value.length) errorMessage.value = t('scenarioAi.refused', { count: problems.value.length })
    else errorMessage.value = describeImportError(err, t('scenarioAi.importError'))
  } finally {
    busy.value = false
  }
}

function close() {
  if (!busy.value) emit('close')
}
</script>

<style scoped>
.ocf-ai-steps {
  display: flex;
  gap: var(--spacing-sm);
  list-style: none;
  padding: 0;
  margin: 0 0 var(--spacing-md);
  counter-reset: ocf-ai-step;
}

.ocf-ai-steps li {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-bottom: 3px solid var(--color-border-light);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  counter-increment: ocf-ai-step;
}

.ocf-ai-steps li::before {
  content: counter(ocf-ai-step) '. ';
}

.ocf-ai-steps li.is-current {
  border-color: var(--color-primary);
  color: var(--color-text-primary);
  font-weight: 600;
}

.ocf-ai-steps li.is-done {
  border-color: var(--color-success);
}

.ocf-ai-prompt-language {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.ocf-ai-prompt-language select {
  width: auto;
}

.ocf-ai-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.ocf-ai-body textarea.form-control {
  width: 100%;
  max-width: none;
}

.ocf-ai-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-md);
}

.ocf-ai-types {
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.ocf-ai-types legend {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.ocf-ai-types label {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-primary);
}

.ocf-ai-target,
.ocf-ai-help {
  margin: 0;
  color: var(--color-text-secondary);
}

.ocf-ai-copy-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.ocf-ai-hint {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.ocf-ai-code {
  font-family: var(--font-family-monospace);
  font-size: var(--font-size-sm);
}

.ocf-ai-status {
  margin: 0;
  min-height: 1.5em;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.ocf-ai-status.is-ok {
  color: var(--color-success);
}

.ocf-ai-status.is-error {
  color: var(--color-danger);
}

.ocf-ai-changes {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.ocf-ai-changes p {
  margin: 0;
}

.ocf-ai-keep-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
  color: var(--color-warning-text);
}

.ocf-ai-error {
  margin: var(--spacing-sm) 0 0;
}

.ocf-ai-fix-btn {
  margin-top: var(--spacing-sm);
}

@media (max-width: 640px) {
  .ocf-ai-row {
    grid-template-columns: 1fr;
  }
}
</style>
