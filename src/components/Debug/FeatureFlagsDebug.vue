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
      <h3>🏴 Feature Flags Debug Panel</h3>
      <p class="debug-note">
        <i class="fas fa-info-circle"></i>
        Admin-only debug interface for testing feature flags
      </p>
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
      <button @click="refreshFlags" class="btn btn-secondary">
        <i class="fas fa-sync"></i> Refresh Flags
      </button>
      <button @click="resetToDefaults" class="btn btn-warning">
        <i class="fas fa-undo"></i> Reset to Defaults
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { useFeatureFlags } from '../../composables/useFeatureFlags'
import { useCurrentUserStore } from '../../stores/currentUser'

const { flags, isEnabled, updateFlag } = useFeatureFlags()
const currentUser = useCurrentUserStore()

// Only show for administrators
const isAdmin = computed(() => currentUser.userRoles[0] === 'administrator')

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
  updateFlag(flagName, { enabled: target.checked })

  // Force a small delay to ensure reactivity propagates
  await nextTick()
  console.log(`🏴 Feature flag "${flagName}" toggled to: ${target.checked}`)
}

function getEnvValue(flagName: string): string | undefined {
  const envVar = `VITE_FEATURE_FLAG_${flagName.toUpperCase()}`
  return import.meta.env[envVar]
}

function refreshFlags() {
  console.log('🏴 Refreshing feature flags...')
  window.location.reload()
}

function resetToDefaults() {
  if (!isAdmin.value) return

  console.log('🏴 Resetting feature flags to defaults...')
  Object.keys(flags.value).forEach(flagName => {
    updateFlag(flagName, { enabled: true })
  })
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
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
}

.debug-header {
  margin-bottom: 30px;
  text-align: center;
}

.debug-header h3 {
  margin: 0 0 10px 0;
  color: #495057;
}

.debug-note {
  color: #6c757d;
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
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.flag-card.flag-enabled {
  border-color: #28a745;
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.1);
}

.flag-card.flag-disabled {
  border-color: #dc3545;
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
  color: #495057;
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
  background-color: #28a745;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.flag-details {
  margin-bottom: 15px;
}

.flag-description {
  margin: 0 0 10px 0;
  color: #6c757d;
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
  background: #fff3cd;
  color: #856404;
}

.type-ops {
  background: #d1ecf1;
  color: #0c5460;
}

.type-experiment {
  background: #f8d7da;
  color: #721c24;
}

.status-enabled {
  background: #d4edda;
  color: #155724;
}

.status-disabled {
  background: #f8d7da;
  color: #721c24;
}

.flag-test {
  padding-top: 10px;
  border-top: 1px solid #e9ecef;
}

.text-success {
  color: #28a745;
}

.text-danger {
  color: #dc3545;
}

.debug-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.debug-info h4 {
  margin: 0 0 15px 0;
  color: #495057;
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
  background: #f8f9fa;
  border-radius: 4px;
}

.env-var code {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #495057;
}

.env-value {
  font-weight: 600;
  color: #6c757d;
}

.debug-actions {
  text-align: center;
}

.btn {
  padding: 10px 20px;
  margin: 0 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>