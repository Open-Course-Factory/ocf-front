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
import { useMachinesStore } from "./machines"
import { useUsernamesStore } from "./usernames"
import { useBaseStore } from "./baseStore"


export const useConnectionsStore = defineStore('Connections', () => {

    const base = useBaseStore();

    useI18n().mergeLocaleMessage('en', { connections : { 
        title: 'Connections list',
        name: 'Connection Name',
        add: 'Add a connection',
        machine: 'Machine',
        username: 'Username',
    }})
    useI18n().mergeLocaleMessage('fr', { connections : { 
        title: 'Liste des connexions',
        name: 'Nom de la connexion',
        add: 'Ajouter une connexion',
        machine: 'Machine',
        username: 'Nom d\'utilisateur',
     }})
    

    const { t } = useI18n()

    const fieldList = new Map<string, any>([
        ["MachineId", { label: t('connections.machine'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["UsernameId", { label: t('connections.username'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
    ])

    base.subEntitiesStores = new Map<string, any>([
        ["MachineId", useMachinesStore()],
        ["UsernameId", useUsernamesStore()],
    ])

    return {...base, fieldList }
})
