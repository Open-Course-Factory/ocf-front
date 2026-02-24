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
                    {{ feature.display_name_en }}
                  </label>
                </div>
              </template>
              <template v-else-if="feature.value_type === 'number' && isFeatureVisible(feature)">
                <div class="number-input-group">
                  <label :for="`feature-${feature.key}`">{{ feature.display_name_en }}</label>
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
      <button class="btn btn-primary" @click="handleSave">
        <i class="fas fa-save"></i>
        {{ plan ? t('planConfig.save') : t('planConfig.create') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { usePlanFeaturesStore } from '../../stores/planFeatures'
import BaseModal from './BaseModal.vue'

const { t } = useTranslations({
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
      stripeProductId: 'Stripe Product ID',
      stripePriceId: 'Stripe Price ID',
      noFeatures: 'No features configured. Create features in the Plan Features admin page first.',
      cancel: 'Cancel',
      save: 'Save',
      create: 'Create'
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
      stripeProductId: 'ID Produit Stripe',
      stripePriceId: 'ID Prix Stripe',
      noFeatures: 'Aucune fonctionnalite configuree. Creez des fonctionnalites dans la page admin Plan Features.',
      cancel: 'Annuler',
      save: 'Enregistrer',
      create: 'Creer'
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
  is_active: true
})

const featureValues = reactive<Record<string, any>>({})

const featuresByCategory = computed(() => planFeaturesStore.featuresByCategory)

const categoryLabels: Record<string, string> = {
  capabilities: 'Capabilities',
  machine_sizes: 'Machine Sizes',
  terminal_limits: 'Terminal Limits',
  course_limits: 'Course Limits'
}

function formatCategoryName(category: string): string {
  return categoryLabels[category] || category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
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

  // Clear feature values
  Object.keys(featureValues).forEach(key => delete featureValues[key])

  const features = plan.features || []
  const allFeatures = planFeaturesStore.entities || []

  // Populate boolean features from plan.features array
  for (const f of allFeatures) {
    if (f.value_type === 'boolean') {
      if (f.category === 'machine_sizes') {
        // Machine size features: check allowed_machine_sizes
        const sizeSuffix = f.key.replace('machine_size_', '').toUpperCase()
        const allowedSizes = plan.allowed_machine_sizes || []
        featureValues[f.key] = allowedSizes.includes(sizeSuffix)
      } else {
        featureValues[f.key] = features.includes(f.key)
      }
    } else if (f.value_type === 'number') {
      // Map number features from dedicated plan fields
      const fieldMap: Record<string, string> = {
        max_session_duration_minutes: 'max_session_duration_minutes',
        max_concurrent_terminals: 'max_concurrent_terminals',
        data_persistence_gb: 'data_persistence_gb',
        command_history_retention_days: 'command_history_retention_days',
        max_courses: 'max_courses',
        max_concurrent_users: 'max_concurrent_users'
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

  const planData: any = {
    ...formData,
    features: enabledFeatures,
    allowed_machine_sizes: allowedMachineSizes,
    // Map number features to dedicated fields
    max_session_duration_minutes: featureValues['max_session_duration_minutes'] || 0,
    max_concurrent_terminals: featureValues['max_concurrent_terminals'] || 0,
    data_persistence_gb: featureValues['data_persistence_gb'] || 0,
    command_history_retention_days: featureValues['command_history_retention_days'] || 0,
    max_courses: featureValues['max_courses'] || 0,
    max_concurrent_users: featureValues['max_concurrent_users'] || 0,
    // Map boolean terminal features to dedicated fields
    network_access_enabled: !!featureValues['network_access'],
    data_persistence_enabled: !!featureValues['data_persistence']
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

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .stripe-info {
    grid-template-columns: 1fr;
  }
}
</style>
