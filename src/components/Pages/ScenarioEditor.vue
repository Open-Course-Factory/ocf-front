<template>
  <div class="ocf-scenario-workbench">
    <ScenarioEditorHeader
      :scenarios="allScenarios"
      :selected-scenario-id="selectedScenarioId"
      :current-scenario="currentScenario"
      :scenario-org-name="currentScenarioOrgName"
      :can-create-scenario="canCreateScenario"
      :can-edit-scenario="canEditScenario"
      :can-copy-to-org="canCopyToOrg"
      :can-export="!!currentScenario && canExportScenario(currentScenario)"
      :can-retire="!!currentScenario && canRetireScenario(currentScenario)"
      :is-admin="isAdmin"
      :can-preview="canPreviewScenario || launchableInCatalogue"
      :play-disabled-reason="canPlayScenario ? '' : t('scenarioEditor.playNeedsAccess')"
      :is-preview-loading="isPreviewLoading"
      :health-available="health.available.value"
      :blocking-count="health.blockingCount.value"
      :warning-count="health.warningCount.value"
      :save-state="saveState"
      @select="requestScenario"
      @create-new="handleCreateNew"
      @export-json="currentScenario && exportScenario(currentScenario, 'json')"
      @export-killercoda="currentScenario && exportScenario(currentScenario, 'killercoda')"
      @copy-to-org="showDuplicateModal = true"
      @archive="showArchiveModal = true"
      @unarchive="handleUnarchive"
      @delete="showDeleteScenarioModal = true"
      @preview="play"
    >
      <template #import>
        <ScenarioImportMenu @imported="(scenario, source) => openImported(scenario, source === 'ai' ? 'scenarioEditor.aiCreateSuccess' : 'scenarioEditor.importSuccess')" />
      </template>
      <template #ai>
        <ScenarioAiButtons :scenario="currentScenario" :can-manage="canEditScenario" only="improve" @imported="onAiImported" />
      </template>
    </ScenarioEditorHeader>

    <!-- Nothing open: say what can be done, not that nothing is there. -->
    <section v-if="!currentScenario" class="ocf-workbench-empty" data-testid="editor-empty-state">
      <i class="fas fa-flask ocf-workbench-empty-icon" aria-hidden="true"></i>
      <h2>{{ t('scenarioEditor.emptyTitle') }}</h2>
      <p>{{ t('scenarioEditor.emptyDescription') }}</p>
      <div class="ocf-workbench-empty-actions">
        <button v-if="canCreateScenario" type="button" class="ocf-btn-primary" data-testid="empty-create-scenario" @click="handleCreateNew">
          <i class="fas fa-plus" aria-hidden="true"></i> {{ t('scenarioEditor.createScenario') }}
        </button>
        <ScenarioImportButton @imported="openImported" />
        <ScenarioAiButtons :scenario="null" :can-manage="false" only="create" @imported="onAiImported" />
      </div>
    </section>

    <div v-else class="ocf-workbench">
      <ScenarioOutline
        class="ocf-workbench-outline"
        :scenario="currentScenario"
        :steps="outline"
        :selected-key="selectedKey"
        :editable="canEditScenario"
        :can-edit-settings="canEditScenario"
        :translation-states="translationStates"
        @select="requestStep"
        @move="moveOutlineStep"
        @insert="insertDraft"
        @insert-copies="(index, ids) => copyLibrarySteps(ids, index)"
        @edit-settings="openScenarioSettings"
      />

      <main class="ocf-workbench-center">
        <ScenarioStepEditor
          v-if="editingStep && canEditScenario"
          :step-data="editingStep"
          :is-new="!editingStep.id"
          :is-first-step="selectedIndex === 0"
          :is-saving="isSavingStep"
          :error-message="stepSaveError"
          :locale="editingLocale"
          :default-locale="scenarioDefaultLocale"
          :translation="editingStepTranslation"
          :step-state="(editingStep.id && translationStates[editingStep.id]) || ''"
          :locale-label="localeLabel(editingLocale)"
          :default-locale-label="localeLabel(scenarioDefaultLocale)"
          :locales="scenarioLocales"
          :can-test-from-step="canPreviewScenario"
          @update:dirty="stepDirty = $event"
          @save="handleSaveStep"
          @save-translation="handleSaveStepTranslation"
          @update:locale="handleEditingLocaleChange"
          @test-from-step="openPreviewConfirm"
          @duplicate="duplicateSelectedStep"
          @delete="requestDeleteStep"
        />

        <!-- A scenario the user only reads (a colleague's lab, a platform one):
             its steps are shown as the learner reads them. -->
        <div v-else-if="editingStep" class="ocf-readonly-step" data-testid="readonly-step">
          <p class="ocf-readonly-banner">
            <i class="fas fa-lock" aria-hidden="true"></i>
            <span>{{ t(currentScenario.organization_id ? 'scenarioEditor.readOnlyStepBanner' : 'scenarioEditor.readOnlyPlatformBanner') }}</span>
            <button v-if="canCopyToOrg" type="button" class="ocf-btn-primary" data-testid="duplicate-into-org" @click="showDuplicateModal = true">
              <i class="fas fa-copy" aria-hidden="true"></i> {{ t('scenarioEditor.duplicateIntoMyOrg') }}
            </button>
          </p>
          <StepLearnerPreview :title="editingStep.title || ''" :text="editingStep.text_content || ''" :translations="editingStep.translations" />
        </div>

        <!-- A platform scenario's steps are sent only to its managers. -->
        <div v-else-if="!canEditScenario" class="ocf-workbench-placeholder" data-testid="readonly-state">
          <i class="fas fa-lock" aria-hidden="true"></i>
          <h2>{{ t('scenarioEditor.readOnlyTitle') }}</h2>
          <p>{{ t('scenarioEditor.readOnlyBody') }}</p>
          <button
            v-if="canCopyToOrg"
            type="button"
            class="ocf-btn-primary"
            data-testid="duplicate-into-org"
            @click="showDuplicateModal = true"
          >
            <i class="fas fa-copy" aria-hidden="true"></i> {{ t('scenarioEditor.duplicateIntoMyOrg') }}
          </button>
          <p v-else class="ocf-workbench-hint">{{ t('scenarioEditor.duplicateNowhere') }}</p>
        </div>

        <div v-else-if="!outline.length" class="ocf-workbench-placeholder" data-testid="no-steps-state">
          <i class="fas fa-list-ol" aria-hidden="true"></i>
          <h2>{{ t('scenarioEditor.noStepsTitle') }}</h2>
          <p>{{ t('scenarioEditor.noStepsBody') }}</p>
        </div>
      </main>

      <ScenarioRail
        class="ocf-workbench-rail"
        :scenario="currentScenario"
        :steps="outline"
        :findings="health.findings.value"
        :health-available="health.available.value"
        :can-manage="canEditScenario"
        :org-name="currentScenarioOrgName"
        @edit-settings="openScenarioSettings"
      >
        <template v-if="canEditScenario" #library>
          <StepLibrary
            :scenarios="allScenarios"
            :current-scenario-id="currentScenario.id"
            :insert-after="libraryInsertIndex"
            :busy="isCopyingSteps"
            @insert="ids => copyLibrarySteps(ids, libraryInsertIndex)"
          />
        </template>
      </ScenarioRail>
    </div>

    <ScenarioEditModal
      :visible="showScenarioEditModal"
      :editing-scenario="editingScenario"
      :title="editingScenario?.isNew ? t('scenarioEditor.createScenario') : t('scenarioEditor.editScenario')"
      :is-saving="isSaving"
      :error-message="modalError"
      :org-scopes="orgScopes"
      :group-scopes="groupScopes"
      :platform-scope-available="platformScopeAvailable"
      :available-create-scopes="availableCreateScopes"
      :scope-hint="scopeHint"
      :current-scenario-org-label="currentScenarioOrgLabel"
      :sizes="sizes"
      :aria-label="t('scenarioEditor.tabsLabel')"
      :locale="editingLocale"
      :default-locale="scenarioDefaultLocale"
      :translation="editingScenarioTranslation"
      :locale-label="localeLabel(editingLocale)"
      :default-locale-label="localeLabel(scenarioDefaultLocale)"
      @close="closeScenarioEditModal"
      @save="handleSaveScenario"
      @save-translation="handleSaveScenarioTranslation"
      @update:locale="handleScenarioEditingLocaleChange"
    />

    <ScenarioDuplicateModal
      :visible="showDuplicateModal"
      :scenario="currentScenario"
      @close="showDuplicateModal = false"
      @duplicated="openDuplicate"
    />

    <BaseModal
      :visible="!!stepPendingDelete"
      :title="t('scenarioEditor.confirmDelete')"
      size="small"
      :show-default-footer="true"
      :confirm-text="t('scenarioEditor.delete')"
      :cancel-text="t('scenarioEditor.cancel')"
      confirm-icon="fas fa-trash"
      @close="stepPendingDelete = null"
      @confirm="confirmDeleteStep"
    >
      <p>{{ t('scenarioEditor.deleteStepWarning', { name: stepPendingDelete?.title || '' }) }}</p>
    </BaseModal>

    <BaseModal
      :visible="unsavedGuard.isAsking.value"
      :title="t('scenarioEditor.unsavedTitle')"
      size="small"
      :show-default-footer="true"
      :confirm-text="t('scenarioEditor.discardChanges')"
      :cancel-text="t('scenarioEditor.keepEditing')"
      @close="unsavedGuard.answer(false)"
      @confirm="unsavedGuard.answer(true)"
    >
      <p>{{ t('scenarioEditor.unsavedBody') }}</p>
    </BaseModal>

    <BaseModal
      :visible="showDeleteScenarioModal"
      :title="t('scenarioEditor.confirmDelete')"
      size="small"
      :show-default-footer="true"
      :confirm-text="t('scenarioEditor.delete')"
      :cancel-text="t('scenarioEditor.cancel')"
      confirm-icon="fas fa-trash"
      @close="showDeleteScenarioModal = false"
      @confirm="handleDeleteScenario"
    >
      <p>{{ t('scenarioEditor.deleteScenarioWarning', { name: currentScenario?.title || currentScenario?.name || '' }) }}</p>
    </BaseModal>

    <!-- Archive Confirmation Modal -->
    <BaseModal
      :visible="showArchiveModal"
      :title="t('scenarioEditor.confirmArchiveTitle')"
      size="small"
      :show-default-footer="true"
      :confirm-text="t('scenarioEditor.archive')"
      :cancel-text="t('scenarioEditor.cancel')"
      confirm-icon="fas fa-box-archive"
      @close="showArchiveModal = false"
      @confirm="handleArchive"
    >
      <p>{{ t('scenarioEditor.archiveWarning', { name: currentScenario?.title || currentScenario?.name || '' }) }}</p>
    </BaseModal>

    <!-- Preview ("Play as learner") Confirmation Modal -->
    <BaseModal
      :visible="showPreviewConfirmModal"
      :title="t('scenarioEditor.previewConfirmTitle')"
      size="small"
      :show-default-footer="true"
      :confirm-text="isPreviewLoading ? t('scenarioEditor.previewStarting') : t('scenarioEditor.previewConfirmAction')"
      :cancel-text="t('scenarioEditor.cancel')"
      :is-loading="isPreviewLoading"
      confirm-icon="fas fa-play"
      @close="closePreviewConfirm"
      @confirm="handleConfirmPreview"
    >
      <p>{{ previewFromStepOrder === null ? t('scenarioEditor.previewConfirmBody') : t('scenarioEditor.previewFromStepConfirmBody') }}</p>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useScenariosStore } from '../../stores/scenarios'
import { useScenarioStepsStore } from '../../stores/scenarioSteps'
import { useOrganizationsStore } from '../../stores/organizations'
import { useScenarioEditorI18n } from '../../composables/useScenarioEditorI18n'
import { useAdminViewMode } from '../../composables/useAdminViewMode'
import { useScenarioCreateScopes } from '../../composables/useScenarioCreateScopes'
import { useNotification } from '../../composables/useNotification'
import { useScenarioExport } from '../../composables/useScenarioExport'
import { useScenarioHealth } from '../../composables/useScenarioHealth'
import { useUnsavedChangesGuard } from '../../composables/useUnsavedChangesGuard'
import { withoutUnseenScripts } from '../../utils/scenarioStepPayload'
import { previewOptions, previewRefusalKey } from '../../utils/scenarioPreview'
import {
  draftStep,
  insertStep,
  moveStep,
  renumberSteps,
  savedPosition,
  toOutlineSteps,
  type OutlineStep,
  type StepType
} from '../../utils/scenarioOutline'
import ScenarioOutline from '../ScenarioEditor/ScenarioOutline.vue'
import ScenarioRail from '../ScenarioEditor/ScenarioRail.vue'
import ScenarioStepEditor from '../ScenarioEditor/ScenarioStepEditor.vue'
import ScenarioEditModal from '../ScenarioEditor/ScenarioEditModal.vue'
import ScenarioEditorHeader from '../ScenarioEditor/ScenarioEditorHeader.vue'
import ScenarioImportButton from '../ScenarioEditor/ScenarioImportButton.vue'
import ScenarioAiButtons from '../ScenarioEditor/ScenarioAiButtons.vue'
import ScenarioDuplicateModal from '../ScenarioEditor/ScenarioDuplicateModal.vue'
import ScenarioImportMenu from '../ScenarioEditor/ScenarioImportMenu.vue'
import StepLearnerPreview from '../ScenarioEditor/StepLearnerPreview.vue'
import StepLibrary from '../ScenarioEditor/StepLibrary.vue'
import { useScenarioEditorAccess } from '../../composables/useScenarioEditorAccess'
import BaseModal from '../Modals/BaseModal.vue'
import { scenarioTranslationService, scenarioSessionService, scenarioStepService } from '../../services/domain/scenario'
import type { LocaleCoverage, StepTranslation, ScenarioTranslation } from '../../services/domain/scenario'
import { terminalService } from '../../services/domain/terminal/terminalService'
import type { Size } from '../../types/terminal'

const route = useRoute()
const router = useRouter()

const { t } = useScenarioEditorI18n()

const scenariosStore = useScenariosStore()
const scenarioStepsStore = useScenarioStepsStore()
const organizationsStore = useOrganizationsStore()
const { isAdmin } = useAdminViewMode()
const notification = useNotification()
const { exportScenario } = useScenarioExport()
// Who may export, archive or delete goes beyond who may edit: see the helpers.
const { canExportScenario, canRetireScenario } = useScenarioEditorAccess()

// Where a new or imported scenario may go — see useScenarioCreateScopes.
const {
  orgScopes,
  groupScopes,
  platformScopeAvailable,
  availableCreateScopes,
  canCreateScenario,
  parseScopeKey,
  pickDefaultScopeKey,
  copyScopesFor,
  loadScopeSources,
} = useScenarioCreateScopes()

const allScenarios = computed(() => scenariosStore.entities)
const selectedScenarioId = ref<string | null>(null)
const currentScenario = ref<any>(null)

const health = useScenarioHealth(computed(() => (currentScenario.value?.can_manage ? currentScenario.value.id : null)))

// `can_manage` is the backend's own CanManageScenario verdict (creator, org
// manager, manager of an assigned class, admin). Guessing it here from
// memberships disagreed with the hooks in both directions.
const canEditScenario = computed(() => !!currentScenario.value?.can_manage)

// Somewhere to put a copy — the same rule the duplicate modal offers.
const canCopyToOrg = computed(() => {
  const { orgs, groups } = copyScopesFor(currentScenario.value)
  return orgs.length + groups.length > 0
})

const currentScenarioOrgName = computed<string | null>(() => {
  const orgId = currentScenario.value?.organization_id
  if (!orgId) return null
  const org = organizationsStore.getOrganizationById(orgId)
  return org?.display_name || org?.name || null
})

const currentScenarioOrgLabel = computed<string | null>(() => {
  if (!currentScenario.value) return null
  if (!currentScenario.value.organization_id) return isAdmin.value ? t('scenarioEditor.platformOnly') : null
  return currentScenarioOrgName.value
})

// ---- Outline and the step being edited ----

const outline = ref<OutlineStep[]>([])
const selectedKey = ref<string | null>(null)
const selectedIndex = computed(() => outline.value.findIndex(step => step.key === selectedKey.value))
// The selected step with everything the form edits (scripts included).
const editingStep = ref<Record<string, any> | null>(null)
const stepDirty = ref(false)
const isSavingStep = ref(false)
const stepSaveError = ref('')

const unsavedGuard = useUnsavedChangesGuard(stepDirty)

const saveState = computed(() => {
  // Nothing to save on a step the user only reads.
  if (!editingStep.value || !canEditScenario.value) return null
  if (isSavingStep.value || pendingOrderWrites.value > 0) return 'saving'
  return stepDirty.value || !editingStep.value.id ? 'dirty' : 'saved'
})

// Playing a lab follows the same reach as exporting it: its managers, and its
// organization's teachers (ocf-core opens preview at teacher).
const canPlayScenario = computed(() => !!currentScenario.value && canExportScenario(currentScenario.value))
const canPreviewScenario = computed(() => canPlayScenario.value && outline.value.some(step => step.id))

// A scenario the user may not preview may still be one the catalogue lets
// them launch (a public one, say): the launcher's own verdict, `launchable` on
// GET /scenario-sessions/available, read once per scenario opened.
const launchableInCatalogue = ref(false)
watch(() => currentScenario.value?.id, async id => {
  launchableInCatalogue.value = false
  if (!id || canPreviewScenario.value) return
  const available = await scenarioSessionService
    .listScenarios(organizationsStore.currentOrganization?.id)
    .catch(() => [])
  if (currentScenario.value?.id === id) {
    launchableInCatalogue.value = !!available.find((s: any) => s.id === id)?.launchable
  }
})

// Play previews what the user may preview; anything else they may launch is
// launched where launching lives, from its card in the catalogue.
function play() {
  if (canPreviewScenario.value) openPreviewConfirm()
  else if (launchableInCatalogue.value) router.push({ name: 'ScenarioLauncher', query: { scenario: currentScenario.value.id } })
}

// ---- Languages ----

// Which language the editor is working in. Equal to the scenario's default —
// or empty — means authoring the original.
const editingLocale = ref('')
const translationCoverage = ref<LocaleCoverage[]>([])
const editingStepTranslation = ref<StepTranslation | null>(null)
const editingScenarioTranslation = ref<ScenarioTranslation | null>(null)

const scenarioLocales = computed<string[]>(() => {
  const raw = currentScenario.value?.locales
  if (!raw) return []
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return []
  }
})

const scenarioDefaultLocale = computed<string>(() => currentScenario.value?.default_locale || '')

const isTranslating = computed(
  () => !!editingLocale.value && editingLocale.value !== scenarioDefaultLocale.value
)

/** Per-step state for the language being edited, keyed by step id. */
const translationStates = computed<Record<string, 'translated' | 'stale' | 'missing'>>(() => {
  if (!isTranslating.value) return {}
  const found = translationCoverage.value.find(c => c.locale === editingLocale.value)
  if (!found) return {}
  return Object.fromEntries(found.steps.map(s => [s.step_id, s.state]))
})

function localeLabel(locale: string): string {
  if (!locale) return ''
  try {
    const name = new Intl.DisplayNames([locale], { type: 'language' }).of(locale) || locale
    return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1)
  } catch {
    return locale
  }
}

/**
 * Refresh how much of each language is done. Re-read after every translation
 * save, because saving is also what marks a step caught up.
 */
const loadTranslationCoverage = async () => {
  // Only a manager may read it, and only a scenario in two languages has any.
  if (!canEditScenario.value || scenarioLocales.value.length < 2) {
    translationCoverage.value = []
    return
  }
  try {
    translationCoverage.value = await scenarioTranslationService.getCoverage(currentScenario.value.id)
  } catch (err) {
    console.error('Failed to load translation coverage:', err)
    translationCoverage.value = []
  }
}

// ---- Loading ----

// Machine size catalog, for ScenarioEditModal's instance_type dropdown.
const sizes = ref<Size[]>([])

onMounted(async () => {
  await Promise.all([
    scenariosStore.loadEntitiesIncludingArchived(),
    loadScopeSources(),
    // Best-effort: without the sizes endpoint the modal falls back to a text input.
    terminalService.getSizes()
      .then(list => { sizes.value = [...list].sort((a, b) => a.sort_order - b.sort_order) })
      .catch(err => {
        console.warn('[ScenarioEditor] failed to load sizes catalog, falling back to text input', err)
        sizes.value = []
      }),
  ])

  const scenarioIdFromUrl = route.query.scenarioId as string | undefined
  if (scenarioIdFromUrl) await openScenario(scenarioIdFromUrl)
})

/** Asks before leaving unsaved edits, then opens the scenario. */
async function requestScenario(id: string | null) {
  if (id === selectedScenarioId.value) return
  if (!(await unsavedGuard.confirmDiscard())) return
  await openScenario(id)
}

/**
 * Loads a scenario with its steps and opens `stepKey`, or its first step.
 * Also how the editor refreshes after a write: the same step stays open.
 */
async function openScenario(id: string | null, stepKey?: string | null) {
  selectedScenarioId.value = id
  // The layout keys the page on the full URL: only a scenario change goes in
  // it, and it reloads the page — the step open is page state, not URL.
  if ((route.query.scenarioId || null) !== id) {
    router.replace({ query: id ? { scenarioId: id } : {} })
    return
  }
  if (!id) {
    currentScenario.value = null
    outline.value = []
    selectStepData(null)
    return
  }

  try {
    const response = await axios.get(`/scenarios/${id}?include=steps`)
    const scenario = response.data
    if (!scenario) return
    const sameScenario = currentScenario.value?.id === scenario.id
    currentScenario.value = scenario
    if (!sameScenario) {
      // A language chosen for one scenario means nothing for the next.
      editingLocale.value = scenario.default_locale || ''
    }
    await loadTranslationCoverage()
    let steps = scenario.steps || scenario.scenario_steps || []
    // A scenario the user cannot edit comes without its steps; its outline
    // (safe fields only) is what a reader may see. Refused — to a learner, say —
    // the editor keeps the "steps appear once duplicated" fallback.
    if (!steps.length && !scenario.can_manage) {
      steps = await scenarioStepService.loadOutline(scenario.id).catch(() => [])
    }
    outline.value = toOutlineSteps(steps)
    const keep = outline.value.find(step => step.key === stepKey) || outline.value[0] || null
    await selectStepData(keep)
  } catch (err) {
    console.error('Error loading scenario:', err)
    notification.showError(t('scenarioEditor.loadError'))
  }
}

async function requestStep(key: string) {
  if (key === selectedKey.value) return
  if (!(await unsavedGuard.confirmDiscard())) return
  dropUnsavedDraft()
  await selectStepData(outline.value.find(step => step.key === key) || null)
}

// A draft left unsaved goes when the author moves on — they were asked.
function dropUnsavedDraft() {
  outline.value = outline.value.filter(step => step.id)
}

/**
 * Opens a step in the editor. A saved step is read in full first: the
 * scenario's step list leaves out its scripts, and a form opened without them
 * would blank them on the next save.
 */
async function selectStepData(step: OutlineStep | null) {
  selectedKey.value = step?.key ?? null
  stepSaveError.value = ''
  editingStepTranslation.value = null
  if (!step) {
    editingStep.value = null
    return
  }
  // A draft, or a step of a scenario the user only reads: the list already
  // holds everything shown (the read-only list carries no scripts to fetch).
  if (!step.id || !canEditScenario.value) {
    editingStep.value = { ...step }
    return
  }
  try {
    const full = await scenarioStepService.loadStep(step.id)
    if (selectedKey.value !== step.key) return
    if (isTranslating.value) {
      editingStepTranslation.value = await scenarioTranslationService
        .getStepTranslation(step.id, editingLocale.value)
        .catch(() => null)
    }
    editingStep.value = { ...full, key: step.key }
  } catch (err) {
    console.error('Failed to load step:', err)
    editingStep.value = { ...step, _receivedFields: [] }
  }
}

// ---- Outline edits: the list order is the step order ----

// Order writes run one after another, each on the list as it is by then: two
// quick moves renumbering at once would interleave their PATCHes on stale
// orders and store neither.
let orderWrites: Promise<void> = Promise.resolve()
const pendingOrderWrites = ref(0)

function persistOutlineOrder(): Promise<void> {
  pendingOrderWrites.value++
  orderWrites = orderWrites.catch(() => {}).then(async () => {
    const { failedLabels } = await renumberSteps(outline.value)
    if (failedLabels.length > 0) {
      notification.showError(t('scenarioEditor.orderSyncFailed', { steps: failedLabels.join(', ') }))
    }
  }).finally(() => { pendingOrderWrites.value-- })
  return orderWrites
}

async function moveOutlineStep(from: number, to: number) {
  outline.value = moveStep(outline.value, from, to)
  await persistOutlineOrder()
  if (editingStep.value?.id) {
    const moved = outline.value.find(step => step.key === editingStep.value?.key)
    if (moved) editingStep.value.order = moved.order
  }
  health.refresh()
}

async function insertDraft(index: number, type: StepType) {
  if (!(await unsavedGuard.confirmDiscard())) return
  // Insert before the step that was at `index`, wherever dropping a draft moved it.
  const before = outline.value[index]
  dropUnsavedDraft()
  const at = before?.id ? outline.value.indexOf(before) : outline.value.length
  const draft = draftStep(type)
  outline.value = insertStep(outline.value, draft, at)
  await selectStepData(draft)
}

// ---- Copying steps from the step library ----

// The library inserts after the selected step, or at the end with none.
const libraryInsertIndex = computed(() => (selectedIndex.value >= 0 ? selectedIndex.value + 1 : outline.value.length))
const isCopyingSteps = ref(false)

/**
 * Copies library steps into this scenario at outline position `index`. The
 * server copies them, scripts included — the browser never sees those — and
 * places them; the editor then reloads and opens the first copy.
 */
async function copyLibrarySteps(stepIds: string[], index: number) {
  if (!currentScenario.value || !stepIds.length) return
  if (!(await unsavedGuard.confirmDiscard())) return
  const position = savedPosition(outline.value, index)
  dropUnsavedDraft()
  isCopyingSteps.value = true
  try {
    const response = await axios.post(`/scenarios/${currentScenario.value.id}/steps/copy`, {
      source_step_ids: stepIds,
      position
    })
    const copies = response.data?.steps || response.data?.data || response.data
    notification.showSuccess(t('scenarioEditor.libraryCopied', { count: String(stepIds.length) }))
    await refreshAfterWrite(Array.isArray(copies) && copies[0]?.id ? copies[0].id : selectedKey.value)
  } catch (err: any) {
    notification.showError(err.response?.data?.error_message || t('scenarioEditor.libraryCopyError'))
  } finally {
    isCopyingSteps.value = false
  }
}

// ---- Step save, duplicate, delete ----

const handleSaveStep = async (formData: any) => {
  const step = editingStep.value
  if (!step || !currentScenario.value) return
  isSavingStep.value = true
  stepSaveError.value = ''
  try {
    // /scenario-steps has no questions field: they go through their own endpoint.
    const { questions: newQuestions, ...stepFields } = formData
    const stepData: Record<string, any> = withoutUnseenScripts({ ...stepFields }, step._receivedFields ?? [])
    stepData.step_type = step.step_type

    let stepId = step.id as string | undefined
    if (!stepId) {
      stepData.scenario_id = currentScenario.value.id
      // Provisionally last, so a failed renumber never leaves two steps on the
      // same order; the renumber then moves it to where it was inserted.
      stepData.order = Math.max(-1, ...outline.value.filter(s => s.id).map(s => s.order)) + 1
      const created = await scenarioStepsStore.createEntity('/scenario-steps', stepData)
      stepId = created?.id || created?.data?.id
      const draft = outline.value.find(s => s.key === step.key)
      if (draft && stepId) {
        Object.assign(draft, { id: stepId, key: stepId, order: stepData.order, isNew: false })
        selectedKey.value = stepId
        await persistOutlineOrder()
      }
    } else {
      await scenarioStepsStore.updateEntity('/scenario-steps', stepId, stepData)
    }

    if (stepId && (step.step_type === 'quiz' || (Array.isArray(newQuestions) && newQuestions.length > 0))) {
      await scenarioStepService.syncQuestions(stepId, step.questions || [], newQuestions || [])
    }

    await refreshAfterWrite(stepId)
  } catch (err: any) {
    console.error('Save step failed:', err)
    stepSaveError.value = err.response?.data?.error_message || err.response?.data?.message || err.message || t('scenarioEditor.saveError')
  } finally {
    isSavingStep.value = false
  }
}

async function duplicateSelectedStep() {
  const step = editingStep.value
  if (!step?.id || !currentScenario.value) return
  if (!(await unsavedGuard.confirmDiscard())) return
  try {
    const copyFields = withoutUnseenScripts({
      scenario_id: currentScenario.value.id,
      step_type: step.step_type,
      title: t('scenarioEditor.copyOfStep', { title: step.title || '' }),
      order: Math.max(-1, ...outline.value.filter(s => s.id).map(s => s.order)) + 1,
      text_content: step.text_content,
      hint_content: step.hint_content,
      verify_script: step.verify_script,
      background_script: step.background_script,
      foreground_script: step.foreground_script,
      flag_path: step.flag_path,
      flag_level: step.flag_level,
      show_immediate_feedback: step.show_immediate_feedback,
      intro_effect: step.intro_effect,
      intro_text: step.intro_text,
      outro_effect: step.outro_effect,
      outro_text: step.outro_text
    }, step._receivedFields ?? [])
    const created = await scenarioStepsStore.createEntity('/scenario-steps', copyFields)
    const copyId = created?.id || created?.data?.id
    if (!copyId) return
    if (step.questions?.length) {
      await scenarioStepService.syncQuestions(copyId, [], step.questions.map(({ id: _id, ...q }: any) => q))
    }
    const copy = { ...outline.value[selectedIndex.value], id: copyId, key: copyId, order: copyFields.order, title: copyFields.title }
    outline.value = insertStep(outline.value, copy, selectedIndex.value + 1)
    await persistOutlineOrder()
    await refreshAfterWrite(copyId)
  } catch (err: any) {
    notification.showError(err.response?.data?.error_message || err.message || t('scenarioEditor.saveError'))
  }
}

const stepPendingDelete = ref<OutlineStep | null>(null)

function requestDeleteStep() {
  const step = outline.value[selectedIndex.value]
  if (!step) return
  if (!step.id) {
    // A draft was never written: discarding it needs no confirmation.
    const index = selectedIndex.value
    outline.value = outline.value.filter(s => s.key !== step.key)
    stepDirty.value = false
    selectStepData(outline.value[Math.max(0, index - 1)] || null)
    return
  }
  stepPendingDelete.value = step
}

async function confirmDeleteStep() {
  const step = stepPendingDelete.value
  stepPendingDelete.value = null
  if (!step?.id) return
  try {
    const index = outline.value.findIndex(s => s.key === step.key)
    await scenarioStepsStore.deleteEntity('/scenario-steps', step.id)
    outline.value = outline.value.filter(s => s.key !== step.key)
    // Close the gap, so the orders stay 0..n-1.
    await persistOutlineOrder()
    stepDirty.value = false
    const next = outline.value[Math.min(index, outline.value.length - 1)]
    await refreshAfterWrite(next?.key ?? null)
  } catch (err: any) {
    notification.showError(err.response?.data?.error_message || t('scenarioEditor.deleteError'))
  }
}

/** Re-reads the scenario after a write, keeping `stepKey` open. */
async function refreshAfterWrite(stepKey: string | null | undefined) {
  stepDirty.value = false
  await Promise.all([
    openScenario(selectedScenarioId.value, stepKey),
    scenariosStore.loadEntitiesIncludingArchived()
  ])
  health.refresh()
}

// ---- Translations ----

/**
 * Switch the language being edited. The new language's text is fetched before
 * either value changes, so the form never shows one language's content under
 * another's label.
 */
const handleEditingLocaleChange = async (locale: string) => {
  const stepId = editingStep.value?.id
  let next: StepTranslation | null = null
  if (stepId && locale && locale !== scenarioDefaultLocale.value) {
    try {
      next = await scenarioTranslationService.getStepTranslation(stepId, locale)
    } catch (err) {
      console.error('Failed to load step translation:', err)
    }
  }
  editingStepTranslation.value = next
  editingLocale.value = locale
}

/**
 * Save a step's translation. Not routed through handleSaveStep: authoring and
 * translating write to different places.
 */
const handleSaveStepTranslation = async (fields: Record<string, string>) => {
  const stepId = editingStep.value?.id
  if (!stepId || !editingLocale.value) return
  isSavingStep.value = true
  stepSaveError.value = ''
  try {
    editingStepTranslation.value = await scenarioTranslationService.saveStepTranslation(
      stepId,
      editingLocale.value,
      fields,
      editingStepTranslation.value?.id
    )
    // Saving is also what marks the step caught up with its source.
    await loadTranslationCoverage()
  } catch (err: any) {
    stepSaveError.value =
      err.response?.data?.error?.details?.original ||
      err.response?.data?.error_message ||
      err.response?.data?.message ||
      t('scenarioEditor.saveError')
  } finally {
    isSavingStep.value = false
  }
}

// ---- Scenario settings (create / edit modal) ----

const showScenarioEditModal = ref(false)
const editingScenario = ref<any>({})
const isSaving = ref(false)
const modalError = ref('')

const scopeHint = computed(() => {
  const scope = parseScopeKey(editingScenario.value?._scopeKey)
  if (!scope) return ''
  if (scope.kind === 'platform') return t('scenarioEditor.scopeHintPlatform')
  if (scope.kind === 'org') return t('scenarioEditor.scopeHintOrg', { name: scope.name })
  return t('scenarioEditor.scopeHintGroup', { name: scope.name })
})

// The fields the scenario modal edits. The save sends this explicit list rather
// than the whole object, so a field added to the modal and not here is edited,
// looks saved, and is silently dropped.
const SCENARIO_FIELDS = [
  'name', 'title', 'difficulty', 'estimated_time_minutes', 'description', 'intro_text', 'finish_text',
  'objectives', 'prerequisites', 'setup_script', 'instance_type', 'hostname', 'os_type', 'source_type',
  'flags_enabled', 'crash_traps', 'port_exposure_allowed', 'is_public', 'default_locale', 'locales'
] as const

const handleCreateNew = async () => {
  if (!(await unsavedGuard.confirmDiscard())) return
  editingScenario.value = {
    name: '',
    title: '',
    difficulty: 'beginner',
    estimated_time_minutes: 0,
    description: '',
    intro_text: '',
    finish_text: '',
    objectives: '',
    prerequisites: '',
    setup_script: '',
    instance_type: 'S',
    hostname: '',
    os_type: 'deb',
    source_type: 'builtin',
    flags_enabled: false,
    crash_traps: false,
    port_exposure_allowed: false,
    is_public: false,
    default_locale: '',
    locales: '',
    _scopeKey: pickDefaultScopeKey(),
    isNew: true
  }
  modalError.value = ''
  showScenarioEditModal.value = true
}

async function openScenarioSettings() {
  const scenario = currentScenario.value
  if (!scenario || !canEditScenario.value) return
  editingScenario.value = {
    ...Object.fromEntries(SCENARIO_FIELDS.map(field => [field, scenario[field] ?? ''])),
    difficulty: scenario.difficulty || 'beginner',
    estimated_time_minutes: scenario.estimated_time_minutes || 0,
    instance_type: scenario.instance_type || 'S',
    flags_enabled: !!scenario.flags_enabled,
    crash_traps: !!scenario.crash_traps,
    port_exposure_allowed: !!scenario.port_exposure_allowed,
    is_public: !!scenario.is_public,
    entityId: scenario.id,
    organization_id: scenario.organization_id || null,
    isNew: false
  }
  editingScenarioTranslation.value = null
  if (isTranslating.value) {
    editingScenarioTranslation.value = await scenarioTranslationService
      .getScenarioTranslation(scenario.id, editingLocale.value)
      .catch(() => null)
  }
  modalError.value = ''
  showScenarioEditModal.value = true
}

const closeScenarioEditModal = () => {
  showScenarioEditModal.value = false
  editingScenario.value = {}
  modalError.value = ''
}

const handleSaveScenario = async () => {
  isSaving.value = true
  modalError.value = ''
  try {
    const entityData: Record<string, any> = Object.fromEntries(
      SCENARIO_FIELDS.map(field => [field, editingScenario.value[field]])
    )
    entityData.default_locale = entityData.default_locale || ''
    entityData.locales = entityData.locales || ''

    if (editingScenario.value.isNew) {
      // Dispatch on scope: platform / organization / group → distinct endpoints.
      const scope = parseScopeKey(editingScenario.value._scopeKey)
      if (!scope) {
        modalError.value = t('scenarioEditor.saveError')
        return
      }
      let result: any = null
      if (scope.kind === 'platform') {
        result = await scenariosStore.createEntity('/scenarios', entityData)
      } else {
        // Org or group scoped: the owner is in the URL path; a group also gets
        // its assignment created.
        const base = scope.kind === 'org' ? `/organizations/${scope.id}` : `/groups/${scope.id}`
        const response = await axios.post(`${base}/scenarios`, entityData)
        result = response.data?.data || response.data
      }
      const newId = result?.id || result?.data?.id
      closeScenarioEditModal()
      if (newId) {
        await scenariosStore.loadEntitiesIncludingArchived()
        await openScenario(newId)
      }
      return
    }

    const entityId = editingScenario.value.entityId
    await scenariosStore.updateEntity('/scenarios', entityId, entityData)
    closeScenarioEditModal()
    if (currentScenario.value?.id === entityId) {
      currentScenario.value = { ...currentScenario.value, ...entityData }
      if (!editingLocale.value || !scenarioLocales.value.includes(editingLocale.value)) {
        editingLocale.value = scenarioDefaultLocale.value
      }
      await loadTranslationCoverage()
      health.refresh()
    }
  } catch (err: any) {
    modalError.value = err.response?.data?.error_message ||
                       err.response?.data?.message ||
                       err.message ||
                       t('scenarioEditor.saveError')
  } finally {
    isSaving.value = false
  }
}

/** Switch language while the scenario modal is open, fetching before swapping. */
const handleScenarioEditingLocaleChange = async (locale: string) => {
  const scenarioId = editingScenario.value?.entityId
  let next: ScenarioTranslation | null = null
  if (scenarioId && locale && locale !== scenarioDefaultLocale.value) {
    try {
      next = await scenarioTranslationService.getScenarioTranslation(scenarioId, locale)
    } catch (err) {
      console.error('Failed to load scenario translation:', err)
    }
  }
  editingScenarioTranslation.value = next
  editingLocale.value = locale
}

/** Save the scenario's own text in one language — prose only, no configuration. */
const handleSaveScenarioTranslation = async (fields: Record<string, string>) => {
  const scenarioId = editingScenario.value?.entityId
  if (!scenarioId || !editingLocale.value) return
  isSaving.value = true
  modalError.value = ''
  try {
    editingScenarioTranslation.value = await scenarioTranslationService.saveScenarioTranslation(
      scenarioId,
      editingLocale.value,
      fields,
      editingScenarioTranslation.value?.id
    )
    closeScenarioEditModal()
  } catch (err: any) {
    modalError.value =
      err.response?.data?.error?.details?.original ||
      err.response?.data?.error_message ||
      err.response?.data?.message ||
      t('scenarioEditor.saveError')
  } finally {
    isSaving.value = false
  }
}

// ---- Import, AI, duplicate: each ends with the new scenario open ----

async function openImported(scenario: { id: string }, successKey = 'scenarioEditor.importSuccess') {
  if (!(await unsavedGuard.confirmDiscard())) return
  await scenariosStore.loadEntitiesIncludingArchived()
  await openScenario(scenario.id)
  notification.showSuccess(t(successKey))
}

function onAiImported(scenario: { id: string }, mode: 'create' | 'improve') {
  openImported(scenario, mode === 'improve' ? 'scenarioEditor.aiUpdateSuccess' : 'scenarioEditor.aiCreateSuccess')
}

const showDuplicateModal = ref(false)

async function openDuplicate(copy: { id: string }) {
  showDuplicateModal.value = false
  await scenariosStore.loadEntitiesIncludingArchived()
  if (copy?.id) await openScenario(copy.id)
}

// ---- Archive ----

// Archiving is confirmed because it retires the scenario for every learner and
// class at once; restoring is not, since it only puts it back.
const showArchiveModal = ref(false)

const reloadAfterArchiveChange = async () => {
  await scenariosStore.loadEntitiesIncludingArchived()
  const refreshed = scenariosStore.entities.find((s: any) => s.id === currentScenario.value?.id)
  if (refreshed) currentScenario.value = { ...currentScenario.value, archived_at: refreshed.archived_at }
}

const handleArchive = async () => {
  if (!currentScenario.value?.id) return
  try {
    await scenariosStore.archiveEntity('/scenarios', currentScenario.value.id)
    notification.showSuccess(t('scenarioEditor.archiveSuccess'))
    showArchiveModal.value = false
    await reloadAfterArchiveChange()
  } catch (err: any) {
    notification.showError(err.response?.data?.error_message || t('scenarioEditor.archiveError'))
  }
}

const handleUnarchive = async () => {
  if (!currentScenario.value?.id) return
  try {
    await scenariosStore.unarchiveEntity('/scenarios', currentScenario.value.id)
    notification.showSuccess(t('scenarioEditor.unarchiveSuccess'))
    await reloadAfterArchiveChange()
  } catch (err: any) {
    notification.showError(err.response?.data?.error_message || t('scenarioEditor.unarchiveError'))
  }
}

const showDeleteScenarioModal = ref(false)

const handleDeleteScenario = async () => {
  if (!currentScenario.value?.id) return
  try {
    await scenariosStore.deleteEntity('/scenarios', currentScenario.value.id)
    showDeleteScenarioModal.value = false
    stepDirty.value = false
    await scenariosStore.loadEntitiesIncludingArchived()
    await openScenario(null)
  } catch (err: any) {
    notification.showError(err.response?.data?.error_message || t('scenarioEditor.deleteScenarioError'))
  }
}

// ---- "Play as learner" ----

// POST /scenarios/:id/preview bypasses the assignment check and provisions a
// real terminal, so the trainer plays the scenario exactly as a learner would.
const showPreviewConfirmModal = ref(false)
const isPreviewLoading = ref(false)
// The step a "Test from this step" preview starts at; null previews the whole scenario.
const previewFromStepOrder = ref<number | null>(null)

const openPreviewConfirm = (fromStepOrder: number | null = null) => {
  if (!canPreviewScenario.value) return
  previewFromStepOrder.value = fromStepOrder
  showPreviewConfirmModal.value = true
}

const closePreviewConfirm = () => {
  if (isPreviewLoading.value) return
  showPreviewConfirmModal.value = false
  previewFromStepOrder.value = null
}

const handleConfirmPreview = async () => {
  if (!selectedScenarioId.value) return
  isPreviewLoading.value = true
  try {
    const orgId = currentScenario.value?.organization_id || undefined
    const result = await scenarioSessionService.previewScenario(
      selectedScenarioId.value,
      previewOptions(orgId, previewFromStepOrder.value)
    )
    // Same tab, same route the launcher uses: a noopener tab would not
    // inherit a sessionStorage JWT and would land on the login screen. The
    // session view's back link brings the trainer back to this scenario.
    const returnTo = router.resolve({
      name: 'ScenarioEditor',
      query: { scenarioId: selectedScenarioId.value }
    }).fullPath
    showPreviewConfirmModal.value = false
    await router.push({
      name: 'TerminalSessionView',
      params: { sessionId: result.terminal_session_id },
      query: { returnTo }
    })
  } catch (err: any) {
    const data = err?.response?.data
    const refusal = previewRefusalKey(err?.response?.status, data, previewFromStepOrder.value)
    notification.showError(refusal
      ? t(refusal)
      : data?.error_message || data?.message || err?.message || t('scenarioEditor.previewError'))
  } finally {
    isPreviewLoading.value = false
  }
}
</script>

<style scoped>
.ocf-scenario-workbench {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background: var(--color-background);
}

.ocf-workbench {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr) auto;
}

.ocf-workbench-outline {
  overflow-y: auto;
  border-right: 1px solid var(--color-border-light);
  background: var(--color-bg-secondary);
}

.ocf-workbench-center {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ocf-workbench-rail {
  width: 360px;
}

.ocf-workbench-rail.is-collapsed {
  width: 3rem;
}

.ocf-workbench-empty,
.ocf-workbench-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-2xl);
  text-align: center;
  color: var(--color-text-secondary);
}

.ocf-workbench-empty h2,
.ocf-workbench-placeholder h2 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.ocf-workbench-empty p,
.ocf-workbench-placeholder p {
  max-width: 34rem;
  margin: 0;
}

.ocf-workbench-empty-icon,
.ocf-workbench-placeholder > i {
  font-size: 2rem;
  color: var(--color-text-muted);
}

.ocf-workbench-empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.ocf-workbench-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.ocf-readonly-step {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-md) var(--spacing-lg);
}

.ocf-readonly-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  font-size: var(--font-size-sm);
}

.ocf-readonly-banner .ocf-btn-primary {
  margin-left: auto;
}

.ocf-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--border-radius-md);
  background: var(--color-primary);
  color: var(--color-white);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.ocf-btn-primary:hover {
  background: var(--color-primary-hover);
}

.ocf-btn-primary:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Below a laptop width the outline sits above the editor. */
@media (max-width: 1024px) {
  .ocf-scenario-workbench {
    height: auto;
    min-height: calc(100vh - 60px);
  }

  .ocf-workbench {
    grid-template-columns: minmax(0, 1fr);
  }

  .ocf-workbench-outline {
    max-height: 40vh;
    border-right: none;
    border-bottom: 1px solid var(--color-border-light);
  }

  .ocf-workbench-rail,
  .ocf-workbench-rail.is-collapsed {
    width: auto;
  }
}
</style>
