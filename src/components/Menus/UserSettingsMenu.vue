<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<template>
  <div v-if="isOpen" class="settings-overlay" @click="handleOverlayClick">
    <div class="settings-menu" @click.stop>
      <header class="settings-header">
        <h2>
          <i class="fas fa-cog"></i>
          <span>{{ t('userSettings.pageTitle') }}</span>
        </h2>
        <button class="close-button" @click="close">
          <i class="fas fa-times"></i>
        </button>
      </header>
      <nav class="settings-nav">
        <ul>
          <li
            v-for="section in settingsSections"
            :key="section.key"
            class="settings-category"
          >
            <div
              class="category-header"
              @click="toggleSection(section.key)"
              :class="{ active: expandedSections[section.key] }"
            >
              <i :class="section.icon"></i>
              <span class="category-title">{{ section.label }}</span>
              <i
                class="fas fa-chevron-down chevron-icon"
                :class="{ rotated: expandedSections[section.key] }"
              ></i>
            </div>
            <div
              class="category-content"
              :class="{ expanded: expandedSections[section.key] }"
            >
              <component
                :is="section.component"
                v-if="expandedSections[section.key]"
              />
            </div>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserSettingsStore } from '../../stores/userSettings'
import NavigationSettings from '../Settings/NavigationSettings.vue'
import LocalizationSettings from '../Settings/LocalizationSettings.vue'
import UISettings from '../Settings/UISettings.vue'
import NotificationSettings from '../Settings/NotificationSettings.vue'
import SecuritySettings from '../Settings/SecuritySettings.vue'
import SSHKeysSettings from '../Settings/SSHKeysSettings.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])

const { t } = useI18n()
const settingsStore = useUserSettingsStore()

// Expanded sections state
const expandedSections = ref<Record<string, boolean>>({
  navigation: false,
  localization: false,
  ui: false,
  notifications: false,
  security: false,
  sshKeys: false
})

// Settings sections structure
const settingsSections = computed(() => [
  {
    key: 'navigation',
    label: t('userSettings.menu.navigation'),
    icon: 'fas fa-compass',
    component: NavigationSettings
  },
  {
    key: 'localization',
    label: t('userSettings.menu.localization'),
    icon: 'fas fa-globe',
    component: LocalizationSettings
  },
  {
    key: 'ui',
    label: t('userSettings.menu.ui'),
    icon: 'fas fa-palette',
    component: UISettings
  },
  {
    key: 'notifications',
    label: t('userSettings.menu.notifications'),
    icon: 'fas fa-bell',
    component: NotificationSettings
  },
  {
    key: 'security',
    label: t('userSettings.menu.security'),
    icon: 'fas fa-shield-alt',
    component: SecuritySettings
  },
  {
    key: 'sshKeys',
    label: t('userSettings.menu.sshKeys'),
    icon: 'fas fa-key',
    component: SSHKeysSettings
  }
])

function toggleSection(sectionKey: string) {
  expandedSections.value[sectionKey] = !expandedSections.value[sectionKey]
}

function close() {
  emit('close')
}

function handleOverlayClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close()
  }
}

function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.isOpen) {
    close()
  }
}

// Load settings when menu opens
watch(() => props.isOpen, async (newValue) => {
  if (newValue) {
    await settingsStore.loadSettings()
    // Open the first section by default
    expandedSections.value.navigation = true
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
})
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  animation: fadeIn 0.3s ease-in-out;
}

.settings-menu {
  background-color: #343a40;
  color: #e7e7e7;
  height: 100vh;
  width: 400px;
  padding: 0;
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.3s ease-in-out;
  overflow: hidden;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #495057;
  background-color: #2c3136;
}

.settings-header h2 {
  font-size: 1.5rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-button {
  background: none;
  border: none;
  color: #e7e7e7;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px 10px;
  transition: color 0.3s;
}

.close-button:hover {
  color: #fff;
}

.settings-nav {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.settings-nav ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.settings-category {
  margin-bottom: 8px;
}

.category-header {
  display: flex;
  align-items: center;
  padding: 15px;
  color: #e7e7e7;
  background-color: #495057;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.3s;
  user-select: none;
}

.category-header:hover {
  background-color: #5a6268;
  transform: translateX(3px);
}

.category-header.active {
  background-color: #6c757d;
}

.category-header i:first-child {
  width: 20px;
  text-align: center;
  margin-right: 10px;
}

.category-title {
  flex-grow: 1;
  font-weight: 600;
  font-size: 0.9rem;
}

.chevron-icon {
  margin-left: auto;
  transition: transform 0.3s ease;
  font-size: 0.8rem;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

.category-content {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.3s ease;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 0 0 4px 4px;
}

.category-content.expanded {
  max-height: 2000px;
  padding: 15px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .settings-menu {
    width: 100%;
  }
}
</style>
