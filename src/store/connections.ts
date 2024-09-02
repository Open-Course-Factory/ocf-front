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
import { useMachinesStore } from "./machines"
import { useUsernamesStore } from "./usernames"


export const useConnectionsStore = defineStore('Connections', () => {

    useI18n().mergeLocaleMessage('en', { connections : { 
        title: 'Connections list',
        name: 'Connection Name',
    }})
    useI18n().mergeLocaleMessage('fr', { connections : { 
        title: 'Liste des connexions',
        name: 'Nom de la connexion',
     }})
    

    const { t } = useI18n()

    const entities = []
    const fieldList = new Map<string, any>([
        ["Machine", { label: t('connections.name'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["Username", { label: t('connections.id'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
    ])

    const subEntitiesStores = new Map<string, any>([
        ["Machine", useMachinesStore()],
        ["Username", useUsernamesStore()],
    ])
        
    function setEntities(entities: any | Ref<any>) {
        this.entities = entities
    }

    return {entities, fieldList, subEntitiesStores, setEntities}
})
