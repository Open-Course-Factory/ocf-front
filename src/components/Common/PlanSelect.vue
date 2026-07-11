<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */
-->

<template>
  <select
    :id="selectId"
    class="form-control"
    :value="modelValue"
    @change="onChange"
  >
    <option v-if="placeholder" value="">{{ placeholder }}</option>
    <option
      v-for="plan in activePlans"
      :key="plan.id"
      :value="plan.id"
    >
      {{ planLabel(plan) }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useSubscriptionPlansStore } from '../../stores/subscriptionPlans'
import type { SubscriptionPlan } from '../../types'

const props = withDefaults(defineProps<{
  modelValue: string
  selectId?: string
  placeholder?: string
}>(), {
  selectId: 'plan-select',
  placeholder: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:selectedName': [value: string]
}>()

const plansStore = useSubscriptionPlansStore()

const activePlans = computed(() =>
  (plansStore.entities as SubscriptionPlan[]).filter((p: SubscriptionPlan) => p.is_active)
)

const planLabel = (plan: SubscriptionPlan): string =>
  `${plan.name} - ${plansStore.formatPrice(plan.price_amount, plan.currency)}/${plan.billing_interval}`

const selectedPlanName = computed(() => {
  if (!props.modelValue) return ''
  const plan = activePlans.value.find((p: SubscriptionPlan) => p.id === props.modelValue)
  return plan ? planLabel(plan) : props.modelValue
})

const onChange = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}

// Keep the parent's confirm-summary label in sync with the selection.
watch(selectedPlanName, (name) => emit('update:selectedName', name), { immediate: true })

// Without a placeholder the field is required — preselect the first active plan
// so an opened modal always has a value (preserves the old modal behavior).
watch(
  [activePlans, () => props.modelValue],
  ([plans, current]) => {
    if (!props.placeholder && !current && plans.length > 0) {
      emit('update:modelValue', plans[0].id)
    }
  },
  { immediate: true }
)
</script>
