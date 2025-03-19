<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2024 Solution Libre
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

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useCurrentUserStore } from '../../store/currentUser.ts';
import Disconnect from '../Buttons/Disconnect.vue';

const currentUser = useCurrentUserStore();
const { locale, availableLocales } = useI18n();
</script>

<template>
  <div class="top-menu">
    <div class="locale-changer">
      <select v-model="locale">
        <option v-for="locale in availableLocales" :key="`locale-${locale}`" :value="locale">
          {{ locale }}
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
</template>

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

.locale-changer {
  margin-right: auto;
}

.locale-changer select {
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ccc;
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
