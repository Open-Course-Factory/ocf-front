/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
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


export const useThemesStore = defineStore('themes', () => {

    const base = useBaseStore();

    useI18n().mergeLocaleMessage('en', { themes : { 
        id : "id",
        pageTitle : "Themes",
        name: 'Theme Name',
        repository: 'Repository',
	    repositoryBranch: 'Branch',
	    size: 'Size',
        modify: 'Modify the theme', 
        add: 'Add a theme',
    }})
    useI18n().mergeLocaleMessage('fr', { themes : { 
        id : "id",
        pageTitle : "Themes",
        name: 'Nom du theme',
        repository: 'Adresse du dépôt',
	    repositoryBranch: 'Branche',
	    size: 'Taille',
        modify: 'Modifier le theme', 
        add: 'Ajouter le theme',
     }})

    const { t } = useI18n()

    
    const fieldList = new Map<string, any>([
        ["id", { label: t('themes.id'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["name", { label: t('themes.name'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["repository", { label: t('themes.repository'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["repositoryBranch", { label: t('themes.repositoryBranch'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["size", { label: t('themes.size'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        
    ])

    
    return {...base, fieldList}
})