<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<template>
  <div class="feature-flags-debug">
    <div class="debug-header">
      <h3>🏴 Feature Flags Management</h3>
      <p class="debug-note">
        <i class="fas fa-info-circle"></i>
        Admin-only interface for managing feature flags (Backend-synced)
      </p>
    </div>

    <!-- Error message -->
    <div v-if="error" class="alert alert-danger">
      <i class="fas fa-exclamation-triangle"></i>
      {{ error }}
      <button @click="error = null" class="btn-close">×</button>
    </div>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="loading-overlay">
      <i class="fas fa-spinner fa-spin fa-2x"></i>
      <p>Loading feature flags from backend...</p>
    </div>

    <div class="flags-grid">
      <div
        v-for="(flag, flagName) in flags"
        :key="`${flagName}-${flag.enabled}`"
        class="flag-card"
        :class="{
          'flag-enabled': flag.enabled,
          'flag-disabled': !flag.enabled
        }"
      >
        <div class="flag-header">
          <h4>{{ flagName }}</h4>
          <div class="flag-toggle">
            <label class="switch">
              <input
                type="checkbox"
                :checked="flag.enabled"
                @change="toggleFlag(flagName as string, $event)"
              />
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="flag-details">
          <p class="flag-description">{{ flag.description || 'No description available' }}</p>
          <div class="flag-meta">
            <span class="flag-type" :class="`type-${flag.type}`">
              {{ flag.type || 'ops' }}
            </span>
            <span class="flag-status" :class="flag.enabled ? 'status-enabled' : 'status-disabled'">
              {{ flag.enabled ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
        </div>

        <div class="flag-test">
          <small>
            <strong>Current user can access:</strong>
            <span :class="isEnabled(flagName as string) ? 'text-success' : 'text-danger'">
              {{ isEnabled(flagName as string) ? '✓ Yes' : '✗ No' }}
            </span>
          </small>
          <!-- Debug: flag summary for reactivity testing -->
          <div v-if="false" style="display: none;">{{ flagSummary }}</div>
        </div>
      </div>
    </div>

    <div class="debug-info">
      <h4>Environment Variables</h4>
      <div class="env-vars">
        <p v-for="(flagName) in Object.keys(flags)" :key="flagName" class="env-var">
          <code>VITE_FEATURE_FLAG_{{ flagName.toUpperCase() }}</code>
          <span class="env-value">
            {{ getEnvValue(flagName) || 'not set' }}
          </span>
        </p>
      </div>
    </div>

    <div class="debug-actions">
      <button @click="refreshFlags" class="btn btn-secondary" :disabled="isLoading">
        <i :class="isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-sync'"></i>
        {{ isLoading ? 'Loading...' : 'Refresh from Backend' }}
      </button>
      <button @click="syncLimits" class="btn btn-primary" :disabled="isSyncing">
        <i :class="isSyncing ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
        {{ isSyncing ? 'Syncing...' : 'Sync Usage Limits' }}
      </button>
      <button @click="diagnose" class="btn btn-info">
        <i class="fas fa-stethoscope"></i> Diagnose
      </button>
      <button @click="resetToDefaults" class="btn btn-warning" :disabled="isLoading">
        <i class="fas fa-undo"></i> Reset All to Enabled
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, onMounted } from 'vue'
import { useFeatureFlags } from '../../composables/useFeatureFlags'
import { useCurrentUserStore } from '../../stores/currentUser'
import { useNotification } from '../../composables/useNotification'

const { flags, isEnabled, updateFlag, fetchFromBackend, syncUsageLimits } = useFeatureFlags()
const currentUser = useCurrentUserStore()
const { showSuccess, showInfo, showConfirm } = useNotification()

// Loading states
const isLoading = ref(false)
const isSyncing = ref(false)
const error = ref<string | null>(null)

// Only show for administrators
const isAdmin = computed(() => currentUser.userRoles[0] === 'administrator')

// Load from backend on mount
onMounted(async () => {
  if (isAdmin.value) {
    isLoading.value = true
    error.value = null
    try {
      console.log('🏴 Admin panel: Fetching feature flags from backend...')
      await fetchFromBackend(true) // Force fetch
      console.log('🏴 Admin panel: Backend fetch complete, flags:', flags.value)

      // Check if flags have backend IDs
      const flagsWithoutIds = Object.entries(flags.value)
        .filter(([_, flag]) => !flag.id)
        .map(([name]) => name)

      if (flagsWithoutIds.length > 0) {
        console.warn('⚠️ Some flags missing backend IDs:', flagsWithoutIds)
      }
    } catch (err) {
      error.value = 'Failed to load feature flags from backend'
      console.error('❌ Admin panel: Backend fetch failed:', err)
    } finally {
      isLoading.value = false
    }
  }
})

// Force reactivity by computing a summary
const flagSummary = computed(() => {
  const summary = Object.entries(flags.value).map(([name, config]) => ({
    name,
    enabled: config.enabled,
    userCanAccess: isEnabled(name)
  }))
  console.log('🏴 Flag summary recomputed:', summary)
  return summary
})

async function toggleFlag(flagName: string, event: Event) {
  if (!isAdmin.value) {
    console.warn('🏴 Only administrators can modify feature flags')
    return
  }

  const target = event.target as HTMLInputElement
  error.value = null

  try {
    await updateFlag(flagName, { enabled: target.checked })
    // Force a small delay to ensure reactivity propagates
    await nextTick()
    console.log(`🏴 Feature flag "${flagName}" toggled to: ${target.checked}`)
  } catch (err: any) {
    error.value = `Failed to update ${flagName}: ${err.message}`
    // Revert checkbox
    target.checked = !target.checked
  }
}

function getEnvValue(flagName: string): string | undefined {
  const envVar = `VITE_FEATURE_FLAG_${flagName.toUpperCase()}`
  return import.meta.env[envVar]
}

async function refreshFlags() {
  console.log('🏴 Refreshing feature flags from backend...')
  isLoading.value = true
  error.value = null

  try {
    await fetchFromBackend(true) // Force refresh
  } catch (err: any) {
    error.value = `Failed to refresh: ${err.message}`
  } finally {
    isLoading.value = false
  }
}

async function syncLimits() {
  if (!isAdmin.value) return

  console.log('🏴 Syncing usage limits...')
  isSyncing.value = true
  error.value = null

  try {
    await syncUsageLimits()
    showSuccess('Usage limits synced successfully!', 'Sync Complete')
  } catch (err: any) {
    error.value = `Failed to sync limits: ${err.message}`
  } finally {
    isSyncing.value = false
  }
}

function diagnose() {
  console.log('🏴 === FEATURE FLAGS DIAGNOSTIC ===')
  console.log('Current flags:', flags.value)

  const flagsWithIds: string[] = []
  const flagsWithoutIds: string[] = []

  Object.entries(flags.value).forEach(([name, flag]) => {
    const info = {
      name,
      enabled: flag.enabled,
      hasBackendId: !!flag.id,
      backendId: flag.id,
      backendName: flag.name,
      module: flag.module
    }

    if (flag.id) {
      flagsWithIds.push(name)
    } else {
      flagsWithoutIds.push(name)
    }

    console.log(`  ${name}:`, info)
  })

  console.log('✅ Flags WITH backend IDs:', flagsWithIds)
  console.log('❌ Flags WITHOUT backend IDs:', flagsWithoutIds)
  console.log('localStorage:', localStorage.getItem('ocf_feature_flags'))
  console.log('=== END DIAGNOSTIC ===')

  showInfo(`Diagnostic complete! Check console.\n\n✅ ${flagsWithIds.length} flags have backend IDs\n❌ ${flagsWithoutIds.length} flags missing backend IDs`, 'Diagnostic Complete')
}

async function resetToDefaults() {
  if (!isAdmin.value) return

  const confirmed = await showConfirm('Reset all feature flags to enabled? This will sync to backend.', 'Reset Feature Flags')
  if (!confirmed) {
    return
  }

  console.log('🏴 Resetting feature flags to defaults...')
  error.value = null

  try {
    for (const flagName of Object.keys(flags.value)) {
      await updateFlag(flagName, { enabled: true })
    }
  } catch (err: any) {
    error.value = `Failed to reset flags: ${err.message}`
  }
}

// Hide component for non-admins
if (!isAdmin.value) {
  console.warn('🏴 Feature flags debug panel is only available for administrators')
}
</script>

<style scoped>
.feature-flags-debug {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
  background: var(--color-gray-50);
  border-radius: 8px;
  border: 2px dashed var(--color-gray-300);
}

.debug-header {
  margin-bottom: 30px;
  text-align: center;
}

.debug-header h3 {
  margin: 0 0 10px 0;
  color: var(--color-gray-700);
}

.debug-note {
  color: var(--color-gray-600);
  margin: 0;
  font-size: 0.9rem;
}

.flags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.flag-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 2px solid var(--color-gray-200);
  transition: all 0.3s ease;
}

.flag-card.flag-enabled {
  border-color: var(--color-success);
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.1);
}

.flag-card.flag-disabled {
  border-color: var(--color-danger);
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.1);
}

.flag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.flag-header h4 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-gray-700);
  font-family: monospace;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--color-success);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.flag-details {
  margin-bottom: 15px;
}

.flag-description {
  margin: 0 0 10px 0;
  color: var(--color-gray-600);
  font-size: 0.9rem;
}

.flag-meta {
  display: flex;
  gap: 10px;
}

.flag-type, .flag-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.type-development {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.type-ops {
  background: var(--color-info-bg);
  color: var(--color-info-text);
}

.type-experiment {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.status-enabled {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.status-disabled {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
}

.flag-test {
  padding-top: 10px;
  border-top: 1px solid var(--color-gray-200);
}

.text-success {
  color: var(--color-success);
}

.text-danger {
  color: var(--color-danger);
}

.debug-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.debug-info h4 {
  margin: 0 0 15px 0;
  color: var(--color-gray-700);
}

.env-vars {
  display: grid;
  gap: 8px;
}

.env-var {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 8px;
  background: var(--color-gray-50);
  border-radius: 4px;
}

.env-var code {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: var(--color-gray-700);
}

.env-value {
  font-weight: 600;
  color: var(--color-gray-600);
}

.debug-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-secondary {
  background: var(--color-gray-600);
  color: white;
}

.btn-info {
  background: var(--color-info);
  color: white;
}

.btn-warning {
  background: var(--color-warning);
  color: var(--color-gray-900);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Alert styles */
.alert {
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.alert-danger {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: 1px solid var(--color-danger-border);
}

.btn-close {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: inherit;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Loading overlay */
.loading-overlay {
  text-align: center;
  padding: 40px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  margin-bottom: 20px;
}

.loading-overlay i {
  color: var(--color-primary);
  margin-bottom: 15px;
}

.loading-overlay p {
  color: var(--color-gray-600);
  margin: 0;
}
</style>