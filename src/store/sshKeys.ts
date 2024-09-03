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

export const useSshKeysStore = defineStore('SshKeys', () => {
    useI18n().mergeLocaleMessage('en', { sshkeys : { 
        title : "Ssh Keys list",
        name: 'Key name',
        value: 'Key value (PRIVATE)',
        modify: 'Modify SSH key name',
        add: 'Add a SSH key',
    }})
    useI18n().mergeLocaleMessage('fr', { sshkeys : { 
        title : "Liste des clés SSH",
        name: 'Nom de la clé',
        value: 'Valeur de la clé (PRIVEE)',
        modify: 'Modifier le nom de la clé SSH',
        add: 'Ajouter une clé SSH',
     }})
    

    const { t } = useI18n()

    const entities = []
    const fieldList = new Map<string, any>([
        ["id", { label: t('sshkeys.id'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["name", { label: t('sshkeys.name'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["private_key", { label: t('sshkeys.value'), type: "textarea", display: false, toBeSet: true, toBeEdited: false }],
        ["created_at", { label: t('sshkeys.created_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
    ])
        
    function setEntities(entities: any | Ref<any>) {
        this.entities = entities
    }

    return {entities, fieldList, setEntities}
})