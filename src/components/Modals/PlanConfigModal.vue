<template>
  <BaseModal
    :visible="visible"
    :title="plan ? t('planConfig.editTitle') : t('planConfig.createTitle')"
    :title-icon="plan ? 'fas fa-edit' : 'fas fa-plus'"
    size="xlarge"
    @close="$emit('close')"
  >
    <div class="plan-config-form">
      <!-- Section 1: Plan Identity -->
      <section class="form-section">
        <h3 class="section-title">
          <i class="fas fa-id-card"></i>
          {{ t('planConfig.identitySection') }}
        </h3>

        <div class="form-grid">
          <div class="form-group">
            <label for="plan-name">{{ t('planConfig.name') }} <span class="required-mark">*</span></label>
            <input id="plan-name" v-model="formData.name" type="text" class="form-control" required />
          </div>

          <div class="form-group form-group-wide">
            <label for="plan-description">{{ t('planConfig.description') }}</label>
            <textarea id="plan-description" v-model="formData.description" class="form-control" rows="3" />
          </div>

          <div class="form-group">
            <label for="plan-price">{{ t('planConfig.priceAmount') }}</label>
            <input id="plan-price" v-model.number="formData.price_amount" type="number" class="form-control" min="0" />
          </div>

          <div class="form-group">
            <label for="plan-currency">{{ t('planConfig.currency') }}</label>
            <select id="plan-currency" v-model="formData.currency" class="form-control">
              <option value="eur">EUR</option>
              <option value="usd">USD</option>
            </select>
          </div>

          <div class="form-group">
            <label for="plan-interval">{{ t('planConfig.billingInterval') }}</label>
            <select id="plan-interval" v-model="formData.billing_interval" class="form-control">
              <option value="month">{{ t('planConfig.monthly') }}</option>
              <option value="year">{{ t('planConfig.yearly') }}</option>
            </select>
          </div>

          <div class="form-group">
            <label for="plan-trial">{{ t('planConfig.trialDays') }}</label>
            <input id="plan-trial" v-model.number="formData.trial_days" type="number" class="form-control" min="0" />
          </div>

          <div class="form-group">
            <label for="plan-role">{{ t('planConfig.requiredRole') }}</label>
            <input id="plan-role" v-model="formData.required_role" type="text" class="form-control" />
          </div>

          <div class="form-group">
            <label for="plan-priority">{{ t('planConfig.priority') }}</label>
            <input id="plan-priority" v-model.number="formData.priority" type="number" class="form-control" min="0" />
          </div>

          <div class="form-group">
            <div class="checkbox-wrapper">
              <input id="plan-active" v-model="formData.is_active" type="checkbox" class="form-checkbox" />
              <label for="plan-active" class="checkbox-label">{{ t('planConfig.isActive') }}</label>
            </div>
          </div>

          <div class="form-group">
            <div class="checkbox-wrapper">
              <input id="plan-catalog" v-model="formData.is_catalog" type="checkbox" class="form-checkbox" />
              <label for="plan-catalog" class="checkbox-label">{{ t('planConfig.isCatalog') }}</label>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 1.5: Quota model + size capacity / count-mode allowlist -->
      <section class="form-section">
        <h3 class="section-title">
          <i class="fas fa-microchip"></i>
          {{ t('planConfig.sizeCapacity.section') }}
        </h3>

        <!-- Quota model discriminator -->
        <div class="quota-model-radio">
          <label class="quota-model-label">{{ t('planConfig.quotaModel.label') }}</label>
          <div class="radio-group">
            <label class="radio-option">
              <input
                type="radio"
                value="budget"
                :checked="formData.quota_model === 'budget'"
                data-test="quota-model-budget"
                @change="formData.quota_model = 'budget'"
              />
              <span>{{ t('planConfig.quotaModel.budget') }}</span>
            </label>
            <label class="radio-option">
              <input
                type="radio"
                value="count"
                :checked="formData.quota_model === 'count'"
                data-test="quota-model-count"
                @change="formData.quota_model = 'count'"
              />
              <span>{{ t('planConfig.quotaModel.count') }}</span>
            </label>
          </div>
        </div>

        <!-- Budget mode: size-quota composer -->
        <div v-if="formData.quota_model === 'budget'" data-test="size-quota-composer" class="size-quota-composer">
          <p class="composer-subtitle">{{ t('planConfig.sizeCapacity.subtitle') }}</p>

          <div v-if="!advancedMode" data-test="size-quota-rows-list" class="size-quota-rows">
            <div
              v-for="(row, idx) in sizeRows"
              :key="idx"
              data-test="size-quota-row"
              class="size-quota-row"
            >
              <div class="row-field">
                <label :for="`size-row-${idx}-size`">{{ t('planConfig.sizeCapacity.rowSize') }}</label>
                <select
                  :id="`size-row-${idx}-size`"
                  v-model="row.size_key"
                  data-test="size-quota-size"
                  class="form-control"
                >
                  <option v-for="key in sizeCatalogKeys" :key="key" :value="key">
                    {{ key.toUpperCase() }}
                  </option>
                </select>
              </div>
              <div class="row-field">
                <label :for="`size-row-${idx}-count`">{{ t('planConfig.sizeCapacity.rowCount') }}</label>
                <input
                  :id="`size-row-${idx}-count`"
                  v-model.number="row.count"
                  data-test="size-quota-count"
                  type="number"
                  min="1"
                  class="form-control row-count-input"
                />
              </div>
              <button
                type="button"
                class="btn btn-icon btn-remove"
                data-test="size-quota-remove-row"
                :aria-label="t('planConfig.sizeCapacity.removeRow')"
                @click="removeRow(idx)"
              >
                <i class="fas fa-times"></i>
              </button>
              <div v-if="row.count < 1" data-test="size-quota-row-validation" class="validation-message">
                {{ t('planConfig.validation.countPositive') }}
              </div>
            </div>

            <button
              type="button"
              class="btn btn-secondary btn-add-row"
              data-test="size-quota-add-row"
              @click="addRow"
            >
              <i class="fas fa-plus"></i>
              {{ t('planConfig.sizeCapacity.addRow') }}
            </button>

            <div
              v-if="sizeRows.length === 0"
              data-test="size-quota-validation"
              class="validation-message validation-block"
            >
              <i class="fas fa-exclamation-triangle"></i>
              {{ t('planConfig.validation.atLeastOneRow') }}
            </div>

            <div data-test="size-quota-preview" class="computed-preview">
              <h4>{{ t('planConfig.sizeCapacity.computedBudget') }}</h4>
              <div class="preview-values">
                <span class="preview-value">
                  <i class="fas fa-microchip"></i>
                  {{ t('planConfig.sizeCapacity.cpuValue', { n: computedBudget.max_cpu }) }}
                </span>
                <span class="preview-value">
                  <i class="fas fa-memory"></i>
                  {{ t('planConfig.sizeCapacity.ramValue', { n: ramGiB }) }}
                </span>
              </div>
            </div>
          </div>

          <div v-else data-test="size-quota-advanced-fields" class="advanced-fields">
            <div class="form-grid">
              <div class="form-group">
                <label for="advanced-max-cpu">MaxCPU</label>
                <input
                  id="advanced-max-cpu"
                  v-model.number="formData.max_cpu"
                  data-test="advanced-max-cpu"
                  type="number"
                  min="0"
                  class="form-control"
                />
              </div>
              <div class="form-group">
                <label for="advanced-max-memory-mb">MaxMemoryMB</label>
                <input
                  id="advanced-max-memory-mb"
                  v-model.number="formData.max_memory_mb"
                  data-test="advanced-max-memory-mb"
                  type="number"
                  min="0"
                  class="form-control"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            class="btn btn-link btn-advanced-toggle"
            data-test="size-quota-advanced-toggle"
            @click="toggleAdvanced"
          >
            <i :class="advancedMode ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
            {{ t('planConfig.sizeCapacity.advanced') }}
          </button>
        </div>

        <!-- Count mode: legacy allowlist -->
        <div v-else data-test="count-mode-section" class="count-mode-section">
          <p class="count-mode-hint">{{ t('planConfig.countMode.hint') }}</p>
        </div>
      </section>

      <!-- Section 2: Plan Configuration (from catalog) -->
      <section class="form-section">
        <h3 class="section-title">
          <i class="fas fa-sliders-h"></i>
          {{ t('planConfig.configSection') }}
        </h3>

        <div v-if="Object.keys(featuresByCategory).length === 0" class="empty-features">
          <i class="fas fa-info-circle"></i>
          {{ t('planConfig.noFeatures') }}
        </div>

        <div v-for="(features, category) in featuresByCategory" :key="category" class="feature-category">
          <h4 class="category-title">{{ formatCategoryName(category) }}</h4>
          <div class="feature-list">
            <div
              v-for="feature in features"
              :key="feature.id"
              class="feature-item"
              :class="{ 'feature-hidden': !isFeatureVisible(feature) }"
            >
              <template v-if="feature.value_type === 'boolean'">
                <div class="checkbox-wrapper">
                  <input
                    :id="`feature-${feature.key}`"
                    v-model="featureValues[feature.key]"
                    type="checkbox"
                    class="form-checkbox"
                  />
                  <label :for="`feature-${feature.key}`" class="checkbox-label">
                    {{ getFeatureDisplayName(feature) }}
                  </label>
                </div>
              </template>
              <template v-else-if="feature.value_type === 'number' && isFeatureVisible(feature)">
                <div class="number-input-group">
                  <label :for="`feature-${feature.key}`">{{ getFeatureDisplayName(feature) }}</label>
                  <div class="number-with-unit">
                    <input
                      :id="`feature-${feature.key}`"
                      v-model.number="featureValues[feature.key]"
                      type="number"
                      class="form-control"
                      min="0"
                    />
                    <span v-if="feature.unit" class="unit-label">{{ feature.unit }}</span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 3: Stripe Info (read-only, edit mode only) -->
      <section v-if="plan" class="form-section">
        <h3 class="section-title">
          <i class="fab fa-stripe-s"></i>
          {{ t('planConfig.stripeSection') }}
        </h3>
        <div class="stripe-info">
          <div class="form-group">
            <label>{{ t('planConfig.stripeProductId') }}</label>
            <input :value="plan.stripe_product_id || '-'" type="text" class="form-control" readonly disabled />
          </div>
          <div class="form-group">
            <label>{{ t('planConfig.stripePriceId') }}</label>
            <input :value="plan.stripe_price_id || '-'" type="text" class="form-control" readonly disabled />
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="$emit('close')">
        <i class="fas fa-ban"></i>
        {{ t('planConfig.cancel') }}
      </button>
      <button
        class="btn btn-primary"
        :disabled="!isFormValid"
        data-test="plan-save-button"
        @click="handleSave"
      >
        <i class="fas fa-save"></i>
        {{ plan ? t('planConfig.save') : t('planConfig.create') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { usePlanFeaturesStore } from '../../stores/planFeatures'
import BaseModal from './BaseModal.vue'
import { CANONICAL_SIZE_CATALOG, computeMaxFromRows, type SizeQuotaRow } from '../../utils/quotaFormatters'

const { t, te, locale } = useTranslations({
  en: {
    planConfig: {
      createTitle: 'Create Plan',
      editTitle: 'Edit Plan',
      identitySection: 'Plan Identity',
      configSection: 'Plan Configuration',
      stripeSection: 'Stripe Information',
      name: 'Plan Name',
      description: 'Description',
      priceAmount: 'Price (cents)',
      currency: 'Currency',
      billingInterval: 'Billing Interval',
      monthly: 'Monthly',
      yearly: 'Yearly',
      trialDays: 'Trial Days',
      requiredRole: 'Required Role',
      priority: 'Priority',
      isActive: 'Active',
      isCatalog: 'Listed in catalog',
      stripeProductId: 'Stripe Product ID',
      stripePriceId: 'Stripe Price ID',
      noFeatures: 'No features configured. Create features in the Plan Features admin page first.',
      cancel: 'Cancel',
      save: 'Save',
      create: 'Create',
      categories: {
        capabilities: 'Capabilities',
        machine_sizes: 'Machine Sizes',
        terminal_limits: 'Terminal Limits',
        course_limits: 'Course Limits'
      },
      sizeCapacity: {
        section: 'Size capacity',
        subtitle: 'Students can spawn one of these combinations',
        rowSize: 'Size',
        rowCount: 'Count',
        addRow: 'Add row',
        removeRow: 'Remove',
        computedBudget: 'Computed budget',
        cpuValue: '{n} vCPU',
        ramValue: '{n} GiB',
        advanced: 'Advanced (raw budget)'
      },
      quotaModel: {
        label: 'Quota model',
        count: 'Count (legacy)',
        budget: 'Budget (new)'
      },
      countMode: {
        hint: 'Count mode uses the legacy allowed_machine_sizes allowlist and max_concurrent_terminals field from the Plan Configuration section below.'
      },
      validation: {
        atLeastOneRow: 'At least one size row is required',
        countPositive: 'Count must be at least 1'
      }
    }
  },
  fr: {
    planConfig: {
      createTitle: 'Creer un Plan',
      editTitle: 'Modifier le Plan',
      identitySection: 'Identite du Plan',
      configSection: 'Configuration du Plan',
      stripeSection: 'Informations Stripe',
      name: 'Nom du Plan',
      description: 'Description',
      priceAmount: 'Prix (centimes)',
      currency: 'Devise',
      billingInterval: 'Intervalle de Facturation',
      monthly: 'Mensuel',
      yearly: 'Annuel',
      trialDays: "Jours d'Essai",
      requiredRole: 'Role Requis',
      priority: 'Priorite',
      isActive: 'Actif',
      isCatalog: 'Visible dans le catalogue',
      stripeProductId: 'ID Produit Stripe',
      stripePriceId: 'ID Prix Stripe',
      noFeatures: 'Aucune fonctionnalite configuree. Creez des fonctionnalites dans la page admin Plan Features.',
      cancel: 'Annuler',
      save: 'Enregistrer',
      create: 'Creer',
      categories: {
        capabilities: 'Fonctionnalites',
        machine_sizes: 'Tailles de Machine',
        terminal_limits: 'Limites Terminal',
        course_limits: 'Limites de Cours'
      },
      sizeCapacity: {
        section: 'Capacite par taille',
        subtitle: "Les apprenants pourront lancer l'une de ces combinaisons",
        rowSize: 'Taille',
        rowCount: 'Nombre',
        addRow: 'Ajouter une ligne',
        removeRow: 'Supprimer',
        computedBudget: 'Budget calcule',
        cpuValue: '{n} vCPU',
        ramValue: '{n} Gio',
        advanced: 'Avance (budget brut)'
      },
      quotaModel: {
        label: 'Modele de quota',
        count: 'Nombre (heritage)',
        budget: 'Budget (nouveau)'
      },
      countMode: {
        hint: "Le mode Nombre utilise la liste allowed_machine_sizes et max_concurrent_terminals dans la section Configuration ci-dessous."
      },
      validation: {
        atLeastOneRow: 'Au moins une ligne est requise',
        countPositive: "Le nombre doit etre d'au moins 1"
      }
    }
  }
})

const props = defineProps<{
  visible: boolean
  plan: any | null
}>()

const emit = defineEmits<{
  save: [data: any]
  close: []
}>()

const planFeaturesStore = usePlanFeaturesStore()

const formData = reactive({
  name: '',
  description: '',
  price_amount: 0,
  currency: 'eur',
  billing_interval: 'month',
  trial_days: 0,
  required_role: '',
  priority: 0,
  is_active: true,
  is_catalog: true,
  quota_model: 'budget' as 'budget' | 'count',
  max_cpu: 0,
  max_memory_mb: 0
})

const featureValues = reactive<Record<string, any>>({})

// Size-quota composer state (budget mode only).
const sizeRows = reactive<SizeQuotaRow[]>([{ size_key: 'l', count: 1 }])
const advancedMode = ref(false)
const sizeCatalogKeys = Object.keys(CANONICAL_SIZE_CATALOG)

const computedBudget = computed(() => computeMaxFromRows(sizeRows))
const ramGiB = computed(() => {
  const mb = computedBudget.value.max_memory_mb
  if (mb === 0) return 0
  // Round to one decimal to avoid floating-point noise (2048 MiB = 2 GiB exactly).
  return Math.round((mb / 1024) * 10) / 10
})

function addRow() {
  sizeRows.push({ size_key: 'l', count: 1 })
}

function removeRow(index: number) {
  sizeRows.splice(index, 1)
}

function toggleAdvanced() {
  advancedMode.value = !advancedMode.value
}

const isFormValid = computed(() => {
  if (formData.quota_model === 'budget' && !advancedMode.value) {
    if (sizeRows.length === 0) return false
    if (sizeRows.some(r => !r.size_key || r.count < 1)) return false
  }
  return true
})

const featuresByCategory = computed(() => planFeaturesStore.featuresByCategory)

function formatCategoryName(category: string): string {
  const key = `planConfig.categories.${category}`
  return te(key) ? t(key) : category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function getFeatureDisplayName(feature: any): string {
  return locale.value === 'fr' ? feature.display_name_fr : feature.display_name_en
}

function isFeatureVisible(feature: any): boolean {
  if (feature.key === 'data_persistence_gb') {
    return !!featureValues['data_persistence']
  }
  if (feature.key === 'command_history_retention_days') {
    return !!featureValues['command_history']
  }
  return true
}

function populateFromPlan(plan: any) {
  formData.name = plan.name || ''
  formData.description = plan.description || ''
  formData.price_amount = plan.price_amount || 0
  formData.currency = plan.currency || 'eur'
  formData.billing_interval = plan.billing_interval || 'month'
  formData.trial_days = plan.trial_days || 0
  formData.required_role = plan.required_role || ''
  formData.priority = plan.priority || 0
  formData.is_active = plan.is_active !== false
  formData.is_catalog = plan.is_catalog !== false

  // Quota model + budget fields.
  formData.quota_model = plan.quota_model === 'count' ? 'count' : 'budget'
  formData.max_cpu = typeof plan.max_cpu === 'number' ? plan.max_cpu : 0
  formData.max_memory_mb = typeof plan.max_memory_mb === 'number' ? plan.max_memory_mb : 0

  // Reset the size-quota composer. We can't reconstruct the original rows
  // because the backend stores only the computed max — so if the plan has a
  // non-zero raw budget we open the Advanced view by default and leave the
  // composer empty. Admin can re-create rows if they want.
  sizeRows.splice(0, sizeRows.length)
  if (formData.max_cpu === 0 && formData.max_memory_mb === 0) {
    sizeRows.push({ size_key: 'l', count: 1 })
    advancedMode.value = false
  } else {
    advancedMode.value = true
  }

  // Clear feature values
  Object.keys(featureValues).forEach(key => delete featureValues[key])

  const features = plan.features || []
  const allFeatures = planFeaturesStore.entities || []

  // Mapping for boolean features that are persisted as dedicated columns on
  // the plan (not via the features[] array). When such a mapping exists, we
  // prefer the dedicated column over features[] membership so the toggle
  // stays in sync with the actual saved value.
  const booleanFieldMap: Record<string, string> = {
    network_access: 'network_access_enabled',
    data_persistence: 'data_persistence_enabled',
    persistent_sessions_enabled: 'persistent_sessions_enabled'
  }

  // Populate boolean features from plan.features array
  for (const f of allFeatures) {
    if (f.value_type === 'boolean') {
      if (f.category === 'machine_sizes') {
        // Machine size features: check allowed_machine_sizes
        const sizeSuffix = f.key.replace('machine_size_', '').toUpperCase()
        const allowedSizes = plan.allowed_machine_sizes || []
        featureValues[f.key] = allowedSizes.includes(sizeSuffix)
      } else {
        // Prefer dedicated column when one exists; otherwise fall back to
        // features[] membership.
        const planField = booleanFieldMap[f.key]
        if (planField && typeof (plan as any)[planField] === 'boolean') {
          featureValues[f.key] = (plan as any)[planField]
        } else {
          featureValues[f.key] = features.includes(f.key)
        }
      }
    } else if (f.value_type === 'number') {
      // Map number features from dedicated plan fields
      const fieldMap: Record<string, string> = {
        max_session_duration_minutes: 'max_session_duration_minutes',
        max_concurrent_terminals: 'max_concurrent_terminals',
        data_persistence_gb: 'data_persistence_gb',
        command_history_retention_days: 'command_history_retention_days',
        max_courses: 'max_courses',
        max_concurrent_users: 'max_concurrent_users',
        max_persistent_sessions: 'max_persistent_sessions'
      }
      const planField = fieldMap[f.key]
      if (planField && plan[planField] !== undefined) {
        featureValues[f.key] = plan[planField]
      } else {
        featureValues[f.key] = 0
      }
    }
  }
}

function resetForm() {
  formData.name = ''
  formData.description = ''
  formData.price_amount = 0
  formData.currency = 'eur'
  formData.billing_interval = 'month'
  formData.trial_days = 0
  formData.required_role = ''
  formData.priority = 0
  formData.is_active = true
  formData.is_catalog = true
  formData.quota_model = 'budget'
  formData.max_cpu = 0
  formData.max_memory_mb = 0
  sizeRows.splice(0, sizeRows.length, { size_key: 'l', count: 1 })
  advancedMode.value = false
  Object.keys(featureValues).forEach(key => delete featureValues[key])

  // Initialize default feature values
  const allFeatures = planFeaturesStore.entities || []
  for (const f of allFeatures) {
    if (f.value_type === 'boolean') {
      featureValues[f.key] = false
    } else if (f.value_type === 'number') {
      featureValues[f.key] = 0
    }
  }
}

// Returns the numeric value for a plan field. The form value (if present)
// always wins -- including an intentional 0. When the form never had this
// field (e.g. because the matching plan_features catalog row is missing or
// has been stripped), we preserve the existing plan value rather than
// silently overwriting it with 0.
function numericFieldValue(key: string, planField: string): number {
  if (key in featureValues) {
    const v = featureValues[key]
    return typeof v === 'number' ? v : 0
  }
  if (props.plan && typeof (props.plan as any)[planField] === 'number') {
    return (props.plan as any)[planField]
  }
  return 0
}

// Same preserve-existing-value behavior for boolean dedicated columns.
function booleanFieldValue(key: string, planField: string): boolean {
  if (key in featureValues) return !!featureValues[key]
  if (props.plan && typeof (props.plan as any)[planField] === 'boolean') {
    return (props.plan as any)[planField]
  }
  return false
}

function handleSave() {
  const allFeatures = planFeaturesStore.entities || []
  const enabledFeatures: string[] = []
  const allowedMachineSizes: string[] = []

  // Build features array and machine sizes from feature values
  for (const f of allFeatures) {
    if (f.value_type === 'boolean' && featureValues[f.key]) {
      enabledFeatures.push(f.key)
      if (f.category === 'machine_sizes') {
        const sizeSuffix = f.key.replace('machine_size_', '').toUpperCase()
        allowedMachineSizes.push(sizeSuffix)
      }
    }
  }

  // In budget mode the composer is the source of truth unless the admin
  // bypassed it via the Advanced disclosure. In count mode we don't send
  // max_cpu / max_memory_mb at all — the legacy allowlist drives the limits.
  let resolvedMaxCpu = formData.max_cpu
  let resolvedMaxMemoryMb = formData.max_memory_mb
  if (formData.quota_model === 'budget' && !advancedMode.value) {
    const budget = computeMaxFromRows(sizeRows)
    resolvedMaxCpu = budget.max_cpu
    resolvedMaxMemoryMb = budget.max_memory_mb
  }

  const planData: any = {
    ...formData,
    max_cpu: resolvedMaxCpu,
    max_memory_mb: resolvedMaxMemoryMb,
    features: enabledFeatures,
    allowed_machine_sizes: allowedMachineSizes,
    // Map number features to dedicated fields (preserve existing plan value
    // when the form didn't include this field -- prevents silent 0 wipes).
    max_session_duration_minutes: numericFieldValue('max_session_duration_minutes', 'max_session_duration_minutes'),
    max_concurrent_terminals: numericFieldValue('max_concurrent_terminals', 'max_concurrent_terminals'),
    data_persistence_gb: numericFieldValue('data_persistence_gb', 'data_persistence_gb'),
    command_history_retention_days: numericFieldValue('command_history_retention_days', 'command_history_retention_days'),
    max_courses: numericFieldValue('max_courses', 'max_courses'),
    max_concurrent_users: numericFieldValue('max_concurrent_users', 'max_concurrent_users'),
    max_persistent_sessions: numericFieldValue('max_persistent_sessions', 'max_persistent_sessions'),
    // Map boolean terminal features to dedicated fields (same preserve semantics).
    network_access_enabled: booleanFieldValue('network_access', 'network_access_enabled'),
    data_persistence_enabled: booleanFieldValue('data_persistence', 'data_persistence_enabled'),
    persistent_sessions_enabled: booleanFieldValue('persistent_sessions_enabled', 'persistent_sessions_enabled')
  }

  if (props.plan) {
    planData.id = props.plan.id
  }

  emit('save', planData)
}

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    await planFeaturesStore.ensureFeaturesLoaded()
    if (props.plan) {
      populateFromPlan(props.plan)
    } else {
      resetForm()
    }
  }
})
</script>

<style scoped>
.plan-config-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.form-section {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-lg) 0;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--spacing-md);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.form-group-wide {
  grid-column: 1 / -1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-group label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.required-mark {
  color: var(--color-danger);
  margin-left: var(--spacing-xs);
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
}

.form-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.checkbox-label {
  margin: 0;
  cursor: pointer;
  user-select: none;
}

.feature-category {
  margin-bottom: var(--spacing-lg);
}

.feature-category:last-child {
  margin-bottom: 0;
}

.category-title {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-md) 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: var(--font-weight-semibold);
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.feature-item {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.feature-hidden {
  display: none;
}

.number-input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.number-input-group label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.number-with-unit {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.number-with-unit input {
  max-width: 150px;
}

.unit-label {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.stripe-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.stripe-info input[disabled] {
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
}

.empty-features {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  color: var(--color-text-muted);
  font-style: italic;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--btn-padding-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark, var(--color-primary-hover));
}

.btn-secondary {
  background-color: var(--color-secondary, var(--color-gray-600));
  color: white;
}

.btn-secondary:hover {
  background-color: var(--color-secondary-dark, var(--color-secondary-hover));
}

.quota-model-radio {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.quota-model-label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.radio-group {
  display: flex;
  gap: var(--spacing-lg);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.size-quota-composer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.composer-subtitle {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.size-quota-rows {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.size-quota-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: var(--spacing-md);
  align-items: end;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.row-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.row-field label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.row-count-input {
  max-width: 100px;
}

.btn-icon {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
}

.btn-icon:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.btn-add-row {
  align-self: flex-start;
}

.btn-advanced-toggle {
  align-self: flex-start;
  background: transparent;
  color: var(--color-text-secondary);
  padding: var(--spacing-xs) 0;
  border: none;
  text-decoration: none;
}

.btn-advanced-toggle:hover {
  color: var(--color-primary);
}

.computed-preview {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-tertiary, var(--color-bg-secondary));
  border-radius: var(--border-radius-md);
  border: 1px dashed var(--color-border);
}

.computed-preview h4 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.preview-values {
  display: flex;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.preview-value {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.advanced-fields {
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.validation-message {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  margin-top: var(--spacing-xs);
}

.validation-block {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-danger-bg, rgba(220, 53, 69, 0.1));
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
}

.count-mode-section {
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.count-mode-hint {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .stripe-info {
    grid-template-columns: 1fr;
  }

  .size-quota-row {
    grid-template-columns: 1fr;
  }
}
</style>
