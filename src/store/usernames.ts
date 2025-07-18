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
import { useBaseStore } from "./baseStore";

export const useUsernamesStore = defineStore('usernames', () => {

    const base = useBaseStore();
    const { t } = useI18n()

    useI18n().mergeLocaleMessage('en', { usernames : { 
        id : "id",
        pageTitle: "Usernames",
        name: 'Username',
        modify: 'Modify username',
        add: 'Add a username',
    }})
    useI18n().mergeLocaleMessage('fr', { usernames : { 
        id : "id",
        pageTitle: 'Nom d\'utilisateur',
        name: 'Nom d\'utilisateur',
        modify: 'Modifier le nom d\'utilisateur',
        add: 'Ajouter un nom d\'utilisateur',
     }})

    const fieldList = new Map<string, any>([
        ["Username", { label: t('usernames.name'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["ID", { label: t('usernames.id'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
    ])

    return {...base, fieldList}
    
})
