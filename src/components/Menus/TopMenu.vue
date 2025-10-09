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
  <div class="top-menu">
    <button class="menu-toggle" @click="toggleMenu">
      <i class="fas fa-bars"></i>
    </button>
    <div class="right-controls">
      <div class="locale-changer">
        <select :value="currentLocale" @change="handleLocaleChange" class="flag-select">
          <option v-for="localeCode in supportedLocales" :key="`locale-${localeCode}`" :value="localeCode">
            {{ getLocaleInfo(localeCode).flag }} {{ getLocaleInfo(localeCode).name }}
          </option>
        </select>
      </div>
      <router-link to="/settings/navigation" class="user-info">
        <div class="profile-picture">
          <i class="fas fa-user"></i>
        </div>
        <p>{{ currentUser.userName }}</p>
      </router-link>
      <Disconnect />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCurrentUserStore } from '../../stores/currentUser.ts';
import Disconnect from '../Buttons/Disconnect.vue';
import { useLocale } from '../../composables/useLocale';

const currentUser = useCurrentUserStore();
const { currentLocale, supportedLocales, setLocale, getLocaleInfo } = useLocale();

const emit = defineEmits(['toggle-menu']);

function toggleMenu() {
  emit('toggle-menu');
}

function handleLocaleChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  setLocale(target.value);
}
</script>

<style scoped>
.top-menu {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 60px;
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
  background-color: var(--color-bg-primary);
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--z-index-modal);
  padding: 0 var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  animation: slideDown var(--transition-slow) ease-in-out;
}

.menu-toggle {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  cursor: pointer;
  color: var(--color-text-primary);
}

.right-controls {
  display: flex;
  align-items: center;
}

.locale-changer {
  margin-right: var(--spacing-lg);
}

.locale-changer select {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-medium);
  background-color: var(--color-bg-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: border-color var(--transition-base);
  min-width: 140px;
}

.locale-changer select:hover {
  border-color: var(--color-border-dark);
}

.locale-changer select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus-primary);
}

.flag-select option {
  padding: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 var(--spacing-md);
  cursor: pointer;
  color: var(--color-text-primary);
  text-decoration: none;
}

.user-info p {
  margin-left: var(--spacing-md);
}

.profile-picture {
  width: 40px;
  height: 40px;
  background-color: var(--color-gray-500);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
}

.profile-picture i {
  font-size: var(--font-size-lg);
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
