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
import { useSshKeysStore } from '../../store/sshKeys';
import { useI18n } from 'vue-i18n';

useI18n().mergeLocaleMessage('en', { sshkeys : { 
    title : "Ssh Keys list",
    name: 'Key name',
    value: 'Key value (PRIVATE)',
}})
useI18n().mergeLocaleMessage('fr', { sshkeys : { 
    title : "Liste des clés SSH",
    name: 'Nom de la clé',
    value: 'Valeur de la clé (PRIVEE)',
 }})

 const { t } = useI18n()

const sshKeysStore = useSshKeysStore();

const fieldList = new Map<string, any>([
    ["id", { label: t('sshkeys.id'), type: "input", display: false, toBeSet: false }],
    ["name", { label: t('sshkeys.name'), type: "input", display: true, toBeSet: true }],
    ["private_key", { label: t('sshkeys.value'), type: "textarea", display: false, toBeSet: true }],
    ["created_at", { label: t('sshkeys.created_at'), type: "input", display: true, toBeSet: false }],
]);

</script>

<template>
    <div class="wrapper">
        <MainNavMenu />
        <div class="inner-wrapper">
            <TopMenu />
            <Entity :entity-name='"sshkeys"' :entity-store=sshKeysStore :field-list="fieldList" />
        </div>
    </div>
</template>
