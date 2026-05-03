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
    :confirm-text="t('scenarioEditor.saveEntity')"
    :cancel-text="t('scenarioEditor.cancel')"
    :is-loading="isSaving"
    :error-message="errorMessage"
    @close="emit('close')"
    @confirm="emit('save')"
  >
    <!-- Tabs -->
    <TabStrip
      v-model="activeTab"
      :tabs="tabs"
      :aria-label="ariaLabel"
      class="modal-tabs-spacing"
    />

    <!-- General tab -->
    <div
      v-show="activeTab === 'general'"
      id="panel-general"
      role="tabpanel"
      aria-labelledby="tab-general"
      class="modal-form"
    >
      <div class="form-group">
        <label>{{ t('scenarioEditor.scenarioName') }}</label>
        <input
          v-model="model.name"
          type="text"
          class="form-control"
          :placeholder="t('scenarioEditor.enterName')"
        />
      </div>

      <div class="form-group">
        <label>{{ t('scenarioEditor.scenarioTitle') }}</label>
        <input
          v-model="model.title"
          type="text"
          class="form-control"
          :placeholder="t('scenarioEditor.enterTitle')"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>{{ t('scenarioEditor.difficulty') }}</label>
          <select v-model="model.difficulty" class="form-control">
            <option value="beginner">{{ t('scenarioEditor.beginner') }}</option>
            <option value="intermediate">{{ t('scenarioEditor.intermediate') }}</option>
            <option value="advanced">{{ t('scenarioEditor.advanced') }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>{{ t('scenarioEditor.estimatedTime') }}</label>
          <input
            v-model="model.estimated_time"
            type="text"
            class="form-control"
            placeholder="30m"
          />
        </div>
      </div>

      <div class="form-group">
        <label>{{ t('scenarioEditor.description') }}</label>
        <textarea
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
        <label>{{ t('scenarioEditor.orgLabel') }}</label>
        <input
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
      <div class="form-group">
        <label>{{ t('scenarioEditor.introText') }}</label>
        <textarea
          v-model="model.intro_text"
          class="form-control"
          rows="6"
          :placeholder="t('scenarioEditor.introTextPlaceholder')"
        ></textarea>
        <span class="form-hint">{{ t('scenarioEditor.markdownSupported') }}</span>
      </div>

      <div class="form-group">
        <label>{{ t('scenarioEditor.finishText') }}</label>
        <textarea
          v-model="model.finish_text"
          class="form-control"
          rows="6"
          :placeholder="t('scenarioEditor.finishTextPlaceholder')"
        ></textarea>
        <span class="form-hint">{{ t('scenarioEditor.markdownSupported') }}</span>
      </div>

      <div class="form-group">
        <label>{{ t('scenarioEditor.objectives') }}</label>
        <textarea
          v-model="model.objectives"
          class="form-control"
          rows="3"
          :placeholder="t('scenarioEditor.objectivesPlaceholder')"
        ></textarea>
      </div>

      <div class="form-group">
        <label>{{ t('scenarioEditor.prerequisites') }}</label>
        <textarea
          v-model="model.prerequisites"
          class="form-control"
          rows="3"
          :placeholder="t('scenarioEditor.prerequisitesPlaceholder')"
        ></textarea>
      </div>
    </div>

    <!-- Setup tab -->
    <div
      v-show="activeTab === 'setup'"
      id="panel-setup"
      role="tabpanel"
      aria-labelledby="tab-setup"
      class="modal-form"
    >
      <div class="form-group">
        <label>{{ t('scenarioEditor.setupScript') }}</label>
        <textarea
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
      v-show="activeTab === 'options'"
      id="panel-options"
      role="tabpanel"
      aria-labelledby="tab-options"
      class="modal-form"
    >
      <div class="form-row">
        <div class="form-group">
          <label>{{ t('scenarioEditor.instanceType') }}</label>
          <input
            v-model="model.instance_type"
            type="text"
            class="form-control"
            placeholder="S"
          />
        </div>

        <div class="form-group">
          <label>{{ t('scenarioEditor.hostname') }}</label>
          <input
            v-model="model.hostname"
            type="text"
            class="form-control"
            placeholder="lab"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>{{ t('scenarioEditor.osType') }}</label>
          <select v-model="model.os_type" class="form-control">
            <option value="">-</option>
            <option value="deb">Debian (apt)</option>
            <option value="rpm">RPM (dnf/yum)</option>
            <option value="apk">Alpine (apk)</option>
            <option value="pacman">Arch (pacman)</option>
          </select>
        </div>

        <div class="form-group">
          <label>{{ t('scenarioEditor.sourceType') }}</label>
          <select v-model="model.source_type" class="form-control">
            <option value="">-</option>
            <option value="builtin">{{ t('scenarioEditor.sourceBuiltin') }}</option>
            <option value="git">Git</option>
            <option value="upload">Upload</option>
            <option value="seed">Seed</option>
          </select>
        </div>
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="model.flags_enabled" />
          {{ t('scenarioEditor.flagsEnabled') }}
        </label>
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="model.crash_traps" />
          {{ t('scenarioEditor.crashTraps') }}
        </label>
        <span class="form-hint">{{ t('scenarioEditor.crashTrapsHint') }}</span>
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="model.gsh_enabled" />
          {{ t('scenarioEditor.gshEnabled') }}
        </label>
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="model.is_public" />
          {{ t('scenarioEditor.isPublic') }}
        </label>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '../Modals/BaseModal.vue'
import TabStrip from '../Common/TabStrip.vue'
import { useTranslations } from '../../composables/useTranslations'

interface ScopeOption {
  id: string
  name: string
}

interface Props {
  visible: boolean
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
  // Optional ARIA label override; defaults to a generic editor name.
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  isSaving: false,
  errorMessage: '',
  ariaLabel: undefined
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save'): void
}>()

const { t } = useTranslations({
  en: {
    scenarioEditor: {
      tabGeneral: 'General',
      tabContent: 'Content',
      tabSetup: 'Setup',
      tabOptions: 'Options'
    }
  },
  fr: {
    scenarioEditor: {
      tabGeneral: 'Général',
      tabContent: 'Contenu',
      tabSetup: 'Installation',
      tabOptions: 'Options'
    }
  }
})

// Local proxy that mutates the parent's editingScenario (objects are
// reference-semantic in Vue — mutating fields is observed by reactivity).
// Using a computed that returns the prop keeps the template terse.
const model = computed(() => props.editingScenario)

const activeTab = ref('general')
const tabs = computed(() => [
  { key: 'general', label: t('scenarioEditor.tabGeneral') },
  { key: 'content', label: t('scenarioEditor.tabContent') },
  { key: 'setup', label: t('scenarioEditor.tabSetup') },
  { key: 'options', label: t('scenarioEditor.tabOptions') }
])

// Reset to the first tab whenever the modal opens.
watch(() => props.visible, (vis) => {
  if (vis) activeTab.value = 'general'
})
</script>

<style scoped>
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
