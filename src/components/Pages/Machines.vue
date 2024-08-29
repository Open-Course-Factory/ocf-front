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

import TopMenu from '../Menus/TopMenu.vue';
import MainNavMenu from '../Menus/MainNavMenu.vue';
import Entity from './Entity.vue';
import { useMachinesStore } from '../../store/machines.ts';
import { useI18n } from 'vue-i18n';

const { t } = useI18n({
    messages: {
      en: { machine: { 
        name: 'Machine Name',
        ip: 'Machine IP',
        port: 'SSH Port',
    } },
      fr: { machine: { 
        name: 'Nom de la machine',
        ip: 'IP de la machine',
        port: 'Port SSH',
    } }
    }
  
}) 

const entityStore = useMachinesStore();

const fieldList = new Map<string, any>([
    ["id", { label: t('machine.id'), type: "input", display: false, toBeSet: false }],
    ["name", { label: t('machine.name'), type: "input", display: true, toBeSet: true }],
    ["ip", { label: t('machine.ip'), type: "input", display: true, toBeSet: true }],
    ["port", { label: t('machine.port'), type: "input", display: true, toBeSet: true }],
])

</script>

<template>
    <div class="wrapper">
        <MainNavMenu />
        <div class="inner-wrapper">
            <TopMenu />
            <Entity :entity-name='"machines"' :entity-store=entityStore :field-list="fieldList" />
        </div>
    </div>
</template>
