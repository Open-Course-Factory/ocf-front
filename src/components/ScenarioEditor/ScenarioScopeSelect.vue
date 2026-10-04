<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Where a new or copied scenario goes: the platform (admin), an organization or
 * a class the user manages, with a line saying what that choice means. Binds a scope
 * key (see useScenarioCreateScopes); the caller loads the scope sources.
 */
-->

<template>
  <div class="form-group">
    <label :for="id">{{ label }}</label>
    <select
      :id="id"
      v-model="scopeKey"
      class="form-control"
      :disabled="targetCount === 0"
    >
      <option v-if="!allowPlatform" value="" disabled>{{ label }}</option>
      <optgroup v-if="allowPlatform && platformScopeAvailable" :label="t('scenarioEditor.scopePlatform')">
        <option value="platform:*">🛡️ {{ t('scenarioEditor.platformOnly') }}</option>
      </optgroup>
      <optgroup v-if="targetOrgs.length" :label="t('scenarioEditor.scopeOrganizations')">
        <option v-for="s in targetOrgs" :key="`org:${s.id}`" :value="`org:${s.id}`">{{ s.name }}</option>
      </optgroup>
      <optgroup v-if="groupScopes.length" :label="t('scenarioEditor.scopeGroups')">
        <option v-for="s in groupScopes" :key="`group:${s.id}`" :value="`group:${s.id}`">{{ s.name }}</option>
      </optgroup>
    </select>
    <p class="form-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useScenarioEditorI18n } from '../../composables/useScenarioEditorI18n'
import { useScenarioCreateScopes } from '../../composables/useScenarioCreateScopes'

const props = withDefaults(defineProps<{
  id: string
  label: string
  /** Shown when the user has nowhere to put a scenario. */
  emptyHint: string
  /** A copy goes into an organization or a class, never onto the platform. */
  allowPlatform?: boolean
  /** The organization a copied scenario already lives in. */
  excludeOrgId?: string | null
}>(), {
  allowPlatform: true,
  excludeOrgId: null
})

const scopeKey = defineModel<string>({ required: true })

const { t } = useScenarioEditorI18n()
const { orgScopes, groupScopes, platformScopeAvailable, parseScopeKey } = useScenarioCreateScopes()

const targetOrgs = computed(() => orgScopes.value.filter(o => o.id !== props.excludeOrgId))

const targetCount = computed(() =>
  targetOrgs.value.length + groupScopes.value.length + (props.allowPlatform && platformScopeAvailable.value ? 1 : 0)
)

const hint = computed(() => {
  const scope = parseScopeKey(scopeKey.value)
  if (!scope) return targetCount.value === 0 ? props.emptyHint : ''
  if (scope.kind === 'platform') return t('scenarioEditor.scopeHintPlatform')
  if (scope.kind === 'org') return t('scenarioEditor.scopeHintOrg', { name: scope.name })
  return t('scenarioEditor.scopeHintGroup', { name: scope.name })
})
</script>
