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
import { Ref } from "vue"
import { useI18n } from "vue-i18n"


export const useMachinesStore = defineStore('machines', () => {

    useI18n().mergeLocaleMessage('en', { machines : { 
        title : "Machines list",
        name: 'Machine Name',
        ip: 'Machine IP',
        port: 'SSH Port', 
    }})
    useI18n().mergeLocaleMessage('fr', { machines : { 
        title : "Liste des machines",
        name: 'Nom de la machine',
        ip: 'IP de la machine',
        port: 'Port SSH',
     }})

    const { t } = useI18n()

    const entities = []
    const fieldList = new Map<string, any>([
        ["id", { label: t('machines.id'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["name", { label: t('machines.name'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["ip", { label: t('machines.ip'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["port", { label: t('machines.port'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
    ])

    const subEntitiesStores = new Map<string, any>([
    ])
    
    function setEntities(entities: any | Ref<any>) {
        this.entities = entities
    }

    return {entities, fieldList, subEntitiesStores, setEntities}
})