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
      <router-link to="/user" class="user-info">
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
  border-bottom: 1px solid #d9dee4;
  background-color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: slideDown 0.3s ease-in-out;
}

.menu-toggle {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
}

.right-controls {
  display: flex;
  align-items: center;
}

.locale-changer {
  margin-right: 20px;
}

.locale-changer select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background-color: white;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s ease;
  min-width: 140px;
}

.locale-changer select:hover {
  border-color: #9ca3af;
}

.locale-changer select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.flag-select option {
  padding: 8px;
  font-size: 14px;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 14px;
  cursor: pointer;
  color: #212529;
  text-decoration: none;
}

.user-info p {
  margin-left: 10px;
}

.profile-picture {
  width: 40px;
  height: 40px;
  background-color: #969696;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.profile-picture i {
  font-size: 1.2em;
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
