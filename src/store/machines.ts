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

import { defineStore } from "pinia"
import { useI18n } from "vue-i18n"
import {useBaseStore} from "./baseStore"


export const useMachinesStore = defineStore('machines', () => {

    const base = useBaseStore();

    useI18n().mergeLocaleMessage('en', { machines : { 
        id : "id",
        pageTitle : "Machines list",
        name: 'Machine Name',
        ip: 'Machine IP',
        port: 'SSH Port',
        modify: 'Modify the machine', 
        add: 'Add a machine',
    }})
    useI18n().mergeLocaleMessage('fr', { machines : { 
        id : "id",
        pageTitle : "Liste des machines",
        name: 'Nom de la machine',
        ip: 'IP de la machine',
        port: 'Port SSH',
        modify: 'Modifier la machine', 
        add: 'Ajouter une machine',
     }})

    const { t } = useI18n()

    
    const fieldList = new Map<string, any>([
        ["id", { label: t('machines.id'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["name", { label: t('machines.name'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["ip", { label: t('machines.ip'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["port", { label: t('machines.port'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
    ])

    
    return {...base, fieldList}
})