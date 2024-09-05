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
// import router from "../router/index.ts"
import { useCurrentUserStore } from '../../store/currentUser.ts';

const currentUser = useCurrentUserStore();


</script>

<template>
    <div class="left-col">
        <h1>
            <router-link to="/dashboard">COurse NEXus</router-link>
        </h1>
        <p>{{ currentUser.userRoles[0] }}</p>
        <nav>
            <ul>
                <li>
                    <router-link to="/courses">Courses</router-link>
                </li>
                <li>
                    <router-link to="/chapters">Chapters</router-link>
                </li>
                <li>
                    <router-link to="/sections">Sections</router-link>
                </li>
                <li>
                    <router-link to="/pages">Pages</router-link>
                </li>
                <li>
                    <router-link to="/tps">TPs</router-link>
                </li>
                <li>
                    <router-link to="/schedule">Emploi du temps</router-link>
                </li>
                <li v-if="currentUser.userRoles[0] === 'administrator'">
                    <router-link to="/usernames">Noms d'utilisateurs</router-link>
                </li>
                <li v-if="currentUser.userRoles[0] === 'administrator'">
                    <router-link to="/machines">Machines</router-link>
                </li>
                <li v-if="currentUser.userRoles[0] === 'administrator'">
                    <router-link to="/connections">&nbsp;> Connections</router-link>
                </li>
                
            </ul>
        </nav>
    </div>
</template>

<style scoped>

p {
  margin-left: 20px;
  font-size: 12px;
  font-size: 1rem;
  text-transform: uppercase;
}

a {
  color: #e7e7e7;
  text-decoration: none;
}

h1 a {
  font-size: 26px;
  margin-left: 20px;
}

ul {
  list-style-type: none;
  margin-left: -32px;
}

ul li a {
  padding: 13px 15px 12px 15px;
  display: block;
  cursor: pointer;
  margin-bottom: 6px;
}

ul li:hover,
ul li:focus {
  background-color: #45484e;
}

</style>